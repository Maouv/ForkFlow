## 14. Open Questions

1. **Web search backend:** DuckDuckGo HTML scrape (free, no key) vs Brave Search API (better results, needs key)? Recommend: DuckDuckGo for Phase 1, Brave optional in config.
2. **Frontend styling:** MUI (component-heavy, fast dev) vs Tailwind (lighter, more custom)? Recommend: Tailwind — lighter bundle, more flexible for node editor styling.
3. **Alembic vs auto-create:** Use Alembic from start or `Base.metadata.create_all()`? Recommend: Alembic from Task 4 — schema evolves, need migrations.
4. **`call_agent` tool synchronous or async?** If agent calls another agent that's slow, it blocks the node. Recommend: synchronous with same timeout as node. Phase 2: async with separate timeout.

---

## Summary

| Phase | Duration | Scope |
|---|---|---|
| **Phase 1** | 4-6 weeks | Trimmed MVP: 2 node types, sequential flow, 3 conditions, 5 tools, session memory, live logs, Docker deploy |
| **Phase 2** | 4-6 weeks | hybrid/formatter, parallel, regex, custom_http, retry, persistent memory, streaming, webhook/schedule, cost tracking |
| **Phase 3** | TBD | Loop/subflow, multi-user, templates, replay, metrics dashboard |

**Phase 1 = 25 tasks across 4 sprints.** Each task is bite-sized (2-5 min implementation), TDD, commit after each.

Total Phase 1 deliverable: working self-hosted Forkflow with visual flow editor, sequential agent orchestration, conditional routing, tools, and live execution logs.
