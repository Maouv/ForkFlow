import { useState } from "react";
import client from "../../api/client";

export default function SetupPage({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await client.post("/auth/setup", {
        username: username.trim(),
        password,
      });
      onDone();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        setError("Setup already completed");
      } else {
        setError("Failed to set up. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-xs">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="ForkFlow" width="48" height="48" className="rounded-md" />
          <span className="text-lg font-semibold tracking-tight text-ink">ForkFlow</span>
          <p className="text-[12px] text-dim">Create your admin account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-line bg-surface p-5"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-muted">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              className="min-h-[44px] w-full rounded-md border border-line bg-base px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
              placeholder="admin"
              minLength={3}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-muted">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] w-full rounded-md border border-line bg-base px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
              placeholder="min 6 characters"
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-muted">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="min-h-[44px] w-full rounded-md border border-line bg-base px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
              placeholder="repeat password"
            />
          </div>

          {error && (
            <p className="mb-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password || !confirm}
            className="min-h-[44px] w-full rounded-md bg-accent px-4 py-2.5 text-[14px] font-semibold text-base transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Setting up…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
