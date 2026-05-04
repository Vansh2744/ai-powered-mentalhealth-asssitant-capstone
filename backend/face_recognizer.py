import threading
import time
import numpy as np

try:
    import cv2
    CV2_OK = True
except ImportError:
    CV2_OK = False

try:
    from fer import FER
    FER_OK = True
except ImportError:
    FER_OK = False

MIN_ANALYSE_INTERVAL = 1.5   # seconds between face analyses


class FaceEmotionRecognizer:
    def __init__(self):
        self._lock         = threading.Lock()
        self._result: dict = {}
        self._frame: "np.ndarray | None" = None
        self._detector     = None
        self._running      = False
        self._cap          = None
        self._thread       = None

        self._last_analyse = -999.0
        self._analysing    = threading.Event()

    def _get_detector(self):
        if self._detector is None and FER_OK:
            self._detector = FER(mtcnn=False)
        return self._detector

    def start(self):
        """Try to open local webcam (works locally; no-op on Render)."""
        if self._running or not CV2_OK:
            return
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("[FaceRec] No webcam — frame-push mode only.")
            return
        self._cap     = cap
        self._running = True
        self._thread  = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        print("[FaceRec] Camera started.")

    def stop(self):
        self._running = False
        if self._cap:
            self._cap.release()
            self._cap = None
        with self._lock:
            self._frame  = None
            self._result = {}
        print("[FaceRec] Stopped.")

    def is_running(self) -> bool:
        return self._running

    def get_latest(self) -> dict:
        with self._lock:
            return self._result.copy()

    def get_latest_frame(self) -> "np.ndarray | None":
        with self._lock:
            return self._frame.copy() if self._frame is not None else None

    def receive_frame(self, jpeg_bytes: bytes) -> dict:
        if not CV2_OK:
            return {}

        arr   = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is None:
            return self.get_latest()

        frame = cv2.resize(frame, (160, 120))

        with self._lock:
            self._frame = frame.copy()

        now = time.time()
        if (now - self._last_analyse >= MIN_ANALYSE_INTERVAL
                and not self._analysing.is_set()):
            self._last_analyse = now
            self._analysing.set()
            threading.Thread(
                target=self._analyse_and_clear,
                args=(frame.copy(),),
                daemon=True,
            ).start()

        return self.get_latest()

    def _analyse_and_clear(self, frame: "np.ndarray"):
        try:
            self._analyse(frame)
        finally:
            self._analysing.clear()

    def _loop(self):
        """Background loop for local webcam mode."""
        count = 0
        while self._running and self._cap:
            ret, frame = self._cap.read()
            if not ret:
                continue
            frame = cv2.resize(frame, (160, 120))
            with self._lock:
                self._frame = frame.copy()
            now = time.time()
            if (now - self._last_analyse >= MIN_ANALYSE_INTERVAL
                    and not self._analysing.is_set()):
                self._last_analyse = now
                self._analysing.set()
                threading.Thread(
                    target=self._analyse_and_clear,
                    args=(frame.copy(),),
                    daemon=True,
                ).start()
            count += 1
            time.sleep(0.033)

    def _analyse(self, frame: "np.ndarray"):
        det = self._get_detector()
        if det is None:
            return
        try:
            faces = det.detect_emotions(frame)
            if faces:
                emotions  = faces[0]["emotions"]
                dominant  = max(emotions, key=emotions.get)
                with self._lock:
                    self._result = {
                        "dominant_emotion": dominant,
                        "emotions": {k: round(v, 2) for k, v in emotions.items()},
                    }
                print(f"[FaceRec] {dominant.upper()} — {self._result['emotions']}")
            else:
                print("[FaceRec] No face detected")
        except Exception as e:
            print(f"[FaceRec] Error: {e}")