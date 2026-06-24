import { useEffect, useRef, useState, useCallback } from "react";
import type { WSLogMessage } from "../types";

export function useWebSocket(executionId: number | null) {
  const [logs, setLogs] = useState<WSLogMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const connect = useCallback(() => {
    if (!executionId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/logs/${executionId}`,
    );

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (ev) => {
      if (pausedRef.current) return;
      try {
        const msg: WSLogMessage = JSON.parse(ev.data);
        setLogs((prev) => [...prev, msg]);
      } catch {
        // ignore malformed
      }
    };

    wsRef.current = ws;
  }, [executionId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      setLogs([]);
      setConnected(false);
    };
  }, [connect]);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, connected, paused, togglePause, clearLogs };
}
