const TOKEN_KEY = "ttm_token";

function normalizeApiBase(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  let b = raw.trim().replace(/\/$/, "");
  if (b.endsWith("/api")) b = b.replace(/\/api$/, "");
  return b;
}

/** Production (split deploy): set `VITE_API_BASE_URL` to your API origin only, e.g. https://xxx.up.railway.app — no `/api` suffix. */
const API_PREFIX = (() => {
  const base = normalizeApiBase(import.meta.env.VITE_API_BASE_URL as string | undefined);
  return base ? `${base}/api` : "/api";
})();

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export type ApiError = { error?: unknown; message?: unknown; details?: unknown };

function messageFromApiPayload(data: unknown, res: Response): string {
  const fallback = res.statusText || `Request failed (${res.status})`;
  if (!data || typeof data !== "object") return fallback;
  const o = data as Record<string, unknown>;
  const err = o.error;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const m = (err as Record<string, unknown>).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  const top = o.message;
  if (typeof top === "string" && top.trim()) return top;
  if (typeof err === "number") return String(err);
  return fallback;
}

function parseJsonBody(text: string, res: Response): unknown {
  const t = text.trim();
  if (!t) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const hint =
      t.startsWith("<!") || t.startsWith("<html")
        ? " The response was HTML, not JSON — usual causes: frontend still pointing at this host for /api (set VITE_API_BASE_URL to your API and redeploy), or the API URL is wrong."
        : "";
    throw new Error(
      `Could not read server response (${res.status}).${hint}`.trim(),
    );
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined = init?.body;
  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }

  const url = `${API_PREFIX}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, body });
  } catch (e) {
    const msg =
      e instanceof TypeError
        ? "Cannot reach the API. Is the server running? If this site is on Vercel, set environment variable VITE_API_BASE_URL to your backend URL (e.g. Railway) and redeploy."
        : "Network request failed.";
    throw new Error(msg);
  }

  const text = await res.text();
  const data = parseJsonBody(text, res);

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    throw new Error(messageFromApiPayload(data, res));
  }
  return data as T;
}
