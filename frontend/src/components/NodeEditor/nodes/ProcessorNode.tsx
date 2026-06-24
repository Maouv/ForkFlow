import { Handle, Position, type NodeProps } from "@xyflow/react";

export default function ProcessorNode({ data, selected }: NodeProps) {
  const label = (data as { label: string }).label;
  return (
    <div
      className={`rounded-lg border bg-surface px-3 py-2.5 shadow-sm transition-shadow ${
        selected ? "border-[#7dba6f] shadow-md" : "border-line"
      }`}
      style={{ minWidth: 140 }}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-base !bg-[#7dba6f]" />
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#7dba6f]" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Processor</span>
      </div>
      <p className="mt-1 text-[13px] font-medium text-ink truncate">{label}</p>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-base !bg-[#7dba6f]" />
    </div>
  );
}
