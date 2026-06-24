import type { AgentProfile } from "../../types";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-base shadow-sm transition-transform ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function AgentList({
  agents,
  onEdit,
  onTest,
  onToggle,
  onDelete,
}: {
  agents: AgentProfile[];
  onEdit: (agent: AgentProfile) => void;
  onTest: (agent: AgentProfile) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-dim">No agents yet</p>
        <p className="mt-1 text-[13px] text-dim">Click "New Agent" to create one</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="flex items-center gap-3 border-b border-line px-4 py-3.5 transition-colors hover:bg-elevated/50"
        >
          {/* Status dot */}
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              agent.active ? "bg-success" : "bg-dim"
            }`}
          />

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{agent.name}</p>
            <p className="truncate text-[12px] text-dim">
              {agent.model} · {agent.tools.length} tools
            </p>
          </div>

          {/* Toggle */}
          <Toggle checked={agent.active} onChange={() => onToggle(agent.id)} />

          {/* Actions */}
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onTest(agent)}
              disabled={!agent.active}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink disabled:opacity-30"
              aria-label="Test"
              title="Test"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(agent)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink"
              aria-label="Edit"
              title="Edit"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-danger"
              aria-label="Delete"
              title="Delete"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
