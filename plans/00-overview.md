# Forkflow — Architecture & Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement Phase 1 tasks. Each task is bite-sized, TDD, commit after each.

**Goal:** Self-hosted AI orchestration platform with visual node-based flow editor, per-agent provider config, and pluggable tool system.

**Architecture:** FastAPI backend (SQLAlchemy + SQLite) serving REST + WebSocket. React + React Flow frontend. Flow executor traverses node graph sequentially with conditional routing. Provider adapter abstracts LLM API calls. Tools are whitelisted per agent profile.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, SQLite, httpx (async HTTP), cryptography (Fernet), Pydantic v2, pytest, React 18, React Flow, Zustand, Vite, TypeScript, Docker Compose

---
