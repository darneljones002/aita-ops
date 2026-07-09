from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("/", response_model=schemas.SessionOut)
def create_session(session: schemas.SessionCreate, db: Session = Depends(get_db)):
    db_session = models.Session(**session.model_dump())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/", response_model=list[schemas.SessionOut])
def list_sessions(db: Session = Depends(get_db)):
    return db.query(models.Session).all()


@router.post("/{session_id}/bulk-invite-by-tag", response_model=schemas.BulkInviteResult)
def bulk_invite_by_tag(
    session_id: int,
    payload: schemas.BulkInviteByTagRequest,
    db: Session = Depends(get_db),
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    athlete_tags = (
        db.query(models.AthleteTag)
        .filter(models.AthleteTag.tag_id.in_(payload.tag_ids))
        .all()
    )

    athlete_ids = sorted(set([item.athlete_id for item in athlete_tags]))

    created = 0
    skipped = 0
    invited_ids = []

    for athlete_id in athlete_ids:
        existing = (
            db.query(models.SessionInvite)
            .filter(models.SessionInvite.session_id == session_id)
            .filter(models.SessionInvite.athlete_id == athlete_id)
            .first()
        )

        if existing and payload.skip_existing:
            skipped += 1
            continue

        invite = models.SessionInvite(
            athlete_id=athlete_id,
            session_id=session_id,
            status=payload.status,
        )

        db.add(invite)
        created += 1
        invited_ids.append(athlete_id)

    db.commit()

    return {
        "created": created,
        "skipped": skipped,
        "athlete_ids": invited_ids,
    }