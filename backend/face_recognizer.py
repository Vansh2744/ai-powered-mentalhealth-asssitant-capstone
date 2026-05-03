import cv2
import threading
from fer import FER


class FaceEmotionRecognizer:
    def __init__(self):
        self.lock = threading.Lock()
        self.cap = None
        self.frame = None
        self.result = {}
        self.running = False
        self.thread = None


        self.detector = FER(mtcnn=False)

    def start(self):
        """Start webcam"""
        if self.running:
            return

        self.cap = cv2.VideoCapture(0)

        if not self.cap.isOpened():
            raise RuntimeError("Cannot open webcam")

        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

        print("Camera Started")

    def stop(self):
        """Stop webcam"""
        self.running = False

        if self.cap:
            self.cap.release()
            self.cap = None

        with self.lock:
            self.frame = None
            self.result = {}

        print("Camera Stopped")

    def is_running(self):
        return self.running

    def _loop(self):
        count = 0

        while self.running:
            if not self.cap:
                break

            ret, frame = self.cap.read()

            if not ret:
                continue

            frame = cv2.resize(frame, (320, 240))

            with self.lock:
                self.frame = frame.copy()

            if count % 15 == 0:
                try:
                    faces = self.detector.detect_emotions(frame)

                    if faces:
                        emotions = faces[0]["emotions"]
                        dominant = max(emotions, key=emotions.get)

                        with self.lock:
                            self.result = {
                                "dominant_emotion": dominant,
                                "emotions": {
                                    k: round(v, 2)
                                    for k, v in emotions.items()
                                }
                            }

                except:
                    pass

            count += 1

    def get_latest(self):
        """Get latest emotion result"""
        with self.lock:
            return self.result.copy()

    def get_latest_frame(self):
        """Get latest camera frame"""
        with self.lock:
            return self.frame.copy() if self.frame is not None else None