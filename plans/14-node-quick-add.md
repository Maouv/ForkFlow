# Plan — Node [+] Quick-Add Pattern

## Goal
Replace NodePalette dengan edge-first [+] quick-add pattern. User bangun flow kiri→kanan secara natural.

## Changes

### 1. Git pull
Sync repo sebelum implementasi.

### 2. Hapus NodePalette.tsx
File redundant. Dihapus total.

### 3. flowStore.ts — extend `addNode`
```ts
addNode(type, position, sourceNodeId?) → juga create edge + selectNode jika sourceNodeId ada
```
- Tanpa sourceNodeId (empty state): add node + select
- Dengan sourceNodeId (dari [+] handle): add node + create edge(condition=none) + select

### 4. NEW: NodeQuickAdd.tsx
Shared component — [+] button + popup picker.
- Props: `sourceNodeId?: string` (optional, untuk node handle vs empty state)
- [+] visible: hover/selected (node mode), always (empty state mode)
- Popup: 2 tombol (Conversation, Processor) → call `addNode(type, position, sourceNodeId)`
- Position: absolute, right of handle / centered untuk empty state
- Close on: select, click outside, Escape

### 5. ConversationNode.tsx + ProcessorNode.tsx
Tambah `<NodeQuickAdd sourceNodeId={node.id} />` di handle kanan.
Visible saat `selected` prop true (React Flow hover → pakai CSS `group-hover`).

### 6. FlowCanvas.tsx — empty state overlay
```tsx
{nodes.length === 0 && (
  <div className="overlay">
    <NodeQuickAdd />  // centered "Add first node"
  </div>
)}
```
ReactFlow tetap mounted (background grid), overlay di atas.

### 7. FlowEditorPage.tsx — cleanup
Hapus:
- NodePalette import + render (sidebar kiri `w-48`)
- FAB button kiri-bawah (mobile palette trigger)
- Panel state `"palette"` + bottom sheet palette section
- `NodePalette` dari mobile bottom sheet

Keep: FAB kanan-bawah (properties) + bottom sheet properties.

## Ponytail compliance
- **YAGNI:** hapus NodePalette (redundant), ga bikin node type baru
- **DRY:** 1 NodeQuickAdd component untuk 3 caller (2 node + empty state)
- **Native:** CSS `group-hover` untuk show/hide [+] (bukan JS state)
- **Deletion:** -1 file, -~40 lines FlowEditorPage (sidebar+FAB+sheet)
- **Shortest diff:** extend `addNode` dgn optional param, bukan function baru
- **Bug fix root cause:** pattern change = fix UX root cause (edge-first vs palette-first)

## Verification
1. `npm run build` — no TS error
2. Empty state → [+] visible → klik → picker → pilih → node muncul + selected
3. Node selected → [+] visible di kanan → klik → picker → pilih → node baru X+250 + edge auto-connect + selected
4. Chain: node baru juga punya [+] → chain terus
5. Mobile: tap node → selected → [+] muncul → same flow
