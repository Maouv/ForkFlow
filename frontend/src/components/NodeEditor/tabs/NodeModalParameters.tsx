import { useEffect, useState } from "react";
import { useFlowStore } from "../../../store/flowStore";
import client from "../../../api/client";
import type { AgentProfile, Provider } from "../../../types";

const inputClass =
  "min-h-[44px] w-full border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-ink placeholder:text-dim";
const labelClass = "text-[10px] font-semibold uppercase tracking-wide text-dim";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export default function NodeModalParameters({
  nodeId,
  data,
  config,
}: {
  nodeId: string;
  data: { label: string; agent_profile_id: number | null };
  config: Record<string, unknown>;
}) {
  const { updateNodeData, updateNodeConfig, nodes, edges } = useFlowStore();
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAgents = () => client.get<AgentProfile[]>("/agents").then((r) => setAgents(r.data)).catch(() => {});

  useEffect(() => { fetchAgents(); }, []);

  // Upstream nodes = edges where target === this node
  const upstreamNodeIds = edges.filter((e) => e.target === nodeId).map((e) => e.source);
  const upstreamNodes = nodes.filter((n) => upstreamNodeIds.includes(n.id));

  const selectedAgent = agents.find((a) => a.id === data.agent_profile_id);
  const modelOverride = (config.model_override as string) ?? "";
  const promptOverride = (config.system_prompt_override as string) ?? "";
  const useOverride = config.use_prompt_override === true;
  const inputSource = (config.input_source as string) ?? "";

  return (
    <div className="flex flex-col gap-4">
      <Field label="Agent">
        <select
          className={inputClass}
          value={data.agent_profile_id ?? ""}
          onChange={(e) => updateNodeData(nodeId, { agent_profile_id: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">None</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="mt-1 text-left text-[12px] text-dim underline hover:text-muted"
        >
          + Create new agent
        </button>
      </Field>

      <Field label="Model">
        <input
          className={inputClass}
          value={modelOverride}
          onChange={(e) => updateNodeConfig(nodeId, "model_override", e.target.value)}
          placeholder={selectedAgent?.model ? `Use agent default (${selectedAgent.model})` : "No agent selected"}
        />
      </Field>

      <Field label="System Prompt">
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-[12px] text-muted">
            <input
              type="radio"
              checked={!useOverride}
              onChange={() => updateNodeConfig(nodeId, "use_prompt_override", false)}
            />
            Use agent default
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-muted">
            <input
              type="radio"
              checked={useOverride}
              onChange={() => updateNodeConfig(nodeId, "use_prompt_override", true)}
            />
            Override
          </label>
        </div>
        {useOverride && (
          <textarea
            className={`${inputClass} mt-1.5 min-h-[100px] resize-y`}
            value={promptOverride}
            onChange={(e) => updateNodeConfig(nodeId, "system_prompt_override", e.target.value)}
            placeholder="Override system prompt..."
          />
        )}
      </Field>

      {upstreamNodes.length > 0 && (
        <Field label="Input from">
          <select
            className={inputClass}
            value={inputSource}
            onChange={(e) => updateNodeConfig(nodeId, "input_source", e.target.value)}
          >
            <option value="">Auto (all upstream)</option>
            {upstreamNodes.map((n) => (
              <option key={n.id} value={n.id}>
                {(n.data as { label: string }).label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {showCreate && (
        <CreateAgentMini
          onCreated={(newAgentId) => {
            fetchAgents();
            updateNodeData(nodeId, { agent_profile_id: newAgentId });
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function CreateAgentMini({
  onCreated,
  onCancel,
}: {
  onCreated: (agentId: number) => void;
  onCancel: () => void;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState({ name: "", system_prompt: "", provider_id: 0, model: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get<Provider[]>("/providers").then((r) => {
      setProviders(r.data);
      if (r.data.length > 0) {
        setForm((f) => ({ ...f, provider_id: r.data[0].id, model: r.data[0].default_model }));
      }
    }).catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.name.trim()) return setError("Name required");
    if (!form.provider_id) return setError("Provider required");
    setSaving(true);
    setError("");
    try {
      const { data } = await client.post<AgentProfile>("/agents", {
        name: form.name,
        system_prompt: form.system_prompt,
        provider_id: form.provider_id,
        model: form.model,
        tools: [],
        memory_type: "session",
        conversation_scope: "full_history",
      });
      onCreated(data.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create agent";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-line bg-base p-3">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-dim">Create New Agent</p>
      <div className="flex flex-col gap-3">
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Agent name"
          autoFocus
        />
        <textarea
          className={`${inputClass} min-h-[60px] resize-y`}
          value={form.system_prompt}
          onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
          placeholder="System prompt (optional)"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            className={inputClass}
            value={form.provider_id}
            onChange={(e) => {
              const p = providers.find((p) => p.id === Number(e.target.value));
              setForm({ ...form, provider_id: Number(e.target.value), model: p?.default_model ?? "" });
            }}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            className={inputClass}
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="Model"
          />
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="min-h-[36px] flex-1 border border-line px-3 text-[12px] text-muted hover:bg-elevated hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="min-h-[36px] flex-1 bg-accent px-3 text-[12px] font-semibold text-base hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
