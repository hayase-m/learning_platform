
from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.get("/community/teams")
async def get_teams():
    return {"message": "Get teams endpoint"}

@router.post("/community/teams/{id}")
async def join_team(id: str):
    return {"message": f"Join team {id} endpoint"}

@router.websocket("/community/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()


