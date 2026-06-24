// ---- Provider ----
export interface Provider {
  id: number;
  name: string;
  type: "openai_compatible" | "anthropic" | "custom_http";
  base_url: string;
  api_key_encrypted?: string;
  default_model: string;
  created_at: string;
}

export interface ProviderCreate {
  name: string;
  type: Provider["type"];
  base_url: string;
  api_key?: string;
  default_model: string;
}

export interface ProviderUpdate {
  name?: string;
  base_url?: string;
  api_key?: string;
  default_model?: string;
}

// ---- Agent ----
export interface AgentProfile {
  id: number;
  name: string;
  system_prompt: string;
  provider_id: number;
  model: string;
  tools: string[];
  memory_type: "session" | "persistent" | "hybrid";
  conversation_scope: "full_history" | "previous_only";
  active: boolean;
  created_at: string;
}

export interface AgentCreate {
  name: string;
  system_prompt: string;
  provider_id: number;
  model: string;
  tools: string[];
  memory_type: AgentProfile["memory_type"];
  conversation_scope: AgentProfile["conversation_scope"];
}

export interface AgentUpdate {
  name?: string;
  system_prompt?: string;
  provider_id?: number;
  model?: string;
  tools?: string[];
  memory_type?: AgentProfile["memory_type"];
  conversation_scope?: AgentProfile["conversation_scope"];
}

// ---- Flow / Node / Edge ----
export type NodeType = "conversation" | "processor" | "hybrid" | "formatter";

export interface NodeData {
  node_type: NodeType;
  label: string;
  agent_profile_id: number | null;
  conversation_scope?: AgentProfile["conversation_scope"];
  config?: Record<string, unknown>;
  position_x: number;
  position_y: number;
}

export interface FlowNode extends NodeData {
  id: number;
  flow_id: number;
}

export interface EdgeData {
  source_node_id: number;
  target_node_id: number;
  condition_type: "none" | "contains" | "not_contains" | "json_path" | null;
  condition_value: string | null;
}

export interface FlowEdge extends EdgeData {
  id: number;
  flow_id: number;
}

export interface Flow {
  id: number;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  created_at: string;
  updated_at: string;
}

export interface FlowCreate {
  name: string;
  description?: string;
}

export interface FlowGraphPut {
  nodes: NodeData[];
  edges: EdgeData[];
}

// ---- Execution ----
export interface NodeResult {
  id: number;
  execution_id: number;
  node_id: number;
  status: "pending" | "running" | "completed" | "failed";
  input: string | null;
  output: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface Execution {
  id: number;
  flow_id: number;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  input: string | null;
  output: string | null;
}

export interface ExecutionDetail {
  execution: Execution;
  node_results: NodeResult[];
}

export interface ExecuteRequest {
  input: string;
}

// ---- WebSocket ----
export interface WSLogMessage {
  timestamp: string;
  node_id: number;
  node_label: string;
  level: "info" | "error";
  message: string;
}
