import os, sys, datetime
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import SessionLocal
from models import User, ExerciseReminder
from exercises import EXERCISES
from email_service import send_email
from email_templates import exercise_reminder_email

APP_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

def run_reminder_job():
    db  = SessionLocal()
    now = datetime.datetime.utcnow()
    current_time = now.strftime("%H:%M")
    prev_time = (now - timedelta(minutes=1)).strftime("%H:%M")

    print(f"[Cron] Exercise reminder job — UTC {current_time}")

    reminders = db.query(ExerciseReminder).filter(
    ExerciseReminder.enabled == True,
    ExerciseReminder.reminder_time.in_([current_time, prev_time])
    ).all()

    print(f"[Cron] {len(reminders)} reminder(s) due at {current_time}")

    for reminder in reminders:
        user = db.query(User).filter(User.id == reminder.user_id).first()
        if not user or not user.email:
            continue

        exercise = EXERCISES.get(reminder.exercise_id)
        if not exercise:
            print(f"[Cron] Unknown exercise_id '{reminder.exercise_id}' — skipping")
            continue

        subject, html = exercise_reminder_email(
            user_name=user.name,
            exercise=exercise,
            reminder_time=current_time,
            app_url=APP_URL,
        )
        ok = send_email(user.email, subject, html)
        if ok:
            print(f"[Cron] Reminder sent → {user.email} ({exercise['title']})")

    db.close()
    print("[Cron] Done.")


import time

if __name__ == "__main__":
    run_reminder_job()