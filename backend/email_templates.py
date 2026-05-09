BG, CARD, BORDER = "#0a0f1a", "#111827", "#1e293b"
TEXT, MUTED      = "#e2e8f0", "#64748b"
CYAN, VIOLET     = "#06b6d4", "#7c3aed"
GREEN, RED       = "#10b981", "#ef4444"


def _wrap(title: str, preheader: str, body: str) -> str:
    return f"""<!DOCTYPE html><html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title></head>
<body style="margin:0;padding:0;background:{BG};font-family:'Helvetica Neue',Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;">{preheader}</span>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;
         border:1px solid {BORDER};background:{CARD};">
  <tr><td style="padding:28px 36px 20px;background:linear-gradient(135deg,#050b12,#0f172a);
                  border-bottom:1px solid {BORDER};">
    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.3em;color:{MUTED};
               text-transform:uppercase;">MindfulAI · AI Therapy</p>
    <h1 style="margin:0;font-size:22px;font-weight:900;letter-spacing:0.08em;
               color:{TEXT};text-transform:uppercase;">{title}</h1>
  </td></tr>
  <tr><td style="padding:28px 36px;color:{TEXT};font-size:14px;line-height:1.8;">
    {body}
  </td></tr>
  <tr><td style="padding:16px 36px;border-top:1px solid {BORDER};background:#080f1a;text-align:center;">
    <p style="margin:0;font-size:11px;color:{MUTED};">
      MindfulAI Therapy · Not a substitute for professional mental health care.
    </p>
  </td></tr>
</table></td></tr></table></body></html>"""


def crisis_followup_email(
    user_name: str,
    helplines: list[dict],
    exercise: dict,
    app_url: str = "http://localhost:5173/",
) -> tuple[str, str]:
    helpline_rows = "".join(f"""
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid {BORDER};">
        <p style="margin:0;font-weight:600;color:{TEXT};font-size:13px;">{h['name']}</p>
        <p style="margin:2px 0 0;color:{MUTED};font-size:11px;">{h['available']}</p>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid {BORDER};text-align:right;">
        <a href="tel:{h['number'].replace(' ','')}"
          style="display:inline-block;padding:7px 16px;border-radius:50px;
                 background:{RED};color:#fff;font-weight:700;font-size:12px;
                 text-decoration:none;">{h['number']}</a>
      </td>
    </tr>""" for h in helplines[:4])

    color = exercise.get("color", GREEN)
    body = f"""
    <p style="color:{MUTED};margin:0 0 22px;">
      Hi <strong style="color:{TEXT};">{user_name}</strong> 💙<br><br>
      We noticed your session earlier today included some really difficult feelings.
      You are <strong style="color:{TEXT};">not alone</strong> — support is always available.
    </p>
    <div style="background:#0f172a;border:1px solid {RED}40;border-radius:14px;
                overflow:hidden;margin-bottom:20px;">
      <div style="padding:12px 16px;background:{RED}20;border-bottom:1px solid {RED}30;">
        <p style="margin:0;font-size:10px;letter-spacing:0.2em;color:{RED};
                   text-transform:uppercase;font-weight:700;">Free Support Lines</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">{helpline_rows}</table>
    </div>
    <p style="color:{MUTED};font-size:13px;margin:0 0 12px;">
      When you feel ready, this gentle exercise can help bring you back to the present:
    </p>
    <div style="background:#0f172a;border:1px solid {color}40;border-radius:14px;padding:20px 22px;">
      <div style="font-size:32px;margin-bottom:8px;">{exercise.get('icon','🌿')}</div>
      <p style="margin:0;font-weight:700;color:{TEXT};font-size:15px;">{exercise.get('title','')}</p>
      <p style="margin:4px 0 12px;color:{MUTED};font-size:12px;">
        {exercise.get('subtitle','')} · {exercise.get('duration','')}</p>
      <a href="{app_url}/exercises"
        style="display:inline-block;padding:10px 24px;border-radius:50px;
               background:{color};color:#000;font-weight:700;font-size:12px;
               text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;">
        Start Exercise →
      </a>
    </div>
    <p style="margin-top:24px;color:{MUTED};font-size:12px;">
      If you are in immediate danger please contact emergency services
      (<strong style="color:{TEXT};">112</strong> India /
       <strong style="color:{TEXT};">911</strong> US).
    </p>"""

    return "Checking in on you 💙 · MindfulAI", _wrap(
        "We're Here With You",
        "We noticed your session was difficult. Support is here.",
        body,
    )


def exercise_reminder_email(
    user_name: str,
    exercise: dict,
    reminder_time: str,
    app_url: str = "http://localhost:5173/",
) -> tuple[str, str]:
    color  = exercise.get("color", CYAN)
    steps  = exercise.get("steps", [])
    rounds = exercise.get("rounds", 1)
    intro  = exercise.get("intro", "")

    steps_rows = "".join(f"""
    <tr>
      <td style="padding:8px 0;vertical-align:top;width:28px;">
        <div style="width:22px;height:22px;border-radius:50%;background:{color}25;
                    border:1px solid {color}60;text-align:center;line-height:22px;
                    font-size:10px;font-weight:700;color:{color};">{i}</div>
      </td>
      <td style="padding:8px 0 8px 10px;color:{MUTED};font-size:12px;line-height:1.6;">
        {step.get('instruction','')}
        <span style="color:{MUTED};font-size:11px;"> ({step.get('duration','')}s)</span>
      </td>
    </tr>""" for i, step in enumerate(steps[:5], 1))

    rounds_note = (f'<p style="margin:10px 0 0;font-size:11px;color:{MUTED};">'
                   f'Repeat <strong style="color:{TEXT};">{rounds}×</strong></p>'
                   if rounds > 1 else "")

    body = f"""
    <p style="color:{MUTED};margin:0 0 4px;font-size:12px;letter-spacing:0.15em;
               text-transform:uppercase;">Your {reminder_time} reminder</p>
    <p style="color:{TEXT};margin:0 0 22px;font-size:15px;line-height:1.7;">
      Hi <strong>{user_name}</strong> 👋<br>
      Time for your daily exercise. A few minutes now makes a real difference.
    </p>
    <div style="border-left:3px solid {color};padding:10px 16px;
                background:{color}10;border-radius:0 10px 10px 0;margin-bottom:20px;">
      <p style="margin:0;color:{TEXT};font-size:13px;font-style:italic;line-height:1.7;">
        "{intro[:180]}…"
      </p>
    </div>
    <div style="background:#0f172a;border:1px solid {color}40;border-radius:14px;padding:20px 22px;">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
        <div style="font-size:36px;line-height:1;">{exercise.get('icon','🧘')}</div>
        <div>
          <p style="margin:0;font-weight:700;color:{TEXT};font-size:16px;">
            {exercise.get('title','')}</p>
          <p style="margin:4px 0 0;color:{MUTED};font-size:12px;">
            {exercise.get('subtitle','')} · {exercise.get('duration','')}</p>
        </div>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">{steps_rows}</table>
      {rounds_note}
      <div style="margin-top:18px;text-align:center;">
        <a href="{app_url}/exercise"
          style="display:inline-block;padding:11px 28px;border-radius:50px;
                 background:{color};color:#000;font-weight:700;font-size:12px;
                 text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;">
          Open in App →
        </a>
      </div>
    </div>
    <p style="margin-top:20px;color:{MUTED};font-size:12px;">
      Change your reminder time anytime in
      <a href="{app_url}/settings" style="color:{CYAN};text-decoration:none;">
        Settings →
      </a>
    </p>"""

    subject  = f"⏰ Time for your {exercise.get('title','')} · MindfulAI"
    preheader = f"{exercise.get('icon','')} Your daily {exercise.get('title','')} reminder."
    return subject, _wrap(f"Time for {exercise.get('title','')}", preheader, body)