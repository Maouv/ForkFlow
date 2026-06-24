from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.auth import verify_auth
from app.database import Base, engine
from app.engine.ws_manager import ws_manager
from app.routers import providers, agents, flows, executions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Forkflow", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_dep = [Depends(verify_auth)]

app.include_router(providers.router, dependencies=auth_dep)
app.include_router(agents.router, dependencies=auth_dep)
app.include_router(flows.router, dependencies=auth_dep)
app.include_router(executions.router, dependencies=auth_dep)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws/logs/{execution_id}")
async def ws_logs(websocket: WebSocket, execution_id: int):
    ws_manager.connect(execution_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(execution_id, websocket)
