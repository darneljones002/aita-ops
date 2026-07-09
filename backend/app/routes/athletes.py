from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/athletes", tags=["Athletes"])


@router.post("/", response_model=schemas.AthleteOut)
def create_athlete(athlete: schemas.AthleteCreate, db: Session = Depends(get_db)):
    db_athlete = models.Athlete(**athlete.model_dump())
    db.add(db_athlete)
    db.commit()
    db.refresh(db_athlete)
    return db_athlete


@router.get("/", response_model=list[schemas.AthleteOut])
def list_athletes(db: Session = Depends(get_db)):
    return db.query(models.Athlete).all()