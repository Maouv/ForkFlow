import { useFlowStore } from "../../store/flowStore";
import type { NodeData } from "../../types";

const paletteItems: { type: NodeData["node_type"]; label: string; color: string }[] = [
  { type: "conversation", label: "Conversation", color: "#6b9fd4" },
  { type: "processor", label: "Processor", color: "#7dba6f" },
];

export default function NodePalette() {
  const addNode = useFlowStore((s) => s.addNode);

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-dim px-1">Add Node</p>
      {paletteItems.map((item) => (
        <button
          key={item.type}
          onClick={() => addNode(item.type, { x: 200, y: 150 })}
          className="flex min-h-[44px] items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-elevated"
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-[13px] font-medium text-ink">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
