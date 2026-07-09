from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.message_renderer import render_template
from app.services.sms_guard import can_send_sms
from app.services.sms_service import send_sms
from app.services.email_guard import can_send_email
from app.services.email_service import send_email

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.post("/", response_model=schemas.TagOut)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Tag).filter(models.Tag.name == tag.name).first()

    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")

    db_tag = models.Tag(**tag.model_dump())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)

    return db_tag


@router.get("/", response_model=list[schemas.TagOut])
def list_tags(db: Session = Depends(get_db)):
    return db.query(models.Tag).order_by(models.Tag.name.asc()).all()


@router.post("/assign", response_model=schemas.AthleteTagOut)
def assign_tag(payload: schemas.AthleteTagCreate, db: Session = Depends(get_db)):
    athlete = db.query(models.Athlete).filter(models.Athlete.id == payload.athlete_id).first()
    tag = db.query(models.Tag).filter(models.Tag.id == payload.tag_id).first()

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    existing = (
        db.query(models.AthleteTag)
        .filter(models.AthleteTag.athlete_id == payload.athlete_id)
        .filter(models.AthleteTag.tag_id == payload.tag_id)
        .first()
    )

    if existing:
        return existing

    db_athlete_tag = models.AthleteTag(**payload.model_dump())
    db.add(db_athlete_tag)
    db.commit()
    db.refresh(db_athlete_tag)

    return db_athlete_tag


@router.delete("/assign/{athlete_tag_id}")
def remove_tag_assignment(athlete_tag_id: int, db: Session = Depends(get_db)):
    assignment = (
        db.query(models.AthleteTag)
        .filter(models.AthleteTag.id == athlete_tag_id)
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()

    return {"message": "Tag assignment removed"}


@router.get("/{tag_id}/athletes", response_model=list[schemas.AthleteOut])
def get_athletes_by_tag(tag_id: int, db: Session = Depends(get_db)):
    athlete_tags = (
        db.query(models.AthleteTag)
        .filter(models.AthleteTag.tag_id == tag_id)
        .all()
    )

    athlete_ids = [item.athlete_id for item in athlete_tags]

    if not athlete_ids:
        return []

    return db.query(models.Athlete).filter(models.Athlete.id.in_(athlete_ids)).all()

@router.post("/bulk-preview", response_model=schemas.BulkPreviewResult)
def bulk_preview_by_tag(payload: schemas.BulkPreviewByTagRequest, db: Session = Depends(get_db)):
    template = (
        db.query(models.MessageTemplate)
        .filter(models.MessageTemplate.id == payload.template_id)
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    athlete_tags = (
        db.query(models.AthleteTag)
        .filter(models.AthleteTag.tag_id.in_(payload.tag_ids))
        .all()
    )

    athlete_ids = sorted(set([item.athlete_id for item in athlete_tags]))

    session = None
    if payload.session_id:
        session = (
            db.query(models.Session)
            .filter(models.Session.id == payload.session_id)
            .first()
        )

    results = []
    ready = 0
    blocked = 0

    for athlete_id in athlete_ids:
        athlete = db.query(models.Athlete).filter(models.Athlete.id == athlete_id).first()

        if not athlete:
            blocked += 1
            results.append({
                "athlete_id": athlete_id,
                "athlete_name": "Unknown",
                "parent_id": None,
                "parent_name": None,
                "recipient": None,
                "status": "blocked",
                "body": "",
                "subject": payload.subject,
                "reason": "Athlete not found",
            })
            continue

        parent = db.query(models.Parent).filter(models.Parent.id == athlete.parent_id).first()

        if not parent:
            blocked += 1
            results.append({
                "athlete_id": athlete.id,
                "athlete_name": f"{athlete.first_name} {athlete.last_name or ''}".strip(),
                "parent_id": None,
                "parent_name": None,
                "recipient": None,
                "status": "blocked",
                "body": "",
                "subject": payload.subject,
                "reason": "Parent not found",
            })
            continue

        rendered_body = render_template(
            template_body=template.body,
            athlete=athlete,
            parent=parent,
            session=session,
        )

        if payload.channel == "sms":
            allowed, reason = can_send_sms(parent, db)
            recipient = parent.phone_normalized or parent.phone

        elif payload.channel == "email":
            allowed, reason = can_send_email(parent, db)
            recipient = parent.email

        else:
            allowed = False
            reason = "Unsupported channel"
            recipient = None

        if allowed:
            ready += 1
            status = "ready"
        else:
            blocked += 1
            status = "blocked"

        results.append({
            "athlete_id": athlete.id,
            "athlete_name": f"{athlete.first_name} {athlete.last_name or ''}".strip(),
            "parent_id": parent.id,
            "parent_name": f"{parent.first_name} {parent.last_name or ''}".strip(),
            "recipient": recipient,
            "status": status,
            "body": rendered_body,
            "subject": payload.subject or template.name,
            "reason": None if allowed else reason,
        })

    return {
        "total_matched": len(athlete_ids),
        "ready": ready,
        "blocked": blocked,
        "results": results,
    }


@router.post("/bulk-send", response_model=schemas.BulkSendResult)
def bulk_send_by_tag(payload: schemas.BulkSendByTagRequest, db: Session = Depends(get_db)):
    template = (
        db.query(models.MessageTemplate)
        .filter(models.MessageTemplate.id == payload.template_id)
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    athlete_tags = (
        db.query(models.AthleteTag)
        .filter(models.AthleteTag.tag_id.in_(payload.tag_ids))
        .all()
    )

    athlete_ids = sorted(set([item.athlete_id for item in athlete_tags]))

    results = []
    sent_or_logged = 0
    blocked = 0

    session = None
    if payload.session_id:
        session = (
            db.query(models.Session)
            .filter(models.Session.id == payload.session_id)
            .first()
        )

    for athlete_id in athlete_ids:
        athlete = (
            db.query(models.Athlete)
            .filter(models.Athlete.id == athlete_id)
            .first()
        )

        if not athlete:
            blocked += 1
            results.append({
                "athlete_id": athlete_id,
                "parent_id": None,
                "recipient": None,
                "status": "blocked",
                "message": "Athlete not found",
            })
            continue

        parent = (
            db.query(models.Parent)
            .filter(models.Parent.id == athlete.parent_id)
            .first()
        )

        if not parent:
            blocked += 1
            results.append({
                "athlete_id": athlete.id,
                "parent_id": None,
                "recipient": None,
                "status": "blocked",
                "message": "Parent not found",
            })
            continue

        rendered_body = render_template(
            template_body=template.body,
            athlete=athlete,
            parent=parent,
            session=session,
        )

        if payload.channel == "sms":
            allowed, reason = can_send_sms(parent, db)

            if not allowed:
                log = models.MessageLog(
                    parent_id=parent.id,
                    athlete_id=athlete.id,
                    session_id=payload.session_id,
                    channel="sms",
                    message_type=payload.message_type,
                    recipient=parent.phone_normalized or parent.phone or "missing",
                    body=rendered_body,
                    status=f"blocked: {reason}",
                    provider_message_id=None,
                )

                db.add(log)
                blocked += 1
                results.append({
                    "athlete_id": athlete.id,
                    "parent_id": parent.id,
                    "recipient": parent.phone_normalized or parent.phone,
                    "status": log.status,
                    "message": reason,
                })
                continue

            result = send_sms(to_phone=parent.phone_normalized, body=rendered_body)

            log = models.MessageLog(
                parent_id=parent.id,
                athlete_id=athlete.id,
                session_id=payload.session_id,
                channel="sms",
                message_type=payload.message_type,
                recipient=parent.phone_normalized,
                body=rendered_body,
                status=result["status"],
                provider_message_id=result["provider_message_id"],
            )

            db.add(log)
            sent_or_logged += 1
            results.append({
                "athlete_id": athlete.id,
                "parent_id": parent.id,
                "recipient": parent.phone_normalized,
                "status": result["status"],
                "message": "SMS logged/sent",
            })

        elif payload.channel == "email":
            allowed, reason = can_send_email(parent, db)

            subject = payload.subject or template.name

            if not allowed:
                log = models.MessageLog(
                    parent_id=parent.id,
                    athlete_id=athlete.id,
                    session_id=payload.session_id,
                    channel="email",
                    message_type=payload.message_type,
                    recipient=parent.email or "missing",
                    body=f"Subject: {subject}\n\n{rendered_body}",
                    status=f"blocked: {reason}",
                    provider_message_id=None,
                )

                db.add(log)
                blocked += 1
                results.append({
                    "athlete_id": athlete.id,
                    "parent_id": parent.id,
                    "recipient": parent.email,
                    "status": log.status,
                    "message": reason,
                })
                continue

            result = send_email(
                to_email=parent.email,
                subject=subject,
                body=rendered_body,
            )

            log = models.MessageLog(
                parent_id=parent.id,
                athlete_id=athlete.id,
                session_id=payload.session_id,
                channel="email",
                message_type=payload.message_type,
                recipient=parent.email,
                body=f"Subject: {subject}\n\n{rendered_body}",
                status=result["status"],
                provider_message_id=result["provider_message_id"],
            )

            db.add(log)
            sent_or_logged += 1
            results.append({
                "athlete_id": athlete.id,
                "parent_id": parent.id,
                "recipient": parent.email,
                "status": result["status"],
                "message": "Email logged/sent",
            })

        else:
            blocked += 1
            results.append({
                "athlete_id": athlete.id,
                "parent_id": parent.id,
                "recipient": None,
                "status": "blocked",
                "message": "Unsupported channel",
            })

    db.commit()

    return {
        "total_matched": len(athlete_ids),
        "sent_or_logged": sent_or_logged,
        "blocked": blocked,
        "results": results,
    }