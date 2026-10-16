// Daily backup to Notion, called by Vercel Cron (vercel.json). If CRON_SECRET
// is set, Vercel sends it and only that caller is accepted; either way a backup
// is skipped if the last one is under 12h old, so extra calls are harmless.
import { runBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    return Response.json(await runBackup("daily", 12 * 3600_000));
  } catch (e) {
    console.error("Backup failed", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
