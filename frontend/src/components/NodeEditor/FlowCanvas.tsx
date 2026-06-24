import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ConversationNode from "./nodes/ConversationNode";
import ProcessorNode from "./nodes/ProcessorNode";
import { useFlowStore } from "../../store/flowStore";

const nodeTypes = {
  conversation: ConversationNode,
  processor: ProcessorNode,
};

export default function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode, selectEdge } =
    useFlowStore();

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => selectNode(node.id),
    [selectNode],
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => selectEdge(edge.id),
    [selectEdge],
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        // Mobile: pinch zoom, single-finger pan
        zoomOnPinch
        panOnDrag
        selectNodesOnDrag={false}
        // Touch-friendly defaults
        nodesConnectable
        edgesFocusable
        className="bg-base"
      >
        <Background gap={20} size={1} color="oklch(0.28 0.006 55)" />
        <Controls
          className="!border-line !bg-surface !shadow-sm"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
