import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import client from "../api/client";
import type { Flow, FlowGraphPut, NodeData } from "../types";

interface FlowState {
  flows: Flow[];
  currentFlow: Flow | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  loading: boolean;
  saving: boolean;

  loadFlows: () => Promise<void>;
  selectFlow: (id: number) => Promise<void>;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;
  addNode: (
    type: NodeData["node_type"],
    position: { x: number; y: number },
    sourceNodeId?: string,
  ) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  updateEdgeData: (id: string, patch: Record<string, unknown>) => void;
  saveGraph: () => Promise<void>;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [],
  currentFlow: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  loading: false,
  saving: false,

  loadFlows: async () => {
    const { data } = await client.get<Flow[]>("/flows");
    set({ flows: data });
  },

  selectFlow: async (id) => {
    set({ loading: true });
    const { data } = await client.get<Flow>(`/flows/${id}`);
    const nodes: Node[] = data.nodes.map((n) => ({
      id: String(n.id),
      type: n.node_type,
      position: { x: n.position_x, y: n.position_y },
      data: { label: n.label, agent_profile_id: n.agent_profile_id, conversation_scope: n.conversation_scope, config: n.config },
    }));
    const edges: Edge[] = data.edges.map((e) => ({
      id: String(e.id),
      source: String(e.source_node_id),
      target: String(e.target_node_id),
      data: { condition_type: e.condition_type, condition_value: e.condition_value },
    }));
    set({ currentFlow: data, nodes, edges, loading: false });
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (conn) => {
    set({
      edges: addEdge(
        { ...conn, data: { condition_type: "none", condition_value: null } },
        get().edges,
      ),
    });
  },

  addNode: (type, position, sourceNodeId) => {
    const id = `temp_${Date.now()}`;
    const node: Node = {
      id,
      type,
      position,
      data: { label: `${type} node`, agent_profile_id: null, conversation_scope: "full_history", config: {} },
    };
    const nodes = [...get().nodes, node];
    // ponytail: auto-edge when sourceNodeId present, reuse onConnect shape
    const edges = sourceNodeId
      ? addEdge(
          { id: `temp_edge_${Date.now()}`, source: sourceNodeId, target: id, data: { condition_type: "none", condition_value: null } },
          get().edges,
        )
      : get().edges;
    set({ nodes, edges, selectedNodeId: id, selectedEdgeId: null });
  },

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  updateNodeData: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    });
  },

  updateEdgeData: (id, patch) => {
    set({
      edges: get().edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...patch } } : e,
      ),
    });
  },

  saveGraph: async () => {
    const { currentFlow, nodes, edges } = get();
    if (!currentFlow) return;

    set({ saving: true });
    const payload: FlowGraphPut = {
      nodes: nodes.map((n) => ({
        node_type: n.type as NodeData["node_type"],
        label: (n.data as { label: string }).label,
        agent_profile_id: (n.data as { agent_profile_id: number | null }).agent_profile_id,
        conversation_scope: (n.data as { conversation_scope?: NodeData["conversation_scope"] }).conversation_scope,
        config: (n.data as { config?: Record<string, unknown> }).config,
        position_x: n.position.x,
        position_y: n.position.y,
      })),
      edges: edges.map((e) => ({
        source_node_id: Number(e.source),
        target_node_id: Number(e.target),
        condition_type: (e.data as { condition_type: string | null }).condition_type as FlowGraphPut["edges"][number]["condition_type"],
        condition_value: (e.data as { condition_value: string | null }).condition_value,
      })),
    };
    await client.put(`/flows/${currentFlow.id}`, payload);
    // Reload to get real IDs
    await get().selectFlow(currentFlow.id);
    set({ saving: false });
  },
}));
