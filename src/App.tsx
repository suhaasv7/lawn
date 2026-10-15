import React, { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createSwapy, Swapy } from "swapy";
import { SignInButton, SignInModal } from "./modules/auth";
import { GithubIcon } from "./components/BrandIcons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Tick01Icon,
  Drag01Icon,
  RefreshIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { TILES, SITE_NAME, Tile, Size, Tone } from "./tiles";
import "./App.css";

const STORAGE_KEY = "lawn_layout_v2";
const TILE_IDS = TILES.map((t) => t.id);
const TILE_BY_ID = Object.fromEntries(TILES.map((t) => [t.id, t]));

// Size belongs to the tile, not the slot: a slot takes the span of whatever it
// holds, and grid-flow-dense backfills holes, so moving the 2x2 intro into a
// 1x1 spot reflows the grid instead of squashing the card.
const SIZE: Record<Size, string> = {
  sm: "",
  wide: "md:col-span-2",
  tall: "row-span-2",
  lg: "md:col-span-2 row-span-2",
};

const TONE: Record<Tone, string> = {
  paper: "bg-[#ece7db] text-[#151411]",
  red: "bg-[#8f2e22] text-[#f5f0e8]",
  blue: "bg-[#1f2c68] text-[#f5f0e8]",
  green: "bg-[#224724] text-[#f5f0e8]",
  dark: "bg-[#171513] text-[#ece7db]",
};

// Saved order minus removed tiles, plus new tiles at the end.
function loadOrder(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(saved)) {
      const kept = [...new Set(saved)].filter((id) => TILE_IDS.includes(id));
      return [...kept, ...TILE_IDS.filter((id) => !kept.includes(id))];
    }
  } catch (e) {
    console.error("Failed to read saved layout", e);
  }
  return TILE_IDS;
}

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// ponytail: microlink's free tier (~50 previews/day per visitor IP); set `image`
// on the tile or self-host screenshots if that ever runs dry.
const preview = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

function Clock({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      {now.toLocaleTimeString("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" })}
    </>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[0.65rem] uppercase tracking-widest opacity-60">{children}</div>
);

function TileCard({ tile, isEditing }: { tile: Tile; isEditing: boolean }) {
  const base = `bento-card corner-crosshair w-full h-full flex flex-col ${TONE[tile.tone]}`;

  switch (tile.kind) {
    case "intro":
      return (
        <div className={`${base} justify-between p-8 sm:p-10`}>
          <Label>hello</Label>
          <div>
            <h1 className="text-[3rem] sm:text-[4rem] font-bold leading-[0.95] tracking-tight mb-5">
              {tile.name}
              <span className="text-[#c59f52]">.</span>
            </h1>
            <p className="text-[0.85rem] leading-relaxed opacity-75 max-w-[420px]">{tile.blurb}</p>
          </div>
          <div className="flex justify-between text-[0.65rem] uppercase tracking-widest opacity-50">
            <span>lawn.</span>
            <span>since 2025</span>
          </div>
        </div>
      );

    case "link":
      return (
        <a
          href={tile.url}
          target="_blank"
          rel="noreferrer"
          draggable={false}
          // A drop ends with a click on the card; don't navigate mid-edit.
          onClick={(e) => isEditing && e.preventDefault()}
          className={`${base} gap-3 p-4 no-underline group`}
        >
          <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-widest opacity-70">
            <img
              src={`https://www.google.com/s2/favicons?domain=${host(tile.url)}&sz=64`}
              alt=""
              width={14}
              height={14}
              draggable={false}
            />
            <span className="truncate">{host(tile.url)}</span>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={14}
              strokeWidth={1.5}
              className="ml-auto shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
          {/* absolute img: a 2560px screenshot must not stretch the grid row */}
          <div className="relative flex-1 min-h-[56px] overflow-hidden border border-current/15 bg-black/20">
            <img
              src={tile.image ?? preview(tile.url)}
              alt={`Preview of ${host(tile.url)}`}
              loading="lazy"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            />
          </div>
          <div className="min-w-0">
            <div className="text-[1.25rem] font-bold leading-tight tracking-tight">{tile.title}</div>
            {tile.note && <div className="text-[0.7rem] opacity-70 truncate">{tile.note}</div>}
          </div>
        </a>
      );

    case "note":
      return (
        <div className={`${base} justify-between p-6`}>
          <Label>{tile.label}</Label>
          <p className="text-[1rem] sm:text-[1.15rem] leading-snug font-semibold tracking-tight">{tile.text}</p>
        </div>
      );

    case "list":
      return (
        <div className={`${base} p-6`}>
          <Label>{tile.label}</Label>
          <ul className="list-none p-0 m-0 mt-auto space-y-2 text-[0.8rem]">
            {tile.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#c59f52]">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case "clock":
      return (
        <div className={`${base} justify-between p-6`}>
          <Label>{tile.label}</Label>
          <div>
            <div className="text-[2.6rem] font-bold leading-none tracking-tight tabular-nums">
              <Clock timeZone={tile.timeZone} />
            </div>
            <div className="text-[0.68rem] opacity-60 mt-2">{tile.timeZone.split("/").pop()?.replace("_", " ")}</div>
          </div>
        </div>
      );
  }
}

function App() {
  const [order, setOrder] = useState<string[]>(loadOrder);
  const [resetFeedback, setResetFeedback] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const swapyRef = useRef<Swapy | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // manualSwap: React owns the DOM. Swapy only reports swaps; letting it move
    // nodes itself desyncs React's tree (cards vanish/duplicate, removeChild crash).
    const swapy = createSwapy(containerRef.current, {
      animation: "spring",
      swapMode: "drop",
      manualSwap: true,
      enabled: false,
    });

    swapyRef.current = swapy;

    swapy.onSwap((event) => {
      const map = event.newSlotItemMap.asObject;
      // Swapy re-reads the DOM next frame, so the render must land before then.
      flushSync(() => setOrder((prev) => prev.map((id, i) => map[`slot-${i}`] ?? id)));
    });

    return () => {
      swapy.destroy();
      swapyRef.current = null;
    };
  }, []);

  useEffect(() => {
    swapyRef.current?.enable(isEditing);
  }, [isEditing]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch (err) {
      console.error("Error persisting layout", err);
    }
  }, [order]);

  const handleResetLayout = () => {
    setOrder(TILE_IDS);
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 1600);

    requestAnimationFrame(() => {
      swapyRef.current?.update();
    });
  };

  return (
    <div className="canvas-bg min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col">
      {/* ── TOP NAV ── */}
      <header
        className="bento-card flex flex-wrap justify-between items-center gap-3 px-6 py-3.5 mb-4 max-w-[1240px] w-full mx-auto"
        style={{ backgroundColor: "#171513" }}
      >
        <a
          href="#"
          className="text-[1.25rem] font-bold text-[#ece7db] tracking-tight hover:opacity-90 no-underline"
        >
          lawn<span className="text-[#c59f52]">.</span>
        </a>

        <nav className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setIsEditing((v) => !v)}
            aria-pressed={isEditing}
            title={isEditing ? "Finish rearranging" : "Rearrange tiles"}
            className={`flex items-center gap-1.5 text-[0.68rem] uppercase tracking-wider transition-colors border px-2.5 py-1 cursor-pointer ${
              isEditing
                ? "text-[#151411] bg-[#c59f52] border-[#c59f52]"
                : "text-[rgba(236,231,219,0.75)] hover:text-[#c59f52] border-[#3d3830] bg-[#100f0d] hover:border-[#c59f52]"
            }`}
          >
            <HugeiconsIcon icon={isEditing ? Tick01Icon : PencilEdit01Icon} size={13} strokeWidth={1.5} />
            <span>{isEditing ? "Done" : "Edit"}</span>
          </button>

          {isEditing && (
            <button
              onClick={handleResetLayout}
              title="Reset layout to default"
              className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-wider text-[rgba(236,231,219,0.75)] hover:text-[#c59f52] transition-colors border border-[#3d3830] bg-[#100f0d] hover:border-[#c59f52] px-2.5 py-1 cursor-pointer"
            >
              <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
              <span>{resetFeedback ? "Layout Reset" : "Reset"}</span>
            </button>
          )}

          <SignInButton />
        </nav>
      </header>

      {/* ── TICKER ── */}
      <div
        className="bento-card max-w-[1240px] w-full mx-auto mb-4 p-0 overflow-hidden flex items-center"
        style={{ backgroundColor: "#141210", height: "44px" }}
      >
        <div className="ticker-wrapper">
          <div className="ticker-track">
            {[...Array(2)].map((_, j) =>
              ["things i make", "links i like", "notes", "experiments", "work in progress", "always growing"].map(
                (t, i) => (
                  <span
                    key={`${j}-${i}`}
                    className="px-8 text-[0.78rem] uppercase tracking-widest text-[rgba(236,231,219,0.55)] flex items-center gap-3"
                  >
                    <span>{t}</span>
                    <span className="text-[#c59f52] text-xs">&#9733;</span>
                  </span>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* ── BENTO GRID ── */}
      <main
        ref={containerRef}
        className={`${isEditing ? "editing " : ""}grid grid-flow-row-dense grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1240px] w-full mx-auto`}
        style={{ gridAutoRows: "minmax(180px, auto)" }}
      >
        {order.map((id, i) => {
          const tile = TILE_BY_ID[id];
          return (
            <div key={`slot-${i}`} data-swapy-slot={`slot-${i}`} className={`w-full h-full ${SIZE[tile.size]}`}>
              <div key={id} data-swapy-item={id} className="relative w-full h-full">
                <TileCard tile={tile} isEditing={isEditing} />
                {isEditing && (
                  <div className="drag-grip absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none" aria-hidden>
                    <HugeiconsIcon icon={Drag01Icon} size={14} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      <SignInModal />

      {/* ── FOOTER ── */}
      <footer
        className="bento-card flex flex-wrap justify-between items-center gap-4 px-6 py-4 mt-8 max-w-[1240px] w-full mx-auto text-[0.72rem] text-[rgba(236,231,219,0.55)]"
        style={{ backgroundColor: "#171513" }}
      >
        <span>
          &copy; {new Date().getFullYear()} {SITE_NAME} · <span className="text-[#ece7db] font-bold">lawn.</span>
        </span>
        <a
          href="https://github.com/suhaasv7"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-[rgba(236,231,219,0.6)] hover:text-[#c59f52] transition-colors no-underline"
        >
          <GithubIcon width={14} height={14} />
          github
        </a>
      </footer>
    </div>
  );
}

export default App;
