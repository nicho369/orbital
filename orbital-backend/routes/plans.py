print("✅ plans.py loaded")

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudyPlan

router = APIRouter(prefix="/plans", tags=["Plans"])

@router.post("/save")
def save_study_plan(user_id: str, json_data: str, db: Session = Depends(get_db)):
    plan = StudyPlan(user_id=user_id, json_data=json_data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"status": "saved", "plan_id": plan.id}

@router.get("/load/{user_id}")
def load_study_plans(user_id: str, db: Session = Depends(get_db)):
    plans = db.query(StudyPlan).filter(StudyPlan.user_id == user_id).all()
    return {"plans": [p.json_data for p in plans]}
