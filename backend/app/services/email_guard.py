import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models


def count_email_since(parent_id: int, since: datetime, db: Session):
    return (
        db.query(models.MessageLog)
        .filter(models.MessageLog.parent_id == parent_id)
        .filter(models.MessageLog.channel == "email")
        .filter(models.MessageLog.status.in_(["sent", "queued", "dry_run"]))
        .filter(models.MessageLog.created_at >= since)
        .count()
    )


def can_send_email(parent: models.Parent, db: Session):
    if not parent.email:
        return False, "Parent email is missing"

    if parent.email_consent_status == "unsubscribed":
        return False, "Parent has unsubscribed from email"

    daily_limit = int(os.getenv("EMAIL_DAILY_LIMIT_PER_PARENT", "5"))
    weekly_limit = int(os.getenv("EMAIL_WEEKLY_LIMIT_PER_PARENT", "20"))

    now = datetime.now()
    last_24_hours = now - timedelta(hours=24)
    last_7_days = now - timedelta(days=7)

    daily_count = count_email_since(parent.id, last_24_hours, db)
    weekly_count = count_email_since(parent.id, last_7_days, db)

    if daily_count >= daily_limit:
        return False, f"Parent has reached daily email limit of {daily_limit}"

    if weekly_count >= weekly_limit:
        return False, f"Parent has reached weekly email limit of {weekly_limit}"

    return True, None