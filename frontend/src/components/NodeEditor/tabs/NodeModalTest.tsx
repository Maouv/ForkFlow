export default function NodeModalTest() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-dim">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      <p className="text-[13px] text-muted">Single-node test coming soon</p>
      <p className="max-w-xs text-[12px] text-dim">
        Requires backend endpoint to run one node in isolation.
        Tracked in backlog.
      </p>
    </div>
  );
}
