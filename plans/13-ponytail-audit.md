# ForkFlow — Ponytail Audit & Pattern Consistency Fixes

Status: **Draft** — hasil ponytail-audit scan seluruh codebase. Dikerjakan setelah approval.

---

## Temuan Audit (ranked: biggest impact first)

### A. Correctness — Schema Mismatch (BLOCKER)

Frontend allow values yang backend reject → 500/error saat user pilih.

| # | File | Masalah | Fix |
|---|------|---------|-----|
| A1 | `backend/app/schemas/agent.py` | `MemoryType` enum cuma 1 value (`session`). Frontend `AgentForm.tsx` kirim 3 (`session`, `persistent`, `hybrid`) → backend reject `persistent`/`hybrid` | Tambah `persistent`, `hybrid` ke enum ATAU hapus 2 option di frontend. Backend DB model `String(20)` udah support — tinggal enum |
| A2 | `backend/app/schemas/flow.py` | `NodeType` enum cuma 2 (`conversation`, `processor`). Frontend `types/index.ts` + `flowStore.ts:nodeColors` punya 4 (`hybrid`, `formatter` juga) → backend reject | Sinkronkan: 2 atau 4. `NodePalette` cuma render 2 tombol → paling ponytail: hapus `hybrid`/`formatter` dari frontend types + nodeColors |
| A3 | `backend/app/schemas/provider.py` | `ProviderType` enum cuma 2 (`openai_compatible`, `anthropic`). Frontend `ProviderForm.tsx` + `ProviderList.tsx:typeColors` punya 3 (`custom_http`) → backend reject | Hapus `custom_http` dari frontend (ga ada adapter) ATAU tambah `custom_http` + adapter. Ponytail: hapus dari frontend — speculative type |

### B. Pattern Inconsistency — Visual (HIGH)

UI components pakai pattern berbeda untuk hal sama → tidak seirama.

| # | File | Masalah | Fix |
|---|------|---------|-----|
| B1 | `FlowEditorPage.tsx:95,133,165` | Save/Run/Create button pakai `bg-ink text-base` (dark). AgentForm/ProviderForm/LoginPage pakai `bg-accent text-base` (light) | Samakan ke 1 pattern. Primary action = `bg-accent`. Update FlowEditor 3 tombol |
| B2 | `FlowEditorPage.tsx:106,144` | Overlay `bg-black/50`. `ChangePasswordModal:47` & `AgentTestDialog:34` pakai `bg-black/40` | Samakan ke `bg-black/50` (lebih dark, lebih jelas fokus) |
| B3 | `FlowEditorPage.tsx:95,133,165` | Focus: `focus-visible:ring-2 ring-ink ring-offset-2`. Tempat lain: `focus-visible:bg-elevated focus-visible:text-ink` | Samakan ke pattern global: `focus-visible:bg-elevated focus-visible:text-ink` |
| B4 | `ProviderList.tsx:3-7` & `flowStore.ts:38-43` | Hardcoded hex colors (`#6b9fd4`, `#d4a44d`) di 2 tempat. Design system monokrom (chroma=0) tapi type colors chroma ≠ 0 | Hapus typeColors (node differentiation udah via icon, bukan color — lihat NodePalette/ConversationNode). Ponytail: deletion over chroma noise |

### C. YAGNI / Dead Code (MEDIUM)

| # | File | Masalah | Fix |
|---|------|---------|-----|
| C1 | `schemas/agent.py:ALLOWED_TOOLS` | `call_agent` di allowed set tapi `ToolRegistry` ga register. Comment bilang "handled by NodeRunner directly" — tapi NodeRunner ga handle call_agent | Hapus `call_agent` dari ALLOWED_TOOLS + frontend `AgentForm.tsx:tools` array |
| C2 | `engine/router.py:EdgeForEval` dataclass | 1 caller only (`executor.py:93-101`). Abstraction 1-caller | Inline sebagai tuple/dict di executor. -7 lines |
| C3 | `engine/node_runner.py:TOOL_PROMPT` | Manual ReAct protocol `[TOOL_CALL]...[/TOOL_CALL]`. `providers/base.py` punya `tools` param tapi always None → native tool calling unused | Borderline — cross-provider manual protocol valid. Keep tapi dokumentasikan: `# ponytail: manual ReAct, native tool calling if single-provider lock-in OK` |

### D. CSS Conflict (MEDIUM)

| # | File | Masalah | Fix |
|---|------|---------|-----|
| D1 | `index.css:46` | `border-radius: 0 !important` global. Tapi frontend pakai `rounded-md`, `rounded-lg`, `rounded-full` (50+ tempat). Global override → semua rounded-* jadi no-op. Dead CSS classes | Opsi 1: hapus semua `rounded-*` dari frontend (tedious). Opsi 2: hapus global override, biarkan Tailwind handle (design system bilang "sharp corners" → tetep sharp via `--radius-*: 0` di theme, bukan `!important`). **Ponytail: opsi 2** — remove `!important`, `--radius-*: 0` di @theme udah cukup |
| D2 | `index.css:46` + `rounded-full` dots | Status dots (`bg-success rounded-full`), toggle dots, handle dots → jadi square karena global override. **BUG visual** | Fix D1 otomatis fix D2 |

### E. DRY (LOW)

| # | File | Masalah | Fix |
|---|------|---------|-----|
| E1 | `schemas/flow.py:_validate_json_path` & `engine/router.py:_eval_json_path` | Duplikasi operator list `_OPERATORS`. Validator cek exists, router parse ulang | Share `_OPERATORS` dari `router.py`, import di `schemas/flow.py` |

---

## Urutan Eksekusi

### Phase 1 — Correctness (A1-A3)
Fix schema mismatch dulu → app ga crash saat user pilih "invalid" option.

### Phase 2 — Visual Pattern (B1-B4)
Samakan button/overlay/focus pattern + hapus chroma noise.

### Phase 3 — Ponytail Purge (C1-C2)
Hapus dead code, inline 1-caller abstraction.

### Phase 4 — CSS Fix (D1-D2)
Remove `border-radius: 0 !important`, rely on `--radius-*: 0` theme tokens.

### Phase 5 — DRY (E1)
Share operator list.

---

## Verification

Setelah semua fix:
1. Build frontend (`npm run build`) — no TS error
2. Test manual: create agent dgn memory_type=persistent → ga 500
3. Test manual: create flow dgn 2 node type → ga 500
4. Visual check: status dots = circle, buttons seirama, overlay konsisten
5. Run existing tests: `cd backend && python -m pytest` (if exists)

---

## Catatan Ponytail Compliance

- A1-A3: bug fix = root cause (enum sync), bukan patch per-endpoint
- B1-B4: deletion over addition (hapus chroma, samakan ke 1 pattern)
- C1-C2: YAGNI purge, inline 1-caller
- D1-D2: native platform feature (Tailwind theme tokens) over `!important` hack
- E1: stdlib reuse (share list, bukan reimplement)

Net estimasi: **-30~50 lines, -3 dead classes/values, +correctness fixes**
