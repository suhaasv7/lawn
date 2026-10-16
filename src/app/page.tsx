import Bento from "@/components/Bento";
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
