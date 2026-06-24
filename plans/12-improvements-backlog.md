# ForkFlow — Issues & Improvements Backlog

Status: **Recorded** — belum dikerjakan, untuk didiskusikan & dikerjakan di Phase 2.

---

## 1. Setup & Runtime — Kurang Seamless

**Masalah:** setup.sh + start.sh masih ribet. User mau yang lebih seamless.

**Target:**
- Bisa install via `npm` (atau package manager)
- Runtime khusus ForkFlow — 1 command jalanin, port dari `.env`
- Idealnya: `npx forkflow` atau `forkflow start` → langsung jalan
- Ga perlu manual venv, ga perlu manual npm install, ga perlu cd ke backend

**Ide:**
- CLI wrapper (Node) yang handle: check deps → venv → pip install → npm build → start uvicorn
- Atau binary tunggal (pkg/bun compile) yang bundle everything
- Atau pake PM2-style process manager yang auto-restart

---

## 2. Web UX — Banyak Masalah

### 2a. Flow Editor — Canvas Kosong di Awal

**Masalah:** User buka Flow Editor → langsung disuguhin canvas kosong. Bingung mau ngapain.

**Target:**
- First-time user → liat onboarding/tutorial/empty state yang jelas
- Atau auto-create 1 starter flow dengan template (lihat issue #2e)
- Empty state: ilustrasi + "Click here to add your first node" atau template picker

### 2b. Penambahan Agent — Harus Ganti Page

**Masalah:** Mau tambah agent → harus pindah ke halaman Agents → bikin → balik ke Flow Editor.

**Target:**
- Tambah agent bisa dari Flow Editor langsung (modal/drawer/sheet)
- Klik node → properties panel → "Create new agent" button → form muncul di panel/modal
- Ga perlu leave Flow Editor page

### 2c. Provider → Model Mismatch

**Masalah:** User masukin `default_model` di provider (misal: `deepseek-chat`). Tapi pas bikin agent, model field kosong/ga auto-fill dari provider. User bingung — "udah kasih model di provider, kok di agent ga ada?"

**Target:**
- Bikin agent → pilih provider → model field **auto-fill** dengan `default_model` dari provider
- Atau: model jadi dropdown yang populate dari provider config
- Atau: provider bisa simpan **list of models** (bukan cuma 1 default), agent pilih dari list itu

### 2d. Model Selection — Ambil Konsep dari OpenRouter

**Masalah:** Model selection terlalu manual dan barebones.

**Target (konsep OpenRouter):**
- Provider punya list model yang available (bukan cuma 1 `default_model`)
- Bisa auto-fetch model list dari provider API (misal: `GET /v1/models` untuk OpenAI-compatible)
- Model picker: search + filter + metadata (context length, price, capabilities)
- Tampilkan model name yang human-readable (bukan raw ID)
- Recent/favorite models di atas

### 2e. UI/UX Overall — Masih Jelek

**Masalah:** UI functional tapi ga enak dilihat, ga enang dipakai.

**Target:**
- Layout yang lebih clear — hierarchy, spacing, alignment
- Better empty states (bukan cuma canvas kosong / list kosong)
- Visual feedback: loading states, success/error toast, hover states
- Onboarding flow untuk first-time user
- Konsistensi: button styles, spacing, typography
- Mobile UX khususnya — pastikan ga ada horizontal scroll, tap target cukup, layout ga cramped

---

## 3. Prioritas

Kalau dikerjakan, urutkan:
1. **2c + 2d** — Provider/Model mismatch + model selection (paling confusing, blocking user dari bikin agent yang functional)
2. **2a** — Empty state / onboarding flow editor (first impression)
3. **2b** — Add agent from flow editor (reduce context switching)
4. **2e** — UI polish overall
5. **1** — Seamless runtime (nice to have, Docker/script sudah work)
