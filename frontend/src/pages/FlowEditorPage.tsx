import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFlowStore } from "../store/flowStore";
import FlowCanvas from "../components/NodeEditor/FlowCanvas";
import NodePalette from "../components/NodeEditor/NodePalette";
import PropertiesPanel from "../components/NodeEditor/PropertiesPanel";
import client from "../api/client";
import type { Flow } from "../types";

type Panel = null | "palette" | "properties";

export default function FlowEditorPage() {
  const { flows, currentFlow, loading, saving, loadFlows, selectFlow, saveGraph } =
    useFlowStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [showRun, setShowRun] = useState(false);
  const [runInput, setRunInput] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const executeFlow = async () => {
    if (!currentFlow || !runInput.trim()) return;
    setRunning(true);
    try {
      const { data } = await client.post(`/flows/${currentFlow.id}/execute`, {
        input: runInput,
      });
      setRunInput("");
      setShowRun(false);
      navigate(`/executions?selected=${data.execution_id}`);
    } catch {
      // silent — user can retry
    } finally {
      setRunning(false);
    }
  };

  const createFlow = async () => {
    if (!newName.trim()) return;
    const { data } = await client.post<Flow>("/flows", { name: newName });
    setNewName("");
    setShowCreate(false);
    await loadFlows();
    await selectFlow(data.id);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2">
        <select
          className="min-h-[36px] flex-1 border border-line bg-base px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-ink md:max-w-[240px]"
          value={currentFlow?.id ?? ""}
          onChange={(e) => e.target.value && selectFlow(Number(e.target.value))}
        >
          <option value="">Select flow…</option>
          {flows.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCreate(true)}
            className="flex min-h-[36px] items-center gap-1.5 border border-line px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </button>

          {currentFlow && (
            <>
              <button
                onClick={() => setShowRun(true)}
                className="flex min-h-[36px] items-center gap-1.5 border border-line px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 3l14 9-14 9V3z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="hidden sm:inline">Run</span>
              </button>
              <button
                onClick={saveGraph}
                disabled={saving}
                className="flex min-h-[36px] items-center gap-1.5 bg-ink px-3 py-1.5 text-[13px] font-semibold text-base transition-colors hover:bg-ink/80 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Run flow dialog */}
      {showRun && currentFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm border border-line bg-surface p-5">
            <p className="mb-1 text-sm font-semibold text-ink">Run Flow</p>
            <p className="mb-4 text-[12px] text-dim">{currentFlow.name}</p>
            <textarea
              className="min-h-[80px] w-full resize-y border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-ink"
              placeholder="Enter input message…"
              value={runInput}
              onChange={(e) => setRunInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  executeFlow();
                }
              }}
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowRun(false)}
                className="min-h-[36px] flex-1 border border-line px-3 py-1.5 text-[13px] text-muted hover:bg-elevated"
              >
                Cancel
              </button>
              <button
                onClick={executeFlow}
                disabled={running || !runInput.trim()}
                className="min-h-[36px] flex-1 bg-ink px-3 py-1.5 text-[13px] font-semibold text-base hover:bg-ink/80 disabled:opacity-40"
              >
                {running ? "Starting…" : "Run"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create flow dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm border border-line bg-surface p-5">
            <p className="mb-4 text-sm font-semibold text-ink">New Flow</p>
            <input
              className="min-h-[44px] w-full border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-ink"
              placeholder="Flow name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFlow()}
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="min-h-[36px] flex-1 border border-line px-3 py-1.5 text-[13px] text-muted hover:bg-elevated"
              >
                Cancel
              </button>
              <button
                onClick={createFlow}
                className="min-h-[36px] flex-1 bg-ink px-3 py-1.5 text-[13px] font-semibold text-base hover:bg-ink/80"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor body */}
      {currentFlow ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop: left palette */}
          <div className="hidden w-48 shrink-0 overflow-y-auto border-r border-line bg-surface md:block">
            <NodePalette />
          </div>

          <div className="relative flex-1">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-1 w-24 animate-pulse bg-line-strong" />
                  <p className="text-[13px] text-dim">Loading…</p>
                </div>
              </div>
            ) : (
              <FlowCanvas />
            )}
          </div>

          {/* Desktop: right properties */}
          <div className="hidden w-64 shrink-0 overflow-y-auto border-l border-line bg-surface md:block">
            <PropertiesPanel />
          </div>

          {/* Mobile: bottom action buttons */}
          <div className="absolute bottom-4 left-4 flex gap-2 md:hidden">
            <button
              onClick={() => setPanel(panel === "palette" ? null : "palette")}
              className="flex h-11 w-11 items-center justify-center border border-line bg-surface shadow-md"
              aria-label="Add node"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink">
                <circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" />
                <path d="M7.5 7L11 16M16.5 7L13 16" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-4 right-4 md:hidden">
            <button
              onClick={() => setPanel(panel === "properties" ? null : "properties")}
              className="flex h-11 w-11 items-center justify-center border border-line bg-surface shadow-md"
              aria-label="Properties"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink">
                <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Mobile bottom sheet */}
          {panel && (
            <>
              <div className="absolute inset-0 z-20 bg-black/40 md:hidden" onClick={() => setPanel(null)} />
              <div className="absolute bottom-0 left-0 right-0 z-30 max-h-[60vh] overflow-y-auto border-t border-line bg-surface md:hidden">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <span className="text-[13px] font-semibold text-ink">
                    {panel === "palette" ? "Add Node" : "Properties"}
                  </span>
                  <button onClick={() => setPanel(null)} className="text-dim hover:text-ink">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {panel === "palette" && <NodePalette />}
                {panel === "properties" && <PropertiesPanel />}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-line-strong">
              <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" />
              <path d="M7.5 7.5L11 16M16.5 7.5L13 16" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-medium text-muted">No flow selected</p>
              <p className="mt-1 text-[12px] text-dim">Select a flow from the dropdown or create a new one</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
