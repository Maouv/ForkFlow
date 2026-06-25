# Plan — Fix 3 Issue: Drag Handle, Zoom Mobile, Test Tab

## Issue 1: Hapus Drag Handle (NodeModal)
**Problem:** Drag handle bar abu-abu di atas mobile → user pikir bisa resize, tapi ga berfungsi.
**Fix:** Hapus 3 lines drag handle div di `NodeModal.tsx`.
**File:** `frontend/src/components/NodeEditor/NodeModal.tsx`
**Diff:** -4 lines

## Issue 2: Zoom Mobile Bug (Controls terpotong)
**Problem:** ReactFlow `<Controls>` default `position="bottom-left"`. Mobile viewport kecil + PropertiesPanel bottom sheet (z-30, max-h-60vh) → Controls kepotong viewport, cuma tombol `+` keliatan. `-` dan `[]` kepotong.
**Root cause:** Controls di bottom area, ketabrak bottom sheet overlay.
**Fix:** Set `position="top-right"` → Controls pindah pojok kanan atas, ga konflik dgn bottom sheet/panel.
**File:** `frontend/src/components/NodeEditor/FlowCanvas.tsx`
**Diff:** +1 prop (`position="top-right"`)
**Check:** top-right ga konflik dgn apa-apa (NodeQuickAdd handle di kanan node, empty state di tengah, FAB properties di bottom-right).

## Issue 3: Test Tab Backend Endpoint
**Problem:** Test tab di node modal = placeholder. Butuh backend endpoint untuk run 1 node in isolation.
**Fix:** New endpoint `POST /api/flows/{flow_id}/nodes/{node_id}/test` + response schema.

### 3a. Backend: Schema
**File:** `backend/app/schemas/flow.py`
```python
class NodeTestRequest(BaseModel):
    input: str

class NodeTestResponse(BaseModel):
    output: str
    duration_ms: int
    token_count: int | None = None
```

### 3b. Backend: Router endpoint
**File:** `backend/app/routers/flows.py`
- `POST /api/flows/{flow_id}/nodes/{node_id}/test`
- Load node from DB, check node.flow_id == flow_id
- Reuse `NodeRunner.run()` with empty context (no upstream)
- Time it, return output + duration_ms
- token_count: parse dari adapter response kalau available, else null
- Handle: no agent → passthrough input, error → 400

### 3c. Backend: NodeRunner token count
**File:** `backend/app/engine/node_runner.py`
- `run()` return `(output, token_count)` tuple instead of just `str`
- Adapter sudah return usage? Cek adapter — kalau ga, null for now
- Update executor.py caller to unpack tuple

### 3d. Frontend: Wire test tab
**File:** `frontend/src/components/NodeEditor/tabs/NodeModalTest.tsx`
- Replace placeholder dgn: input textarea + Run button + output display
- `POST /api/flows/{flow_id}/nodes/{node_id}/test` via client
- Show output + duration_ms + token_count
- Need flow_id + node_id from store
- node_id = editingNodeId (string), but backend needs int → parse

**Problem:** Frontend node IDs are string (ReactFlow), backend IDs are int. Editing modal knows `editingNodeId` (string). But saveGraph maps string→int via DB. For test, need real DB node ID.
**Solution:** FlowStore `nodes` punya `id` as string. Tapi setelah `selectFlow`, IDs come from backend as int→string. So `parseInt(editingNodeId)` works IF node was loaded from DB. New nodes (not saved yet) = temp string IDs → test endpoint will 404. Acceptable: user must save before testing.

## Execution Order
1. Issue 1 (hapus drag handle) — 1 line, instant
2. Issue 2 (zoom Controls position) — 1 prop, instant
3. Issue 3 (test tab) — backend + frontend, multi-file

## Files Touched
| Issue | File | Change |
|-------|------|--------|
| 1 | `NodeModal.tsx` | -4 lines |
| 2 | `FlowCanvas.tsx` | +1 prop |
| 3a | `schemas/flow.py` | +2 schema |
| 3b | `routers/flows.py` | +1 endpoint |
| 3c | `engine/node_runner.py` | refactor return tuple |
| 3c | `engine/executor.py` | update caller |
| 3d | `tabs/NodeModalTest.tsx` | rewrite placeholder |

## Risks
- Issue 3c: refactor `NodeRunner.run()` return type → executor.py caller must update. Blast radius = 1 caller. Safe.
- Issue 3d: node ID string→int. New unsaved nodes can't test. User must save first. UX: show hint if node not saved.
