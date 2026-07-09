from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/message-logs", tags=["Message Logs"])


@router.get("/", response_model=list[schemas.MessageLogOut])
def list_message_logs(db: Session = Depends(get_db)):
    return db.query(models.MessageLog).order_by(models.MessageLog.id.desc()).all()