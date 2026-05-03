# Team Task Manager

Full-stack web app for **projects**, **team membership**, and **tasks** with **Admin / Member** roles, JWT authentication, and a **PostgreSQL** database (via Prisma).

## Features

- **Auth**: Sign up, log in, JWT sessions (`Authorization: Bearer …`)
- **Projects**: Create projects; owner is implicit **Admin**
- **Team**: Admins invite users by email and set role **ADMIN** or **MEMBER**
- **Tasks**: Create, assign, set status (`TODO` / `IN_PROGRESS` / `DONE`), due dates
- **Dashboard**: Totals by status, overdue count, due today, open tasks assigned to you
- **RBAC**: Route and field-level rules (e.g. only admins delete tasks; members update assigned / own tasks)

## Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| API      | Node.js 22, Express 5, TypeScript   |
| ORM / DB | Prisma 6, PostgreSQL                |
| Client   | React 19, Vite 6, React Router 7    |
| Deploy   | Docker (see `Dockerfile`), Railway, Vercel (SPA) |

## Local development

### Prerequisites

- Node.js 22+
- PostgreSQL (local or Docker) and a `DATABASE_URL`

### Setup

1. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and `JWT_SECRET`.

2. Install and migrate:

   ```bash
   cd server && npm install && npx prisma migrate deploy
   ```

3. Terminal A — API (port **4000**):

   ```bash
   cd server && npm run dev
   ```

4. Terminal B — client (port **5173**, proxies `/api` to the server):

   ```bash
   cd client && npm install && npm run dev
   ```

Open `http://localhost:5173`.

## Production build (local)

```bash
cd client && npm run build
cd server && npm run build
cd server && npx prisma migrate deploy && node dist/index.js
```

The server serves the SPA from `client/dist` when `index.html` is present.

## Deploy on Railway

1. Create a **new project** on [Railway](https://railway.app).

2. Add a **PostgreSQL** plugin and note the **`DATABASE_URL`** (Railway usually injects this into your service).

3. Add a **new service** from this GitHub repo. The included `railway.toml` uses the root **`Dockerfile`**.

4. In the service **Variables**, set at minimum:

   - `DATABASE_URL` — reference the Postgres variable if not already linked.
   - `JWT_SECRET` — long random string (required in production).

   Optional: `CLIENT_ORIGIN` — your public app URL if you need a strict CORS allowlist.

5. Deploy. The container runs `prisma migrate deploy` then starts the API on **`PORT`** (Railway sets this automatically).

6. Smoke-test: `GET /api/health` should return `{"ok":true}`; open the app URL in a browser.

## Deploy on Vercel (frontend)

Keep the **API** on Railway (or any host that runs Node + PostgreSQL). Vercel hosts the **static Vite build** only.

1. In Vercel, **Import** this repo. You can leave **Root Directory** at the repo root: root **`vercel.json`** installs and builds only `client/` and sets **Output Directory** to `client/dist` (so the default `public` folder is not used). Alternatively, set Root Directory to `client` and rely on `client/vercel.json` instead.
2. Under **Environment Variables**, add **`VITE_API_BASE_URL`** with your public API origin (no path, no trailing slash), for example `https://your-service.up.railway.app`.
3. On the **server**, set **`CLIENT_ORIGIN`** to your Vercel site URL (for example `https://your-app.vercel.app`) so CORS allows the browser. Redeploy the API after changing it.
4. Deploy the Vercel project. SPA rewrites are configured in `vercel.json` (root) or `client/vercel.json` (if the root directory is `client`).

## REST API (summary)

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/auth/register` | Body: `email`, `password`, `name` |
| POST | `/api/auth/login` | Body: `email`, `password` |
| GET | `/api/auth/me` | Bearer token |
| GET | `/api/projects` | List projects for current user |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:projectId` | Detail + membership |
| PATCH | `/api/projects/:projectId` | Admin |
| DELETE | `/api/projects/:projectId` | **Owner only** |
| GET/POST | `/api/projects/:projectId/members` | List / invite (admin for POST) |
| PATCH/DELETE | `/api/projects/:projectId/members/:userId` | Admin |
| GET/POST | `/api/projects/:projectId/tasks` | List / create |
| PATCH/DELETE | `/api/tasks/:taskId` | Permissions per role / assignee / creator |
| GET | `/api/dashboard` | Aggregated stats |

## Submission checklist

- [ ] Push to **GitHub**
- [ ] Deploy live app on **Railway** (working signup → project → tasks)
- [ ] Record **2–5 minute demo** (auth, roles, tasks, dashboard)

## License

MIT (adjust for your course / organization if needed).
