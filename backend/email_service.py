import os, resend
from dotenv import load_dotenv
load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM           = os.getenv("EMAIL_FROM", "onboarding@resend.dev")

def send_email(to: str, subject: str, html: str) -> bool:
    if not resend.api_key:
        print("[Email] RESEND_API_KEY not set — skipping"); return False
    try:
        params: resend.Emails.SendParams = {
        "from": "onboarding@resend.dev",
        "to": [to],
        "subject": subject,
        "html": html,
        }
        resp: resend.Emails.SendResponse = resend.Emails.send(params)
        print(f"[Email] Sent → {to}  id={resp.get('id')}"); return True
    except Exception as e:
        print(f"[Email] Error → {to}: {e}"); return False