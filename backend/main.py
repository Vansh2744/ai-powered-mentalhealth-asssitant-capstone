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
import threading
import cv2
import threading
import datetime
import pyttsx3
from deepface import DeepFace
from pathlib import Path
from system_prompt import conversation_prompt
from mental_health_evaluation import evaluate_app
from uuid import UUID, uuid4
import whisper
from gtts import gTTS
import shutil
from transformers import pipeline
from fastapi.responses import FileResponse


Base.metadata.create_all(bind=engine)

load_dotenv()

emotion_classifier = pipeline(
    task="audio-classification", model="superb/wav2vec2-base-superb-er"
)

model = whisper.load_model("base")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

running = False
camera_thread = None
cap = None

LOG_FILE = "emotion_log.txt"

engine = pyttsx3.init()
engine.setProperty("rate", 150)

def log_emotion(emotion: str):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"{time_now} - {emotion}\n")


def emotion_detection_loop():
    global running, cap

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        running = False
        return

    while running:
        ret, frame = cap.read()
        if not ret:
            break

        try:
            result = DeepFace.analyze(
                frame, actions=["emotion"], enforce_detection=False
            )
            emotion = result[0]["dominant_emotion"]
        except Exception:
            emotion = "No Face"

        if emotion != "No Face":
            log_emotion(emotion)

    cap.release()
    running = False


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

@app.post("/therapy", response_model=ChatResponse)
async def therapy(file: UploadFile = File(...)):
    global running, camera_thread

    if not running:
        running = True
    camera_thread = threading.Thread(target=emotion_detection_loop)
    camera_thread.start()

    file_location = f"audio_files/{file.filename}"

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = emotion_classifier("audio_files/recording.webm")
    emotion = result[0]["label"]
    confidence = result[0]["score"]

    audio_result = model.transcribe("audio_files/recording.webm")

    session_id = "default_session"
    if session_id not in sessions:
        sessions[session_id] = []

    all_emotion_track = ""

    with open(LOG_FILE, 'r') as f:
        all_emotion_track = f.read()

    print(all_emotion_track)

    sessions[session_id].append(HumanMessage(content=f"text:{audio_result['text']} emotion:{emotion} confidence:{confidence} all_emotion_track:{all_emotion_track}"))

    result = graph.invoke({"messages": sessions[session_id]})

    ai_response = result["messages"][-1].content

    sessions[session_id].append(AIMessage(content=ai_response))
    
    tts = gTTS(text=ai_response, lang="en")

    tts.save("audio_files/output.mp3")

    return FileResponse(
        path="audio_files/output.mp3", media_type="audio/mpeg", filename="output.mp3"
    )

@app.post('/camera-running-check')
def camera_check():
    global running

    running = False 

    file_path = Path("emotion_log.txt")

    if file_path.exists():
        file_path.unlink()

    return {"message": "camera is off"}

@app.post("/stop")
def stop_camera(response:TherapySessionResponse, db:Session = Depends(get_db)):
    global running
    running = False

    file_path = 'emotion_log.txt'

    file_content = ""

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            file_content = content
    except FileNotFoundError:
        return {"message":f"Error: The file '{file_path}' was not found."}
    except Exception as e:
        return {"message":f"An error occurred: {e}"}

    Path(file_path).unlink()

    result = evaluate_app.invoke({
    "conversation": response.data,
    "face_logs": file_content
     })

    db_session = SessionAttended(
        classification=result["classification"],
        evaluation=result["evaluation"],
        user_id=response.user_id
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return {"classification": result["classification"], "evaluation":result["evaluation"]}

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

