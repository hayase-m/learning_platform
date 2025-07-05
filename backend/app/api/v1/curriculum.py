
from fastapi import APIRouter

router = APIRouter()

@router.post("/curriculum/generate")
async def generate_curriculum():
    return {"message": "Generate curriculum endpoint"}


