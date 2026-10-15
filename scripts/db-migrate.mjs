// Applies supabase/migrations/*.sql in filename order, each once (tracked in
// supabase_migrations.schema_migrations, same as the Supabase CLI), then stores
// the hash of LAWN_WRITE_SECRET as the owner key and prints row counts.
//
//   npm run db:migrate        (reads .env.local)
//
// Needs SUPABASE_URL, LAWN_WRITE_SECRET and SUPABASE_ACCESS_TOKEN — a personal
// token from https://supabase.com/dashboard/account/tokens (local only, never
// add it to Vercel).
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const { SUPABASE_URL, SUPABASE_ACCESS_TOKEN, LAWN_WRITE_SECRET } = process.env;
const ref = SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
if (!ref || !SUPABASE_ACCESS_TOKEN || !LAWN_WRITE_SECRET) {
  console.error("Missing SUPABASE_URL, SUPABASE_ACCESS_TOKEN or LAWN_WRITE_SECRET in .env.local");
  process.exit(1);
}

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${body}`);
  return body ? JSON.parse(body) : [];
}

await sql(`
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
`);
const applied = new Set((await sql("select version from supabase_migrations.schema_migrations")).map((r) => r.version));

const dir = new URL("../supabase/migrations/", import.meta.url);
for (const file of readdirSync(dir).sort()) {
  const m = file.match(/^(\d+)_(\w+)\.sql$/);
  if (!m) continue;
  const [, version, name] = m;
  if (applied.has(version)) {
    console.log(`skip   ${file}`);
    continue;
  }
  // Sent as one multi-statement query, which Postgres runs as a single
  // transaction: the migration and its record land together or not at all.
  await sql(
    `${readFileSync(new URL(file, dir), "utf8")}
insert into supabase_migrations.schema_migrations (version, name) values ('${version}', '${name}');`
  );
  console.log(`apply  ${file}`);
}

const hash = createHash("sha256").update(LAWN_WRITE_SECRET).digest("hex");
await sql(`
  insert into private.owner (id, secret_sha256) values (1, '${hash}')
  on conflict (id) do update set secret_sha256 = excluded.secret_sha256;
`);
console.log("owner  key stored (sha256 of LAWN_WRITE_SECRET)");

const [rows] = await sql(`
  select (select count(*) from public.tiles)::int as tiles,
         (select count(*) from public.themes)::int as themes,
         (select count(*) from public.site_settings)::int as settings
`);
console.log("rows  ", rows);
