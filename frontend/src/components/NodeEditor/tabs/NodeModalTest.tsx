import { useState } from "react";
import { useFlowStore } from "../../../store/flowStore";
import client from "../../../api/client";

interface TestResult {
  output: string;
  duration_ms: number;
  token_count: number | null;
}

const inputClass =
  "min-h-[44px] w-full border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-ink placeholder:text-dim";

export default function NodeModalTest({ nodeId }: { nodeId: string }) {
  const { currentFlow } = useFlowStore();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!currentFlow || !input.trim()) return;
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const { data } = await client.post<TestResult>(
        `/flows/${currentFlow.id}/nodes/${nodeId}/test`,
        { input },
      );
      setResult(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Test failed";
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-dim">Input</span>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type sample input to test this node..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={run}
          disabled={running || !input.trim()}
          className="min-h-[36px] bg-accent px-4 text-[12px] font-semibold text-base hover:bg-accent-hover disabled:opacity-50"
        >
          {running ? "Running..." : "Run Node"}
        </button>
      </div>

      {error && (
        <p className="text-[12px] text-danger">{error}</p>
      )}

      {result && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-dim">Output</span>
          <pre className="min-h-[80px] w-full overflow-x-auto whitespace-pre-wrap border border-line bg-base px-3 py-2 text-[13px] text-ink">
            {result.output}
          </pre>
          <p className="text-right text-[11px] text-dim">
            {result.duration_ms}ms
            {result.token_count != null && ` · ${result.token_count}t`}
          </p>
        </div>
      )}
    </div>
  );
}
