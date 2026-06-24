import type { Provider } from "../../types";

const typeColors: Record<string, string> = {
  openai_compatible: "#6b9fd4",
  anthropic: "#d4a44d",
  custom_http: "#b8859e",
};

export default function ProviderList({
  providers,
  onEdit,
  onDelete,
}: {
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onDelete: (id: number) => void;
}) {
  if (providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-dim">No providers yet</p>
        <p className="mt-1 text-[13px] text-dim">Click "New Provider" to add one</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {providers.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 border-b border-line px-4 py-3.5 transition-colors hover:bg-elevated/50"
        >
          {/* Type indicator */}
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: typeColors[p.type] ?? "#888" }}
          />

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>
            <p className="truncate text-[12px] text-dim">
              {p.type.replace(/_/g, " ")} · {p.default_model}
            </p>
          </div>

          {/* API key indicator */}
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
              p.api_key_encrypted
                ? "bg-success/15 text-success"
                : "bg-dim/15 text-dim"
            }`}
          >
            {p.api_key_encrypted ? "Key set" : "No key"}
          </span>

          {/* Actions */}
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(p)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink"
              aria-label="Edit"
              title="Edit"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(p.id)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-danger"
              aria-label="Delete"
              title="Delete"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
