import os
import io
import csv
import json
import asyncio
import datetime
from collections import OrderedDict
from contextlib import asynccontextmanager
from uuid import UUID

from dotenv import load_dotenv
from fastapi import (
    FastAPI, Depends, HTTPException, Header,
    UploadFile, File, WebSocket, WebSocketDisconnect, Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

load_dotenv()

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage

from models import User, SessionAttended, ChatSession, Message
from schemas import (
    UserCreate, UserLogin, UserLogout, UserResponse,
    RefreshToken, ChatRequest, ChatResponse, MessageSchema,
)
from db import get_db, engine, Base
from auth import (
    get_password_hash, authenticate_user, get_current_user,
    create_access_token, create_refresh_token, refresh_token,
)
from system_prompt import conversation_prompt 
from face_recognizer import FaceEmotionRecognizer
from voice_recognizer import VoiceEmotionRecognizer
from therapist import TherapistAgent
from transcriber import Transcriber
from exercises import EXERCISES


Base.metadata.create_all(bind=engine)

LOG_FILE         = "emotion_log.csv"
MAX_SESSIONS     = 100          

face_rec   = FaceEmotionRecognizer()
voice_rec  = VoiceEmotionRecognizer()
therapist  = TherapistAgent()
transcriber = Transcriber()

last_audio:    dict = {"bytes": None, "mime": "audio/webm"}
last_response: dict = {"bytes": None}


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        import numpy as np          # local import — don't pay at startup
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.integer):  return int(obj)
        if isinstance(obj, np.ndarray):  return obj.tolist()
        return super().default(obj)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", newline="") as f:
            csv.writer(f).writerow([
                "timestamp", "transcript",
                "voice_emotion", "voice_confidence",
                "face_emotion",  "face_confidence",
                "verdict",       "therapist_response",
            ])
    print("Backend ready.")
    yield
    face_rec.stop()


app = FastAPI(lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    max_tokens=500,
    groq_api_key=os.getenv("GROQ_API_KEY"),
)
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
        sessions.popitem(last=False)   # evict oldest
    return sessions[session_id]


@app.post("/sign-up")
def sign_up(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    db_user = User(
        name=user.name,
        email=user.email,
        password=get_password_hash(user.password),
    )
    db.add(db_user); db.commit(); db.refresh(db_user)
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
    return {"access_token": access, "refresh_token": refresh,
            "user": {"id": u.id, "email": u.email}}


@app.post("/sign-out")
def logout(user: UserLogout, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == user.email).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.refresh_token = None; db.commit()
    return {"message": "Logged out"}


@app.get("/current-user", response_model=UserResponse)
def current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    user  = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/refresh")
def token_refresh(token: RefreshToken, db: Session = Depends(get_db)):
    return refresh_token(token.refresh_token, db)


@app.get("/session-history/{user_id}")
def session_history(user_id: UUID, db: Session = Depends(get_db)):
    return db.query(SessionAttended).filter(
        SessionAttended.user_id == user_id).all()


@app.get("/session/{session_id}")
def session(session_id: UUID, db: Session = Depends(get_db)):
    s = db.query(SessionAttended).filter(SessionAttended.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")

    history = _get_or_create_session(request.session_id)
    history.append(HumanMessage(content=request.message))

    chain  = prompt | llm
    result = chain.invoke({"messages": history})
    ai_text = result.content

    history.append(AIMessage(content=ai_text))
    return ChatResponse(response=ai_text)


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
    return (db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
            .all())


@app.get("/chat/history/{session_id}")
def get_chat_history(session_id: UUID, db: Session = Depends(get_db)):
    return (db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.created_at)
            .all())

def save_log(transcript: str, voice: dict, face: dict, therapist_text: str) -> dict:
    ts    = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    v_emo  = voice.get("dominant_emotion", "unknown")
    v_conf = float(voice.get("confidence", 0))
    f_emo  = face.get("dominant_emotion", "no_face") if face else "no_face"

    raw_f_conf = float((face or {}).get("emotions", {}).get(f_emo, 0))
    f_conf = round(raw_f_conf * 100, 2)

    
    if f_emo == "no_face" or not face:
        verdict = v_emo
    elif v_conf >= f_conf:
        verdict = v_emo
    else:
        verdict = f_emo

    with open(LOG_FILE, "a", newline="") as f:
        csv.writer(f).writerow(
            [ts, transcript, v_emo, v_conf, f_emo, f_conf, verdict, therapist_text])

    return {
        "timestamp": ts, "transcript": transcript,
        "voice": {"emotion": v_emo, "confidence": v_conf,
                  "probabilities": voice.get("probabilities", {})},
        "face":  {"emotion": f_emo, "confidence": f_conf,
                  "emotions": (face or {}).get("emotions", {})},
        "verdict": verdict,
    }


@app.post("/analyze")
async def analyze(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    mime_type   = audio.content_type or "audio/webm"
    last_audio.update(bytes=audio_bytes, mime=mime_type)

    transcript, language = transcriber.transcribe(audio_bytes, mime_type)
    voice_result = voice_rec.analyze(audio_bytes)

    face_result = face_rec.get_latest()
    if not face_result.get("dominant_emotion"):
        import asyncio
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
    combined["therapist"]  = {
        "text": therapy["text"],
        "audio_b64": therapy["audio_b64"],
        "language": language,
    }
    combined["transcript"] = transcript
    combined["language"]   = language
    return JSONResponse(content=combined)


@app.get("/playback")
async def playback():
    if not last_audio["bytes"]:
        return Response(status_code=204)
    return Response(content=last_audio["bytes"], media_type=last_audio["mime"],
                    headers={"Content-Disposition": "inline; filename=playback.webm"})


@app.get("/response-audio")
async def response_audio():
    if not last_response["bytes"]:
        return Response(status_code=204)
    return Response(content=last_response["bytes"], media_type="audio/mpeg",
                    headers={"Content-Disposition": "inline; filename=response.mp3"})


@app.get("/history")
async def get_history():
    records = []
    try:
        with open(LOG_FILE, newline="") as f:
            records = list(csv.DictReader(f))
    except FileNotFoundError:
        pass
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
            data = face_rec.get_latest()
            await websocket.send_text(json.dumps(data, cls=NumpyEncoder))
            await asyncio.sleep(1) 
    except WebSocketDisconnect:
        pass


@app.websocket("/ws/camera")
async def ws_camera(websocket: WebSocket):
    """
    Browser encodes its camera as JPEG and sends raw bytes over this socket.
    Server analyses them and sends back the emotion JSON.
    This avoids the server needing a webcam at all (works on Render).
    """
    await websocket.accept()
    try:
        while True:
            jpeg_bytes = await websocket.receive_bytes()
            result = face_rec.receive_frame(jpeg_bytes)
            await websocket.send_text(json.dumps(result, cls=NumpyEncoder))
    except WebSocketDisconnect:
        pass


@app.post("/camera/start")
async def camera_start():
    face_rec.start()           # no-op on Render (no webcam), fine
    return {"status": "started"}


@app.post("/camera/stop")
async def camera_stop():
    face_rec.stop()
    return {"status": "stopped"}


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
    text = body.get("text", "")
    lang = body.get("lang", "en")
    if not text:
        return Response(status_code=400)
    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return Response(content=buf.read(), media_type="audio/mpeg",
                        headers={"Cache-Control": "no-cache"})
    except Exception as e:
        print(f"[Exercise TTS error] {e}")
        return Response(status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)