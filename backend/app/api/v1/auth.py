
from fastapi import APIRouter

router = APIRouter()

@router.post("/auth/login")
async def login():
    return {"message": "Login endpoint"}

@router.post("/auth/refresh")
async def refresh_token():
    return {"message": "Refresh token endpoint"}


