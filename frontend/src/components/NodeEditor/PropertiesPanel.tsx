import { useEffect, useState } from "react";
import { useFlowStore } from "../../store/flowStore";
import client from "../../api/client";
import type { AgentProfile, NodeData } from "../../types";

const conditionTypes = [
  { value: "none", label: "None (always)" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not contains" },
  { value: "json_path", label: "JSON path" },
];

const scopeTypes: { value: NodeData["conversation_scope"]; label: string }[] = [
  { value: "full_history", label: "Full history" },
  { value: "previous_only", label: "Previous only" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-dim">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "min-h-[44px] border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-ink";

export default function PropertiesPanel() {
  const { nodes, edges, selectedNodeId, selectedEdgeId, updateNodeData, updateEdgeData } =
    useFlowStore();
  const [agents, setAgents] = useState<AgentProfile[]>([]);

  useEffect(() => {
    client.get<AgentProfile[]>("/agents").then((r) => setAgents(r.data)).catch(() => {});
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-[13px] text-dim">Select a node or edge to edit</p>
      </div>
    );
  }

  if (selectedNode) {
    const d = selectedNode.data as {
      label: string;
      agent_profile_id: number | null;
      conversation_scope: NodeData["conversation_scope"];
    };

    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-dim">Node Properties</p>

        <Field label="Label">
          <input
            className={inputClass}
            value={d.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
          />
        </Field>

        <Field label="Agent">
          <select
            className={inputClass}
            value={d.agent_profile_id ?? ""}
            onChange={(e) =>
              updateNodeData(selectedNode.id, {
                agent_profile_id: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">None</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Conversation scope">
          <select
            className={inputClass}
            value={d.conversation_scope ?? "full_history"}
            onChange={(e) =>
              updateNodeData(selectedNode.id, {
                conversation_scope: e.target.value as NodeData["conversation_scope"],
              })
            }
          >
            {scopeTypes.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    );
  }

  if (selectedEdge) {
    const d = (selectedEdge.data ?? {}) as { condition_type: string | null; condition_value: string | null };

    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-dim">Edge Condition</p>

        <Field label="Condition type">
          <select
            className={inputClass}
            value={d.condition_type ?? "none"}
            onChange={(e) => updateEdgeData(selectedEdge.id, { condition_type: e.target.value })}
          >
            {conditionTypes.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        {d.condition_type && d.condition_type !== "none" && (
          <Field label="Condition value">
            <input
              className={inputClass}
              placeholder={d.condition_type === "json_path" ? "verdict == APPROVED" : "APPROVED"}
              value={d.condition_value ?? ""}
              onChange={(e) => updateEdgeData(selectedEdge.id, { condition_value: e.target.value })}
            />
          </Field>
        )}
      </div>
    );
  }

  return null;
}
