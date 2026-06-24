import type { Execution } from "../../types";

const statusDot: Record<string, string> = {
  pending: "bg-dim",
  running: "bg-accent animate-pulse",
  completed: "bg-success",
  failed: "bg-danger",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

export default function ExecutionHistory({
  executions,
  onSelect,
}: {
  executions: Execution[];
  onSelect: (id: number) => void;
}) {
  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-dim">No executions yet</p>
        <p className="mt-1 text-[13px] text-dim">Run a flow to see history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {executions.map((exec) => (
        <button
          key={exec.id}
          onClick={() => onSelect(exec.id)}
          className="flex items-center gap-3 border-b border-line px-4 py-3.5 text-left transition-colors hover:bg-elevated/50"
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot[exec.status] ?? "bg-dim"}`} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">
              Execution #{exec.id}
            </p>
            <p className="truncate text-[12px] text-dim">
              {formatTime(exec.started_at)}
            </p>
          </div>

          <span className="shrink-0 text-[12px] font-medium capitalize text-muted">
            {exec.status}
          </span>
        </button>
      ))}
    </div>
  );
}
