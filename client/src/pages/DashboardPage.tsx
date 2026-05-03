import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

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

export function DashboardPage() {
  const [data, setData] = useState<{ summary: Summary; recentTasks: RecentTask[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  if (!data) return <div className="page-muted">Loading dashboard…</div>;

  const { summary, recentTasks } = data;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="muted">Overview of tasks across your projects.</p>
      </header>

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
          <p className="muted">No tasks yet. Create a project and add tasks.</p>
        ) : (
          <ul className="task-list compact">
            {recentTasks.map((t) => (
              <li key={t.id}>
                <Link to={`/projects/${t.project.id}`} className="task-link">
                  <span className={`pill status-${t.status}`}>{formatStatus(t.status)}</span>
                  <span className="task-title">{t.title}</span>
                  <span className="muted small">{t.project.name}</span>
                  {t.dueDate ? (
                    <span className={`small ${isOverdue(t.dueDate, t.status) ? "text-warn" : ""}`}>
                      Due {formatDate(t.dueDate)}
                    </span>
                  ) : null}
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
