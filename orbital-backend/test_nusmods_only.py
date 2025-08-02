#!/usr/bin/env python3
"""
Test script to run only the NUSMods routes without database dependencies
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import nusmods
import uvicorn

app = FastAPI()
app.include_router(nusmods.router)

# Allow frontend to make requests to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "NUSMods test backend running!"}

if __name__ == "__main__":
    print("Starting NUSMods-only backend on http://localhost:8000")
    print("Test endpoint: http://localhost:8000/nusmods/modules/2024-2025")
    uvicorn.run("test_nusmods_only:app", host="127.0.0.1", port=8000, reload=True)
