import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { isAuthenticated, clearAuth } from "./api/client";
import client from "./api/client";

const FlowEditorPage = lazy(() => import("./pages/FlowEditorPage"));
const AgentsPage = lazy(() => import("./pages/AgentsPage"));
const ProvidersPage = lazy(() => import("./pages/ProvidersPage"));
const ExecutionsPage = lazy(() => import("./pages/ExecutionsPage"));
const LoginPage = lazy(() => import("./components/Auth/LoginPage"));
const SetupPage = lazy(() => import("./components/Auth/SetupPage"));
const ChangePasswordModal = lazy(() => import("./components/Auth/ChangePasswordModal"));

const navItems = [
  { to: "/flows", label: "Flows" },
  { to: "/agents", label: "Agents" },
  { to: "/providers", label: "Providers" },
  { to: "/executions", label: "Executions" },
];

function Sidebar({ onNavigate, onChangePassword }: { onNavigate?: () => void; onChangePassword?: () => void }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-full w-52 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <img src="/logo.png" alt="ForkFlow" width="20" height="20" className="shrink-0" />
        <span className="text-sm font-bold tracking-tight text-ink">ForkFlow</span>
      </div>
      <nav className="flex flex-1 flex-col gap-px px-2 pt-3">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-dim">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `px-3 py-2 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:bg-elevated focus-visible:text-ink ${
                isActive
                  ? "bg-elevated text-ink"
                  : "text-muted hover:bg-elevated/50 hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex flex-col gap-px border-t border-line px-2 py-3">
        <button
          onClick={onChangePassword}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-muted transition-colors duration-150 outline-none hover:bg-elevated/50 hover:text-ink focus-visible:bg-elevated focus-visible:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Change Password
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-muted transition-colors duration-150 outline-none hover:bg-elevated/50 hover:text-ink focus-visible:bg-elevated focus-visible:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}

type GateState = "loading" | "setup" | "login" | "app";

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [gate, setGate] = useState<GateState>("loading");
  const [showChangePw, setShowChangePw] = useState(false);

  const checkGate = useCallback(async () => {
    if (isAuthenticated()) {
      setGate("app");
      return;
    }
    try {
      const { data } = await client.get("/auth/status");
      if (data.setup_required) {
        setGate("setup");
      } else {
        setGate("login");
      }
    } catch {
      setGate("login");
    }
  }, []);

  useEffect(() => {
    checkGate();
  }, [checkGate]);

  if (gate === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-base">
        <div className="h-1 w-20 animate-pulse bg-line-strong" />
      </div>
    );
  }

  if (gate === "setup") {
    return (
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-base"><div className="h-1 w-20 animate-pulse bg-line-strong" /></div>}>
        <SetupPage onDone={() => setGate("login")} />
      </Suspense>
    );
  }

  if (gate === "login") {
    return (
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-base"><div className="h-1 w-20 animate-pulse bg-line-strong" /></div>}>
        <LoginPage onDone={() => setGate("app")} />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar onChangePassword={() => setShowChangePw(true)} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed left-0 top-0 z-40 h-full md:hidden">
            <Sidebar onNavigate={() => setDrawerOpen(false)} onChangePassword={() => { setShowChangePw(true); setDrawerOpen(false); }} />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center text-muted transition-colors duration-150 hover:bg-elevated hover:text-ink outline-none focus-visible:bg-elevated focus-visible:text-ink"
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-sm font-bold text-ink">ForkFlow</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="h-1 w-20 animate-pulse bg-line-strong" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<FlowEditorPage />} />
              <Route path="/flows" element={<FlowEditorPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/executions" element={<ExecutionsPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePw && (
        <Suspense fallback={null}>
          <ChangePasswordModal onClose={() => setShowChangePw(false)} />
        </Suspense>
      )}
    </div>
  );
}
