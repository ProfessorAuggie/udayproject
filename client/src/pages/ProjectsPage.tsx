import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  role: "ADMIN" | "MEMBER";
  isOwner: boolean;
  taskCount: number;
  memberCount: number;
  updatedAt: string;
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await api<{ projects: ProjectRow[] }>("/projects");
      setProjects(r.projects);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/projects", { method: "POST", json: { name, description: description || null } });
      setName("");
      setDescription("");
      setCreating(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h1>Projects</h1>
          <p className="muted">Spaces for your team and tasks.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setCreating((c) => !c)}>
          {creating ? "Cancel" : "New project"}
        </button>
      </header>

      {creating ? (
        <form className="panel form inline-create" onSubmit={createProject}>
          <h2>New project</h2>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>
          <button type="submit" className="btn primary">
            Create
          </button>
        </form>
      ) : null}

      {error ? <div className="alert error">{error}</div> : null}

      {projects.length === 0 && !error ? (
        <p className="muted">No projects yet. Create one to get started.</p>
      ) : (
        <ul className="project-grid">
          {projects.map((p) => (
            <li key={p.id}>
              <Link to={`/projects/${p.id}`} className="project-card">
                <div className="project-card-head">
                  <h3>{p.name}</h3>
                  <span className={`pill ${p.role === "ADMIN" ? "admin" : ""}`}>
                    {p.isOwner ? "Owner" : p.role === "ADMIN" ? "Admin" : "Member"}
                  </span>
                </div>
                {p.description ? <p className="small muted">{p.description}</p> : null}
                <div className="project-meta">
                  <span>{p.taskCount} tasks</span>
                  <span>{p.memberCount} people</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
