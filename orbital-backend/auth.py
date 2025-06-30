import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException, Depends
import json
import os
from firebase_admin import credentials


# Prefer environment variable, but fall back to file for local dev
firebase_credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
if firebase_credentials_json:
    cred_dict = json.loads(firebase_credentials_json)
    cred = credentials.Certificate(cred_dict)
else:
    cred = credentials.Certificate("firebase_admin_sdk.json")
firebase_admin.initialize_app(cred)

async def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    id_token = auth_header.split(" ")[1]
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token["uid"]
    except Exception as e:
        print("Token verification failed:", e)
        raise HTTPException(status_code=401, detail="Invalid token")
