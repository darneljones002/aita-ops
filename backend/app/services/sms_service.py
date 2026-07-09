import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()


def send_sms(to_phone: str, body: str):
    dry_run = os.getenv("SMS_DRY_RUN", "true").lower() == "true"

    if dry_run:
        return {
            "status": "dry_run",
            "provider_message_id": None,
            "body": body,
            "to": to_phone,
        }

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_phone = os.getenv("TWILIO_FROM_PHONE")

    if not account_sid or not auth_token or not from_phone:
        raise ValueError("Twilio credentials are missing")

    client = Client(account_sid, auth_token)

    message = client.messages.create(
        body=body,
        from_=from_phone,
        to=to_phone,
    )

    return {
        "status": message.status,
        "provider_message_id": message.sid,
        "body": body,
        "to": to_phone,
    }