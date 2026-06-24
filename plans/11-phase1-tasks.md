## 11. Phase 1 Task List

### Sprint 1: Backend Foundation (Week 1-2)

#### Task 1: Project Scaffold

**Files:**
- Create: `forkflow/backend/requirements.txt`
- Create: `forkflow/backend/app/__init__.py`
- Create: `forkflow/backend/app/main.py`
- Create: `forkflow/backend/app/config.py`
- Create: `forkflow/backend/app/database.py`
- Create: `forkflow/backend/Dockerfile`
- Create: `forkflow/.env.example`
- Create: `forkflow/docker-compose.yml`

**requirements.txt:**
```
fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.30
alembic==1.13.1
pydantic==2.7.1
pydantic-settings==2.2.1
httpx==0.27.0
cryptography==42.0.7
python-multipart==0.0.9
websockets==12.0
pytest==8.2.0
pytest-asyncio==0.23.7
```

**app/config.py:**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    forkflow_username: str = "admin"
    forkflow_password: str = "changeme"
    forkflow_encryption_key: str = ""
    forkflow_db_path: str = "/data/forkflow.db"
    forkflow_sandbox_dir: str = "/data/sandbox"
    forkflow_host: str = "0.0.0.0"
    forkflow_port: int = 8000
    forkflow_max_concurrent_provider_calls: int = 5

    class Config:
        env_file = ".env"

settings = Settings()
```

**app/database.py:**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(f"sqlite:///{settings.forkflow_db_path}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**app/main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Forkflow", version="0.1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

**Verification:** `uvicorn app.main:app --reload` → GET `/api/health` → `{"status": "ok"}`

---

#### Task 2: Crypto Module (API Key Encryption)

**Files:**
- Create: `forkflow/backend/app/crypto.py`
- Test: `forkflow/backend/tests/test_crypto.py`

**Step 1: Write failing test**
```python
# tests/test_crypto.py
from app.crypto import encrypt_api_key, decrypt_api_key

def test_encrypt_decrypt_roundtrip():
    plaintext = "***"
    encrypted = encrypt_api_key(plaintext)
    assert encrypted != plaintext
    decrypted = decrypt_api_key(encrypted)
    assert decrypted == plaintext

def test_decrypt_invalid_returns_none():
    result = decrypt_api_key("not-valid-encrypted-data")
    assert result is None
```

**Step 2: Run test → FAIL (module not found)**

**Step 3: Implement**
```python
# app/crypto.py
from cryptography.fernet import Fernet, InvalidToken
from app.config import settings

def _get_fernet() -> Fernet:
    key = settings.forkflow_encryption_key
    if not key:
        # Generate ephemeral key (dev only — warn in logs)
        key = Fernet.generate_key().decode()
    return Fernet(key.encode() if isinstance(key, str) else key)

_fernet = _get_fernet()

def encrypt_api_key(plaintext: str) -> str:
    if not plaintext:
        return ""
    return _fernet.encrypt(plaintext.encode()).decode()

def decrypt_api_key(ciphertext: str) -> str | None:
    if not ciphertext:
        return None
    try:
        return _fernet.decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        return None
```

**Step 4: Run test → PASS**

---

#### Task 3: Database Models

**Files:**
- Create: `forkflow/backend/app/models/__init__.py`
- Create: `forkflow/backend/app/models/provider.py`
- Create: `forkflow/backend/app/models/agent.py`
- Create: `forkflow/backend/app/models/flow.py`
- Create: `forkflow/backend/app/models/execution.py`

Implement each model per schema in Section 2. Use SQLAlchemy 2.0 style (Mapped, mapped_column). JSON columns use `sqlalchemy.JSON`.

**Verification:** `python -c "from app.models import *; from app.database import Base; Base.metadata.create_all(engine)"` → no errors, tables created.

---

#### Task 4: Alembic Migrations Setup

**Files:**
- Create: `forkflow/backend/alembic.ini`
- Create: `forkflow/backend/alembic/env.py`

**Steps:**
1. `alembic init alembic` (run in backend/)
2. Configure `alembic.ini` → `sqlalchemy.url = sqlite:///./forkflow.db`
3. Configure `alembic/env.py` → import `Base` from `app.database`, set `target_metadata = Base.metadata`
4. `alembic revision --autogenerate -m "initial schema"`
5. `alembic upgrade head`

**Verification:** `alembic current` → head revision. Tables exist in SQLite.

---

#### Task 5: Pydantic Schemas

**Files:**
- Create: `forkflow/backend/app/schemas/__init__.py`
- Create: `forkflow/backend/app/schemas/provider.py`
- Create: `forkflow/backend/app/schemas/agent.py`
- Create: `forkflow/backend/app/schemas/flow.py`
- Create: `forkflow/backend/app/schemas/execution.py`

**Provider schemas:**
```python
# schemas/provider.py
from pydantic import BaseModel, Field
from enum import Enum

class ProviderType(str, Enum):
    openai_compatible = "openai_compatible"
    anthropic = "anthropic"

class ProviderCreate(BaseModel):
    name: str = Field(..., max_length=50)
    type: ProviderType
    base_url: str
    api_key: str | None = None
    default_model: str

class ProviderResponse(BaseModel):
    id: int
    name: str
    type: ProviderType
    base_url: str
    default_model: str
    has_api_key: bool
    created_at: datetime

    class Config:
        from_attributes = True
```

Continue for agent, flow, execution schemas per API design in Section 3.

**Key validation rules:**
- Agent `tools` must be from allowed tool list (validator)
- Node `config.timeout_seconds` must be 1-300
- Edge `condition_type` must be valid enum
- `json_path` condition_value must be parseable expression (validator)

---

#### Task 6: Provider CRUD Router

**Files:**
- Create: `forkflow/backend/app/routers/__init__.py`
- Create: `forkflow/backend/app/routers/providers.py`
- Modify: `forkflow/backend/app/main.py` (include router)

Implement GET/POST/GET/{id}/PUT/{id}/DELETE/{id} per Section 3.
- On create/update: encrypt `api_key` via `crypto.encrypt_api_key` before save
- On response: return `has_api_key: bool` (never return the key itself)
- On delete: check if agents reference this provider → 409 Conflict if yes

**Test:** `tests/test_providers.py` — create, get, update, delete, delete-with-reference (409).

---

#### Task 7: Agent Profile CRUD Router

**Files:**
- Create: `forkflow/backend/app/routers/agents.py`
- Modify: `forkflow/backend/app/main.py`

Implement full CRUD + PATCH toggle + POST test.
- `POST /api/agents/{id}/test`: body `{"message": "hello"}` → calls provider adapter → returns response. No flow needed.
- Toggle: flip `active` boolean, return updated agent.
- Delete: check if nodes reference this agent → 409 if yes.

**Test:** `tests/test_agents.py` — CRUD, toggle, test endpoint (mock provider).

---

#### Task 8: Flow CRUD Router

**Files:**
- Create: `forkflow/backend/app/routers/flows.py`
- Modify: `forkflow/backend/app/main.py`

Implement GET/POST/GET/{id}/PUT/{id}/DELETE/{id}.
- `PUT /api/flows/{id}`: accepts full graph (nodes + edges), replaces all in single transaction. Delete old nodes/edges, insert new.
- `GET /api/flows/{id}`: returns flow with nested nodes + edges.

**Test:** `tests/test_flows.py` — create empty flow, add nodes+edges via PUT, GET returns full graph.

---

### Sprint 2: Core Engine (Week 2-3)

#### Task 9: Provider Adapters

**Files:**
- Create: `forkflow/backend/app/providers/__init__.py`
- Create: `forkflow/backend/app/providers/base.py`
- Create: `forkflow/backend/app/providers/openai_compat.py`
- Create: `forkflow/backend/app/providers/anthropic.py`
- Test: `forkflow/backend/tests/test_providers_adapter.py`

**base.py:**
```python
from abc import ABC, abstractmethod

class ProviderAdapter(ABC):
    @abstractmethod
    async def call(self, messages: list[dict], model: str, tools: list[dict] | None = None, timeout: int = 60) -> str:
        pass

def get_adapter(provider_type: str) -> ProviderAdapter:
    if provider_type == "openai_compatible":
        return OpenAICompatAdapter()
    elif provider_type == "anthropic":
        return AnthropicAdapter()
    raise ValueError(f"Unknown provider type: {provider_type}")
```

**openai_compat.py:**
```python
import httpx
from app.providers.base import ProviderAdapter

class OpenAICompatAdapter(ProviderAdapter):
    async def call(self, base_url, api_key, messages, model, tools=None, timeout=60):
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{base_url}/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": model, "messages": messages, "temperature": 0.7},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
```

**anthropic.py:**
```python
import httpx
from app.providers.base import ProviderAdapter

class AnthropicAdapter(ABC):
    async def call(self, base_url, api_key, messages, model, tools=None, timeout=60):
        # Extract system prompt
        system = ""
        chat_messages = []
        for m in messages:
            if m["role"] == "system":
                system += m["content"] + "\n"
            else:
                chat_messages.append(m)

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{base_url}/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "messages": chat_messages,
                    "system": system.strip(),
                    "max_tokens": 4096,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]
```

**Test:** Mock httpx responses, verify correct URL/headers/body per adapter type.

---

#### Task 10: Tool Registry + 5 Tools

**Files:**
- Create: `forkflow/backend/app/tools/__init__.py`
- Create: `forkflow/backend/app/tools/registry.py`
- Create: `forkflow/backend/app/tools/file_ops.py`
- Create: `forkflow/backend/app/tools/web.py`
- Create: `forkflow/backend/app/tools/code.py`
- Create: `forkflow/backend/app/tools/flow_control.py`
- Test: `forkflow/backend/tests/test_tools.py`

Implement per Section 5. Key: sandbox path enforcement for file/code tools.

**Test cases:**
- `read_file` within sandbox → returns content
- `read_file` outside sandbox → returns error string
- `write_file` within sandbox → writes, returns True
- `write_file` path traversal `../../etc/passwd` → blocked
- `execute_code` → runs Python, returns stdout
- `execute_code` infinite loop → timeout at 10s
- `web_search` → returns results (mock or real)
- `call_agent` → calls provider (mock)

---

#### Task 11: Memory Manager

**Files:**
- Create: `forkflow/backend/app/engine/memory.py`
- Test: `forkflow/backend/tests/test_memory.py`

Implement `assemble(scope, context, agent, current_input)` per Section 4.
- `full_history`: format all previous results as `{sender}: {output}`, truncate if > 8000 chars
- `previous_only`: only last result

**Test:**
- `full_history` with 3 previous nodes → all 3 in context
- `previous_only` with 3 previous nodes → only last 1
- Context > 8000 chars → truncated to most recent

---

#### Task 12: Conditional Router

**Files:**
- Create: `forkflow/backend/app/engine/router.py`
- Test: `forkflow/backend/tests/test_router.py`

Implement `evaluate_edges(edges, node_output)` per Section 4.

**Test cases:**
- `none` condition → always routes
- `contains` with match → routes
- `contains` without match → no route
- `not_contains` with match → routes
- `not_contains` where output contains keyword → no route
- `json_path` with `verdict == "APPROVED"` and matching JSON → routes
- `json_path` with `score > 7` and score=8 → routes
- `json_path` with `score > 7` and score=5 → no route
- Multiple edges, first match wins
- No matching edges → returns None

---

#### Task 13: WebSocket Manager

**Files:**
- Create: `forkflow/backend/app/engine/ws_manager.py`

```python
import json
from datetime import datetime
from fastapi import WebSocket

class WSManager:
    def __init__(self):
        self.connections: dict[int, list[WebSocket]] = {}  # execution_id → connections

    def connect(self, execution_id: int, ws: WebSocket):
        ws.accept()
        self.connections.setdefault(execution_id, []).append(ws)

    def disconnect(self, execution_id: int, ws: WebSocket):
        if execution_id in self.connections:
            self.connections[execution_id].remove(ws)
            if not self.connections[execution_id]:
                del self.connections[execution_id]

    async def broadcast(self, execution_id: int, node_id: int, node_label: str, level: str, message: str):
        log = {
            "timestamp": datetime.utcnow().isoformat(),
            "node_id": node_id,
            "node_label": node_label,
            "level": level,
            "message": message,
        }
        if execution_id in self.connections:
            for ws in self.connections[execution_id]:
                await ws.send_text(json.dumps(log))

ws_manager = WSManager()
```

---

#### Task 14: Flow Executor

**Files:**
- Create: `forkflow/backend/app/engine/executor.py`
- Create: `forkflow/backend/app/engine/node_runner.py`
- Test: `forkflow/backend/tests/test_executor.py`

**executor.py:**
```python
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Flow, Node, Edge, Execution, NodeResult
from app.engine.node_runner import NodeRunner
from app.engine.router import evaluate_edges
from app.engine.ws_manager import ws_manager

class FlowExecutor:
    def __init__(self, db: Session):
        self.db = db
        self.runner = NodeRunner(db)

    async def execute(self, flow_id: int, user_input: str) -> int:
        # Load flow
        flow = self.db.query(Flow).get(flow_id)
        nodes = {n.id: n for n in flow.nodes}
        edges = flow.edges

        # Create execution
        execution = Execution(flow_id=flow_id, status="running", started_at=datetime.utcnow(), input=user_input)
        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)

        # Find entry node (no incoming edges)
        entry_node = self._find_entry_node(nodes, edges)

        # Execute
        current_node = entry_node
        current_input = user_input
        context = []  # list of (sender_name, output)

        try:
            while current_node:
                await ws_manager.broadcast(execution.id, current_node.id, current_node.label, "info", f"Starting node: {current_node.label}")

                # Run node with timeout
                timeout = current_node.config.get("timeout_seconds", 60)
                try:
                    output = await asyncio.wait_for(
                        self.runner.run(current_node, current_input, context),
                        timeout=timeout
                    )
                except asyncio.TimeoutError:
                    raise Exception(f"Node '{current_node.label}' timed out after {timeout}s")

                # Save result
                result = NodeResult(
                    execution_id=execution.id,
                    node_id=current_node.id,
                    status="completed",
                    input=current_input,
                    output=output,
                    started_at=datetime.utcnow(),
                    completed_at=datetime.utcnow(),
                )
                self.db.add(result)

                # Update context
                sender = current_node.agent_profile.name if current_node.agent_profile else current_node.label
                context.append({"sender": sender, "output": output})

                await ws_manager.broadcast(execution.id, current_node.id, current_node.label, "info", f"Node completed. Output: {output[:200]}")

                # Find next node
                outgoing = [e for e in edges if e.source_node_id == current_node.id]
                next_node_id = evaluate_edges(outgoing, output)

                if next_node_id:
                    current_node = nodes[next_node_id]
                    current_input = output
                else:
                    current_node = None

            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            execution.output = context[-1]["output"] if context else ""
        except Exception as e:
            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.output = str(e)
            await ws_manager.broadcast(execution.id, 0, "", "error", str(e))

        self.db.commit()
        return execution.id

    def _find_entry_node(self, nodes, edges):
        target_ids = {e.target_node_id for e in edges}
        entry_ids = set(nodes.keys()) - target_ids
        if not entry_ids:
            raise Exception("No entry node found (all nodes have incoming edges)")
        return nodes[entry_ids.pop()]
```

**Test:** Mock NodeRunner, test sequential flow A→B→C, test conditional routing, test timeout, test error handling.

---

#### Task 15: Execution Router + WebSocket Endpoint

**Files:**
- Create: `forkflow/backend/app/routers/executions.py`
- Modify: `forkflow/backend/app/main.py`

```python
# routers/executions.py
@router.post("/flows/{flow_id}/execute")
async def execute_flow(flow_id: int, body: ExecuteRequest, db: Session = Depends(get_db)):
    executor = FlowExecutor(db)
    execution_id = await executor.execute(flow_id, body.input)
    return {"execution_id": execution_id}

@router.get("/executions")
def list_executions(flow_id: int | None = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(Execution)
    if flow_id:
        query = query.filter(Execution.flow_id == flow_id)
    return query.order_by(Execution.started_at.desc()).offset(skip).limit(limit).all()

@router.get("/executions/{execution_id}")
def get_execution(execution_id: int, db: Session = Depends(get_db)):
    execution = db.query(Execution).get(execution_id)
    results = db.query(NodeResult).filter(NodeResult.execution_id == execution_id).all()
    return {"execution": execution, "node_results": results}

# main.py
@app.websocket("/ws/logs/{execution_id}")
async def ws_logs(websocket: WebSocket, execution_id: int):
    ws_manager.connect(execution_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect(execution_id, websocket)
```

---

#### Task 16: Basic Auth Middleware

**Files:**
- Create: `forkflow/backend/app/auth/__init__.py`
- Create: `forkflow/backend/app/auth/basic_auth.py`
- Modify: `forkflow/backend/app/main.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets
from app.config import settings

security = HTTPBasic()

def verify_auth(credentials: HTTPBasicCredentials = Depends(security)):
    is_user = secrets.compare_digest(credentials.username.encode(), settings.forkflow_username.encode())
    is_pass = secrets.compare_digest(credentials.password.encode(), settings.forkflow_password.encode())
    if not (is_user and is_pass):
        raise HTTPException(status_code=401, headers={"WWW-Authenticate": "Basic"})
    return credentials.username
```

Apply to all routers except `/api/health`.

---

### Sprint 3: Frontend (Week 3-5)

#### Task 17: Frontend Scaffold

**Files:**
- Create: `forkflow/frontend/package.json`
- Create: `forkflow/frontend/vite.config.ts`
- Create: `forkflow/frontend/tsconfig.json`
- Create: `forkflow/frontend/index.html`
- Create: `forkflow/frontend/src/main.tsx`
- Create: `forkflow/frontend/src/App.tsx`
- Create: `forkflow/frontend/src/types/index.ts`
- Create: `forkflow/frontend/src/api/client.ts`
- Create: `forkflow/frontend/Dockerfile`

**Dependencies:** react, react-dom, @xyflow/react, zustand, axios, react-router-dom, tailwindcss, vite, typescript

**api/client.ts:** Axios instance with basic auth header, base URL `/api`.

---

#### Task 18: React Flow Node Editor

**Files:**
- Create: `forkflow/frontend/src/components/NodeEditor/FlowCanvas.tsx`
- Create: `forkflow/frontend/src/components/NodeEditor/NodePalette.tsx`
- Create: `forkflow/frontend/src/components/NodeEditor/PropertiesPanel.tsx`
- Create: `forkflow/frontend/src/components/NodeEditor/nodes/ConversationNode.tsx`
- Create: `forkflow/frontend/src/components/NodeEditor/nodes/ProcessorNode.tsx`
- Create: `forkflow/frontend/src/store/flowStore.ts`
- Create: `forkflow/frontend/src/pages/FlowEditorPage.tsx`

Implement:
- Canvas with drag-to-add nodes from palette
- Custom node components (conversation = blue, processor = green)
- Node properties panel: select node → edit label, agent, config, timeout
- Edge creation: drag from handle → connect to target
- Edge condition editor: click edge → set condition_type + condition_value
- Save button → PUT `/api/flows/{id}` with full graph
- Load: GET `/api/flows/{id}` → populate canvas

---

#### Task 19: Agent Manager UI

**Files:**
- Create: `forkflow/frontend/src/components/AgentManager/AgentList.tsx`
- Create: `forkflow/frontend/src/components/AgentManager/AgentForm.tsx`
- Create: `forkflow/frontend/src/components/AgentManager/AgentTestDialog.tsx`
- Create: `forkflow/frontend/src/pages/AgentsPage.tsx`

- List all agents in table with toggle switch
- Form: name, system_prompt (textarea), provider (dropdown), model, tools (multi-select checkboxes), memory_type, conversation_scope
- Test dialog: input box → POST `/api/agents/{id}/test` → show response

---

#### Task 20: Provider Manager UI

**Files:**
- Create: `forkflow/frontend/src/components/ProviderManager/ProviderList.tsx`
- Create: `forkflow/frontend/src/components/ProviderManager/ProviderForm.tsx`
- Create: `forkflow/frontend/src/pages/ProvidersPage.tsx`

- Card list of providers
- Form: name, type (dropdown), base_url, api_key (password field), default_model
- Show `has_api_key` indicator, never display the key

---

#### Task 21: Execution Panel + Live Logs

**Files:**
- Create: `forkflow/frontend/src/components/ExecutionPanel/ExecutionHistory.tsx`
- Create: `forkflow/frontend/src/components/ExecutionPanel/ExecutionDetail.tsx`
- Create: `forkflow/frontend/src/components/ExecutionPanel/LiveLogs.tsx`
- Create: `forkflow/frontend/src/hooks/useWebSocket.ts`
- Create: `forkflow/frontend/src/pages/ExecutionsPage.tsx`

- Flow editor: "Run" button → input dialog → POST execute → navigate to execution detail
- Execution detail: per-node timeline (status, duration, output)
- Live logs: WebSocket hook → streaming log entries in real-time
- History: table with flow name, status, started_at, duration

---

#### Task 22: Auth Login Page

**Files:**
- Create: `forkflow/frontend/src/components/Auth/LoginPage.tsx`

- Simple login form (username/password)
- Store credentials in localStorage (base64 encoded for basic auth header)
- Redirect to flow editor on success
- 401 response → show error, stay on login

---

### Sprint 4: Integration & Deploy (Week 5-6)

#### Task 23: Docker Compose

**Files:**
- Create: `forkflow/backend/Dockerfile`
- Create: `forkflow/frontend/Dockerfile`
- Create: `forkflow/docker-compose.yml`
- Create: `forkflow/.env.example`

**Backend Dockerfile:** python:3.12-slim, install requirements, uvicorn entrypoint.
**Frontend Dockerfile:** node:20 → build, nginx:alpine → serve static + proxy /api to backend.
**docker-compose.yml:** per Section 9. Mount `./data:/data` for SQLite + sandbox.

**Verification:** `docker-compose up --build` → backend on :8000, frontend on :3000. Health check passes.

---

#### Task 24: E2E Integration Test

**Test scenario:**
1. Create provider (mock LLM endpoint or real DeepSeek/Ollama)
2. Create agent profile (conversation node, provider ref, tools=[web_search])
3. Create flow with 2 nodes: conversation → processor
4. Connect with unconditional edge
5. Execute flow with input "Hello"
6. Verify: execution status=completed, 2 node_results saved, logs broadcast via WS
7. Verify: execution history shows the run

**Test:** `tests/test_e2e.py` — full flow with mocked provider.

---

#### Task 25: README + Docs

**Files:**
- Create: `forkflow/README.md`

Contents:
- What is Forkflow
- Quick start (Docker Compose)
- Configuration (env vars)
- Creating providers and agents
- Building flows
- Running executions
- API reference summary

---
