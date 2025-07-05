from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, users, curriculum, progress, community

app = FastAPI(
    title="Learning Platform API",
    description="API for a personalized learning platform with AI-generated curriculum and community features.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust as needed for your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(curriculum.router, prefix="/api/v1", tags=["curriculum"])
app.include_router(progress.router, prefix="/api/v1", tags=["progress"])
app.include_router(community.router, prefix="/api/v1", tags=["community"])

@app.get("/", tags=["root"])
async def read_root():
    return {"message": "Welcome to the Learning Platform API"}


