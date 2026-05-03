# TaskFlow (Team Task Manager)

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
| Deploy   | Docker, Railway, **Vercel** (static UI + serverless API; see below) |

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

5. Optional — **demo accounts** (admin + three members, sample project **TaskFlow HQ** and tasks):

   ```bash
   cd server && npm run db:seed
   ```

   Sign in with e.g. `admin@taskflow.com` / `admin@123` (see login page for the full list).

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

## Deploy on Vercel (full stack on Vercel)

Vercel runs the **Express API** from the root **`index.ts`** (default export) and serves the UI from **`public/`**. The build copies `client/dist` → `public` (see `vercel.json`); routes stay under **`/api/...`**. You still need **hosted PostgreSQL** (e.g. [Neon](https://neon.tech), Supabase, or Vercel Postgres)—Vercel does not replace the database.

1. Create a Postgres database and copy its connection string (`DATABASE_URL`). Use a URL that allows SSL (often `?sslmode=require`).

2. In Vercel → your project → **Settings → Environment Variables** (Production + Preview as needed):

   - **`DATABASE_URL`** — required for build (`prisma migrate deploy`) and runtime.
   - **`JWT_SECRET`** — long random string (required in production).
   - **`CLIENT_ORIGIN`** — optional; leave unset to allow any browser origin, or set your site URL(s), comma-separated for previews.

   Do **not** set **`VITE_API_BASE_URL`** for this setup—the browser should call **`/api`** on the same Vercel hostname.

3. **Import** the GitHub repo with **Root Directory** = repository root (so `vercel.json`, `api/`, `server/`, and `client/` are all used).

4. Deploy. The build runs `prisma generate`, `prisma migrate deploy`, compiles the server, and builds the client.

5. **Demo data** (optional): from your machine, with production `DATABASE_URL`:

   ```bash
   cd server && npm ci && npm run db:seed
   ```

6. Check **`GET https://your-project.vercel.app/api/health`** → `{"ok":true}`. Sign in at your site URL.

### Split hosting (API on Railway, UI on Vercel)

If the API stays on another host, build only the client on Vercel and set **`VITE_API_BASE_URL`** to that API origin (no `/api` suffix). Configure **`CLIENT_ORIGIN`** on the API for your Vercel URL(s). Root **`vercel.json`** in this repo targets **full stack on Vercel**; for client-only root directory you can use **`client/`** and `client/vercel.json` instead.

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
