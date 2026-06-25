import { useFlowStore } from "../../store/flowStore";
import type { NodeData } from "../../types";

const paletteItems: { type: NodeData["node_type"]; label: string; icon: string }[] = [
  {
    type: "conversation",
    label: "Conversation",
    icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  },
  {
    type: "processor",
    label: "Processor",
    icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  },
];

export default function NodePalette() {
  const addNode = useFlowStore((s) => s.addNode);

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-dim">Add Node</p>
      {paletteItems.map((item) => (
        <button
          key={item.type}
          onClick={() => addNode(item.type, { x: 200, y: 150 })}
          className="flex min-h-[44px] items-center gap-2.5 border border-line bg-surface px-3 py-2.5 text-left transition-colors duration-150 outline-none hover:border-line-strong hover:bg-elevated focus-visible:border-ink focus-visible:bg-elevated"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
            <path d={item.icon} />
          </svg>
          <span className="text-[13px] font-medium text-ink">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
