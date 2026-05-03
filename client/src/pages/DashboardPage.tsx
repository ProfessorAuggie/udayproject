import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";

type Summary = {
  totalTasks: number;
  byStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
  overdue: number;
  dueToday: number;
  myAssignedOpen: number;
};

type RecentTask = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  project: { id: string; name: string };
  assignee: { id: string; name: string } | null;
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ summary: Summary; recentTasks: RecentTask[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lead = useMemo(() => `${greeting()}, ${user?.name?.split(" ")[0] ?? "there"}.`, [user?.name]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api<{ summary: Summary; recentTasks: RecentTask[] }>("/dashboard");
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) {
    return (
      <div className="page">
        <div className="loading-hero">
          <div className="skeleton skeleton-line lg" />
          <div className="skeleton skeleton-line md" />
          <div className="skeleton stat-skel-grid">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        </div>
      </div>
    );
  }

  const { summary, recentTasks } = data;

  return (
    <div className="page">
      <section className="dashboard-hero">
        <div>
          <h1 className="dashboard-greet">{lead}</h1>
          <p className="muted lead dashboard-lead">
            Here’s what’s happening across your projects — open work, deadlines, and tasks assigned to you.
          </p>
        </div>
        <Link to="/projects" className="btn primary dashboard-cta">
          Open projects
        </Link>
      </section>

      <section className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total tasks</span>
          <span className="stat-value">{summary.totalTasks}</span>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">Overdue</span>
          <span className="stat-value">{summary.overdue}</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-label">Due today</span>
          <span className="stat-value">{summary.dueToday}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Assigned to you (open)</span>
          <span className="stat-value">{summary.myAssignedOpen}</span>
        </div>
      </section>

      <section className="panel">
        <h2>By status</h2>
        <div className="status-bars">
          {(
            [
              ["To do", summary.byStatus.TODO, "var(--bar-todo)"],
              ["In progress", summary.byStatus.IN_PROGRESS, "var(--bar-progress)"],
              ["Done", summary.byStatus.DONE, "var(--bar-done)"],
            ] as const
          ).map(([label, count, color]) => (
            <div key={label} className="status-row">
              <span>{label}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${summary.totalTasks ? (count / summary.totalTasks) * 100 : 0}%`,
                    background: color,
                  }}
                />
              </div>
              <span className="mono">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Recently updated</h2>
          <Link to="/projects" className="link">
            All projects →
          </Link>
        </div>
        {recentTasks.length === 0 ? (
          <p className="muted">No tasks yet. Create a project and add tasks to get started.</p>
        ) : (
          <ul className="task-list compact">
            {recentTasks.slice(0, 8).map((t) => (
              <li key={t.id}>
                <Link to={`/projects/${t.project.id}`} className="task-link" title={t.title}>
                  <span className={`pill status-${t.status}`}>{formatStatus(t.status)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="task-title">{t.title}</div>
                    <div className="muted small">{t.project.name}</div>
                  </div>
                  <div className="task-meta">
                    {t.assignee && <span className="small muted">@{t.assignee.name.split(" ")[0]}</span>}
                    {t.dueDate && (
                      <span className={`small ${isOverdue(t.dueDate, t.status) ? "text-warn" : ""}`}>
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isOverdue(iso: string, status: string) {
  if (status === "DONE") return false;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}
