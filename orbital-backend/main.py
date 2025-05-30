from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import plans

app = FastAPI()
app.include_router(plans.router)


# Allow frontend to make requests to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace * with frontend domain for security later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend running!"}

# create tables
from database import engine
from models import Base

# Create DB tables
Base.metadata.create_all(bind=engine)
