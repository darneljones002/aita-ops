from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.phone_service import normalize_phone

router = APIRouter(prefix="/parents", tags=["Parents"])


@router.post("/", response_model=schemas.ParentOut)
def create_parent(parent: schemas.ParentCreate, db: Session = Depends(get_db)):
    phone_normalized, phone_valid = normalize_phone(parent.phone)

    parent_data = parent.model_dump()
    parent_data["phone_normalized"] = phone_normalized
    parent_data["phone_valid"] = phone_valid

    if parent.sms_consent_status == "opted_in":
        parent_data["sms_consent_timestamp"] = datetime.now()

    db_parent = models.Parent(**parent_data)

    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)

    return db_parent


@router.get("/", response_model=list[schemas.ParentOut])
def list_parents(db: Session = Depends(get_db)):
    return db.query(models.Parent).all()