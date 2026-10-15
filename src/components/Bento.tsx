"use client";

import React, { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createSwapy, Swapy } from "swapy";
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
  PaintBoardIcon,
} from "@hugeicons/core-free-icons";
import { GithubIcon } from "./BrandIcons";
import { TILES, SITE_NAME, Tile, Tone } from "@/tiles";
import { THEMES, FONTS, MAX_RADIUS, THEME_KEY, DEFAULT_THEME, ThemeSettings, parseTheme, applyTheme } from "@/theme";

const TILES_KEY = "lawn_tiles_v3";
const TILE_IDS = TILES.map((t) => t.id);
const KINDS = ["intro", "link", "note", "list", "clock"];
const MAX_H = 8;

// Per-tile accent, exposed as --tone (bg-(--tone), text-(--tone), tile wash).
const TONE: Record<Tone, string> = {
  plain: "transparent",
  accent: "var(--t-accent)",
  violet: "#a78bfa",
  blue: "#60a5fa",
  green: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
};

// Shared class sets. Every color/radius here is a theme token from globals.css,
// so Theme Center restyles all of it live.
const BTN =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-theme border border-line bg-fg/5 text-muted text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:text-fg hover:bg-fg/10 hover:border-line-strong aria-pressed:text-fg aria-pressed:border-accent/60 aria-pressed:bg-accent/15";
const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-theme border border-fg bg-fg text-bg text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:bg-fg/85";
const CTL =
  "absolute z-[2] flex items-center justify-center min-w-6 h-6 px-1.5 text-[11px] leading-none text-fg bg-bg/80 backdrop-blur border border-line-strong rounded-theme";
const CTL_BTN = `${CTL} cursor-pointer transition-colors hover:bg-fg hover:text-bg`;
const FIELD =
  "w-full bg-fg/5 border border-line rounded-theme px-3 py-2 text-sm text-fg placeholder:text-faint outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/25";
const SECTION = "text-[11px] uppercase tracking-[0.14em] text-faint";
const PANEL =
  "bg-surface/95 backdrop-blur-xl border border-line-strong rounded-theme text-fg shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]";

const parseTiles = (raw: unknown): Tile[] | null =>
  Array.isArray(raw) && raw.every((t) => typeof t?.id === "string" && KINDS.includes(t.kind) && t.w >= 1 && t.h >= 1)
    ? (raw as Tile[])
    : null;

// Saved per browser. The server renders `initial`; the saved value is applied
// after mount (localStorage only exists in the browser). `ready` turns true once
// that's happened, and nothing is written back before it.
function useStored<T>(key: string, initial: T, parse: (raw: unknown) => T | null) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = parse(JSON.parse(localStorage.getItem(key) ?? "null"));
      if (saved) setValue(saved);
    } catch (e) {
      console.error(`Failed to read ${key}`, e);
    }
    setReady(true);
  }, [key, parse]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key}`, e);
    }
  }, [key, value, ready]);
  return [value, setValue, ready] as const;
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

// Starts empty so the server-rendered HTML matches the first client render.
function ClockFace({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const offset =
    now &&
    new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value;
  return (
    <div>
      <div className="glow-text text-[2.4rem] font-semibold leading-none tracking-tight tabular-nums">
        {now ? now.toLocaleTimeString("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }) : "--:--"}
      </div>
      <div className="mt-2 text-[11px] text-faint">
        {timeZone.split("/").pop()?.replace("_", " ")}
        {offset && ` · ${offset}`}
      </div>
    </div>
  );
}

const Label = ({ children, dot }: { children: React.ReactNode; dot: boolean }) => (
  <div className={`flex items-center gap-2 ${SECTION}`}>
    {dot && <span className="size-1.5 rounded-theme bg-(--tone) shadow-[0_0_10px_var(--tone)]" />}
    {children}
  </div>
);

function TileCard({ tile, isEditing }: { tile: Tile; isEditing: boolean }) {
  const style = { "--tone": TONE[tile.tone] ?? "transparent" } as React.CSSProperties;
  const base = "tile w-full h-full flex";
  const dot = tile.tone !== "plain";

  switch (tile.kind) {
    case "intro":
      return (
        <div className={`${base} flex-col justify-between p-6 sm:p-8`} style={style}>
          <Label dot={dot}>hello, i&apos;m</Label>
          <div>
            <h1 className="text-[2.75rem] sm:text-[3.75rem] font-semibold leading-[0.95] tracking-tight">
              <span className="glow-text">{tile.name}</span>
              <span className="text-(--tone)">.</span>
            </h1>
            <p className="mt-4 max-w-[440px] text-sm leading-relaxed text-muted">{tile.blurb}</p>
          </div>
          <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] text-faint">
            <span>lawn.sv7.space</span>
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
        style,
        // A drop ends with a click on the card; don't navigate mid-edit.
        onClick: (e: React.MouseEvent) => isEditing && e.preventDefault(),
      };
      const icon = (size: number) => (
        <img src={favicon(tile.url)} alt="" width={size} height={size} draggable={false} className="shrink-0" />
      );
      const appIcon = (box: string, size: number) => (
        <span
          className={`${box} grid shrink-0 place-items-center rounded-theme-sm border border-line bg-raised shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:border-line-strong`}
        >
          {icon(size)}
        </span>
      );
      const shot = (
        // absolute img: a 2560px screenshot must not stretch the grid row
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-theme-sm border border-line bg-raised">
          <img
            src={tile.image ?? preview(tile.url)}
            alt={`Preview of ${site}`}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-top opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        </div>
      );
      const titleBlock = (
        <div className="min-w-0">
          <div className="truncate text-base font-semibold leading-tight tracking-tight">{tile.title}</div>
          <div className="truncate text-xs text-muted">{tile.note ?? site}</div>
        </div>
      );

      // 1x1: just the favicon, app-icon style.
      if (tile.w === 1 && tile.h === 1) {
        return (
          <a {...linkProps} className={`${base} group flex-col items-center justify-center gap-3 p-3`}>
            {appIcon("size-14", 30)}
            <span className="max-w-full truncate text-xs text-muted">{tile.title}</span>
          </a>
        );
      }

      // One row tall: details on the left, preview strip on the right.
      if (tile.h === 1) {
        return (
          <a {...linkProps} className={`${base} group gap-4 p-4`}>
            <div className="flex w-[42%] min-w-0 shrink-0 flex-col justify-between">
              {appIcon("size-10", 20)}
              {titleBlock}
            </div>
            {shot}
          </a>
        );
      }

      return (
        <a {...linkProps} className={`${base} group flex-col gap-3 p-4`}>
          <div className="flex items-center gap-2 text-[11px] text-faint">
            {icon(14)}
            <span className="truncate">{site}</span>
            <span className="ml-auto grid size-7 shrink-0 place-items-center rounded-theme border border-line text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:text-fg">
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.75} />
            </span>
          </div>
          {shot}
          {titleBlock}
        </a>
      );
    }

    case "note":
      return (
        <div className={`${base} flex-col justify-between p-5`} style={style}>
          <Label dot={dot}>{tile.label}</Label>
          <p className="text-lg font-medium leading-snug tracking-tight sm:text-xl">{tile.text}</p>
        </div>
      );

    case "list":
      return (
        <div className={`${base} flex-col p-5`} style={style}>
          <Label dot={dot}>{tile.label}</Label>
          <ul className="m-0 mt-auto list-none space-y-1.5 p-0 text-[13px]">
            {tile.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-(--tone)">›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case "clock":
      return (
        <div className={`${base} flex-col justify-between p-5`} style={style}>
          <Label dot={dot}>{tile.label}</Label>
          <ClockFace timeZone={tile.timeZone} />
        </div>
      );
  }
}

function ThemeCenter({
  theme,
  setTheme,
}: {
  theme: ThemeSettings;
  setTheme: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}) {
  return (
    // Native popover: light-dismiss + Esc, and non-modal so changes preview live.
    <div
      id="theme-center"
      popover="auto"
      className={`${PANEL} fixed inset-auto top-[76px] right-[max(16px,calc((100vw-1240px)/2))] m-0 max-h-[calc(100dvh-96px)] w-[min(340px,calc(100vw-32px))] overflow-auto p-4`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-sm font-semibold">Theme center</h2>
          <p className="m-0 mt-0.5 text-[11px] text-faint">Applies live · saved in this browser</p>
        </div>
        <button className={BTN} onClick={() => setTheme(DEFAULT_THEME)}>
          <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.75} />
          Reset
        </button>
      </div>

      <fieldset className="mb-5">
        <legend className={`${SECTION} mb-2`}>Theme</legend>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            // data-theme on the swatch scopes that theme's tokens to it, so it previews itself.
            <label
              key={t.id}
              data-theme={t.id}
              className="flex cursor-pointer flex-col gap-1.5 rounded-theme border border-line bg-bg p-1.5 text-fg transition-colors hover:border-line-strong has-checked:border-accent has-checked:ring-1 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="theme"
                className="sr-only"
                checked={theme.theme === t.id}
                onChange={() => setTheme((s) => ({ ...s, theme: t.id }))}
              />
              <span className="relative h-10 overflow-hidden rounded-theme-sm border border-line bg-surface bg-[radial-gradient(90%_130%_at_0%_0%,var(--t-glow-1),transparent_70%)]">
                <span className="absolute left-2 top-2 h-1 w-1/4 rounded-theme bg-fg/40" />
                <span className="absolute bottom-2 left-2 h-1 w-2/5 rounded-theme bg-accent shadow-[0_0_10px_var(--t-accent)]" />
              </span>
              <span className="px-0.5 text-[11px]">{t.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className={`${SECTION} mb-2`}>Font</legend>
        <div className="flex flex-col gap-1">
          {FONTS.map((f) => (
            <label
              key={f.id}
              style={{ fontFamily: `var(--font-${f.id})` }}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-theme border border-transparent px-2.5 py-2 text-[13px] text-muted transition-colors hover:bg-fg/5 hover:text-fg has-checked:border-line-strong has-checked:bg-accent/10 has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="font"
                className="sr-only"
                checked={theme.font === f.id}
                onChange={() => setTheme((s) => ({ ...s, font: f.id }))}
              />
              <span>{f.name}</span>
              <span className="text-faint">Aa 0123</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className={`${SECTION} mb-2 flex justify-between`}>
          <span>Corners</span>
          <span className="normal-case tracking-normal text-muted">{theme.radius}px</span>
        </span>
        <input
          type="range"
          min={0}
          max={MAX_RADIUS}
          step={2}
          value={theme.radius}
          onChange={(e) => setTheme((s) => ({ ...s, radius: Number(e.target.value) }))}
          className="w-full accent-accent"
        />
        <span className="mt-1 flex justify-between text-[10px] text-faint">
          <span>sharp</span>
          <span>round</span>
        </span>
      </label>
    </div>
  );
}

function Bento() {
  const [tiles, setTiles, tilesReady] = useStored(TILES_KEY, TILES, parseTiles);
  const [theme, setTheme, themeReady] = useStored(THEME_KEY, DEFAULT_THEME, parseTheme);
  // Bumped when tiles are added/removed/reset so Swapy re-reads the slots.
  // Not bumped on swap or resize: those keep the same slots and items.
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [resetFeedback, setResetFeedback] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [entering, setEntering] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const swapyRef = useRef<Swapy | null>(null);
  const addDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // The <head> script already applied the saved theme before paint; only take
  // over once the saved value is loaded, so the defaults never flash.
  useEffect(() => {
    if (themeReady) applyTheme(theme);
  }, [theme, themeReady]);

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
  }, [layoutVersion, tilesReady, setTiles]);

  useEffect(() => {
    swapyRef.current?.enable(isEditing);
  }, [isEditing, layoutVersion, tilesReady]);

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

  // Feeds the tile spotlight (--mx/--my) under the cursor.
  const trackPointer = (e: React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".tile");
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
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
    setTiles((prev) => [...prev, { id: `link-${Date.now()}`, kind: "link", url: href, title, tone: "plain", w: 1, h: 1 }]);
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

  return (
    <div className="flex min-h-screen flex-col p-4 sm:p-6 lg:p-8">
      {/* ── TOP NAV ── */}
      <header className="sticky top-3 z-40 mx-auto mb-5 flex w-full max-w-[1240px] items-center justify-between gap-3 rounded-theme border border-line bg-bg/70 px-4 py-2.5 backdrop-blur-xl backdrop-saturate-150">
        <a href="#" className="flex items-center text-[15px] font-semibold tracking-tight text-fg no-underline">
          lawn
          <span
            aria-hidden
            className="ml-1 inline-block h-[1.05em] w-[0.55em] animate-blink bg-accent motion-reduce:animate-none"
          />
        </a>

        <nav className="flex flex-wrap items-center justify-end gap-2">
          {isEditing && (
            <button onClick={handleResetLayout} title="Reset layout to default" className={BTN}>
              <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={1.75} />
              <span className="hidden sm:inline">{resetFeedback ? "Layout reset" : "Reset"}</span>
            </button>
          )}
          <button popoverTarget="theme-center" aria-label="Theme center" className={BTN}>
            <HugeiconsIcon icon={PaintBoardIcon} size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">Theme</span>
          </button>
          <button
            onClick={() => setIsEditing((v) => !v)}
            aria-pressed={isEditing}
            title={isEditing ? "Finish editing" : "Move and resize tiles"}
            className={BTN}
          >
            <HugeiconsIcon icon={isEditing ? Tick01Icon : PencilEdit01Icon} size={14} strokeWidth={1.75} />
            <span>{isEditing ? "Done" : "Edit"}</span>
          </button>
          <button onClick={() => addDialogRef.current?.showModal()} className={BTN_PRIMARY}>
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
            <span>Add</span>
          </button>
        </nav>
      </header>

      <ThemeCenter theme={theme} setTheme={setTheme} />

      {/* ── BENTO GRID: square cells, tiles span w x h of them ── */}
      <div className="bento-wrap mx-auto w-full max-w-[1240px]">
        <main
          ref={containerRef}
          onPointerMove={trackPointer}
          className={`bento-grid${isEditing ? " editing" : ""}${entering ? " entering" : ""}`}
        >
          {tiles.map((tile, i) => (
            <div
              key={`slot-${i}`}
              data-swapy-slot={`slot-${i}`}
              style={{ "--w": tile.w, "--h": tile.h, "--i": i } as React.CSSProperties}
            >
              <div key={tile.id} data-swapy-item={tile.id} className="relative h-full w-full">
                <TileCard tile={tile} isEditing={isEditing} />
                {isEditing && (
                  <>
                    <div
                      aria-hidden
                      className={`${CTL} pointer-events-none top-2 left-1/2 -translate-x-1/2 px-2.5`}
                    >
                      <HugeiconsIcon icon={Drag01Icon} size={14} strokeWidth={1.75} />
                    </div>
                    <button
                      data-swapy-no-drag
                      onClick={() => removeTile(tile)}
                      aria-label={`Remove ${labelOf(tile)}`}
                      className={`${CTL_BTN} top-2 right-2`}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                    </button>
                    <span aria-hidden className={`${CTL} pointer-events-none bottom-2 left-2`}>
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
                      className={`${CTL_BTN} right-2 bottom-2 cursor-nwse-resize touch-none`}
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
      <dialog ref={addDialogRef} className={`add-dialog ${PANEL} m-auto w-[min(420px,calc(100vw-32px))] p-0`}>
        <form onSubmit={addSite} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-base font-semibold">Add a website</h2>
            <button
              type="button"
              onClick={() => addDialogRef.current?.close()}
              aria-label="Close"
              className="grid size-7 cursor-pointer place-items-center rounded-theme text-muted transition-colors hover:bg-fg/10 hover:text-fg"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.75} />
            </button>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={SECTION}>URL</span>
            <input
              name="url"
              required
              autoFocus
              inputMode="url"
              autoComplete="url"
              placeholder="example.com"
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              className={FIELD}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={SECTION}>
              Title <span className="normal-case tracking-normal opacity-70">(optional)</span>
            </span>
            <input name="title" placeholder="Defaults to the domain" className={FIELD} />
          </label>
          <p className="m-0 text-xs text-faint">
            Starts as a 1×1 tile showing the site&apos;s icon — hit Edit and drag its corner to make it bigger.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => addDialogRef.current?.close()} className={BTN}>
              Cancel
            </button>
            <button type="submit" className={BTN_PRIMARY}>
              Add website
            </button>
          </div>
        </form>
      </dialog>

      {/* ── FOOTER ── */}
      <footer className="mx-auto mt-10 flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-xs text-faint">
        <span>
          &copy; {new Date().getFullYear()} {SITE_NAME}
        </span>
        <a
          href="https://github.com/suhaasv7"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-faint no-underline transition-colors hover:text-fg"
        >
          <GithubIcon width={14} height={14} />
          github
        </a>
      </footer>
    </div>
  );
}

export default Bento;
