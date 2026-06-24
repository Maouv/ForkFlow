import { useState } from "react";
import client from "../../api/client";
import type { Provider, ProviderCreate } from "../../types";

const providerTypes: { value: Provider["type"]; label: string }[] = [
  { value: "openai_compatible", label: "OpenAI Compatible" },
  { value: "anthropic", label: "Anthropic" },
  { value: "custom_http", label: "Custom HTTP" },
];

const inputClass =
  "min-h-[44px] w-full rounded-md border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-accent";
const labelClass = "text-[11px] font-medium uppercase tracking-wide text-dim";

export default function ProviderForm({
  provider,
  onSaved,
  onCancel,
}: {
  provider: Provider | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProviderCreate>({
    name: provider?.name ?? "",
    type: provider?.type ?? "openai_compatible",
    base_url: provider?.base_url ?? "",
    api_key: "",
    default_model: provider?.default_model ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) return setError("Name required");
    if (!form.base_url.trim()) return setError("Base URL required");
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      // Don't send empty api_key on edit
      if (provider && !payload.api_key) delete payload.api_key;
      if (provider) {
        await client.put(`/providers/${provider.id}`, payload);
      } else {
        await client.post("/providers", payload);
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
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
          placeholder="deepseek"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Type</span>
        <select
          className={inputClass}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as Provider["type"] })}
        >
          {providerTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Base URL</span>
        <input
          className={inputClass}
          value={form.base_url}
          onChange={(e) => setForm({ ...form, base_url: e.target.value })}
          placeholder="https://api.deepseek.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>
          API Key {provider && <span className="text-dim normal-case">(leave blank to keep current)</span>}
        </span>
        <input
          type="password"
          className={inputClass}
          value={form.api_key}
          onChange={(e) => setForm({ ...form, api_key: e.target.value })}
          placeholder={provider ? "••••••••" : "sk-…"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Default Model</span>
        <input
          className={inputClass}
          value={form.default_model}
          onChange={(e) => setForm({ ...form, default_model: e.target.value })}
          placeholder="deepseek-chat"
        />
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
          {saving ? "Saving…" : provider ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}
