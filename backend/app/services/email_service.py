import os
import requests
from dotenv import load_dotenv

load_dotenv()


def send_email(to_email: str, subject: str, body: str):
    dry_run = os.getenv("EMAIL_DRY_RUN", "true").lower() == "true"

    if dry_run:
        return {
            "status": "dry_run",
            "provider_message_id": None,
            "to": to_email,
            "subject": subject,
            "body": body,
        }

    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("EMAIL_FROM")

    if not api_key or not from_email:
        raise ValueError("Resend credentials are missing")

    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "text": body,
        },
        timeout=20,
    )

    response.raise_for_status()
    data = response.json()

    return {
        "status": "sent",
        "provider_message_id": data.get("id"),
        "to": to_email,
        "subject": subject,
        "body": body,
    }