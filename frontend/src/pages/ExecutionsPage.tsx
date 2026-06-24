import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import client from "../api/client";
import type { Execution, ExecutionDetail } from "../types";
import ExecutionHistory from "../components/ExecutionPanel/ExecutionHistory";
import ExecutionDetailComp from "../components/ExecutionPanel/ExecutionDetail";
import LiveLogs from "../components/ExecutionPanel/LiveLogs";
import { useWebSocket } from "../hooks/useWebSocket";

type View = "history" | "detail";
type MobileTab = "detail" | "logs";

export default function ExecutionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ExecutionDetail | null>(null);
  const [view, setView] = useState<View>("history");
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("detail");

  const { logs, connected, paused, togglePause, clearLogs } = useWebSocket(selectedId);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get<Execution[]>("/executions");
      setExecutions(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle ?selected= query param from Run button
  useEffect(() => {
    const selected = searchParams.get("selected");
    if (selected) {
      const id = Number(selected);
      if (!Number.isNaN(id)) {
        selectExecution(id);
        // Clean URL
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams]);

  // Poll detail saat execution masih running
  useEffect(() => {
    if (!selectedId || !detail) return;
    if (detail.execution.status === "running" || detail.execution.status === "pending") {
      const timer = setTimeout(async () => {
        try {
          const { data } = await client.get<ExecutionDetail>(`/executions/${selectedId}`);
          setDetail(data);
        } catch {
          // silent
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedId, detail]);

  const selectExecution = async (id: number) => {
    setSelectedId(id);
    setView("detail");
    setMobileTab("detail");
    try {
      const { data } = await client.get<ExecutionDetail>(`/executions/${id}`);
      setDetail(data);
    } catch {
      // silent
    }
  };

  const backToHistory = () => {
    setView("history");
    setSelectedId(null);
    setDetail(null);
    loadHistory();
  };

  if (view === "detail" && detail) {
    return (
      <div className="flex h-full flex-col">
        {/* Mobile tab switcher */}
        <div className="flex border-b border-line bg-surface md:hidden">
          <button
            onClick={() => setMobileTab("detail")}
            className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
              mobileTab === "detail"
                ? "border-b-2 border-accent text-accent"
                : "text-muted"
            }`}
          >
            Detail
          </button>
          <button
            onClick={() => setMobileTab("logs")}
            className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
              mobileTab === "logs"
                ? "border-b-2 border-accent text-accent"
                : "text-muted"
            }`}
          >
            Logs
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Detail panel — desktop: left, mobile: conditional */}
          <div
            className={`flex-1 overflow-y-auto md:w-1/2 md:flex-none md:border-r md:border-line ${
              mobileTab === "detail" ? "block" : "hidden"
            } md:block`}
          >
            <ExecutionDetailComp detail={detail} onBack={backToHistory} />
          </div>

          {/* Live logs — desktop: right, mobile: conditional */}
          <div
            className={`flex-1 overflow-hidden md:w-1/2 md:flex-none ${
              mobileTab === "logs" ? "block" : "hidden"
            } md:block`}
          >
            <LiveLogs
              logs={logs}
              connected={connected}
              paused={paused}
              onTogglePause={togglePause}
              onClear={clearLogs}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
        <h1 className="text-base font-semibold text-ink">Executions</h1>
        <button
          onClick={loadHistory}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-ink"
          aria-label="Refresh"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6M3 22v-6h6M21 8a9 9 0 00-15-3M3 16a9 9 0 0015 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-dim">Loading…</p>
          </div>
        ) : (
          <ExecutionHistory executions={executions} onSelect={selectExecution} />
        )}
      </div>
    </div>
  );
}
