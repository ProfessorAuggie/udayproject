import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function RegisterPage() {
  const { user, ready, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
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
            <h2 className="auth-aside-title">Join a workspace in seconds.</h2>
            <p className="auth-aside-copy">
              Create your profile, then start a project or wait for an invite from an admin.
            </p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-card">
            <p className="auth-kicker">Register</p>
            <h1>Create account</h1>
            <p className="muted">Start organizing work with your team.</p>

            <form onSubmit={onSubmit} className="form">
              {error ? <div className="alert error">{error}</div> : null}
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required minLength={1} />
              </label>
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </label>
              <button 
                type="submit" 
                className="btn primary" 
                disabled={loading || !email || !password || !name}
                style={{ opacity: loading || !email || !password || !name ? 0.6 : 1 }}
              >
                {loading ? "Creating account…" : "Sign up"}
              </button>
            </form>

            <p className="muted small auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
