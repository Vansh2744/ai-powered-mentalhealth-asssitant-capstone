CRISIS_KEYWORDS_T1 = [
    "kill myself", "end my life", "want to die", "suicidal", "suicide",
    "take my own life", "don't want to live", "no reason to live",
    "better off dead", "end it all",
]
CRISIS_KEYWORDS_T2 = [
    "hurt myself", "self harm", "self-harm", "cut myself", "harm myself",
    "can't go on", "can't take it anymore", "give up on life",
    "nobody would miss me", "disappear forever",
]
CRISIS_KEYWORDS_T3 = [
    "hopeless", "worthless", "no point", "nothing matters",
    "trapped", "no way out", "can't cope", "falling apart",
]

HELPLINES = [
    {"name": "iCall (India)",         "number": "9152987821",       "available": "Mon-Sat, 8am-10pm"},
    {"name": "Vandrevala Foundation", "number": "1860-2662-345",    "available": "24/7"},
    {"name": "AASRA",                 "number": "9820466627",       "available": "24/7"},
    {"name": "Crisis Text Line (US)", "number": "Text HOME to 741741", "available": "24/7"},
    {"name": "Samaritans (UK)",       "number": "116 123",          "available": "24/7"},
]

def detect_crisis(transcript: str) -> dict | None:
    if not transcript:
        return None
    text = transcript.lower()
    for kw in CRISIS_KEYWORDS_T1:
        if kw in text:
            return {"tier": 1, "keyword": kw, "helplines": HELPLINES}
    for kw in CRISIS_KEYWORDS_T2:
        if kw in text:
            return {"tier": 2, "keyword": kw, "helplines": HELPLINES}
    for kw in CRISIS_KEYWORDS_T3:
        if kw in text:
            return {"tier": 3, "keyword": kw, "helplines": HELPLINES[:2]}
    return None