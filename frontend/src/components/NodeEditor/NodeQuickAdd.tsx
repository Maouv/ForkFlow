import { useEffect, useRef, useState } from "react";
import { useFlowStore } from "../../store/flowStore";
import type { NodeData } from "../../types";

const NODE_TYPES: { type: NodeData["node_type"]; label: string; icon: string }[] = [
  { type: "conversation", label: "Conversation", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  { type: "processor", label: "Processor", icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" },
];

interface Props {
  sourceNodeId?: string;
  spawnPosition: { x: number; y: number };
  variant: "handle" | "empty";
  visible?: boolean; // handle mode: selected/hover
}

export default function NodeQuickAdd({ sourceNodeId, spawnPosition, variant, visible = true }: Props) {
  const addNode = useFlowStore((s) => s.addNode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (type: NodeData["node_type"]) => {
    addNode(type, spawnPosition, sourceNodeId);
    setOpen(false);
  };

  // ponytail: CSS-driven visibility, no JS hover state
  const wrapperClass =
    variant === "empty"
      ? "flex flex-col items-center gap-3"
      : `absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full ${visible ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"} transition-opacity duration-150`;

  const btnClass =
    variant === "empty"
      ? "flex min-h-[44px] items-center gap-2 border border-line-strong bg-surface px-5 py-2.5 text-[13px] font-semibold text-ink shadow-sm transition-colors hover:bg-elevated"
      : "flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-surface shadow-sm transition-colors hover:bg-elevated";

  return (
    <div ref={ref} className={`relative ${wrapperClass}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={btnClass}
        aria-label="Add node"
      >
        {variant === "empty" ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span>Add first node</span>
          </>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 border border-line bg-surface py-1 shadow-lg ${
            variant === "empty" ? "left-0 top-full mt-2" : "right-0 top-full mt-1"
          }`}
        >
          {NODE_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={(e) => {
                e.stopPropagation();
                pick(t.type);
              }}
              className="flex w-full min-h-[36px] items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-elevated"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                <path d={t.icon} />
              </svg>
              <span className="text-[13px] font-medium text-ink">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
