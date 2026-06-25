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
}: EdgeProps) {
  const removeEdge = useFlowStore((s) => s.removeEdge);
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId);
  const selected = selectedEdgeId === id;

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
      {/* invisible wider hit path for mobile touch */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        style={{ pointerEvents: "stroke", cursor: "pointer" }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        className={selected ? "!stroke-ink !stroke-[2.5]" : ""}
      />
      <EdgeLabelRenderer>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeEdge(id);
            }}
            className="nopan absolute flex h-7 w-7 items-center justify-center border border-ink bg-surface text-ink shadow-md transition-colors hover:bg-elevated"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            title="Disconnect"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
