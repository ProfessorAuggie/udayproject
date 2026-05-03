import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveClientDist(): string {
  if (process.env.CLIENT_DIST) {
    return path.resolve(process.env.CLIENT_DIST);
  }
  const candidates = [
    path.resolve(__dirname, "../../client/dist"),
    path.resolve(__dirname, "../client/dist"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return candidates[0];
}

function corsOrigin(): boolean | string | string[] {
  const raw = process.env.CLIENT_ORIGIN?.trim();
  if (!raw) return true;
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return true;
  if (list.length === 1) return list[0];
  return list;
}

/**
 * @param includeStatic When true (Docker/local monolith), serve the Vite build and SPA fallback. When false (Vercel serverless), only API routes — static files come from the Vercel deployment output.
 */
export function createServerApp(includeStatic: boolean): express.Application {
  const app = express();

  app.use(
    cors({
      origin: corsOrigin(),
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api", tasksRouter);
  app.use("/api/dashboard", dashboardRouter);

  if (includeStatic) {
    const clientDist = resolveClientDist();
    app.use(express.static(clientDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"), (err) => {
        if (err) next();
      });
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
