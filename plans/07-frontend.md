## 7. Frontend Architecture

### State Management (Zustand)

```typescript
// store/flowStore.ts
interface FlowStore {
  // Flow editor state
  nodes: Node[]
  edges: Edge[]
  selectedFlowId: number | null
  
  // Agent/Provider state
  agents: AgentProfile[]
  providers: Provider[]
  
  // Execution state
  currentExecutionId: number | null
  logs: LogEntry[]
  
  // Actions
  loadFlow: (id: number) => Promise<void>
  saveFlow: () => Promise<void>
  addNode: (type: NodeType, position: XYPosition) => void
  connectNodes: (source: string, target: string, condition?: EdgeCondition) => void
  executeFlow: (input: string) => Promise<void>
}
```

### React Flow Integration

- Custom node types: `conversationNode`, `processorNode`
- Each node renders: label, agent profile badge, node type icon
- Edge labels show condition type + value
- Sidebar: drag-to-add node palette
- Properties panel: select node → edit config (agent, prompt template, timeout)

### WebSocket Hook

```typescript
// hooks/useWebSocket.ts
function useExecutionLogs(executionId: number | null) {
  // Connect to /ws/logs/{executionId}
  // Append messages to logs array
  // Auto-reconnect on disconnect
  // Cleanup on unmount
}
```

### Pages

| Page | Components |
|---|---|
| Login | Simple form, basic auth |
| Flow Editor | React Flow canvas + sidebar + properties panel |
| Agents | CRUD table, test dialog per agent |
| Providers | CRUD form cards |
| Executions | History table + detail view (per-node timeline + logs) |

---
