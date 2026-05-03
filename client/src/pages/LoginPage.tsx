import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DEMO_ACCOUNTS } from "../demoCredentials";

export function LoginPage() {
  const { user, ready, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(true);

  if (ready && user) return <Navigate to="/" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  return (
    <div className="auth-page">
      <div className="auth-split">
        <aside className="auth-aside" aria-hidden="false">
          <div className="auth-aside-inner">
            <div className="auth-logo-row">
              <span className="brand-mark lg" aria-hidden />
              <span className="auth-product">TaskFlow</span>
            </div>
            <h2 className="auth-aside-title">Your team’s work, in one calm place.</h2>
            <p className="auth-aside-copy">
              Projects, roles, and tasks with a clear dashboard — built for demos and real collaboration.
            </p>
            <ul className="auth-aside-list">
              <li>JWT auth and RBAC per project</li>
              <li>Tasks, assignees, due dates, status</li>
              <li>Live stats: overdue, due today, yours</li>
            </ul>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-card">
            <p className="auth-kicker">Sign in</p>
            <h1>Welcome back</h1>
            <p className="muted">Use your work email and password.</p>

            <form onSubmit={onSubmit} className="form">
              {error ? <div className="alert error">{error}</div> : null}
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button 
                type="submit" 
                className="btn primary" 
                disabled={loading || !email || !password}
                style={{ opacity: loading || !email || !password ? 0.6 : 1 }}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="demo-panel">
              <button
                type="button"
                className="demo-panel-toggle"
                onClick={() => setDemoOpen((o) => !o)}
                aria-expanded={demoOpen}
              >
                <span className="demo-panel-toggle-label">Demo accounts</span>
                <span className="demo-panel-chevron">{demoOpen ? "▼" : "▶"}</span>
              </button>
              {demoOpen ? (
                <div className="demo-panel-body">
                  <p className="muted small demo-hint">
                    After running <code className="inline-code">npm run db:seed</code> in{" "}
                    <code className="inline-code">server/</code>, click a row to fill the form.
                  </p>
                  <div className="demo-table-wrap">
                    <table className="demo-table">
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>Account</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {DEMO_ACCOUNTS.map((a) => (
                          <tr key={a.email}>
                            <td>
                              <span className={`demo-role ${a.role === "Admin" ? "admin" : ""}`}>{a.role}</span>
                            </td>
                            <td>
                              <div className="demo-who">{a.subtitle}</div>
                              <div className="demo-email mono">{a.email}</div>
                            </td>
                            <td>
                              <button type="button" className="btn secondary sm" onClick={() => fillDemo(a)}>
                                Use
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>

            <p className="muted small auth-footer">
              No account? <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
