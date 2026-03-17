import os
import io
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class Transcriber:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    def transcribe(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> tuple[str, str]:
        """
        Returns (transcript_text, detected_language_code)
        e.g. ("Hola como estas", "es")
        """
        try:
            ext        = "webm" if "webm" in mime_type else "wav"
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = f"audio.{ext}"

            result = self.client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=audio_file,
                response_format="verbose_json",  # ← gives us language info
                # NO language param — Whisper auto-detects
            )

            transcript = result.text.strip()
            language   = getattr(result, "language", "en")  # e.g. "en", "hi", "es"
            print(f"📝 Transcript ({language}): {transcript}")
            return transcript, language

        except Exception as e:
            print(f"[Transcription error] {e}")
            return "", "en"