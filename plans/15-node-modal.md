# Plan — Node Modal (4 Tab) + Mini Create Agent

## Goal
Double-tap node → modal buka dgn 4 tab. Live sync ke canvas. No save button — auto-save via store. Mini create agent inline.

## Bug fix pre-requisite
`flowStore.ts:98` masih kirim `conversation_scope: "full_history"` di `addNode` padahal field udah dihapus dari `NodeData`. Fix bareng.

---

## Section 1 — Store: `flowStore.ts`

### 1a. Fix bug addNode
Hapus `conversation_scope` dari addNode data init.

### 1b. Add `editingNodeId` state
```ts
editingNodeId: string | null;
openNodeEditor: (id: string) => void;
closeNodeEditor: () => void;
```
- `openNodeEditor` = set editingNodeId + selectNode
- `closeNodeEditor` = set editingNodeId null
- Single click → `selectNode` saja (modal ga buka)
- Double-click / edit button → `openNodeEditor`

### 1c. `updateNodeConfig(id, key, value)`
Helper buat update nested `config` object tanpa spread manual di tiap tab:
```ts
updateNodeConfig: (id, key, value) => {
  set({
    nodes: get().nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, config: { ...(n.data as any).config, [key]: value } } } : n,
    ),
  });
},
```

---

## Section 2 — Node Component: edit button

### 2a. `ConversationNode.tsx` + `ProcessorNode.tsx`
Tambah edit button (SVG slider icon) di samping [+] handle:
- Visible saat `selected` (sama dgn [+] handle)
- Klik → `openNodeEditor(id)`
- Position: absolute, left of [+] atau top-right corner node
- `onDoubleClick` di node div → `openNodeEditor(id)` (desktop fallback)

Icon: SVG sliders horizontal (3 lines dgn dots), bukan emoji.

---

## Section 3 — `NodeModal.tsx` (NEW, main component)

Shell modal dgn tab system. ~80 lines.

```
src/components/NodeEditor/NodeModal.tsx
```

### Structure
```
overlay (bg-black/50, click outside → close)
  modal container (max-w-2xl, max-h-[85vh])
    header: node icon + editable label input + [x] close
    tab bar: Parameters | Settings | Test | Notes
    tab content (scrollable)
```

### Behavior
- Read `editingNodeId` from store → find node
- `activeTab` state: `"parameters"` default, reset on open
- Click outside / ESC / [x] → `closeNodeEditor()`
- Label input = direct `updateNodeData(id, { label })` → live sync canvas
- Tab content = render sub-component per tab
- Ga ada save button — semua onChange → store update

### Mobile
- Full-screen modal (w-full h-full, no max-w)
- Tab bar = scrollable horizontal kalau overflow
- Bottom padding buat safe area

---

## Section 4 — Tab: Parameters (`NodeModalParameters.tsx`)

```
src/components/NodeEditor/tabs/NodeModalParameters.tsx
```

### Fields
| Field | Source | Behavior |
|-------|--------|----------|
| Agent | `node.data.agent_profile_id` | Dropdown dari `/agents` + "+ Create new agent" button |
| Model | `node.config.model_override` | Text input, placeholder = agent's model. Empty = use agent default |
| System Prompt | `node.config.system_prompt_override` | Radio: "Use agent default" / "Override" + textarea (show saat override) |
| Input dari | `node.config.input_source` | Dropdown: upstream node labels (auto-detect dari edges) |

### "Create new agent" mini dialog
- Button di bawah dropdown → overlay kecil muncul di atas modal
- 4 field: name, system_prompt, provider (dropdown), model (auto-fill dari provider.default_model)
- Submit → `POST /api/agents` → re-fetch `/agents` → auto-select new agent di dropdown
- Cancel → close overlay, back to Parameters tab
- Ga leave modal, ga page switch

### Upstream node detection
Baca `edges` dari store → filter `target === current node id` → map `source` ke node labels.

---

## Section 5 — Tab: Settings (`NodeModalSettings.tsx`)

```
src/components/NodeEditor/tabs/NodeModalSettings.tsx
```

### Fields (all → `node.config`)
| Field | Key | Type | Default |
|-------|-----|------|---------|
| Memory | `memory_type` | select: session/persistent/hybrid | session |
| Conv Scope | `conversation_scope` | select: full_history/previous_only | full_history |
| Output fmt | `output_format` | select: raw_text/json/markdown | raw_text |
| Temperature | `temperature` | number input (0-2, step 0.1) | 0.7 |
| Max tokens | `max_tokens` | number input | 1024 |
| On fail | `on_fail` | select: stop/retry/skip | stop |
| Max retry | `max_retry` | number input (0-10) | 3 |

Semua onChange → `updateNodeConfig(id, key, value)`. Live sync, no save button.

---

## Section 6 — Tab: Test (`NodeModalTest.tsx`)

```
src/components/NodeEditor/tabs/NodeModalTest.tsx
```

### Fields
- Input textarea (sample input)
- "Run Node" button
- Output area (hasil)
- Metrics: duration_ms + token count

### Implementation
Backend belum punya single-node test endpoint. 2 opsi:

**Opsi A (skip sekarang):** Tab Test render placeholder: "Coming soon — need backend single-node test endpoint." + catat di `plans/12-improvements-backlog.md`.

**Opsi B (hack):** Run entire flow via `POST /api/flows/{id}/execute`, filter result untuk node ini. Hacky, jalanin seluruh flow buat test 1 node.

**Rekomendasi:** Opsi A. Test tab = placeholder. Backend endpoint = backlog item.

---

## Section 7 — Tab: Notes (`NodeModalNotes.tsx`)

```
src/components/NodeEditor/tabs/NodeModalNotes.tsx
```

### Fields
- Free text textarea → `node.config.notes`
- Hint text: "Appears as tooltip on canvas when notes has content"

### Canvas tooltip
Di `ConversationNode` / `ProcessorNode`: kalau `config.notes` non-empty, render `<title>` element (native browser tooltip) di node div. Ponytail: native `<title>` over custom tooltip component.

---

## Section 8 — FlowEditorPage integration

### 8a. Render NodeModal
Di `FlowEditorPage.tsx`, render `<NodeModal />` setelah FlowCanvas:
```tsx
<NodeModal />  // reads editingNodeId from store, self-gates
```
NodeModal self-gate: if `!editingNodeId` return null.

### 8b. PropertiesPanel — keep or repurpose?
PropertiesPanel masih render di sidebar kanan (desktop) + bottom sheet (mobile). 2 opsi:

**Keep:** PropertiesPanel = quick edit (label, agent, edge condition). NodeModal = full edit (4 tab). Both work on same node. Ga conflict — PropertiesPanel edits subset, modal edits superset.

**Remove:** Hapus PropertiesPanel, semua edit via modal. Tapi edge condition edit ilang — perlu masuk ke modal juga atau panel edge-only.

**Rekomendasi:** Keep PropertiesPanel buat edge condition + quick label edit. NodeModal = deep edit. User pilih: quick edit = panel, deep edit = double-tap/edit button.

---

## Section 9 — Backlog update

Add to `plans/12-improvements-backlog.md`:
```
## 2f. Node Test Tab — Backend Single-Node Execution
**Masalah:** Test tab di node modal butuh endpoint POST /api/nodes/{id}/test
**Target:** Backend endpoint untuk run single node dgn sample input, return output + metrics
```

---

## File manifest

| File | Action | Est. lines |
|------|--------|------------|
| `flowStore.ts` | M | +15 (editingNodeId, openNodeEditor, closeNodeEditor, updateNodeConfig, fix bug) |
| `ConversationNode.tsx` | M | +10 (edit button + double-click + notes tooltip) |
| `ProcessorNode.tsx` | M | +10 (same) |
| `NodeModal.tsx` | A | ~80 (shell + tab system) |
| `tabs/NodeModalParameters.tsx` | A | ~90 (agent dropdown + create mini + model + prompt + input) |
| `tabs/NodeModalSettings.tsx` | A | ~60 (7 config fields) |
| `tabs/NodeModalTest.tsx` | A | ~30 (placeholder) |
| `tabs/NodeModalNotes.tsx` | A | ~25 (textarea + hint) |
| `FlowEditorPage.tsx` | M | +2 (render NodeModal) |
| `plans/12-improvements-backlog.md` | M | +5 (test tab backlog) |

**Net:** +7 files, ~330 lines. 0 backend changes (all config via existing `config: dict`).

---

## Execution order

1. **Section 1** — Store (fix bug + new state + updateNodeConfig)
2. **Section 2** — Node edit button + double-click
3. **Section 3** — NodeModal shell
4. **Section 4** — Parameters tab + create agent mini
5. **Section 5** — Settings tab
6. **Section 6** — Test tab (placeholder)
7. **Section 7** — Notes tab + canvas tooltip
8. **Section 8** — FlowEditorPage render
9. **Section 9** — Backlog update

Incremental — verify build setiap section selesai.

---

## Ponytail compliance

- **YAGNI:** Test tab = placeholder, ga hack full-flow run
- **DRY:** 1 updateNodeConfig helper, 1 modal shell, tab = thin components
- **Native:** `<title>` tooltip, CSS group-hover, HTML `<select>`
- **No emoji:** semua icon = SVG inline
- **Deletion:** fix bug = hapus conversation_scope dari addNode
- **No backend work:** config JSON catch-all, ga perlu schema/DB migration
- **Shortest path:** PropertiesPanel keep (ga rewrite edge editing), modal = additive

---

## Open questions for user

1. **PropertiesPanel:** keep (quick edit + edge) atau remove (all via modal)?
2. **Test tab:** Opsi A (placeholder) confirm?
3. **Create agent mini:** 4 field cukup (name, prompt, provider, model)? Atau perlu tools/memory/scope juga?
