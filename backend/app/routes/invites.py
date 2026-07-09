from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/invites", tags=["Invites"])


@router.post("/", response_model=schemas.InviteOut)
def create_invite(invite: schemas.InviteCreate, db: Session = Depends(get_db)):
    db_invite = models.SessionInvite(**invite.model_dump())
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite


@router.get("/", response_model=list[schemas.InviteOut])
def list_invites(db: Session = Depends(get_db)):
    return db.query(models.SessionInvite).all()


@router.patch("/{invite_id}", response_model=schemas.InviteOut)
def update_invite(invite_id: int, update: schemas.InviteUpdate, db: Session = Depends(get_db)):
    invite = db.query(models.SessionInvite).filter(models.SessionInvite.id == invite_id).first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    invite.status = update.status
    invite.notes = update.notes

    db.commit()
    db.refresh(invite)
    return invite