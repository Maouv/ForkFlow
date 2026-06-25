import { Handle, Position, type NodeProps } from "@xyflow/react";

export default function ConversationNode({ data, selected }: NodeProps) {
  const label = (data as { label: string }).label;
  return (
    <div
      className={`border bg-surface px-3 py-2.5 shadow-sm transition-colors ${
        selected ? "border-ink" : "border-line-strong"
      }`}
      style={{ minWidth: 140 }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border !border-base !bg-line-strong" />
      <div className="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Conversation</span>
      </div>
      <p className="mt-1 text-[13px] font-medium text-ink truncate">{label}</p>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border !border-base !bg-line-strong" />
    </div>
  );
}
