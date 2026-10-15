import Bento from "@/components/Bento";
import { canUnlock, isOwner } from "@/lib/owner";
import { getSiteData } from "@/lib/site";

export default async function Page() {
  const [data, owner] = await Promise.all([getSiteData(), isOwner()]);
  return (
    <Bento
      initialTiles={data.tiles}
      initialThemes={data.themes}
      initialSettings={data.settings}
      // Editing only against live data, never over the code fallback.
      owner={owner && data.live}
      canUnlock={canUnlock() && data.live}
    />
  );
}
