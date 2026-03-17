import os
import io
import base64
from gtts import gTTS
from langchain_groq import ChatGroq
from langchain.messages import SystemMessage, HumanMessage
from langchain_classic.memory import ConversationBufferWindowMemory
from dotenv import load_dotenv
from system_prompt import SYSTEM_PROMPT

load_dotenv()

# gTTS language codes
GTTS_LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "es": "es",
    "fr": "fr",
    "de": "de",
    "it": "it",
    "pt": "pt",
    "ru": "ru",
    "ja": "ja",
    "ko": "ko",
    "zh": "zh",
    "ar": "ar",
    "bn": "bn",
    "pa": "pa",
    "ur": "ur",
    "ta": "ta",
    "te": "te",
    "mr": "mr",
    "gu": "gu",
}

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "bn": "Bengali",
    "pa": "Punjabi",
    "ur": "Urdu",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
}

SYSTEM_PROMPT = SYSTEM_PROMPT


class TherapistAgent:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set in .env")

        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.75,
            max_tokens=400,
            groq_api_key=api_key,
        )
        self.memory = ConversationBufferWindowMemory(k=10, return_messages=True)
        self.system_message = SystemMessage(content=SYSTEM_PROMPT)

    def _build_prompt(
        self,
        transcript: str,
        voice_emotion: str,
        voice_confidence: float,
        face_emotion: str,
        face_confidence: float,
        verdict: str,
        language: str,
    ) -> str:
        lang_name = LANGUAGE_NAMES.get(language, language.upper())
        return f"""
[DETECTED LANGUAGE]: {lang_name} (code: {language})
YOU MUST RESPOND IN {lang_name.upper()} ONLY.

[EMOTIONAL CONTEXT]
- Voice emotion : {voice_emotion.upper()} ({voice_confidence:.0f}% confidence)
- Face emotion  : {face_emotion.upper()} ({face_confidence:.0f}% confidence)
- Overall mood  : {verdict.upper()}
- Alignment     : {"Emotions ALIGNED" if voice_emotion == face_emotion
                   else f"Emotions DIFFER — voice={voice_emotion}, face={face_emotion} (may be masking feelings)"}

[WHAT THE PERSON SAID in {lang_name}]
{transcript if transcript.strip() else "(No speech detected)"}
""".strip()

    def respond(
        self,
        transcript: str,
        voice_emotion: str,
        voice_confidence: float,
        face_emotion: str,
        face_confidence: float,
        verdict: str,
        language: str = "en",
    ) -> dict:
        user_prompt = self._build_prompt(
            transcript,
            voice_emotion,
            voice_confidence,
            face_emotion,
            face_confidence,
            verdict,
            language,
        )

        history = self.memory.chat_memory.messages
        messages = [self.system_message] + history + [HumanMessage(content=user_prompt)]

        response = self.llm.invoke(messages)
        response_text = response.content.strip()

        self.memory.chat_memory.add_user_message(user_prompt)
        self.memory.chat_memory.add_ai_message(response_text)

        audio_bytes = self._text_to_speech(response_text, language)
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        return {
            "text": response_text,
            "audio_b64": audio_b64,
            "audio_bytes": audio_bytes,
            "language": language,
        }

    def _text_to_speech(self, text: str, language: str = "en") -> bytes:
        tts_lang = GTTS_LANG_MAP.get(language, "en")
        try:
            tts = gTTS(text=text, lang=tts_lang, slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            buf.seek(0)
            return buf.read()
        except Exception as e:
            print(f"[TTS error for lang={tts_lang}] {e} — falling back to English")
            try:
                tts = gTTS(text=text, lang="en", slow=False)
                buf = io.BytesIO()
                tts.write_to_fp(buf)
                buf.seek(0)
                return buf.read()
            except Exception:
                return b""

    def clear_memory(self):
        self.memory.clear()
