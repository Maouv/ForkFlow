import { useFlowStore } from "../../../store/flowStore";

const inputClass =
  "min-h-[44px] w-full border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-ink";
const labelClass = "text-[10px] font-semibold uppercase tracking-wide text-dim";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

const memoryTypes = [
  { value: "session", label: "Session" },
  { value: "persistent", label: "Persistent" },
  { value: "hybrid", label: "Hybrid" },
];

const scopeTypes = [
  { value: "full_history", label: "Full history" },
  { value: "previous_only", label: "Previous only" },
];

const outputFormats = [
  { value: "raw_text", label: "Raw text" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
];

const onFailOptions = [
  { value: "stop", label: "Stop" },
  { value: "retry", label: "Retry" },
  { value: "skip", label: "Skip" },
];

export default function NodeModalSettings({
  nodeId,
  config,
}: {
  nodeId: string;
  config: Record<string, unknown>;
}) {
  const { updateNodeConfig } = useFlowStore();

  const get = <T,>(key: string, fallback: T): T => (config[key] as T) ?? fallback;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Memory">
          <select
            className={inputClass}
            value={get("memory_type", "session")}
            onChange={(e) => updateNodeConfig(nodeId, "memory_type", e.target.value)}
          >
            {memoryTypes.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Conv Scope">
          <select
            className={inputClass}
            value={get("conversation_scope", "full_history")}
            onChange={(e) => updateNodeConfig(nodeId, "conversation_scope", e.target.value)}
          >
            {scopeTypes.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Output format">
        <select
          className={inputClass}
          value={get("output_format", "raw_text")}
          onChange={(e) => updateNodeConfig(nodeId, "output_format", e.target.value)}
        >
          {outputFormats.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Temperature">
          <input
            type="number"
            step="0.1"
            min="0"
            max="2"
            className={inputClass}
            value={get("temperature", 0.7)}
            onChange={(e) => updateNodeConfig(nodeId, "temperature", parseFloat(e.target.value))}
          />
        </Field>

        <Field label="Max tokens">
          <input
            type="number"
            className={inputClass}
            value={get("max_tokens", 1024)}
            onChange={(e) => updateNodeConfig(nodeId, "max_tokens", parseInt(e.target.value, 10))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="On fail">
          <select
            className={inputClass}
            value={get("on_fail", "stop")}
            onChange={(e) => updateNodeConfig(nodeId, "on_fail", e.target.value)}
          >
            {onFailOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Max retry">
          <input
            type="number"
            min="0"
            max="10"
            className={inputClass}
            value={get("max_retry", 3)}
            onChange={(e) => updateNodeConfig(nodeId, "max_retry", parseInt(e.target.value, 10))}
          />
        </Field>
      </div>
    </div>
  );
}
