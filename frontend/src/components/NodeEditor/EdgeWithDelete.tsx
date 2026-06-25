import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useFlowStore } from "../../store/flowStore";

export default function EdgeWithDelete({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const removeEdge = useFlowStore((s) => s.removeEdge);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={selected ? "!stroke-ink" : ""}
      />
      <EdgeLabelRenderer>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeEdge(id);
            }}
            className="nopan absolute flex h-6 w-6 items-center justify-center border border-line bg-surface text-dim shadow-sm transition-colors hover:text-ink"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            title="Disconnect"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
