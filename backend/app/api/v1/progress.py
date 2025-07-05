
from fastapi import APIRouter

router = APIRouter()

@router.get("/progress")
async def get_progress():
    return {"message": "Get progress endpoint"}

@router.post("/progress")
async def create_progress():
    return {"message": "Create progress endpoint"}


