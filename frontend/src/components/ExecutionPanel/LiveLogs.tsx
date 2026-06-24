import { useEffect, useRef } from "react";
import type { WSLogMessage } from "../../types";

const levelColors: Record<string, string> = {
  info: "text-muted",
  error: "text-danger",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour12: false });
  } catch {
    return "--:--:--";
  }
}

export default function LiveLogs({
  logs,
  connected,
  paused,
  onTogglePause,
  onClear,
}: {
  logs: WSLogMessage[];
  connected: boolean;
  paused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  // Auto-scroll ke bottom kalau user ga scroll up
  useEffect(() => {
    if (autoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    autoScroll.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            connected ? "bg-success" : "bg-dim"
          } ${connected && !paused ? "animate-pulse" : ""}`}
        />
        <span className="text-[12px] font-medium text-muted">
          {paused ? "Paused" : connected ? "Live" : "Disconnected"}
        </span>
        <span className="text-[12px] text-dim">· {logs.length} logs</span>

        <div className="ml-auto flex gap-1">
          <button
            onClick={onTogglePause}
            disabled={!connected}
            className="flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-[12px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink disabled:opacity-30"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={onClear}
            className="flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-[12px] font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-base px-3 py-2 font-mono text-[12px] leading-relaxed"
      >
        {logs.length === 0 ? (
          <p className="text-dim">Waiting for logs…</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-2 py-0.5">
              <span className="shrink-0 text-dim">{formatTime(log.timestamp)}</span>
              <span className="shrink-0 text-accent">[{log.node_label}]</span>
              <span className={`shrink-0 ${levelColors[log.level] ?? "text-muted"}`}>
                {log.level}
              </span>
              <span className="min-w-0 break-words text-ink">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
