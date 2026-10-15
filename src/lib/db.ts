// Server-only Supabase access over its REST API (PostgREST). Plain fetch keeps
// us off the supabase-js dependency for three selects and four RPCs.
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

export const dbConfigured = Boolean(URL && KEY);

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY!, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${body}`);
  return (body ? JSON.parse(body) : undefined) as T;
}

export const select = <T>(table: string, query: string) => rest<T[]>(`${table}?${query}`);

export const rpc = <T = void>(fn: string, args: Record<string, unknown>) =>
  rest<T>(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
