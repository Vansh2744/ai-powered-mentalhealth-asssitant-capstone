import io
import numpy as np

try:
    import librosa
    LIBROSA_OK = True
except ImportError:
    LIBROSA_OK = False

try:
    from pydub import AudioSegment
    PYDUB_OK = True
except ImportError:
    PYDUB_OK = False


class VoiceEmotionRecognizer:
    def __init__(self, sr: int = 16000):
        self.sr = sr

    def analyze(self, audio_bytes: bytes) -> dict:
        audio = self._load(audio_bytes)
        audio = audio[: self.sr * 4]
        return self._classify(audio)

    def _load(self, audio_bytes: bytes) -> np.ndarray:
        if PYDUB_OK:
            try:
                seg = AudioSegment.from_file(io.BytesIO(audio_bytes))
                seg = seg.set_channels(1).set_frame_rate(self.sr)
                data = np.frombuffer(seg.raw_data, dtype=np.int16)
                return data.astype(np.float32) / 32768.0
            except Exception:
                pass
        return np.zeros(self.sr, dtype=np.float32)

    def _classify(self, audio: np.ndarray) -> dict:
        if len(audio) < 100:
            return {"dominant_emotion": "neutral", "confidence": 50}

        energy   = float(np.mean(np.abs(audio)))
        zcr      = float(np.mean(np.abs(np.diff(np.sign(audio)))) / 2)

        centroid = None
        if LIBROSA_OK:
            try:
                sc = librosa.feature.spectral_centroid(y=audio, sr=self.sr)
                centroid = float(np.mean(sc))
            except Exception:
                pass


        if energy < 0.025:
            emotion, confidence = "sad", 62
        elif zcr > 0.18 and energy > 0.06:
            emotion, confidence = "fearful", 60
        elif energy > 0.15:
            if centroid and centroid > 3000:
                emotion, confidence = "happy", 63
            else:
                emotion, confidence = "angry", 61
        elif energy > 0.06:
            emotion, confidence = "neutral", 65
        else:
            emotion, confidence = "calm", 60

        return {"dominant_emotion": emotion, "confidence": confidence}