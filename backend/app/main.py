from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import providers, agents, flows

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Forkflow", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router)
app.include_router(agents.router)
app.include_router(flows.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
