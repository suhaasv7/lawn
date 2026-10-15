// Server-only Supabase access over its REST API (PostgREST). Plain fetch keeps
// us off the supabase-js dependency for a handful of selects and writes.
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

export const dbConfigured = Boolean(URL && KEY);

async function rest<T>(path: string, init?: RequestInit & { headers?: Record<string, string> }): Promise<T> {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY!, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${body}`);
  return (body ? JSON.parse(body) : undefined) as T;
}

export const select = <T>(table: string, query: string) => rest<T[]>(`${table}?${query}`);

// Writes carry LAWN_WRITE_SECRET in x-lawn-secret; the tables' "Owner writes"
// policies only let a write through when its sha256 matches private.owner.
// Returns the affected rows, so a write the policies filtered out shows up as [].
export function write<T = unknown>(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown, prefer = "") {
  const secret = process.env.LAWN_WRITE_SECRET;
  if (!secret) throw new Error("Saving is off: LAWN_WRITE_SECRET isn't set.");
  return rest<T[]>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "x-lawn-secret": secret, Prefer: ["return=representation", prefer].filter(Boolean).join(",") },
  });
}
