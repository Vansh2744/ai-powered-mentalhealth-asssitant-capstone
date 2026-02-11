import cv2
import threading
import datetime
import pyttsx3
from deepface import DeepFace

LOG_FILE = "emotion_log.txt"

def log_emotion(emotion: str):
    time_now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"{time_now} - {emotion}\n")


def emotion_detection_loop():
    global running, cap, last_spoken

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

        if emotion != last_spoken and emotion != "No Face":
            # speak(f"You look {emotion}")
            log_emotion(emotion)
            last_spoken = emotion

    cap.release()
    running = False