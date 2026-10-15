import React, { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createSwapy, Swapy } from "swapy";
import { SignInButton, SignInModal } from "./modules/auth";
import { GithubIcon } from "./components/BrandIcons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowUpRight01Icon,
  ArrowExpandDiagonal01Icon,
  Cancel01Icon,
  Tick01Icon,
  Drag01Icon,
  RefreshIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { TILES, SITE_NAME, Tile, Tone } from "./tiles";
import "./App.css";

const STORAGE_KEY = "lawn_tiles_v3";
const TILE_IDS = TILES.map((t) => t.id);
const KINDS = ["intro", "link", "note", "list", "clock"];
const MAX_H = 8;

const TONE: Record<Tone, string> = {
  paper: "bg-[#ece7db] text-[#151411]",
  red: "bg-[#8f2e22] text-[#f5f0e8]",
  blue: "bg-[#1f2c68] text-[#f5f0e8]",
  green: "bg-[#224724] text-[#f5f0e8]",
  dark: "bg-[#171513] text-[#ece7db]",
};

function loadTiles(): Tile[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (
      Array.isArray(saved) &&
      saved.every((t) => typeof t?.id === "string" && KINDS.includes(t.kind) && t.w >= 1 && t.h >= 1)
    ) {
      return saved;
    }
  } catch (e) {
    console.error("Failed to read saved tiles", e);
  }
  return TILES;
}

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");
const favicon = (url: string) => `https://www.google.com/s2/favicons?domain=${host(url)}&sz=128`;
const labelOf = (t: Tile) => (t.kind === "link" ? t.title : t.kind === "intro" ? t.name : t.label);

// ponytail: microlink's free tier (~50 previews/day per visitor IP); set `image`
// on the tile or self-host screenshots if that ever runs dry.
const preview = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

const ARROWS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

function Clock({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <>{now.toLocaleTimeString("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" })}</>;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[0.65rem] uppercase tracking-widest opacity-60">{children}</div>
);

function TileCard({ tile, isEditing }: { tile: Tile; isEditing: boolean }) {
  const base = `bento-card corner-crosshair w-full h-full overflow-hidden flex ${TONE[tile.tone]}`;

  switch (tile.kind) {
    case "intro":
      return (
        <div className={`${base} flex-col justify-between p-6 sm:p-8`}>
          <Label>hello</Label>
          <div>
            <h1 className="text-[2.6rem] sm:text-[3.6rem] font-bold leading-[0.95] tracking-tight mb-4">
              {tile.name}
              <span className="text-[#c59f52]">.</span>
            </h1>
            <p className="text-[0.82rem] leading-relaxed opacity-75 max-w-[420px]">{tile.blurb}</p>
          </div>
          <div className="flex justify-between text-[0.65rem] uppercase tracking-widest opacity-50">
            <span>lawn.</span>
            <span>since 2025</span>
          </div>
        </div>
      );

    case "link": {
      const site = host(tile.url);
      const linkProps = {
        href: tile.url,
        target: "_blank",
        rel: "noreferrer",
        draggable: false,
        title: `${tile.title} — ${site}`,
        // A drop ends with a click on the card; don't navigate mid-edit.
        onClick: (e: React.MouseEvent) => isEditing && e.preventDefault(),
      };
      const icon = (size: number) => (
        <img src={favicon(tile.url)} alt="" width={size} height={size} draggable={false} className="shrink-0" />
      );
      const shot = (
        // absolute img: a 2560px screenshot must not stretch the grid row
        <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden border border-current/15 bg-black/20">
          <img
            src={tile.image ?? preview(tile.url)}
            alt={`Preview of ${site}`}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        </div>
      );
      const titleBlock = (
        <div className="min-w-0">
          <div className="text-[1.1rem] font-bold leading-tight tracking-tight truncate">{tile.title}</div>
          <div className="text-[0.68rem] opacity-70 truncate">{tile.note ?? site}</div>
        </div>
      );

      // 1x1: just the favicon, app-icon style.
      if (tile.w === 1 && tile.h === 1) {
        return (
          <a {...linkProps} className={`${base} flex-col items-center justify-center gap-2.5 p-3 no-underline group`}>
            <span className="transition-transform group-hover:scale-110">{icon(44)}</span>
            <span className="text-[0.68rem] opacity-75 truncate max-w-full">{tile.title}</span>
          </a>
        );
      }

      // One row tall: details on the left, preview strip on the right.
      if (tile.h === 1) {
        return (
          <a {...linkProps} className={`${base} gap-4 p-4 no-underline group`}>
            <div className="flex flex-col justify-between w-[42%] shrink-0 min-w-0">
              {icon(28)}
              {titleBlock}
            </div>
            {shot}
          </a>
        );
      }

      return (
        <a {...linkProps} className={`${base} flex-col gap-3 p-4 no-underline group`}>
          <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-widest opacity-70">
            {icon(14)}
            <span className="truncate">{site}</span>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={14}
              strokeWidth={1.5}
              className="ml-auto shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
          {shot}
          {titleBlock}
        </a>
      );
    }

    case "note":
      return (
        <div className={`${base} flex-col justify-between p-5`}>
          <Label>{tile.label}</Label>
          <p className="text-[0.95rem] sm:text-[1.1rem] leading-snug font-semibold tracking-tight">{tile.text}</p>
        </div>
      );

    case "list":
      return (
        <div className={`${base} flex-col p-5`}>
          <Label>{tile.label}</Label>
          <ul className="list-none p-0 m-0 mt-auto space-y-1.5 text-[0.78rem]">
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
        <div className={`${base} flex-col justify-between p-5`}>
          <Label>{tile.label}</Label>
          <div>
            <div className="text-[2.2rem] font-bold leading-none tracking-tight tabular-nums">
              <Clock timeZone={tile.timeZone} />
            </div>
            <div className="text-[0.68rem] opacity-60 mt-1.5">
              {tile.timeZone.split("/").pop()?.replace("_", " ")}
            </div>
          </div>
        </div>
      );
  }
}

function App() {
  const [tiles, setTiles] = useState<Tile[]>(loadTiles);
  // Bumped when tiles are added/removed/reset so Swapy re-reads the slots.
  // Not bumped on swap or resize: those keep the same slots and items.
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [resetFeedback, setResetFeedback] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const swapyRef = useRef<Swapy | null>(null);
  const addDialogRef = useRef<HTMLDialogElement>(null);

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
      flushSync(() =>
        setTiles((prev) => {
          const byId = new Map(prev.map((t) => [t.id, t]));
          return prev.map((t, i) => byId.get(map[`slot-${i}`]) ?? t);
        })
      );
    });

    return () => {
      swapy.destroy();
      swapyRef.current = null;
    };
  }, [layoutVersion]);

  useEffect(() => {
    swapyRef.current?.enable(isEditing);
  }, [isEditing, layoutVersion]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
    } catch (err) {
      console.error("Error persisting tiles", err);
    }
  }, [tiles]);

  const cols = () => getComputedStyle(containerRef.current!).gridTemplateColumns.split(" ").length;

  const resize = (id: string, w: number, h: number) => {
    const cw = Math.max(1, Math.min(w, cols()));
    const ch = Math.max(1, Math.min(h, MAX_H));
    setTiles((prev) =>
      prev.some((t) => t.id === id && (t.w !== cw || t.h !== ch))
        ? prev.map((t) => (t.id === id ? { ...t, w: cw, h: ch } : t))
        : prev
    );
  };

  // Drag the corner: every cell (+gap) of pointer travel adds/removes a cell.
  // Cells are square, so one step size works for both axes.
  const startResize = (e: React.PointerEvent, tile: Tile) => {
    e.preventDefault();
    const grid = containerRef.current!;
    const n = cols();
    const step = (grid.clientWidth + parseFloat(getComputedStyle(grid).columnGap)) / n;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const w0 = Math.min(tile.w, n);
    const move = (ev: PointerEvent) =>
      resize(tile.id, w0 + Math.round((ev.clientX - x0) / step), tile.h + Math.round((ev.clientY - y0) / step));
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  const removeTile = (tile: Tile) => {
    if (!confirm(`Remove "${labelOf(tile)}"?`)) return;
    setTiles((prev) => prev.filter((t) => t.id !== tile.id));
    setLayoutVersion((v) => v + 1);
  };

  const addSite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const urlInput = form.elements.namedItem("url") as HTMLInputElement;
    const raw = urlInput.value.trim();
    let href = "";
    try {
      // Bare "example.com" -> https. Prefixing also means only http(s) gets through.
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (url.hostname.includes(".")) href = url.href;
    } catch {
      /* invalid, handled below */
    }
    if (!href) {
      urlInput.setCustomValidity("Enter a website, like example.com");
      urlInput.reportValidity();
      return;
    }
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim() || host(href);
    setTiles((prev) => [...prev, { id: `link-${Date.now()}`, kind: "link", url: href, title, tone: "dark", w: 1, h: 1 }]);
    setLayoutVersion((v) => v + 1);
    form.reset();
    addDialogRef.current?.close();
  };

  // Defaults back in their default order/size; sites you added stay, at the end.
  const handleResetLayout = () => {
    setTiles((prev) => [...TILES, ...prev.filter((t) => !TILE_IDS.includes(t.id))]);
    setLayoutVersion((v) => v + 1);
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 1600);
  };

  const navBtn =
    "flex items-center gap-1.5 text-[0.68rem] uppercase tracking-wider transition-colors border px-2.5 py-1 cursor-pointer";
  const navBtnIdle =
    "text-[rgba(236,231,219,0.75)] hover:text-[#c59f52] border-[#3d3830] bg-[#100f0d] hover:border-[#c59f52]";

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

        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={() => addDialogRef.current?.showModal()} className={`${navBtn} ${navBtnIdle}`}>
            <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} />
            <span>Add</span>
          </button>

          <button
            onClick={() => setIsEditing((v) => !v)}
            aria-pressed={isEditing}
            title={isEditing ? "Finish editing" : "Move and resize tiles"}
            className={`${navBtn} ${isEditing ? "text-[#151411] bg-[#c59f52] border-[#c59f52]" : navBtnIdle}`}
          >
            <HugeiconsIcon icon={isEditing ? Tick01Icon : PencilEdit01Icon} size={13} strokeWidth={1.5} />
            <span>{isEditing ? "Done" : "Edit"}</span>
          </button>

          {isEditing && (
            <button onClick={handleResetLayout} title="Reset layout to default" className={`${navBtn} ${navBtnIdle}`}>
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

      {/* ── BENTO GRID: square cells, tiles span w x h of them ── */}
      <div className="bento-wrap max-w-[1240px] w-full mx-auto">
        <main ref={containerRef} className={`bento-grid${isEditing ? " editing" : ""}`}>
          {tiles.map((tile, i) => (
            <div
              key={`slot-${i}`}
              data-swapy-slot={`slot-${i}`}
              style={{ "--w": tile.w, "--h": tile.h } as React.CSSProperties}
            >
              <div key={tile.id} data-swapy-item={tile.id} className="relative w-full h-full">
                <TileCard tile={tile} isEditing={isEditing} />
                {isEditing && (
                  <>
                    <div className="drag-grip absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none" aria-hidden>
                      <HugeiconsIcon icon={Drag01Icon} size={14} strokeWidth={1.5} />
                    </div>
                    <button
                      data-swapy-no-drag
                      onClick={() => removeTile(tile)}
                      aria-label={`Remove ${labelOf(tile)}`}
                      className="tile-ctl absolute top-1.5 right-1.5"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                    </button>
                    <span className="tile-ctl absolute bottom-1.5 left-1.5 pointer-events-none" aria-hidden>
                      {tile.w}×{tile.h}
                    </span>
                    <button
                      data-swapy-no-drag
                      onPointerDown={(e) => startResize(e, tile)}
                      onKeyDown={(e) => {
                        const d = ARROWS[e.key];
                        if (!d) return;
                        e.preventDefault();
                        resize(tile.id, tile.w + d[0], tile.h + d[1]);
                      }}
                      aria-label={`Resize ${labelOf(tile)}, ${tile.w} by ${tile.h}. Drag, or use arrow keys.`}
                      className="tile-ctl resize-handle absolute bottom-1.5 right-1.5"
                    >
                      <HugeiconsIcon icon={ArrowExpandDiagonal01Icon} size={12} strokeWidth={2} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* ── ADD WEBSITE ── native <dialog>: focus trap, Esc, backdrop for free */}
      <dialog
        ref={addDialogRef}
        className="add-dialog m-auto w-[min(420px,calc(100vw-32px))] bg-[#171513] text-[#ece7db] border-2 border-[#453e34] p-0"
      >
        <form onSubmit={addSite} className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[1.2rem] font-bold tracking-tight m-0">add a website</h2>
            <button
              type="button"
              onClick={() => addDialogRef.current?.close()}
              aria-label="Close"
              className="opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none text-[#ece7db]"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} />
            </button>
          </div>
          <label className="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-widest text-[rgba(236,231,219,0.7)]">
            url
            <input
              name="url"
              required
              autoFocus
              inputMode="url"
              autoComplete="url"
              placeholder="example.com"
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              className="add-input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-widest text-[rgba(236,231,219,0.7)]">
            <span>
              title <span className="opacity-60 normal-case tracking-normal">(optional)</span>
            </span>
            <input name="title" placeholder="defaults to the domain" className="add-input" />
          </label>
          <p className="text-[0.68rem] text-[rgba(236,231,219,0.5)] m-0">
            starts as a 1×1 tile showing the site's icon — hit edit and drag its corner to make it bigger.
          </p>
          <button
            type="submit"
            className="self-end border-[1.5px] border-[#ece7db] px-5 py-1.5 uppercase text-[0.75rem] tracking-wider bg-[#ece7db] text-[#16150f] hover:bg-transparent hover:text-[#ece7db] transition-colors cursor-pointer"
          >
            Add
          </button>
        </form>
      </dialog>

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
