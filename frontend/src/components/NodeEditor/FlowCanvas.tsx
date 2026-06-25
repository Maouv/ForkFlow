import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ConversationNode from "./nodes/ConversationNode";
import ProcessorNode from "./nodes/ProcessorNode";
import NodeQuickAdd from "./NodeQuickAdd";
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
    <div className="relative h-full w-full">
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
        zoomOnPinch
        panOnDrag
        selectNodesOnDrag={false}
        nodesConnectable
        edgesFocusable
        className="bg-base"
      >
        <Background gap={20} size={1} color="oklch(0.25 0 0)" />
        <Controls
          position="top-right"
          className="!border-line !bg-surface !shadow-sm"
          showInteractive={false}
        />
        {nodes.length === 0 && (
          <Panel
            position="center"
            className="flex items-center justify-center"
          >
            <NodeQuickAdd spawnPosition={{ x: 250, y: 200 }} variant="empty" />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
