import os, io, csv, json, asyncio, base64, datetime, uuid
from collections import OrderedDict, Counter
from contextlib import asynccontextmanager
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

load_dotenv()

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage

from models import User, SessionAttended, ChatSession, Message, EmotionLog, SessionSummary, ExerciseReminder
from schemas import (UserCreate, UserLogin, UserLogout, UserResponse,
                     RefreshToken, ChatRequest, ChatResponse, MessageSchema)
from db import get_db, engine, Base
from auth import (get_password_hash, authenticate_user, get_current_user,
                  create_access_token, create_refresh_token, refresh_token)
from system_prompt import conversation_prompt, SYSTEM_PROMPT
from face_recognizer import FaceEmotionRecognizer
from voice_recognizer import VoiceEmotionRecognizer
from therapist import TherapistAgent
from transcriber import Transcriber
from exercises import EXERCISES

CRISIS_HELPLINES = [
    {"name": "iCall (India)",         "number": "9152987821",          "available": "Mon–Sat 8am–10pm"},
    {"name": "Vandrevala Foundation", "number": "1860-2662-345",       "available": "24/7"},
    {"name": "AASRA",                 "number": "9820466627",          "available": "24/7"},
    {"name": "Crisis Text Line (US)", "number": "Text HOME to 741741", "available": "24/7"},
]
APP_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
from crisis import detect_crisis
from summary import generate_session_summary, generate_coping_plan
from email_service import send_email
from email_templates import crisis_followup_email, exercise_reminder_email
import re

Base.metadata.create_all(bind=engine)

LOG_FILE     = "emotion_log.csv"
MAX_SESSIONS = 100

face_rec    = FaceEmotionRecognizer()
voice_rec   = VoiceEmotionRecognizer()
therapist   = TherapistAgent()
transcriber = Transcriber()

last_audio:    dict = {"bytes": None, "mime": "audio/webm"}
last_response: dict = {"bytes": None}


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        import numpy as np
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.integer):  return int(obj)
        if isinstance(obj, np.ndarray):  return obj.tolist()
        return super().default(obj)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", newline="") as f:
            csv.writer(f).writerow(["timestamp","transcript","voice_emotion",
                                    "voice_confidence","face_emotion","face_confidence",
                                    "verdict","therapist_response"])
    print("Backend ready.")
    yield
    face_rec.stop()


app = FastAPI(lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7,
               max_tokens=500, groq_api_key=os.getenv("GROQ_API_KEY"))
prompt = ChatPromptTemplate.from_messages([
    ("system", conversation_prompt),
    MessagesPlaceholder(variable_name="messages"),
])

sessions: OrderedDict = OrderedDict()

def _get_or_create_session(session_id) -> list:
    if session_id in sessions:
        sessions.move_to_end(session_id)
        return sessions[session_id]
    sessions[session_id] = []
    if len(sessions) > MAX_SESSIONS:
        sessions.popitem(last=False)
    return sessions[session_id]

@app.post("/sign-up")
def sign_up(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    db.add(User(name=user.name, email=user.email, password=get_password_hash(user.password)))
    db.commit()
    return {"message": "Signup successful"}

@app.post("/sign-in")
def sign_in(user: UserLogin, db: Session = Depends(get_db)):
    u = authenticate_user(user.email, user.password, db)
    if not u:
        raise HTTPException(status_code=401, detail="User not found")
    access  = create_access_token({"sub": u.email})
    refresh = create_refresh_token({"sub": u.email})
    u.refresh_token = refresh
    db.commit(); db.refresh(u)
    return {"access_token": access, "refresh_token": refresh, "user": {"id": u.id, "email": u.email}}

@app.post("/sign-out")
def logout(user: UserLogout, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == user.email).first()
    if not u: raise HTTPException(status_code=404, detail="User not found")
    u.refresh_token = None; db.commit()
    return {"message": "Logged out"}

@app.get("/current-user", response_model=UserResponse)
def current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = get_current_user(authorization.split(" ", 1)[1], db)
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/refresh")
def token_refresh(token: RefreshToken, db: Session = Depends(get_db)):
    return refresh_token(token.refresh_token, db)

@app.get("/session-history/{user_id}")
def session_history(user_id: UUID, db: Session = Depends(get_db)):
    return db.query(SessionAttended).filter(SessionAttended.user_id == user_id).all()

@app.get("/session/{session_id}")
def session(session_id: UUID, db: Session = Depends(get_db)):
    s = db.query(SessionAttended).filter(SessionAttended.id == session_id).first()
    if not s: raise HTTPException(status_code=404, detail="Session not found")
    return s

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")
    history = _get_or_create_session(request.session_id)
    history.append(HumanMessage(content=request.message))
    result  = (prompt | llm).invoke({"messages": history})
    history.append(AIMessage(content=result.content))
    return ChatResponse(response=result.content)

@app.post("/chat/session/{user_id}")
def chat_session(user_id: UUID, db: Session = Depends(get_db)):
    s = ChatSession(user_id=user_id)
    db.add(s); db.commit(); db.refresh(s)
    return {"session_id": s.id}

@app.post("/chat/message")
def save_message(data: MessageSchema, db: Session = Depends(get_db)):
    db.add(Message(role=data.role, content=data.content, session_id=data.session_id))
    db.commit()
    return {"status": "saved"}

@app.get("/all/chat/{user_id}")
def all_chat(user_id: UUID, db: Session = Depends(get_db)):
    return (db.query(ChatSession).filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc()).all())

@app.get("/chat/history/{session_id}")
def get_chat_history(session_id: UUID, db: Session = Depends(get_db)):
    return (db.query(Message).filter(Message.session_id == session_id)
            .order_by(Message.created_at).all())

def save_log(transcript, voice, face, therapist_text):
    ts     = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    v_emo  = voice.get("dominant_emotion", "unknown")
    v_conf = float(voice.get("confidence", 0))
    f_emo  = face.get("dominant_emotion", "no_face") if face else "no_face"
    raw_fc = float((face or {}).get("emotions", {}).get(f_emo, 0))
    f_conf = round(raw_fc * 100, 2)
    verdict = v_emo if (f_emo == "no_face" or v_conf >= f_conf) else f_emo

    with open(LOG_FILE, "a", newline="") as f:
        csv.writer(f).writerow([ts, transcript, v_emo, v_conf, f_emo, f_conf, verdict, therapist_text])

    return {"timestamp": ts, "transcript": transcript,
            "voice": {"emotion": v_emo, "confidence": v_conf, "probabilities": voice.get("probabilities", {})},
            "face":  {"emotion": f_emo, "confidence": f_conf, "emotions": (face or {}).get("emotions", {})},
            "verdict": verdict}

@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    x_user_id: str = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    audio_bytes = await audio.read()
    mime_type   = audio.content_type or "audio/webm"
    last_audio.update(bytes=audio_bytes, mime=mime_type)

    transcript, language = transcriber.transcribe(audio_bytes, mime_type)

    crisis = detect_crisis(transcript)
    if crisis and crisis["tier"] <= 2:
        return JSONResponse(content={
            "crisis":     crisis,
            "transcript": transcript,
            "language":   language,
            "therapist":  {
                "text": (
                    "I hear that you're going through something very difficult. "
                    "Please reach out to one of these support lines — you don't have to face this alone."
                ),
                "audio_b64": "",
                "language":  language,
            },
        })

    voice_result = voice_rec.analyze(audio_bytes)

    face_result = face_rec.get_latest()
    if not face_result.get("dominant_emotion"):
        for _ in range(8):
            await asyncio.sleep(0.25)
            face_result = face_rec.get_latest()
            if face_result.get("dominant_emotion"):
                break

    combined = save_log(transcript, voice_result, face_result, "")

    therapy = therapist.respond(
        transcript=transcript,
        voice_emotion=combined["voice"]["emotion"],
        voice_confidence=combined["voice"]["confidence"],
        face_emotion=combined["face"]["emotion"],
        face_confidence=combined["face"]["confidence"],
        verdict=combined["verdict"],
        language=language,
    )

    last_response["bytes"] = therapy["audio_bytes"]

    if x_user_id:
        try:
            db.add(EmotionLog(
                user_id=uuid.UUID(x_user_id),
                transcript=transcript,
                voice_emotion=combined["voice"]["emotion"],
                voice_confidence=combined["voice"]["confidence"],
                face_emotion=combined["face"]["emotion"],
                face_confidence=combined["face"]["confidence"],
                verdict=combined["verdict"],
                language=language,
                therapist_text=therapy["text"],
            ))
            db.commit()
        except Exception as e:
            print(f"[EmotionLog] {e}")

    if crisis and crisis["tier"] <= 2 and x_user_id:
        try:
            user_obj = db.query(User).filter(User.id == uuid.UUID(x_user_id)).first()
            if user_obj:
                ex = EXERCISES.get("grounding", EXERCISES["box-breathing"])
                subj, html = crisis_followup_email(
                    user_name=user_obj.name,
                    helplines=CRISIS_HELPLINES,
                    exercise=ex,
                    app_url=APP_URL,
                )
                send_email(user_obj.email, subj, html)
        except Exception as e:
            print(f"[Email] Crisis send error: {e}")

    combined["therapist"]  = {"text": therapy["text"], "audio_b64": therapy["audio_b64"], "language": language}
    combined["transcript"] = transcript
    combined["language"]   = language
    combined["crisis"]     = crisis
    return JSONResponse(content=combined)

@app.get("/playback")
async def playback():
    if not last_audio["bytes"]: return Response(status_code=204)
    return Response(content=last_audio["bytes"], media_type=last_audio["mime"],
                    headers={"Content-Disposition": "inline; filename=playback.webm"})

@app.get("/response-audio")
async def response_audio():
    if not last_response["bytes"]: return Response(status_code=204)
    return Response(content=last_response["bytes"], media_type="audio/mpeg",
                    headers={"Content-Disposition": "inline; filename=response.mp3"})

@app.get("/history")
async def get_history():
    records = []
    try:
        with open(LOG_FILE, newline="") as f: records = list(csv.DictReader(f))
    except FileNotFoundError: pass
    return records[-50:]

@app.post("/clear-memory")
async def clear_memory():
    therapist.clear_memory()
    return {"status": "cleared"}

@app.websocket("/ws/face")
async def ws_face(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_text(json.dumps(face_rec.get_latest(), cls=NumpyEncoder))
            await asyncio.sleep(1)
    except WebSocketDisconnect: pass

@app.websocket("/ws/camera")
async def ws_camera(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            jpeg_bytes = await websocket.receive_bytes()
            result = face_rec.receive_frame(jpeg_bytes)
            await websocket.send_text(json.dumps(result, cls=NumpyEncoder))
    except WebSocketDisconnect: pass

@app.post("/camera/start")
async def camera_start():
    face_rec.start(); return {"status": "started"}

@app.post("/camera/stop")
async def camera_stop():
    face_rec.stop(); return {"status": "stopped"}

@app.get("/camera/status")
async def camera_status():
    return {"running": face_rec.is_running()}

@app.get("/exercises")
async def get_exercises():
    return list(EXERCISES.values())

@app.post("/exercises/tts")
async def exercise_tts(request: Request):
    from gtts import gTTS
    body = await request.json()
    text = body.get("text", ""); lang = body.get("lang", "en")
    if not text: return Response(status_code=400)
    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        buf = io.BytesIO(); tts.write_to_fp(buf); buf.seek(0)
        return Response(content=buf.read(), media_type="audio/mpeg",
                        headers={"Cache-Control": "no-cache"})
    except Exception as e:
        print(f"[TTS] {e}"); return Response(status_code=500)

@app.post("/session/end/{user_id}")
async def end_session(user_id: UUID, db: Session = Depends(get_db)):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=60)
    logs = (db.query(EmotionLog)
            .filter(EmotionLog.user_id == user_id, EmotionLog.created_at >= cutoff)
            .order_by(EmotionLog.created_at).all())
    if not logs:
        raise HTTPException(status_code=404, detail="No session data found")

    log_dicts = [{"transcript": l.transcript, "voice_emotion": l.voice_emotion,
                  "face_emotion": l.face_emotion, "verdict": l.verdict,
                  "therapist_text": l.therapist_text} for l in logs]

    crisis_detected = None
    for l in log_dicts:
        c = detect_crisis(l.get("transcript", ""))
        if c: crisis_detected = c.get("keyword"); break

    data = generate_session_summary(log_dicts)

    summary = SessionSummary(
        user_id=user_id,
        dominant_emotions=data.get("dominant_emotions", {}),
        topics_discussed=data.get("topics_discussed", []),
        coping_strategies=data.get("coping_strategies", []),
        suggested_exercises=data.get("suggested_exercises", []),
        summary_text=data.get("summary_text", ""),
        crisis_detected=crisis_detected,
    )
    db.add(summary); db.commit(); db.refresh(summary)

    return {
        "id": str(summary.id),
        "dominant_emotions": summary.dominant_emotions,
        "topics_discussed": summary.topics_discussed,
        "coping_strategies": summary.coping_strategies,
        "suggested_exercises": summary.suggested_exercises,
        "summary_text": summary.summary_text,
        "crisis_detected": summary.crisis_detected,
        "created_at": summary.created_at.isoformat(),
    }

@app.get("/mood/timeline/{user_id}")
def mood_timeline(user_id: UUID, days: int = 30, db: Session = Depends(get_db)):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    logs = (db.query(EmotionLog)
            .filter(EmotionLog.user_id == user_id, EmotionLog.created_at >= cutoff)
            .order_by(EmotionLog.created_at).all())
    by_date: dict[str, list] = {}
    for log in logs:
        d = log.created_at.strftime("%Y-%m-%d")
        if d not in by_date: by_date[d] = []
        if log.verdict: by_date[d].append(log.verdict)
    timeline = []
    for d, emotions in sorted(by_date.items()):
        if emotions:
            dominant = Counter(emotions).most_common(1)[0][0]
            timeline.append({"date": d, "dominant": dominant,
                             "counts": dict(Counter(emotions)), "total": len(emotions)})
    return timeline

@app.get("/mood/heatmap/{user_id}")
def mood_heatmap(user_id: UUID, db: Session = Depends(get_db)):
    logs = db.query(EmotionLog).filter(EmotionLog.user_id == user_id).all()
    days_map = {0:"Monday",1:"Tuesday",2:"Wednesday",3:"Thursday",4:"Friday",5:"Saturday",6:"Sunday"}
    by_dow: dict[str, list] = {d: [] for d in days_map.values()}
    for log in logs:
        if log.verdict and log.created_at:
            by_dow[days_map[log.created_at.weekday()]].append(log.verdict)
    result = {}
    for day, emotions in by_dow.items():
        result[day] = {
            "dominant": Counter(emotions).most_common(1)[0][0] if emotions else None,
            "counts": dict(Counter(emotions)),
            "total": len(emotions),
        }
    return result

@app.get("/summaries/{user_id}")
def get_summaries(user_id: UUID, limit: int = 10, db: Session = Depends(get_db)):
    summaries = (db.query(SessionSummary)
                 .filter(SessionSummary.user_id == user_id)
                 .order_by(SessionSummary.created_at.desc())
                 .limit(limit).all())
    return [{"id": str(s.id), "dominant_emotions": s.dominant_emotions,
             "topics_discussed": s.topics_discussed, "coping_strategies": s.coping_strategies,
             "suggested_exercises": s.suggested_exercises, "summary_text": s.summary_text,
             "crisis_detected": s.crisis_detected, "created_at": s.created_at.isoformat()}
            for s in summaries]

@app.get("/coping-plan/{user_id}")
def get_coping_plan(user_id: UUID, db: Session = Depends(get_db)):
    summaries = (db.query(SessionSummary)
                 .filter(SessionSummary.user_id == user_id)
                 .order_by(SessionSummary.created_at.desc())
                 .limit(7).all())
    if len(summaries) < 2:
        return {"plan": None, "exercises": [],
                "message": "Complete at least 2 sessions to get a personalized plan."}
    plan = generate_coping_plan([
        {"dominant_emotions": s.dominant_emotions,
         "topics_discussed": s.topics_discussed, "patterns": None}
        for s in summaries
    ])
    ex_counts: dict[str, int] = {}
    for s in summaries:
        for ex in (s.suggested_exercises or []):
            ex_counts[ex] = ex_counts.get(ex, 0) + 1
    top_ex = sorted(ex_counts, key=ex_counts.get, reverse=True)[:3]
    return {"plan": plan, "exercises": [EXERCISES[e] for e in top_ex if e in EXERCISES]}

@app.get("/reminder/{user_id}")
def get_reminder(user_id: UUID, db: Session = Depends(get_db)):
    r = db.query(ExerciseReminder).filter(ExerciseReminder.user_id == user_id).first()
    if not r:
        return {"reminder": None}
    return {"reminder": {"exercise_id": r.exercise_id,
                         "reminder_time": r.reminder_time, "enabled": r.enabled}}


@app.post("/reminder/{user_id}")
def save_reminder(user_id: UUID, body: dict, db: Session = Depends(get_db)):
    exercise_id   = body.get("exercise_id", "box-breathing")
    reminder_time = body.get("reminder_time", "20:00")
    enabled       = body.get("enabled", True)

    if exercise_id not in EXERCISES:
        raise HTTPException(status_code=400, detail="Invalid exercise_id")
    if not re.match(r'^([01]\d|2[0-3]):[0-5]\d$', reminder_time):
        raise HTTPException(status_code=400, detail="reminder_time must be HH:MM 24h UTC")

    r = db.query(ExerciseReminder).filter(ExerciseReminder.user_id == user_id).first()
    if r:
        r.exercise_id = exercise_id; r.reminder_time = reminder_time; r.enabled = enabled
    else:
        db.add(ExerciseReminder(user_id=user_id, exercise_id=exercise_id,
                                reminder_time=reminder_time, enabled=enabled))
    db.commit()
    return {"status": "saved", "exercise_id": exercise_id,
            "reminder_time": reminder_time, "enabled": enabled}


@app.delete("/reminder/{user_id}")
def disable_reminder(user_id: UUID, db: Session = Depends(get_db)):
    r = db.query(ExerciseReminder).filter(ExerciseReminder.user_id == user_id).first()
    if r:
        r.enabled = False; db.commit()
    return {"status": "disabled"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


@app.get("/analytics/heatmap/{user_id}")
def analytics_heatmap(user_id: UUID, weeks: int = 12, db: Session = Depends(get_db)):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(weeks=weeks)
    logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.user_id == user_id, EmotionLog.created_at >= cutoff)
        .order_by(EmotionLog.created_at)
        .all()
    )
    by_date: dict[str, list] = {}
    for log in logs:
        d = log.created_at.strftime("%Y-%m-%d")
        if d not in by_date: by_date[d] = []
        if log.verdict: by_date[d].append(log.verdict)

    result = []
    for d, emotions in sorted(by_date.items()):
        if emotions:
            c = Counter(emotions)
            result.append({"date": d, "dominant": c.most_common(1)[0][0],
                           "counts": dict(c), "total": len(emotions)})
    return result


@app.get("/analytics/alignment/{user_id}")
def analytics_alignment(user_id: UUID, days: int = 30, db: Session = Depends(get_db)):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    logs = (
        db.query(EmotionLog)
        .filter(
            EmotionLog.user_id == user_id,
            EmotionLog.created_at >= cutoff,
            EmotionLog.face_emotion != "no_face",
            EmotionLog.face_emotion.isnot(None),
            EmotionLog.voice_emotion.isnot(None),
        )
        .order_by(EmotionLog.created_at)
        .all()
    )
    if not logs:
        return {"overall_match_pct": None, "total_analyzed": 0,
                "total_matched": 0, "daily": [], "mismatch_breakdown": {}}

    total_match = sum(1 for l in logs if l.voice_emotion == l.face_emotion)
    overall_pct = round(total_match / len(logs) * 100, 1)

    by_date: dict[str, dict] = {}
    for log in logs:
        d = log.created_at.strftime("%Y-%m-%d")
        if d not in by_date: by_date[d] = {"match": 0, "total": 0}
        by_date[d]["total"] += 1
        if log.voice_emotion == log.face_emotion:
            by_date[d]["match"] += 1

    daily = [{"date": d, "match_pct": round(v["match"]/v["total"]*100,1), "total": v["total"]}
             for d, v in sorted(by_date.items())]

    mismatches = [l for l in logs if l.voice_emotion != l.face_emotion]
    breakdown: dict[str, int] = {}
    for l in mismatches:
        k = f"{l.face_emotion} / {l.voice_emotion}"
        breakdown[k] = breakdown.get(k, 0) + 1

    return {
        "overall_match_pct":  overall_pct,
        "total_analyzed":     len(logs),
        "total_matched":      total_match,
        "daily":              daily,
        "mismatch_breakdown": dict(sorted(breakdown.items(), key=lambda x: x[1], reverse=True)[:5]),
    }


@app.get("/analytics/streak/{user_id}")
def analytics_streak(user_id: UUID, db: Session = Depends(get_db)):
    logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.user_id == user_id)
        .order_by(EmotionLog.created_at)
        .all()
    )
    if not logs:
        return {"current_streak": 0, "longest_streak": 0,
                "total_days": 0, "last_7": [], "today_done": False}

    dates     = sorted(set(l.created_at.strftime("%Y-%m-%d") for l in logs))
    date_objs = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in dates]
    today     = datetime.datetime.utcnow().date()
    date_set  = set(date_objs)

    current = 0
    check   = today
    while True:
        if check in date_set:
            current += 1
        elif current > 0:
            break
        elif (today - check).days > 1:
            break
        check -= datetime.timedelta(days=1)
        if (today - check).days > 365:
            break

    longest = run = 1 if date_objs else 0
    for i in range(1, len(date_objs)):
        if (date_objs[i] - date_objs[i-1]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    last_7 = [
        {"date": (today - datetime.timedelta(days=i)).isoformat(),
         "day":  (today - datetime.timedelta(days=i)).strftime("%a"),
         "has_session": (today - datetime.timedelta(days=i)) in date_set}
        for i in range(6, -1, -1)
    ]

    return {"current_streak": current, "longest_streak": longest,
            "total_days": len(dates), "today_done": today in date_set, "last_7": last_7}