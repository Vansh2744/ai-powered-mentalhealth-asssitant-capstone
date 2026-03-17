import io
import numpy as np
import librosa
from transformers import pipeline

class VoiceEmotionRecognizer:

    EMOTION_COLORS_ANSI = {
        "angry": "\033[91m", "happy": "\033[92m", "sad": "\033[94m",
        "neutral": "\033[97m", "fearful": "\033[95m",
        "disgust": "\033[93m", "surprised": "\033[96m",
    }
    RESET = "\033[0m"

    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.classifier  = None
        self._load_model()

    def _load_model(self):
        print("🔄 Loading voice emotion model...")
        try:
            self.classifier = pipeline(
                task="audio-classification",
                model="superb/wav2vec2-base-superb-er",
                device=-1,
                framework="pt",
            )
            print("✅ Voice model ready.")
        except Exception as e:
            print(f"⚠️  Model failed: {e}. Using heuristic fallback.")
            self.classifier = None

    def analyze(self, audio_bytes: bytes) -> dict:
        """
        Accept any browser audio format (webm, ogg, mp4, wav).
        Uses pydub+ffmpeg to decode → numpy float32 at 16kHz.
        """
        audio = self._decode_audio(audio_bytes)
        if self.classifier:
            return self._predict(audio)
        return self._heuristic(audio)

    def _decode_audio(self, audio_bytes: bytes) -> np.ndarray:
        """Decode any audio format to float32 numpy array at self.sample_rate."""
        try:
            from pydub import AudioSegment

            # Let pydub auto-detect format via ffmpeg
            seg = AudioSegment.from_file(io.BytesIO(audio_bytes))

            # Convert to mono, 16kHz
            seg = seg.set_channels(1).set_frame_rate(self.sample_rate)

            # Export to raw PCM bytes and convert to float32
            raw = seg.raw_data
            samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
            samples /= 32768.0
            return samples

        except Exception as e:
            print(f"[Audio decode error] {e}")
            # Last resort: try librosa
            try:
                audio, _ = librosa.load(
                    io.BytesIO(audio_bytes),
                    sr=self.sample_rate,
                    mono=True,
                )
                return audio.astype(np.float32)
            except Exception as e2:
                print(f"[Librosa fallback failed] {e2}")
                return np.zeros(self.sample_rate, dtype=np.float32)

    def _predict(self, audio: np.ndarray) -> dict:
        try:
            preds = self.classifier(
                {"array": audio, "sampling_rate": self.sample_rate},
                top_k=None,
            )
            dominant = max(preds, key=lambda x: x["score"])
            return {
                "dominant_emotion": dominant["label"].lower(),
                "confidence":       round(dominant["score"] * 100, 2),
                "probabilities": {
                    p["label"].lower(): round(p["score"] * 100, 2) for p in preds
                },
            }
        except Exception as e:
            print(f"[Predict error] {e}")
            return self._heuristic(audio)

    def _heuristic(self, audio: np.ndarray) -> dict:
        energy = float(np.mean(np.abs(audio)))
        try:
            pitches, _ = librosa.piptrack(y=audio, sr=self.sample_rate, threshold=0.1)
            pitch = float(np.mean(pitches[pitches > 0])) if np.any(pitches > 0) else 0
        except Exception:
            pitch = 0

        if energy > 0.15 and pitch > 250:   e, c = "angry",   65.0
        elif energy > 0.10 and pitch > 180: e, c = "happy",   60.0
        elif energy < 0.04:                 e, c = "sad",     58.0
        else:                               e, c = "neutral", 55.0

        return {"dominant_emotion": e, "confidence": c, "probabilities": {e: c}}

    def print_result(self, result: dict):
        emotion = result["dominant_emotion"]
        color   = self.EMOTION_COLORS_ANSI.get(emotion, "")
        print(f"\n🎤 Voice: {color}{emotion.upper()}{self.RESET} ({result['confidence']:.1f}%)")
        for emo, prob in sorted(result.get("probabilities", {}).items(), key=lambda x: -x[1]):
            print(f"   {emo:<12} {'█' * int(prob/5):<20} {prob:.1f}%")