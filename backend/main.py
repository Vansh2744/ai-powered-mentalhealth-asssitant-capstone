import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, MessagesState, StateGraph
from fastapi.middleware.cors import CORSMiddleware
from models import User, SessionAttended, ChatSession, Message
from schemas import (
    UserCreate,
    UserLogin,
    UserLogout,
    UserResponse,
    RefreshToken,
    TherapySessionResponse,
    ChatRequest,
    ChatResponse,
    MessageSchema
)
from db import get_db
from auth import (
    get_password_hash,
    authenticate_user,
    get_current_user,
    create_access_token,
    create_refresh_token,
    refresh_token,
)
from sqlalchemy.orm import Session
from db import engine, Base
import cv2
import datetime
from system_prompt import conversation_prompt
from uuid import UUID
from gtts import gTTS
import csv
import datetime
import os
import base64
import cv2
import json
import asyncio
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from face_recognizer import FaceEmotionRecognizer
from voice_recognizer import VoiceEmotionRecognizer
from therapist import TherapistAgent
from transcriber import Transcriber

from exercises import EXERCISES
from gtts import gTTS
import io
from fastapi import Request


Base.metadata.create_all(bind=engine)

load_dotenv()

face_rec = FaceEmotionRecognizer()
voice_rec = VoiceEmotionRecognizer()
therapist = TherapistAgent()
transcriber = Transcriber()
LOG_FILE = "emotion_log.csv"

last_audio: dict = {"bytes": None, "mime": "audio/webm"}
last_response: dict = {"bytes": None}

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", newline="") as f:
            csv.writer(f).writerow(
                [
                    "timestamp",
                    "transcript",
                    "voice_emotion",
                    "voice_confidence",
                    "face_emotion",
                    "face_confidence",
                    "verdict",
                    "therapist_response",
                ]
            )
    print("Backend ready.")
    yield
    face_rec.stop()

app = FastAPI(lifespan=lifespan)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        FRONTEND_URL,           # ← production frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    max_tokens=500,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", conversation_prompt),
        MessagesPlaceholder(variable_name="messages"),
    ]
)


def call_model(state: MessagesState):
    chain = prompt | llm
    response = chain.invoke(state["messages"])
    return {"messages": [response]}

workflow = StateGraph(state_schema=MessagesState)
workflow.add_node("model", call_model)
workflow.set_entry_point("model")
workflow.add_edge("model", END)
graph = workflow.compile()


sessions = {}

@app.post("/sign-up")
def sign_up(user: UserCreate, db: Session = Depends(get_db)):
    existed_user = db.query(User).filter(User.email == user.email).first()
    if existed_user:
        raise HTTPException(
            status_code=402, detail="User with this email already exists"
        )

    hashed_password = get_password_hash(user.password)
    db_user = User(name=user.name, email=user.email, password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if not db_user:
        raise HTTPException(
            status_code=402, detail="Unable to signup. Please try again later"
        )
    return {"message": "Signup successful"}


@app.post("/sign-in")
def sign_in(user: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(user.email, user.password, db)

    if not user:
        raise HTTPException(status_code=402, detail="User not found")

    access_token = create_access_token({"sub": user.email})
    refresh_token = create_refresh_token({"sub": user.email})

    user.refresh_token = refresh_token
    db.commit()
    db.refresh(user)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {"id": user.id, "email": user.email},
    }


@app.post("/sign-out")
def logout(user: UserLogout, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user.email).first()
    if not user:
        raise HTTPException(status_code=402, detail="User not Found")

    user.refresh_token = None
    db.commit()

    return {"message": "Logged out"}


@app.get("/current-user", response_model=UserResponse)
def current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = get_current_user(token, db)

    if not user:
        raise HTTPException(status_code=402, detail="User not Found")

    return user


@app.post("/refresh")
def token_refresh(token: RefreshToken, db: Session = Depends(get_db)):
    token = token.refresh_token
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res_tokens = refresh_token(token, db)

    return res_tokens

@app.get('/session-history/{user_id}')
def session_history(user_id:UUID, db: Session = Depends(get_db)):
    sessions = db.query(SessionAttended).filter(SessionAttended.user_id == user_id).all()
    return sessions

@app.get('/session/{session_id}')
def session(session_id:UUID, db:Session = Depends(get_db)):
    session = db.query(SessionAttended).filter(SessionAttended.id == session_id).first()

    if not session:
        raise HTTPException(status_code=402, detail="Note not found")
    
    return session

@app.post('/chat', response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")

    session_id = request.session_id
    if session_id not in sessions:
        sessions[session_id] = []

    sessions[session_id].append(HumanMessage(content=request.message))

    result = graph.invoke({"messages": sessions[session_id]})

    ai_response = result["messages"][-1].content

    sessions[session_id].append(AIMessage(content=ai_response))
    
    return ChatResponse(response=ai_response)

@app.post('/chat/session/{user_id}')
def chat_session(user_id:UUID, db:Session = Depends(get_db)):
    db_chat_session = ChatSession(user_id = user_id)
    db.add(db_chat_session)
    db.commit()
    db.refresh(db_chat_session)

    return {"session_id":db_chat_session.id}

@app.post("/chat/message")
def save_message(data: MessageSchema, db:Session = Depends(get_db)):
    message = Message(
        role=data.role,
        content=data.content,
        session_id=data.session_id
    )
    db.add(message)
    db.commit()
    return {"status": "saved"}

@app.get('/all/chat/{user_id}')
def all_chat(user_id:UUID, db:Session = Depends(get_db)):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )

    return sessions

@app.get("/chat/history/{session_id}")
def get_history(session_id: UUID, db:Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at).all()

    return messages

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

def save_log(transcript: str, voice: dict, face: dict, therapist_text: str) -> dict:
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    v_emo = voice.get("dominant_emotion", "unknown")
    v_conf = float(voice.get("confidence", 0))
    f_emo = face.get("dominant_emotion", "no_face") if face else "no_face"
    f_conf = float(face.get("emotions", {}).get(f_emo, 0)) if face else 0.0
    verdict = v_emo if v_conf >= f_conf else f_emo

    with open(LOG_FILE, "a", newline="") as f:
        csv.writer(f).writerow(
            [ts, transcript, v_emo, v_conf, f_emo, f_conf, verdict, therapist_text]
        )

    return {
        "timestamp": ts,
        "transcript": transcript,
        "voice": {
            "emotion": v_emo,
            "confidence": v_conf,
            "probabilities": voice.get("probabilities", {}),
        },
        "face": {
            "emotion": f_emo,
            "confidence": f_conf,
            "emotions": face.get("emotions", {}) if face else {},
        },
        "verdict": verdict,
    }

@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...)
):
    audio_bytes = await audio.read()
    mime_type = audio.content_type or "audio/webm"
    last_audio["bytes"] = audio_bytes
    last_audio["mime"] = mime_type

    transcript, language = transcriber.transcribe(audio_bytes, mime_type)

    voice_result = voice_rec.analyze(audio_bytes)
    face_result = face_rec.get_latest()
    combined = save_log(transcript, voice_result, face_result, "")

    therapy = therapist.respond(
        transcript=transcript,
        voice_emotion=combined["voice"]["emotion"],
        voice_confidence=combined["voice"]["confidence"],
        face_emotion=combined["face"]["emotion"],
        face_confidence=combined["face"]["confidence"],
        verdict=combined["verdict"],
        language=language,  # ← pass detected language
    )

    last_response["bytes"] = therapy["audio_bytes"]
    combined["therapist"] = {
        "text": therapy["text"],
        "audio_b64": therapy["audio_b64"],
        "language": language,
    }
    combined["transcript"] = transcript
    combined["language"] = language
    return JSONResponse(content=combined)


@app.get("/playback")
async def playback():
    if not last_audio["bytes"]:
        return Response(status_code=204)
    return Response(
        content=last_audio["bytes"],
        media_type=last_audio["mime"],
        headers={"Content-Disposition": "inline; filename=playback.webm"},
    )


@app.get("/response-audio")
async def response_audio():
    if not last_response["bytes"]:
        return Response(status_code=204)
    return Response(
        content=last_response["bytes"],
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=response.mp3"},
    )



@app.get("/history")
async def get_history():
    records = []
    try:
        with open(LOG_FILE, newline="") as f:
            for row in csv.DictReader(f):
                records.append(row)
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
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass



@app.websocket("/ws/camera")
async def ws_camera(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            frame = face_rec.get_latest_frame()
            if frame is not None:
                _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
                await websocket.send_text(json.dumps({"frame": b64}))
            await asyncio.sleep(0.033)
    except WebSocketDisconnect:
        pass


@app.post("/camera/start")
async def camera_start():
    if not face_rec.is_running():
        face_rec.start()
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
        return Response(
            content=buf.read(),
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-cache"},
        )
    except Exception as e:
        print(f"[Exercise TTS error] {e}")
        return Response(status_code=500)