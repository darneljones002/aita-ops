from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.message_renderer import render_template
from app.services.sms_service import send_sms
from app.services.sms_guard import can_send_sms
from app.services.email_guard import can_send_email
from app.services.email_service import send_email

router = APIRouter(prefix="/message-templates", tags=["Message Templates"])


@router.post("/", response_model=schemas.MessageTemplateOut)
def create_template(template: schemas.MessageTemplateCreate, db: Session = Depends(get_db)):
    db_template = models.MessageTemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.get("/", response_model=list[schemas.MessageTemplateOut])
def list_templates(db: Session = Depends(get_db)):
    return db.query(models.MessageTemplate).all()


@router.post("/render")
def render_message(request: schemas.MessageRenderRequest, db: Session = Depends(get_db)):
    template = db.query(models.MessageTemplate).filter(models.MessageTemplate.id == request.template_id).first()
    athlete = db.query(models.Athlete).filter(models.Athlete.id == request.athlete_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    parent = db.query(models.Parent).filter(models.Parent.id == athlete.parent_id).first()

    session = None
    if request.session_id:
        session = db.query(models.Session).filter(models.Session.id == request.session_id).first()

    rendered = render_template(
        template_body=template.body,
        athlete=athlete,
        parent=parent,
        session=session,
    )

    return {"message": rendered}


@router.post("/send-sms", response_model=schemas.MessageLogOut)
def send_rendered_sms(request: schemas.SendSmsRequest, db: Session = Depends(get_db)):
    parent = db.query(models.Parent).filter(models.Parent.id == request.parent_id).first()

    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    allowed, reason = can_send_sms(parent, db)

    if not allowed:
        log = models.MessageLog(
            parent_id=request.parent_id,
            athlete_id=request.athlete_id,
            session_id=request.session_id,
            channel="sms",
            message_type=request.message_type,
            recipient=parent.phone_normalized or parent.phone or "missing",
            body=request.body,
            status=f"blocked: {reason}",
            provider_message_id=None,
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        return log

    result = send_sms(to_phone=parent.phone_normalized, body=request.body)

    log = models.MessageLog(
        parent_id=request.parent_id,
        athlete_id=request.athlete_id,
        session_id=request.session_id,
        channel="sms",
        message_type=request.message_type,
        recipient=parent.phone_normalized,
        body=request.body,
        status=result["status"],
        provider_message_id=result["provider_message_id"],
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log

@router.post("/send-email", response_model=schemas.MessageLogOut)
def send_rendered_email(request: schemas.SendEmailRequest, db: Session = Depends(get_db)):
    parent = db.query(models.Parent).filter(models.Parent.id == request.parent_id).first()

    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    allowed, reason = can_send_email(parent, db)

    if not allowed:
        log = models.MessageLog(
            parent_id=request.parent_id,
            athlete_id=request.athlete_id,
            session_id=request.session_id,
            channel="email",
            message_type=request.message_type,
            recipient=parent.email or "missing",
            body=f"Subject: {request.subject}\n\n{request.body}",
            status=f"blocked: {reason}",
            provider_message_id=None,
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        return log

    result = send_email(
        to_email=parent.email,
        subject=request.subject,
        body=request.body,
    )

    log = models.MessageLog(
        parent_id=request.parent_id,
        athlete_id=request.athlete_id,
        session_id=request.session_id,
        channel="email",
        message_type=request.message_type,
        recipient=parent.email,
        body=f"Subject: {request.subject}\n\n{request.body}",
        status=result["status"],
        provider_message_id=result["provider_message_id"],
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log