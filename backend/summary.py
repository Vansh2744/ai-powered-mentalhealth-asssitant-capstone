"""summary.py — Session summary + personalized coping plan generator."""

import os, json
from groq import Groq
from exercises import EXERCISES

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

EXERCISE_IDS = list(EXERCISES.keys())

SUMMARY_SYSTEM = (
    "You are a clinical assistant that analyses therapy session transcripts. "
    "Respond with ONLY valid JSON — no markdown fences, no preamble. "
    "Return exactly this shape:\n"
    '{"dominant_emotions":{"emotion":count},"topics_discussed":["..."],'
    '"coping_strategies":["..."],"suggested_exercises":["id1"],'
    '"summary_text":"3-4 warm sentences in second person.",'
    '"patterns":"One sentence about emotional pattern or null."}\n'
    f"suggested_exercises must only use IDs from: {EXERCISE_IDS}"
)

COPING_SYSTEM = (
    "You are a compassionate therapist. Based on the user's emotional patterns "
    "from recent sessions, write a SHORT personalized coping plan (3-4 sentences). "
    "Be warm, specific, actionable. No bullet points. Plain text only."
)


def generate_session_summary(session_logs: list[dict]) -> dict:
    if not session_logs:
        return {}
    lines = []
    for i, log in enumerate(session_logs, 1):
        t = (log.get("transcript") or "").strip()
        e = log.get("verdict", "unknown")
        r = (log.get("therapist_text") or "").strip()
        if t:
            lines.append(f"[{i}] User ({e}): {t}")
        if r:
            lines.append(f"[{i}] Therapist: {r[:120]}")
    try:
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=600,
            messages=[
                {"role": "system", "content": SUMMARY_SYSTEM},
                {"role": "user",   "content": "Session:\n" + "\n".join(lines)},
            ],
        )
        raw = resp.choices[0].message.content.strip().replace("```json","").replace("```","")
        return json.loads(raw)
    except Exception as e:
        print(f"[Summary] {e}")
        return {}


def generate_coping_plan(past_summaries: list[dict]) -> str:
    if not past_summaries:
        return ""
    emotion_totals: dict[str, int] = {}
    all_topics, all_patterns = [], []
    for s in past_summaries:
        for emo, cnt in (s.get("dominant_emotions") or {}).items():
            emotion_totals[emo] = emotion_totals.get(emo, 0) + int(cnt)
        all_topics.extend(s.get("topics_discussed") or [])
        p = s.get("patterns")
        if p:
            all_patterns.append(p)
    top = sorted(emotion_totals.items(), key=lambda x: x[1], reverse=True)[:3]
    context = (
        f"Top emotions: {top}. "
        f"Recurring topics: {list(set(all_topics))[:5]}. "
        f"Patterns: {all_patterns[-3:]}."
    )
    try:
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.6,
            max_tokens=200,
            messages=[
                {"role": "system", "content": COPING_SYSTEM},
                {"role": "user",   "content": context},
            ],
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[CopingPlan] {e}")
        return ""