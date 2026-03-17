import cv2
import threading
import numpy as np
from deepface import DeepFace


class FaceEmotionRecognizer:
    def __init__(self):
        self._lock = threading.Lock()
        self._latest_result = {}
        self._latest_frame = None
        self._cap = None
        self._running = False
        self._thread = None

    def start(self):
        """Start webcam only when called — not on server startup."""
        if self._running:
            return
        self._cap = cv2.VideoCapture(0)
        if not self._cap.isOpened():
            raise RuntimeError("Cannot open webcam")
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        print("📷 Camera started.")

    def stop(self):
        """Stop webcam and release resources."""
        if not self._running:
            return
        self._running = False
        if self._cap:
            self._cap.release()
            self._cap = None
        with self._lock:
            self._latest_frame = None
            self._latest_result = {}
        print("📷 Camera stopped.")

    def is_running(self) -> bool:
        return self._running

    def _loop(self):
        frame_count = 0
        while self._running:
            if not self._cap or not self._cap.isOpened():
                break
            ret, frame = self._cap.read()
            if not ret:
                continue
            with self._lock:
                self._latest_frame = frame.copy()
            if frame_count % 5 == 0:
                result = self._analyze(frame)
                if result:
                    with self._lock:
                        self._latest_result = result
            frame_count += 1

    def _analyze(self, frame) -> dict:
        try:
            analyses = DeepFace.analyze(
                frame,
                actions=["emotion"],
                enforce_detection=False,
                silent=True,
            )
            if not isinstance(analyses, list):
                analyses = [analyses]
            face = analyses[0]
            return {
                "dominant_emotion": face["dominant_emotion"],
                "emotions": {k: round(float(v), 2) for k, v in face["emotion"].items()},
            }
        except Exception:
            return {}

    def get_latest(self) -> dict:
        with self._lock:
            return dict(self._latest_result)

    def get_latest_frame(self):
        with self._lock:
            return self._latest_frame.copy() if self._latest_frame is not None else None
