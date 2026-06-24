import { useState } from "react";
import client from "../../api/client";
import type { AgentProfile } from "../../types";

export default function AgentTestDialog({
  agent,
  onClose,
}: {
  agent: AgentProfile;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const test = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const { data } = await client.post(`/agents/${agent.id}/test`, { input });
      setResponse(data.response ?? data.output ?? JSON.stringify(data));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-lg border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Test Agent</p>
            <p className="text-[12px] text-dim">{agent.name}</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-dim hover:bg-elevated hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              className="min-h-[44px] flex-1 rounded-md border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && test()}
              autoFocus
            />
            <button
              onClick={test}
              disabled={loading || !input.trim()}
              className="min-h-[44px] rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-base transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "…" : "Send"}
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5">
              <p className="text-[13px] text-danger">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 px-1 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="text-[13px] text-dim">Waiting for response…</span>
            </div>
          )}

          {response && (
            <div className="rounded-md border border-line bg-base px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-dim mb-1">Response</p>
              <p className="whitespace-pre-wrap text-[13px] text-ink">{response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
