import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useFlowStore } from "../../../store/flowStore";
import NodeQuickAdd from "../NodeQuickAdd";

export default function ConversationNode({ id, data, selected }: NodeProps) {
  const label = (data as { label: string }).label;
  const config = (data as { config?: Record<string, unknown> }).config;
  const notes = (config?.notes as string | undefined)?.trim();
  const position = useFlowStore((s) => s.nodes.find((n) => n.id === id)?.position) ?? { x: 0, y: 0 };
  const openNodeEditor = useFlowStore((s) => s.openNodeEditor);

  return (
    <div
      className={`group relative border bg-surface px-4 py-3 shadow-sm transition-colors duration-150 ${
        selected ? "border-ink" : "border-line-strong"
      }`}
      style={{ minWidth: 150 }}
      onDoubleClick={() => openNodeEditor(id)}
      title={notes || undefined}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border !border-base !bg-line-strong" />
      <div className="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-dim">Conversation</span>
      </div>
      <p className="mt-1.5 text-[13px] font-bold text-ink truncate">{label}</p>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border !border-base !bg-line-strong" />

      {selected && (
        <button
          onClick={(e) => { e.stopPropagation(); openNodeEditor(id); }}
          className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center border border-line bg-surface text-dim transition-colors hover:text-ink"
          title="Edit node"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      )}

      <NodeQuickAdd
        sourceNodeId={id}
        spawnPosition={{ x: position.x + 250, y: position.y }}
        variant="handle"
        visible={selected}
      />
    </div>
  );
}
