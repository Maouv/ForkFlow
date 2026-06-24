## 6. Gap Fixes (Integrated into Phase 1)

These are the gaps I flagged in the assessment, now addressed in the architecture:

| Gap | Fix | Phase |
|---|---|---|
| **Node timeout** | Each node has `timeout_seconds` in config (default 60). `asyncio.wait_for` enforcement. Exceed → node fails, flow stops. | Phase 1 |
| **Error handling** | Node fail → save error in `node_result.error_message`, flow status = `failed`. No silent failures. | Phase 1 |
| **Flow persistence** | Flows saved as JSON (nodes + edges). Full graph saved in single PUT request, single DB transaction. | Phase 1 |
| **Schema validation** | Pydantic v2 schemas for all inputs. Invalid node config / edge condition → 422 rejection at API layer. | Phase 1 |
| **API key encryption** | Fernet encryption at rest. Master key from `FORKFLOW_ENCRYPTION_KEY` env var. Decrypt only at call time. | Phase 1 |
| **Context overflow** | `full_history` scope → truncate context if > 8000 chars (configurable per agent). Keep most recent. | Phase 1 |
| **Rate limit** | Per-provider rate limit: max N concurrent calls (default 5). Simple semaphore. | Phase 1 |
| **Streaming** | Defer. Phase 1 = non-streaming. Log "calling provider..." → "response received". | Phase 2 |
| **Cost tracking** | Defer. Phase 2. | Phase 2 |
| **Loop/subflow** | Defer. Phase 3. | Phase 3 |
| **Webhook/schedule** | Defer. Phase 2. | Phase 2 |
| **Flow versioning** | Defer. Phase 2 (copy-on-edit: editing a flow creates a draft, published version immutable while running). | Phase 2 |

---
