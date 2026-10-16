import Bento from "@/components/Bento";

// Backups to Notion run inside this page's server actions and can take a while.
export const maxDuration = 60;
import { getSiteData } from "@/lib/site";

export default async function Page() {
  const data = await getSiteData();
  return (
    <Bento
      initialTiles={data.tiles}
      initialZones={data.zones}
      initialThemes={data.themes}
      initialSettings={data.settings}
      // Editing only against live data, never over the code fallback.
      editable={data.live && Boolean(process.env.LAWN_WRITE_SECRET)}
    />
  );
}
