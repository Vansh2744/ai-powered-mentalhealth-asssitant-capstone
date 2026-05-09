<div align="center">

# 🧠 MindfulAI — AI-Powered Emotional Therapy Platform

**A multimodal AI therapy companion that understands not just what you say — but how you feel.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

*Final Year Capstone Project · B.Tech Computer Science and Engineering*

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment-render)
- [Database Schema](#-database-schema)
- [How It Works](#-how-it-works)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

MindfulAI is a full-stack AI therapy platform that performs **real-time multimodal emotion analysis** — simultaneously processing your voice tone, facial expressions, and spoken words to deliver deeply personalised, empathetic therapy responses.

Unlike generic mental health chatbots, MindfulAI cross-references three independent emotional signals to detect when emotions are being **masked or suppressed**, adapting its response accordingly. It supports **19 languages**, has a built-in **3-tier crisis detection system**, and builds a **long-term emotional profile** for each user over time.

```
User speaks  →  Voice emotion (Librosa)  ─┐
User's face  →  Face emotion  (FER)      ─┼→  MindfulAI LLM  →  Empathetic audio response
Transcript   →  Words (Whisper STT)      ─┘
```

---

## ✨ Features

### 🎙️ Multimodal Emotion Intelligence
- **Voice analysis** — Librosa acoustic features (energy, pitch, ZCR) classify emotion from speech tone
- **Facial recognition** — FER + OpenCV Haar cascade detects 7 emotions from live camera feed
- **Speech transcription** — Whisper Large v3 transcribes speech with automatic language detection
- **Emotion masking detection** — Cross-references voice vs face signals to detect suppressed feelings
- **Verdict weighting** — Normalised confidence scores determine which signal takes precedence

### 🧠 AI Therapy Engine (MindfulAI)
- Powered by **Groq LLama 3.1-8b-instant** for ultra-fast responses
- 5-case emotional authenticity detection system built into the system prompt
- Responds in the **user's detected language** (full script support — Devanagari, Gurmukhi, etc.)
- Maintains **conversation memory** (last 10 exchanges) for contextual continuity
- Audio responses via **gTTS** in 19 languages

### 🚨 Crisis Detection & Escalation
| Tier | Risk Level | Trigger Examples | Response |
|------|-----------|-----------------|----------|
| 1 | 🔴 Critical | "kill myself", "want to die", "suicidal" | Session paused · Full-screen helplines · Email sent immediately |
| 2 | 🟠 High Risk | "hurt myself", "self harm", "can't go on" | Crisis overlay · Helplines shown · Email sent · Session continues |
| 3 | 🟡 Distress | "hopeless", "worthless", "no way out" | Subtle alert · Coping exercise suggested |

> Crisis emails are sent **instantly and cannot be disabled** — a core ethical safeguard.

### 📊 Analytics Dashboard
- **Mood Timeline** — Area chart of daily dominant emotions (7–90 day range)
- **Emotion Heatmap** — GitHub-style 12-week calendar grid showing daily mood
- **Voice vs Face Alignment Score** — Measures emotional authenticity over time with mismatch breakdown
- **Session Streak** — Duolingo-style daily streak with 7-day grid and personal best tracking

### 📋 Session Intelligence
- **AI Session Summaries** — Auto-generated on session end: topics, emotions, coping strategies
- **Personalized Coping Plans** — Generated from 7 past session patterns with recommended exercises
- **6 Guided Exercises** — Box Breathing, Body Scan, 5-4-3-2-1 Grounding, Progressive Relaxation, Gratitude, Coherent Breathing

### 🔔 Smart Notifications
- **Exercise Reminders** — User sets daily reminder time (stored in UTC, displayed in local timezone)
- **Crisis Follow-up Email** — Sent automatically when crisis language is detected
- Cron-based delivery via **Resend** email API

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Tailwind CSS | Styling |
| Recharts | Analytics charts |
| WebSocket API | Camera frame push + emotion stream |
| MediaRecorder API | Audio capture |

### Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI | REST API + WebSocket server |
| SQLAlchemy | ORM |
| PostgreSQL | Primary database |
| JWT (PyJWT) | Authentication |
| Uvicorn | ASGI server |

### AI / ML
| Technology | Purpose |
|-----------|---------|
| Groq LLama 3.1-8b-instant | Therapy LLM responses |
| Whisper Large v3 (Groq) | Speech-to-text + language detection |
| FER + OpenCV | Facial emotion recognition |
| Librosa | Voice acoustic feature extraction |
| gTTS | Text-to-speech audio responses |

### Services & Infrastructure
| Technology | Purpose |
|-----------|---------|
| Render | Deployment (free tier optimised) |
| Resend | Transactional email |
| PostgreSQL (Render) | Managed database |
| Cron Job (Render) | Scheduled exercise reminders |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Camera  │  │  Voice   │  │ Analytics │  │   Settings   │  │
│  │  Feed    │  │ Recorder │  │ Dashboard │  │  (Reminders) │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│       │ JPEG bytes  │ WebM audio   │ REST            │ REST     │
└───────┼─────────────┼──────────────┼─────────────────┼──────────┘
        │ WebSocket   │ POST         │                 │
┌───────▼─────────────▼──────────────▼─────────────────▼──────────┐
│                     FastAPI Backend                              │
│                                                                  │
│  /ws/camera  →  FaceEmotionRecognizer (FER + OpenCV)            │
│  /analyze    →  Transcriber (Whisper) + VoiceRecognizer         │
│              →  CrisisDetector → TherapistAgent (Groq LLM)      │
│              →  EmotionLog (PostgreSQL)                          │
│  /session/end→  SessionSummary (Groq LLM) → DB                  │
│  /reminder/* →  ExerciseReminder CRUD                           │
│  /analytics/ →  Aggregated queries on EmotionLog                │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
      ┌───────▼──────┐    ┌────────▼───────┐   ┌───────▼──────┐
      │  PostgreSQL  │    │   Groq API     │   │  Resend API  │
      │   Database   │    │  (LLM + STT)   │   │   (Email)    │
      └──────────────┘    └────────────────┘   └──────────────┘
                                   │
                          ┌────────▼────────┐
                          │  Cron Job       │
                          │  (Reminders)    │
                          └─────────────────┘
```

---

## 📁 Project Structure

```
ai-powered-mentalhealth-asssitant-capstone/
├── backend/
│   ├── main.py                 # FastAPI app, all routes
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── db.py                   # Database connection
│   ├── auth.py                 # JWT authentication
│   ├── therapist.py            # TherapistAgent (LLM)
│   ├── transcriber.py          # Whisper STT
│   ├── face_recognizer.py      # FER facial emotion
│   ├── voice_recognizer.py     # Librosa voice emotion
│   ├── crisis.py               # Crisis keyword detection
│   ├── summary.py              # Session summary + coping plan
│   ├── exercises.py            # Exercise definitions
│   ├── system_prompt.py        # MindfulAI system prompt
│   ├── email_service.py        # Resend wrapper
│   ├── email_templates.py      # HTML email templates
│   ├── cron.py                 # Exercise reminder cron job
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Therapy.tsx         # Main therapy session
    │   │   ├── MoodTimeline.tsx    # Emotion chart
    │   │   ├── AnalyticsDashboard.tsx
    │   │   ├── SessionSummaryPage.tsx
    │   │   ├── CopingPlan.tsx
    │   │   └── ReminderSettings.tsx
    │   ├── components/
    │   │   ├── CameraFeed.tsx      # WebSocket frame push
    │   │   ├── VoiceRecorder.tsx   # Audio recording
    │   │   ├── ResponseCard.tsx    # Therapy response display
    │   │   └── CrisisAlert.tsx     # Crisis overlay
    │   ├── types/
    │   │   └── index.ts
    │   └── utils/
    │       └── backendUrl.ts
    ├── package.json
    └── .env
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- [Groq API key](https://console.groq.com) (free)
- [Resend API key](https://resend.com) (free tier — for emails)

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/Vansh2744/ai-powered-mentalhealth-asssitant-capstone.git
cd ai-powered-mentalhealth-asssitant-capstone/backend

# 2. Create virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment file and fill in values
cp .env.example .env

# 5. Run the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd ai-powered-mentalhealth-asssitant-capstone/frontend

# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start development server
npm run dev
```

### Environment Variables

**Backend `.env`**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db_name

# Groq (LLM + Whisper STT)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=MindfulAI <mindfulai@yourdomain.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# JWT Secrets (generate with: openssl rand -hex 32)
ACCESS_TOKEN_SECRET_KEY=your_access_secret_here
REFRESH_TOKEN_SECRET_KEY=your_refresh_secret_here
```

**Frontend `.env`**
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/sign-up` | Register new user |
| `POST` | `/sign-in` | Login, returns JWT tokens |
| `POST` | `/sign-out` | Logout, invalidates refresh token |
| `GET`  | `/current-user` | Get authenticated user |
| `POST` | `/refresh` | Refresh access token |

### Therapy Session
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/analyze` | Upload audio → emotion analysis + therapy response |
| `WS`   | `/ws/camera` | Push JPEG frames → receive face emotion JSON |
| `POST` | `/clear-memory` | Reset conversation history |
| `POST` | `/session/end/{user_id}` | Generate + save session summary |

### Analytics
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/mood/timeline/{user_id}` | Daily emotion data (last N days) |
| `GET` | `/mood/heatmap/{user_id}` | Day-of-week emotion breakdown |
| `GET` | `/analytics/heatmap/{user_id}` | 12-week calendar heatmap |
| `GET` | `/analytics/alignment/{user_id}` | Voice vs face match score |
| `GET` | `/analytics/streak/{user_id}` | Session streak data |
| `GET` | `/summaries/{user_id}` | Past session summaries |
| `GET` | `/coping-plan/{user_id}` | Personalized coping plan |

### Reminders & Exercises
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET`  | `/exercises` | List all 6 guided exercises |
| `POST` | `/exercises/tts` | Generate TTS audio for exercise text |
| `GET`  | `/reminder/{user_id}` | Get current reminder settings |
| `POST` | `/reminder/{user_id}` | Create or update reminder |
| `DELETE` | `/reminder/{user_id}` | Disable reminder |

### /analyze Request/Response

**Request** — `multipart/form-data`
```
audio: <audio/webm file>
Header: X-User-Id: <uuid>   (optional, enables DB logging)
```

**Response** — `application/json`
```json
{
  "transcript": "I've been feeling really anxious lately",
  "language": "en",
  "voice": { "emotion": "fearful", "confidence": 68.5 },
  "face":  { "emotion": "sad", "confidence": 72.0 },
  "verdict": "sad",
  "crisis": null,
  "therapist": {
    "text": "It sounds like anxiety has been weighing heavily on you...",
    "audio_b64": "<base64 mp3>",
    "language": "en"
  }
}
```

---

## 🚢 Deployment (Render)

### Backend Web Service
```
Build Command:  pip install -r requirements.txt
Start Command:  uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend Static Site
```
Build Command:  npm run build
Publish Dir:    dist
```

### Cron Job (Exercise Reminders)
```
Schedule:  * * * * *   (every minute)
Command:   python cron.py
```

> **Free tier notes:** The backend is optimised to run within Render's free tier constraints (512MB RAM, 0.1 CPU). Heavy ML dependencies (torch, transformers) have been replaced with lightweight alternatives, keeping total memory usage under 200MB.

---

## 🗄️ Database Schema

```
users
├── id (UUID PK)
├── name, email (unique), password (hashed)
├── refresh_token
└── created_at, updated_at

emotion_logs
├── id (UUID PK)
├── user_id (FK → users)
├── transcript, voice_emotion, voice_confidence
├── face_emotion, face_confidence, verdict
├── language, therapist_text
└── created_at

session_summaries
├── id (UUID PK)
├── user_id (FK → users)
├── dominant_emotions (JSON), topics_discussed (JSON)
├── coping_strategies (JSON), suggested_exercises (JSON)
├── summary_text, crisis_detected
└── created_at

exercise_reminders
├── id (UUID PK)
├── user_id (FK → users, UNIQUE)
├── exercise_id, reminder_time (HH:MM UTC)
├── enabled (bool)
└── created_at

chat_sessions + messages
├── session per user
└── full message history (role + content)
```

---

## 🔍 How It Works

### Emotion Detection Pipeline

```
1. User clicks record  →  MediaRecorder captures audio/webm
2. User's camera       →  Browser sends JPEG frames at 5fps over WebSocket
3. User stops         →  Audio blob POSTed to /analyze

Server side:
4. Whisper Large v3   →  Transcribes audio, detects language
5. Librosa            →  Extracts energy, ZCR, spectral centroid
6. FER + OpenCV       →  Analyses buffered face frame (background thread)
7. Crisis detector    →  Scans transcript for 30+ crisis keywords (3 tiers)
8. Verdict            →  Weighted by normalised confidence scores
9. Groq LLM           →  Generates therapy response aware of all 3 signals
10. gTTS              →  Converts response to audio in detected language
```

### Emotional Masking Detection

MindfulAI's system prompt contains 5 cases that handle signal mismatches:

| Scenario | Detection | MindfulAI's Approach |
|---------|-----------|----------------|
| All signals match | Genuine emotion | Full empathy and validation |
| "I'm fine" but sad face + fearful voice | Masking | Gently names the discrepancy |
| Dramatic words but calm face + voice | Performed distress | Grounds without mirroring |
| Rapid emotion switches | Dysregulation | Stabilises, asks what's most present |
| Flat affect but intense words | Suppression | Curious, non-alarming inquiry |

### Exercise Reminder Flow

```
User sets reminder (10:00 AM IST)
  → Frontend: localToUtc("10:00") = "04:30" UTC
  → POST /reminder/{userId} with reminder_time: "04:30"
  → Stored in exercise_reminders table

Cron runs every minute:
  → Queries WHERE enabled=True AND reminder_time = current_utc_time
  → Sends exercise reminder email via Resend
  → Writes /tmp/sent:{user_id}:{date} to prevent duplicate sends
```

---

## 🖼️ Screenshots

> *Add screenshots of your running app here*

| Therapy Session | Analytics Dashboard |
|----------------|-------------------|
| ![therapy](./images/therapy.png) | ![analytics](./images/analytics.png) |

| Crisis Alert | Reminder Settings |
|-------------|-----------------|
| ![crisis](./images/crisis.png) | ![settings](./images/settings.png) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## ⚠️ Disclaimer

MindfulAI is an AI-powered support tool and is **not a substitute for professional mental health care**. If you are experiencing a mental health crisis, please contact a qualified healthcare professional or one of the crisis helplines listed in the app.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **Vansh** · Final Year Capstone Project · 2024–25

*"Making mental health support accessible to everyone, everywhere."*

</div>
