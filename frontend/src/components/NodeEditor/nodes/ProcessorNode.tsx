import { Handle, Position, type NodeProps } from "@xyflow/react";

export default function ProcessorNode({ data, selected }: NodeProps) {
  const label = (data as { label: string }).label;
  return (
    <div
      className={`border bg-surface px-4 py-3 shadow-sm transition-colors duration-150 ${
        selected ? "border-ink" : "border-line-strong"
      }`}
      style={{ minWidth: 150 }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border !border-base !bg-line-strong" />
      <div className="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-dim">Processor</span>
      </div>
      <p className="mt-1.5 text-[13px] font-bold text-ink truncate">{label}</p>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border !border-base !bg-line-strong" />
    </div>
  );
}
