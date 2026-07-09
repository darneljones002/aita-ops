import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models


def is_quiet_hour():
    now = datetime.now()
    current_hour = now.hour

    quiet_start = int(os.getenv("SMS_QUIET_HOUR_START", "20"))
    quiet_end = int(os.getenv("SMS_QUIET_HOUR_END", "8"))

    if quiet_start > quiet_end:
        return current_hour >= quiet_start or current_hour < quiet_end

    return quiet_start <= current_hour < quiet_end


def count_sms_since(parent_id: int, since: datetime, db: Session):
    return (
        db.query(models.MessageLog)
        .filter(models.MessageLog.parent_id == parent_id)
        .filter(models.MessageLog.channel == "sms")
        .filter(models.MessageLog.status.in_(["sent", "queued", "accepted", "dry_run"]))
        .filter(models.MessageLog.created_at >= since)
        .count()
    )


def can_send_sms(parent: models.Parent, db: Session):
    if parent.sms_consent_status != "opted_in":
        return False, "Parent has not opted in to SMS"

    if parent.phone_valid != "valid":
        return False, "Parent does not have a valid phone number"

    if not parent.phone_normalized:
        return False, "Parent normalized phone number is missing"

    if is_quiet_hour():
        return False, "SMS blocked during quiet hours"

    daily_limit = int(os.getenv("SMS_DAILY_LIMIT_PER_PARENT", "3"))
    weekly_limit = int(os.getenv("SMS_WEEKLY_LIMIT_PER_PARENT", "10"))

    now = datetime.now()
    last_24_hours = now - timedelta(hours=24)
    last_7_days = now - timedelta(days=7)

    daily_count = count_sms_since(parent.id, last_24_hours, db)
    weekly_count = count_sms_since(parent.id, last_7_days, db)

    if daily_count >= daily_limit:
        return False, f"Parent has reached daily SMS limit of {daily_limit}"

    if weekly_count >= weekly_limit:
        return False, f"Parent has reached weekly SMS limit of {weekly_limit}"

    return True, None