import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";

type Member = {
  userId: string;
  role: "ADMIN" | "MEMBER";
  user: { id: string; name: string; email: string };
  isOwner?: boolean;
};

type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string; email: string };
  members: { userId: string; role: "ADMIN" | "MEMBER"; user: { id: string; name: string; email: string }; joinedAt: string }[];
  taskCount: number;
  yourRole: "ADMIN" | "MEMBER";
  isOwner: boolean;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
};

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const isAdmin = project?.yourRole === "ADMIN";

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setError(null);
    try {
      const [p, m, t] = await Promise.all([
        api<{ project: ProjectDetail }>(`/projects/${projectId}`),
        api<{ members: Member[] }>(`/projects/${projectId}/members`),
        api<{ tasks: TaskRow[] }>(`/projects/${projectId}/tasks`),
      ]);
      setProject(p.project);
      setMembers(m.members);
      setTasks(t.tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load project");
    }
  }, [projectId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const memberOptions = useMemo(() => {
    return members.map((m) => ({
      id: m.userId,
      label: `${m.user.name}${m.isOwner ? " (owner)" : ""}`,
    }));
  }, [members]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setError(null);
    try {
      await api(`/projects/${projectId}/members`, {
        method: "POST",
        json: { email: inviteEmail, role: inviteRole },
      });
      setInviteEmail("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    }
  }

  async function removeMember(userId: string) {
    if (!projectId) return;
    if (!confirm("Remove this member?")) return;
    setError(null);
    try {
      await api(`/projects/${projectId}/members/${userId}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  }

  async function changeMemberRole(userId: string, role: "ADMIN" | "MEMBER") {
    if (!projectId) return;
    setError(null);
    try {
      await api(`/projects/${projectId}/members/${userId}`, { method: "PATCH", json: { role } });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setError(null);
    try {
      await api(`/projects/${projectId}/tasks`, {
        method: "POST",
        json: {
          title: taskTitle,
          dueDate: taskDue ? new Date(taskDue).toISOString() : null,
        },
      });
      setTaskTitle("");
      setTaskDue("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task create failed");
    }
  }

  async function updateTask(
    task: TaskRow,
    patch: {
      status?: TaskRow["status"];
      title?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
    },
  ) {
    setError(null);
    try {
      const body: Record<string, unknown> = { ...patch };
      await api(`/tasks/${task.id}`, { method: "PATCH", json: body });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    setError(null);
    try {
      await api(`/tasks/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function deleteProject() {
    if (!projectId || !project?.isOwner) return;
    if (!confirm("Delete this entire project? This cannot be undone.")) return;
    setError(null);
    try {
      await api(`/projects/${projectId}`, { method: "DELETE" });
      navigate("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (!projectId) return null;
  if (error && !project) return <div className="alert error">{error}</div>;
  if (!project) return <div className="page-muted">Loading…</div>;

  return (
    <div className="page">
      <nav className="breadcrumb">
        <Link to="/projects">Projects</Link>
        <span>/</span>
        <span>{project.name}</span>
      </nav>

      <header className="page-header row">
        <div>
          <h1>{project.name}</h1>
          <p className="muted">
            Owner: {project.owner.name} · You are {project.isOwner ? "owner" : project.yourRole.toLowerCase()}
          </p>
        </div>
        {project.isOwner ? (
          <button type="button" className="btn danger ghost" onClick={() => void deleteProject()}>
            Delete project
          </button>
        ) : null}
      </header>

      {error ? <div className="alert error">{error}</div> : null}

      {project.description ? <p className="lead">{project.description}</p> : null}

      <div className="two-col">
        <section className="panel">
          <h2>Team</h2>
          {isAdmin ? (
            <form className="form row-form" onSubmit={addMember}>
              <input
                type="email"
                placeholder="Invite by email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button type="submit" className="btn secondary sm">
                Add
              </button>
            </form>
          ) : null}
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.userId}>
                <div>
                  <strong>{m.user.name}</strong>
                  <span className="muted small">{m.user.email}</span>
                </div>
                <div className="member-actions">
                  <span className={`pill ${m.role === "ADMIN" || m.isOwner ? "admin" : ""}`}>
                    {m.isOwner ? "Owner" : m.role}
                  </span>
                  {isAdmin && !m.isOwner && m.userId !== user?.id ? (
                    <>
                      <select
                        className="sm"
                        value={m.role}
                        onChange={(e) => void changeMemberRole(m.userId, e.target.value as "ADMIN" | "MEMBER")}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button type="button" className="btn ghost sm" onClick={() => void removeMember(m.userId)}>
                        Remove
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Add task</h2>
          <form className="form row-form" onSubmit={createTask}>
            <input
              placeholder="Task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            />
            <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
            <button type="submit" className="btn primary sm">
              Add
            </button>
          </form>
        </section>
      </div>

      <section className="panel">
        <h2>Tasks ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <p className="muted">No tasks yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="task-cell-title">{t.title}</div>
                      {t.description ? <div className="small muted">{t.description}</div> : null}
                    </td>
                    <td>
                      <select
                        className="sm"
                        value={t.status}
                        onChange={(e) =>
                          void updateTask(t, { status: e.target.value as TaskRow["status"] })
                        }
                      >
                        <option value="TODO">To do</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="sm"
                        value={t.assignee?.id ?? ""}
                        onChange={(e) => {
                          const id = e.target.value || null;
                          void updateTask(t, { assigneeId: id });
                        }}
                      >
                        <option value="">Unassigned</option>
                        {memberOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="sm"
                        value={t.dueDate ? t.dueDate.slice(0, 10) : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          void updateTask(t, {
                            dueDate: v ? new Date(v).toISOString() : null,
                          });
                        }}
                      />
                    </td>
                    <td className="actions">
                      {isAdmin ? (
                        <button type="button" className="btn ghost sm" onClick={() => void deleteTask(t.id)}>
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
