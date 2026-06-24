## 8. Project Structure

```
forkflow/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── crypto.py              # Fernet encrypt/decrypt
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── provider.py
│   │   │   ├── agent.py
│   │   │   ├── flow.py
│   │   │   └── execution.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── provider.py
│   │   │   ├── agent.py
│   │   │   ├── flow.py
│   │   │   └── execution.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── providers.py
│   │   │   ├── agents.py
│   │   │   ├── flows.py
│   │   │   └── executions.py
│   │   ├── engine/
│   │   │   ├── __init__.py
│   │   │   ├── executor.py
│   │   │   ├── node_runner.py
│   │   │   ├── router.py
│   │   │   ├── memory.py
│   │   │   └── ws_manager.py
│   │   ├── providers/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── openai_compat.py
│   │   │   └── anthropic.py
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── registry.py
│   │   │   ├── file_ops.py
│   │   │   ├── web.py
│   │   │   ├── code.py
│   │   │   └── flow_control.py
│   │   └── auth/
│   │       ├── __init__.py
│   │       └── basic_auth.py
│   └── tests/
│       ├── conftest.py
│       ├── test_providers.py
│       ├── test_agents.py
│       ├── test_flows.py
│       ├── test_executor.py
│       ├── test_router.py
│       ├── test_tools.py
│       └── test_crypto.py
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── NodeEditor/
│   │   │   │   ├── FlowCanvas.tsx
│   │   │   │   ├── NodePalette.tsx
│   │   │   │   ├── PropertiesPanel.tsx
│   │   │   │   └── nodes/
│   │   │   │       ├── ConversationNode.tsx
│   │   │   │       └── ProcessorNode.tsx
│   │   │   ├── AgentManager/
│   │   │   │   ├── AgentList.tsx
│   │   │   │   ├── AgentForm.tsx
│   │   │   │   └── AgentTestDialog.tsx
│   │   │   ├── ProviderManager/
│   │   │   │   ├── ProviderList.tsx
│   │   │   │   └── ProviderForm.tsx
│   │   │   ├── ExecutionPanel/
│   │   │   │   ├── ExecutionHistory.tsx
│   │   │   │   ├── ExecutionDetail.tsx
│   │   │   │   └── LiveLogs.tsx
│   │   │   └── Auth/
│   │   │       └── LoginPage.tsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── store/
│   │   │   └── flowStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── pages/
│   │       ├── FlowEditorPage.tsx
│   │       ├── AgentsPage.tsx
│   │       ├── ProvidersPage.tsx
│   │       └── ExecutionsPage.tsx
│   └── ...
└── sandbox/                       # Tool sandbox dir (mounted volume)
```

---
