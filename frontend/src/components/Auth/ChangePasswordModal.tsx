import { useState } from "react";
import client from "../../api/client";

export default function ChangePasswordModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next || !confirm) return;
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await client.post("/auth/change-password", {
        current_password: current,
        new_password: next,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError("Current password is incorrect");
      } else {
        setError("Failed to change password");
      }
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-lg border border-line bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Change Password</h2>

        {success ? (
          <p className="py-4 text-center text-[13px] text-success">
            Password changed successfully
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="mb-1 block text-[12px] text-muted">Current</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoFocus
                className="min-h-[40px] w-full rounded-md border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-[12px] text-muted">New</label>
              <input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                minLength={6}
                className="min-h-[40px] w-full rounded-md border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-[12px] text-muted">Confirm</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="min-h-[40px] w-full rounded-md border border-line bg-base px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
              />
            </div>

            {error && (
              <p className="mb-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] flex-1 rounded-md border border-line px-3 py-2 text-[13px] text-muted transition-colors hover:bg-elevated"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !current || !next || !confirm}
                className="min-h-[40px] flex-1 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-base transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? "…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
