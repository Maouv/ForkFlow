import type { ExecutionDetail, NodeResult } from "../../types";

const statusConfig: Record<string, { dot: string; label: string; text: string }> = {
  pending: { dot: "bg-dim", label: "Pending", text: "text-dim" },
  running: { dot: "bg-accent animate-pulse", label: "Running", text: "text-accent" },
  completed: { dot: "bg-success", label: "Done", text: "text-success" },
  failed: { dot: "bg-danger", label: "Failed", text: "text-danger" },
};

function formatDuration(ms: number | null) {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function NodeTimeline({ result }: { result: NodeResult }) {
  const cfg = statusConfig[result.status] ?? statusConfig.pending;

  return (
    <div className="border-b border-line px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
        <span className="flex-1 text-[13px] font-medium text-ink">
          Node #{result.node_id}
        </span>
        <span className={`text-[12px] font-medium ${cfg.text}`}>{cfg.label}</span>
        <span className="text-[12px] text-dim">{formatDuration(result.duration_ms)}</span>
      </div>

      {result.output && (
        <div className="mt-2 rounded-md border border-line bg-base px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-dim mb-1">Output</p>
          <p className="whitespace-pre-wrap break-words text-[12px] text-ink">
            {result.output}
          </p>
        </div>
      )}

      {result.error_message && (
        <div className="mt-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-danger mb-1">Error</p>
          <p className="whitespace-pre-wrap break-words text-[12px] text-danger">
            {result.error_message}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ExecutionDetail({
  detail,
  onBack,
}: {
  detail: ExecutionDetail;
  onBack: () => void;
}) {
  const { execution, node_results } = detail;
  const cfg = statusConfig[execution.status] ?? statusConfig.pending;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-ink"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink">Execution #{execution.id}</p>
          <p className="text-[12px] text-dim">Flow #{execution.flow_id}</p>
        </div>
        <span className={`text-[12px] font-medium ${cfg.text}`}>{cfg.label}</span>
      </div>

      {/* Input */}
      {execution.input && (
        <div className="border-b border-line px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-dim mb-1">Input</p>
          <p className="whitespace-pre-wrap break-words text-[13px] text-ink">{execution.input}</p>
        </div>
      )}

      {/* Node timeline */}
      <div className="flex-1 overflow-y-auto">
        {node_results.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-dim">No node results yet</p>
          </div>
        ) : (
          node_results.map((r) => <NodeTimeline key={r.id} result={r} />)
        )}
      </div>

      {/* Final output */}
      {execution.output && (
        <div className="border-t border-line bg-surface px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-dim mb-1">Final Output</p>
          <p className="whitespace-pre-wrap break-words text-[13px] text-ink">{execution.output}</p>
        </div>
      )}
    </div>
  );
}
