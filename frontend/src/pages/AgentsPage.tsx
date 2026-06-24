import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import type { AgentProfile } from "../types";
import AgentList from "../components/AgentManager/AgentList";
import AgentForm from "../components/AgentManager/AgentForm";
import AgentTestDialog from "../components/AgentManager/AgentTestDialog";

type View = "list" | "form";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<AgentProfile | null>(null);
  const [testing, setTesting] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get<AgentProfile[]>("/agents");
      setAgents(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (id: number) => {
    await client.post(`/agents/${id}/toggle`);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this agent?")) return;
    await client.delete(`/agents/${id}`);
    load();
  };

  const handleNew = () => {
    setEditing(null);
    setView("form");
  };

  const handleEdit = (agent: AgentProfile) => {
    setEditing(agent);
    setView("form");
  };

  const handleSaved = () => {
    setView("list");
    setEditing(null);
    load();
  };

  if (view === "form") {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => { setView("list"); setEditing(null); }}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-ink"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-ink">
            {editing ? "Edit Agent" : "New Agent"}
          </h1>
        </div>
        <AgentForm agent={editing} onSaved={handleSaved} onCancel={() => { setView("list"); setEditing(null); }} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
        <h1 className="text-base font-semibold text-ink">Agents</h1>
        <button
          onClick={handleNew}
          className="flex min-h-[36px] items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-semibold text-base transition-colors hover:bg-accent-hover"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New Agent
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-dim">Loading…</p>
          </div>
        ) : (
          <AgentList
            agents={agents}
            onEdit={handleEdit}
            onTest={setTesting}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Test dialog */}
      {testing && (
        <AgentTestDialog agent={testing} onClose={() => setTesting(null)} />
      )}
    </div>
  );
}
