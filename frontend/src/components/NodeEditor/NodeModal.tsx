import { useEffect, useState } from "react";
import { useFlowStore } from "../../store/flowStore";
import NodeModalParameters from "./tabs/NodeModalParameters";
import NodeModalSettings from "./tabs/NodeModalSettings";
import NodeModalTest from "./tabs/NodeModalTest";
import NodeModalNotes from "./tabs/NodeModalNotes";

type Tab = "parameters" | "settings" | "test" | "notes";

const tabs: { id: Tab; label: string }[] = [
  { id: "parameters", label: "Parameters" },
  { id: "settings", label: "Settings" },
  { id: "test", label: "Test" },
  { id: "notes", label: "Notes" },
];

export default function NodeModal() {
  const { editingNodeId, nodes, closeNodeEditor, updateNodeData } = useFlowStore();
  const [activeTab, setActiveTab] = useState<Tab>("parameters");

  // Reset tab when modal opens (editingNodeId changes from null → id)
  useEffect(() => {
    if (editingNodeId) setActiveTab("parameters");
  }, [editingNodeId]);

  // ESC to close
  useEffect(() => {
    if (!editingNodeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNodeEditor();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingNodeId, closeNodeEditor]);

  if (!editingNodeId) return null;

  const node = nodes.find((n) => n.id === editingNodeId);
  if (!node) return null;

  const data = node.data as { label: string; agent_profile_id: number | null; config?: Record<string, unknown> };
  const config = data.config ?? {};

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex max-h-[70vh] flex-col border-t border-line bg-surface shadow-lg sm:bottom-4 sm:left-auto sm:right-4 sm:max-h-[80vh] sm:max-w-md sm:border"
    >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dim shrink-0">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <input
            className="flex-1 bg-transparent text-[14px] font-bold text-ink outline-none placeholder:text-dim"
            value={data.label}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            placeholder="Node name"
          />
          <button
            onClick={closeNodeEditor}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-dim transition-colors hover:bg-elevated hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-line overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`min-h-[40px] shrink-0 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                activeTab === t.id
                  ? "border-b-2 border-ink text-ink"
                  : "text-dim hover:text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "parameters" && <NodeModalParameters nodeId={node.id} data={data} config={config} />}
          {activeTab === "settings" && <NodeModalSettings nodeId={node.id} config={config} />}
          {activeTab === "test" && <NodeModalTest nodeId={node.id} />}
          {activeTab === "notes" && <NodeModalNotes nodeId={node.id} config={config} />}
        </div>
    </div>
  );
}
