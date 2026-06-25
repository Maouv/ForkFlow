import { useFlowStore } from "../../../store/flowStore";

export default function NodeModalNotes({
  nodeId,
  config,
}: {
  nodeId: string;
  config: Record<string, unknown>;
}) {
  const { updateNodeConfig } = useFlowStore();
  const notes = (config.notes as string) ?? "";

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-dim">Notes</span>
      <textarea
        className="min-h-[180px] w-full resize-y border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-ink placeholder:text-dim"
        value={notes}
        onChange={(e) => updateNodeConfig(nodeId, "notes", e.target.value)}
        placeholder="Write anything — reminders, context, decisions..."
        autoFocus
      />
      <p className="text-[12px] text-dim">
        Appears as tooltip on canvas node when notes has content.
      </p>
    </div>
  );
}
