import { useEffect, useState } from "react";
import client from "../../api/client";
import type { AgentProfile, Provider } from "../../types";

const tools = ["read_file", "write_file", "web_search", "execute_code"];

const memoryTypes: { value: AgentProfile["memory_type"]; label: string }[] = [
  { value: "session", label: "Session" },
  { value: "persistent", label: "Persistent" },
  { value: "hybrid", label: "Hybrid" },
];

const scopeTypes: { value: AgentProfile["conversation_scope"]; label: string }[] = [
  { value: "full_history", label: "Full history" },
  { value: "previous_only", label: "Previous only" },
];

const inputClass =
  "min-h-[44px] w-full rounded-md border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-accent";
const labelClass = "text-[11px] font-medium uppercase tracking-wide text-dim";

export default function AgentForm({
  agent,
  onSaved,
  onCancel,
}: {
  agent: AgentProfile | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState({
    name: agent?.name ?? "",
    system_prompt: agent?.system_prompt ?? "",
    provider_id: agent?.provider_id ?? 0,
    model: agent?.model ?? "",
    tools: agent?.tools ?? [],
    memory_type: agent?.memory_type ?? "session" as const,
    conversation_scope: agent?.conversation_scope ?? "full_history" as const,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get<Provider[]>("/providers").then((r) => {
      setProviders(r.data);
      if (!agent && r.data.length > 0) {
        setForm((f) => ({ ...f, provider_id: r.data[0].id }));
      }
    }).catch(() => {});
  }, [agent]);

  const toggleTool = (tool: string) => {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(tool)
        ? f.tools.filter((t) => t !== tool)
        : [...f.tools, tool],
    }));
  };

  const submit = async () => {
    if (!form.name.trim()) return setError("Name required");
    if (!form.provider_id) return setError("Provider required");
    setSaving(true);
    setError("");
    try {
      if (agent) {
        await client.put(`/agents/${agent.id}`, form);
      } else {
        await client.post("/agents", form);
      }
      onSaved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Name</span>
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Agent name"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>System Prompt</span>
        <textarea
          className={`${inputClass} min-h-[100px] resize-y`}
          value={form.system_prompt}
          onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
          placeholder="You are a helpful assistant…"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Provider</span>
          <select
            className={inputClass}
            value={form.provider_id}
            onChange={(e) => setForm({ ...form, provider_id: Number(e.target.value) })}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Model</span>
          <input
            className={inputClass}
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="deepseek-chat"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Tools</span>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              className={`min-h-[36px] rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                form.tools.includes(tool)
                  ? "border-accent bg-[oklch(0.25_0_0)] text-accent"
                  : "border-line text-muted hover:bg-elevated"
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Memory</span>
          <select
            className={inputClass}
            value={form.memory_type}
            onChange={(e) => setForm({ ...form, memory_type: e.target.value as AgentProfile["memory_type"] })}
          >
            {memoryTypes.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Conversation Scope</span>
          <select
            className={inputClass}
            value={form.conversation_scope}
            onChange={(e) => setForm({ ...form, conversation_scope: e.target.value as AgentProfile["conversation_scope"] })}
          >
            {scopeTypes.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="min-h-[44px] flex-1 rounded-md border border-line px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="min-h-[44px] flex-1 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-base transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : agent ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}
