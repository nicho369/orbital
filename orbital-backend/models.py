from sqlalchemy import Column, Integer, String
from database import Base

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    json_data = Column(String)  # Store study plan JSON here
