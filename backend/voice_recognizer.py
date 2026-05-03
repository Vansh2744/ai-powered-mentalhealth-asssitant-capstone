import io
import numpy as np
from transformers import pipeline
from pydub import AudioSegment


class VoiceEmotionRecognizer:
    def __init__(self, sr=16000):
        self.sr = sr
        self.model = None

        try:
            self.model = pipeline(
                "audio-classification",
                model="superb/wav2vec2-base-superb-er",
                device=-1
            )
        except:
            pass

    def analyze(self, audio_bytes):
        audio = self._load(audio_bytes)

        # use only first 3 sec to save CPU/RAM
        audio = audio[: self.sr * 3]

        if self.model:
            try:
                pred = self.model(
                    {"array": audio, "sampling_rate": self.sr},
                    top_k=1
                )[0]

                return {
                    "dominant_emotion": pred["label"].lower(),
                    "confidence": round(pred["score"] * 100, 2)
                }

            except:
                pass

        return self._fallback(audio)

    def _load(self, audio_bytes):
        try:
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            audio = audio.set_channels(1).set_frame_rate(self.sr)

            data = np.frombuffer(audio.raw_data, dtype=np.int16)
            return data.astype(np.float32) / 32768.0

        except:
            return np.zeros(self.sr, dtype=np.float32)

    def _fallback(self, audio):
        energy = np.mean(np.abs(audio))

        if energy > 0.12:
            emo = "happy"
        elif energy < 0.03:
            emo = "sad"
        else:
            emo = "neutral"

        return {
            "dominant_emotion": emo,
            "confidence": 55
        }