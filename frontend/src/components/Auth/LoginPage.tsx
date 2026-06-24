import { useState } from "react";
import client, { setAuth } from "../../api/client";

export default function LoginPage({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setError("");
    setLoading(true);

    try {
      // Test credentials against protected endpoint
      setAuth(username.trim(), password);
      await client.get("/providers");
      onDone();
    } catch {
      setError("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="ForkFlow" width="48" height="48" className="rounded-md" />
          <span className="text-lg font-semibold tracking-tight text-ink">
            ForkFlow
          </span>
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
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="mb-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="min-h-[44px] w-full rounded-md bg-accent px-4 py-2.5 text-[14px] font-semibold text-base transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
