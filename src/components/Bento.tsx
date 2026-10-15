"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { createSwapy, Swapy } from "swapy";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowUpRight01Icon,
  ArrowExpandDiagonal01Icon,
  Cursor01Icon,
  Cancel01Icon,
  Tick01Icon,
  Drag01Icon,
  RefreshIcon,
  PencilEdit01Icon,
  PaintBoardIcon,
} from "@hugeicons/core-free-icons";
import { GithubIcon } from "./BrandIcons";
import { ADD_SIZE, MAX_SPAN, MIN_SIZE, TILES, SITE_NAME, Tile, Tone } from "@/tiles";
import {
  BASE_KEYS,
  BASE_LABELS,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  FONTS,
  HEX,
  MAX_RADIUS,
  Settings,
  Theme,
  ThemeBase,
  applyVars,
  colorVars,
  deriveTheme,
  themeVars,
} from "@/theme";
import { canEmbed, deleteTheme, saveSettings, saveTheme, saveTiles } from "@/app/actions";

const TILE_IDS = TILES.map((t) => t.id);

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
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-theme border border-line bg-fg/5 text-muted text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:text-fg hover:bg-fg/10 hover:border-line-strong aria-pressed:text-fg aria-pressed:border-accent/60 aria-pressed:bg-accent/15 disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-theme border border-fg bg-fg text-bg text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:bg-fg/85 disabled:opacity-50 disabled:cursor-not-allowed";
const CTL =
  "absolute z-[2] flex items-center justify-center min-w-5 h-5 px-1 text-[10px] leading-none text-fg bg-bg/80 backdrop-blur border border-line-strong rounded-theme";
const CTL_BTN = `${CTL} cursor-pointer transition-colors hover:bg-fg hover:text-bg`;
const FIELD =
  "w-full bg-fg/5 border border-line rounded-theme px-3 py-2 text-sm text-fg placeholder:text-faint outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/25";
const SECTION = "text-[11px] uppercase tracking-[0.14em] text-faint";
const PANEL =
  "bg-surface/95 backdrop-blur-xl border border-line-strong rounded-theme text-fg shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]";

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");
const favicon = (url: string) => `https://www.google.com/s2/favicons?domain=${host(url)}&sz=128`;
const labelOf = (t: Tile) =>
  t.kind === "bookmark" || t.kind === "website" ? t.title : t.kind === "intro" ? t.name : t.label;

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

type Draft = ThemeBase & { id?: string };
type SaveState = "idle" | "saving" | "saved" | "error";

// The editor works on the five base colors; non-hex values fall back to Midnight's.
const toDraft = (t: Theme): Draft =>
  ({
    id: t.is_preset ? undefined : t.id,
    name: t.name,
    ...Object.fromEntries(BASE_KEYS.map((k) => [k, HEX.test(t[k]) ? t[k] : DEFAULT_THEME[k]])),
  }) as Draft;

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

// Website: the live site in an iframe (or a screenshot if it refuses to be
// framed). Look-only by default; the cursor button turns interaction on.
// Always look-only while editing so dragging works.
function WebsiteTile({
  tile,
  isEditing,
  style,
}: {
  tile: Extract<Tile, { kind: "website" }>;
  isEditing: boolean;
  style: React.CSSProperties;
}) {
  const [live, setLive] = useState(false);
  const interactive = live && !isEditing;
  const site = host(tile.url);
  const embed = tile.embed !== false && !tile.image;
  const iconBtn =
    "grid size-7 shrink-0 cursor-pointer place-items-center rounded-theme border border-line text-muted transition-colors hover:border-line-strong hover:text-fg";
  const guard = (e: React.MouseEvent) => isEditing && e.preventDefault();

  return (
    <div className="tile group flex h-full w-full flex-col gap-3 p-4" style={style}>
      <div className="flex items-center gap-2 text-[11px] text-faint">
        <img src={favicon(tile.url)} alt="" width={14} height={14} draggable={false} className="shrink-0" />
        <span className="min-w-0 truncate">{site}</span>
        {embed && !isEditing && (
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            aria-pressed={live}
            title={live ? "Stop interacting" : "Interact with the site"}
            className={`${iconBtn} ml-auto aria-pressed:border-accent aria-pressed:bg-accent/15 aria-pressed:text-fg`}
          >
            <HugeiconsIcon icon={live ? Cancel01Icon : Cursor01Icon} size={13} strokeWidth={1.75} />
          </button>
        )}
        <a
          href={tile.url}
          target="_blank"
          rel="noreferrer"
          draggable={false}
          onClick={guard}
          aria-label={`Open ${site} in a new tab`}
          className={`${iconBtn} ${embed && !isEditing ? "" : "ml-auto"}`}
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.75} />
        </a>
      </div>
      <div
        className={`relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-theme-sm border bg-raised transition-colors ${interactive ? "border-accent ring-1 ring-accent" : "border-line"}`}
      >
        {embed ? (
          <iframe
            src={tile.url}
            title={`${tile.title} (${site})`}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            tabIndex={interactive ? 0 : -1}
            className={`absolute inset-0 h-full w-full border-0 ${interactive ? "" : "pointer-events-none"}`}
          />
        ) : (
          // absolute img: a 2560px screenshot must not stretch the grid row
          <img
            src={tile.image ?? preview(tile.url)}
            alt={`Preview of ${site}`}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-top opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        )}
      </div>
      <a href={tile.url} target="_blank" rel="noreferrer" draggable={false} onClick={guard} className="min-w-0 text-fg no-underline">
        <div className="truncate text-base font-semibold leading-tight tracking-tight">{tile.title}</div>
        <div className="truncate text-xs text-muted">{tile.note ?? site}</div>
      </a>
    </div>
  );
}

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

    case "bookmark":
    case "website": {
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
      // Bookmark: just the icon at one cell wide; the name joins once there's room.
      if (tile.kind === "bookmark") {
        if (tile.w === 1) {
          return (
            <a {...linkProps} className={`${base} group items-center justify-center`}>
              <span className="transition-transform duration-300 group-hover:scale-110">{icon(28)}</span>
            </a>
          );
        }
        if (tile.h === 1) {
          return (
            <a {...linkProps} className={`${base} group items-center gap-2.5 px-3`}>
              {icon(22)}
              <span className="min-w-0 truncate text-[13px] font-medium">{tile.title}</span>
            </a>
          );
        }
        const big = tile.w >= 3 && tile.h >= 3;
        return (
          <a {...linkProps} className={`${base} group flex-col items-center justify-center gap-2.5 p-3`}>
            {appIcon(big ? "size-14" : "size-11", big ? 30 : 24)}
            <span className="max-w-full truncate text-xs text-muted">{tile.title}</span>
          </a>
        );
      }

      return <WebsiteTile tile={tile} isEditing={isEditing} style={style} />;
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
  themes,
  settings,
  setSettings,
  draft,
  setDraft,
  onSaveDraft,
  onDeleteDraft,
  busy,
}: {
  themes: Theme[];
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  draft: Draft | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  onSaveDraft: () => void;
  onDeleteDraft: () => void;
  busy: boolean;
}) {
  const active = themes.find((t) => t.id === settings.theme_id) ?? themes[0];
  return (
    // Native popover: light-dismiss + Esc, and non-modal so changes preview live.
    <div
      id="theme-center"
      popover="auto"
      // Closing the panel discards an unsaved draft (and its live preview).
      onToggle={(e) => (e.nativeEvent as ToggleEvent).newState === "closed" && setDraft(null)}
      className={`${PANEL} fixed inset-auto top-[76px] right-[max(16px,calc((100vw-1240px)/2))] m-0 max-h-[calc(100dvh-96px)] w-[min(360px,calc(100vw-32px))] overflow-auto p-4`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-sm font-semibold">Theme center</h2>
          <p className="m-0 mt-0.5 text-[11px] text-faint">Applies live · saved to the site</p>
        </div>
        <button className={BTN} onClick={() => setSettings(DEFAULT_SETTINGS)} title="Midnight, Cascadia Code, sharp corners">
          <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.75} />
          Defaults
        </button>
      </div>

      {draft ? (
        <div className="mb-5 flex flex-col gap-3 rounded-theme border border-line-strong p-3">
          <div className="flex items-center justify-between">
            <span className={SECTION}>{draft.id ? "Edit theme" : "New theme"}</span>
            <span className="text-[11px] text-faint">previewing live</span>
          </div>
          <input
            aria-label="Theme name"
            className={FIELD}
            value={draft.name}
            maxLength={40}
            onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            {BASE_KEYS.map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="color"
                  value={draft[k]}
                  onChange={(e) => setDraft((d) => d && { ...d, [k]: e.target.value })}
                  className="h-7 w-9 shrink-0 cursor-pointer rounded-theme-sm border border-line bg-transparent p-0.5"
                />
                {BASE_LABELS[k]}
              </label>
            ))}
          </div>
          <div className="flex justify-between gap-2">
            {draft.id ? (
              <button className={BTN} onClick={onDeleteDraft} disabled={busy}>
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button className={BTN} onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button className={BTN_PRIMARY} onClick={onSaveDraft} disabled={busy || !draft.name.trim()}>
                Save theme
              </button>
            </div>
          </div>
        </div>
      ) : (
        <fieldset className="mb-5">
          <legend className={`${SECTION} mb-2`}>Theme</legend>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <div key={t.id} className="relative">
                {/* The swatch carries its own theme's tokens, so it previews itself. */}
                <label
                  style={colorVars(t) as React.CSSProperties}
                  className="flex cursor-pointer flex-col gap-1.5 rounded-theme border border-line bg-bg p-1.5 text-fg transition-colors hover:border-line-strong has-checked:border-accent has-checked:ring-1 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-accent"
                >
                  <input
                    type="radio"
                    name="theme"
                    className="sr-only"
                    checked={active?.id === t.id}
                    onChange={() => setSettings((s) => ({ ...s, theme_id: t.id }))}
                  />
                  <span className="relative h-10 overflow-hidden rounded-theme-sm border border-line bg-surface bg-[radial-gradient(90%_130%_at_0%_0%,var(--t-glow-1),transparent_70%)]">
                    <span className="absolute left-2 top-2 h-1 w-1/4 rounded-theme bg-fg/40" />
                    <span className="absolute bottom-2 left-2 h-1 w-2/5 rounded-theme bg-accent shadow-[0_0_10px_var(--t-accent)]" />
                  </span>
                  <span className="truncate px-0.5 text-[11px]">{t.name}</span>
                </label>
                {!t.is_preset && (
                  <button
                    onClick={() => setDraft(toDraft(t))}
                    aria-label={`Edit ${t.name}`}
                    className={`${CTL_BTN} top-1 right-1 size-6 min-w-0 p-0`}
                  >
                    <HugeiconsIcon icon={PencilEdit01Icon} size={11} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setDraft({ ...toDraft(active ?? DEFAULT_THEME), id: undefined, name: `${active?.name ?? "My"} copy` })}
              className="flex min-h-[78px] cursor-pointer flex-col items-center justify-center gap-1 rounded-theme border border-dashed border-line-strong text-[11px] text-muted transition-colors hover:border-accent hover:text-fg"
            >
              <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.75} />
              New theme
            </button>
          </div>
        </fieldset>
      )}

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
                checked={settings.font === f.id}
                onChange={() => setSettings((s) => ({ ...s, font: f.id }))}
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
          <span className="normal-case tracking-normal text-muted">{settings.radius}px</span>
        </span>
        <input
          type="range"
          min={0}
          max={MAX_RADIUS}
          step={2}
          value={settings.radius}
          onChange={(e) => setSettings((s) => ({ ...s, radius: Number(e.target.value) }))}
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

function Bento({
  initialTiles,
  initialThemes,
  initialSettings,
  editable,
}: {
  initialTiles: Tile[];
  initialThemes: Theme[];
  initialSettings: Settings;
  editable: boolean;
}) {
  const [tiles, setTiles] = useState(initialTiles);
  const [themes, setThemes] = useState(initialThemes);
  const [settings, setSettings] = useState(initialSettings);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // Bumped when tiles are added/removed/reset so Swapy re-reads the slots.
  // Not bumped on swap or resize: those keep the same slots and items.
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [resetFeedback, setResetFeedback] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [entering, setEntering] = useState(true);
  const editing = editable && isEditing;

  const containerRef = useRef<HTMLDivElement>(null);
  const swapyRef = useRef<Swapy | null>(null);
  const addDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // ── Theme: the server already rendered the saved one; this keeps <html> in
  // sync with Theme Center (including the unsaved draft being edited).
  const active = themes.find((t) => t.id === settings.theme_id) ?? themes[0] ?? DEFAULT_THEME;
  useEffect(() => {
    applyVars(themeVars(draft ? { ...active, ...deriveTheme(draft) } : active, settings));
  }, [draft, active, settings]);

  // ── Saving: changes are written to Supabase shortly after they stop.
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const persist = useCallback((key: string, run: () => Promise<unknown>) => {
    clearTimeout(timers.current[key]);
    setSaveState("saving");
    timers.current[key] = setTimeout(() => {
      run().then(
        () => setSaveState("saved"),
        (e) => {
          console.error(e);
          setSaveState("error");
        }
      );
    }, 600);
  }, []);

  const savedTiles = useRef(JSON.stringify(initialTiles));
  useEffect(() => {
    if (!editable) return;
    const json = JSON.stringify(tiles);
    if (json === savedTiles.current) return;
    persist("tiles", async () => {
      await saveTiles(tiles);
      savedTiles.current = json;
    });
  }, [tiles, editable, persist]);

  const savedSettings = useRef(JSON.stringify(initialSettings));
  useEffect(() => {
    if (!editable) return;
    const json = JSON.stringify(settings);
    if (json === savedSettings.current) return;
    persist("settings", async () => {
      await saveSettings(settings);
      savedSettings.current = json;
    });
  }, [settings, editable, persist]);

  // ── Swapy
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
    swapyRef.current?.enable(editing);
  }, [editing, layoutVersion]);

  const cols = () => getComputedStyle(containerRef.current!).gridTemplateColumns.split(" ").length;

  // Each type has its own smallest size (a bookmark can be one 56px cell, a
  // website needs room for its preview); the most is the grid's width.
  const resize = (tile: Tile, w: number, h: number) => {
    const [minW, minH] = MIN_SIZE[tile.kind];
    const cw = Math.max(minW, Math.min(w, cols(), MAX_SPAN));
    const ch = Math.max(minH, Math.min(h, MAX_SPAN));
    setTiles((prev) =>
      prev.some((t) => t.id === tile.id && (t.w !== cw || t.h !== ch))
        ? prev.map((t) => (t.id === tile.id ? { ...t, w: cw, h: ch } : t))
        : prev
    );
  };

  // Drag the corner: every 56px cell (+gap) of pointer travel adds/removes a
  // cell. Cells are square, so one step size works for both axes.
  const startResize = (e: React.PointerEvent, tile: Tile) => {
    e.preventDefault();
    const grid = containerRef.current!;
    const n = cols();
    const css = getComputedStyle(grid);
    const step = parseFloat(css.gridTemplateColumns) + parseFloat(css.columnGap);
    const x0 = e.clientX;
    const y0 = e.clientY;
    const w0 = Math.min(tile.w, n);
    const move = (ev: PointerEvent) =>
      resize(tile, w0 + Math.round((ev.clientX - x0) / step), tile.h + Math.round((ev.clientY - y0) / step));
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

  const addSite = async (e: React.FormEvent<HTMLFormElement>) => {
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
    const kind = (form.elements.namedItem("kind") as RadioNodeList).value === "website" ? "website" : "bookmark";
    const [w, h] = ADD_SIZE[kind];
    const embed = kind === "website" ? await canEmbed(href) : undefined;
    setTiles((prev) => [...prev, { id: `link-${Date.now()}`, kind, url: href, title, tone: "plain", w, h, embed }]);
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

  // ── Theme editor
  const saveDraft = async () => {
    if (!draft) return;
    setSaveState("saving");
    try {
      const saved = await saveTheme(draft);
      setThemes((prev) => (prev.some((t) => t.id === saved.id) ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]));
      setSettings((s) => ({ ...s, theme_id: saved.id }));
      setDraft(null);
      setSaveState("saved");
    } catch (e) {
      console.error(e);
      setSaveState("error");
    }
  };

  const deleteDraft = async () => {
    const id = draft?.id;
    if (!id || !confirm(`Delete the "${draft.name}" theme?`)) return;
    setSaveState("saving");
    try {
      await deleteTheme(id);
      const rest = themes.filter((t) => t.id !== id);
      setThemes(rest);
      if (settings.theme_id === id) setSettings((s) => ({ ...s, theme_id: rest[0]?.id ?? null }));
      setDraft(null);
      setSaveState("saved");
    } catch (e) {
      console.error(e);
      setSaveState("error");
    }
  };

  const saveLabel = { idle: "", saving: "Saving…", saved: "Saved", error: "Couldn't save" }[saveState];

  return (
    <div className="flex min-h-screen flex-col p-4 sm:p-6 lg:p-8">
      {/* ── TOP NAV ── */}
      <header className="sticky top-3 z-40 mx-auto mb-5 flex w-full max-w-[1240px] items-center justify-between gap-3 rounded-theme border border-line bg-bg/70 px-4 py-2.5 backdrop-blur-xl backdrop-saturate-150">
        <a href="#" className="flex h-8 items-center text-[15px] font-semibold tracking-tight text-fg no-underline">
          lawn
          <span
            aria-hidden
            className="ml-1 inline-block h-[1.05em] w-[0.55em] animate-blink bg-accent motion-reduce:animate-none"
          />
        </a>

        {editable && (
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <span
              aria-live="polite"
              className={`hidden text-[11px] sm:inline ${saveState === "error" ? "text-[#fb7185]" : "text-faint"}`}
            >
              {saveLabel}
            </span>
            {editing && (
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
              aria-pressed={editing}
              title={editing ? "Finish editing" : "Move and resize tiles"}
              className={BTN}
            >
              <HugeiconsIcon icon={editing ? Tick01Icon : PencilEdit01Icon} size={14} strokeWidth={1.75} />
              <span>{editing ? "Done" : "Edit"}</span>
            </button>
            <button onClick={() => addDialogRef.current?.showModal()} className={BTN_PRIMARY}>
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              <span>Add</span>
            </button>
          </nav>
        )}
      </header>

      {editable && (
        <ThemeCenter
          themes={themes}
          settings={settings}
          setSettings={setSettings}
          draft={draft}
          setDraft={setDraft}
          onSaveDraft={saveDraft}
          onDeleteDraft={deleteDraft}
          busy={saveState === "saving"}
        />
      )}

      {/* ── BENTO GRID: square cells, tiles span w x h of them ── */}
      <div className="bento-wrap mx-auto w-full max-w-[1240px]">
        <main
          ref={containerRef}
          onPointerMove={trackPointer}
          className={`bento-grid${editing ? " editing" : ""}${entering ? " entering" : ""}`}
        >
          {tiles.map((tile, i) => (
            <div
              key={`slot-${i}`}
              data-swapy-slot={`slot-${i}`}
              style={{ "--w": tile.w, "--h": tile.h, "--i": i } as React.CSSProperties}
            >
              <div key={tile.id} data-swapy-item={tile.id} className="relative h-full w-full">
                <TileCard tile={tile} isEditing={editing} />
                {editing && (
                  <>
                    {tile.w > 1 && tile.h > 1 && (
                      <div
                        aria-hidden
                        className={`${CTL} pointer-events-none top-1.5 left-1/2 -translate-x-1/2 px-2`}
                      >
                        <HugeiconsIcon icon={Drag01Icon} size={12} strokeWidth={1.75} />
                      </div>
                    )}
                    <button
                      data-swapy-no-drag
                      onClick={() => removeTile(tile)}
                      aria-label={`Remove ${labelOf(tile)}`}
                      className={`${CTL_BTN} top-1.5 right-1.5`}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={11} strokeWidth={2} />
                    </button>
                    {tile.w > 1 && tile.h > 1 && (
                      <span aria-hidden className={`${CTL} pointer-events-none bottom-1.5 left-1.5`}>
                        {tile.w}×{tile.h}
                      </span>
                    )}
                    <button
                      data-swapy-no-drag
                      onPointerDown={(e) => startResize(e, tile)}
                      onKeyDown={(e) => {
                        const d = ARROWS[e.key];
                        if (!d) return;
                        e.preventDefault();
                        resize(tile, tile.w + d[0], tile.h + d[1]);
                      }}
                      aria-label={`Resize ${labelOf(tile)}, ${tile.w} by ${tile.h}. Drag, or use arrow keys.`}
                      className={`${CTL_BTN} right-1.5 bottom-1.5 cursor-nwse-resize touch-none`}
                    >
                      <HugeiconsIcon icon={ArrowExpandDiagonal01Icon} size={11} strokeWidth={2} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* ── ADD WEBSITE ── native <dialog>: focus trap, Esc, backdrop for free */}
      {editable && (
        <dialog ref={addDialogRef} className={`add-dialog ${PANEL} m-auto w-[min(420px,calc(100vw-32px))] p-0`}>
          <form onSubmit={addSite} className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold">Add a link</h2>
              <button
                type="button"
                onClick={() => addDialogRef.current?.close()}
                aria-label="Close"
                className="grid size-7 cursor-pointer place-items-center rounded-theme text-muted transition-colors hover:bg-fg/10 hover:text-fg"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.75} />
              </button>
            </div>
            <fieldset className="flex flex-col gap-1.5">
              <legend className={`${SECTION} mb-1.5`}>Type</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["bookmark", "Bookmark", "Site icon · down to 56px"],
                    ["website", "Website", "Live preview · 192px+"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer flex-col gap-0.5 rounded-theme border border-line px-3 py-2 text-muted transition-colors hover:border-line-strong has-checked:border-accent has-checked:bg-accent/10 has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-accent"
                  >
                    <input type="radio" name="kind" value={value} defaultChecked={value === "bookmark"} className="sr-only" />
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-[11px] text-faint">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
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
              Hit Edit and drag a tile&apos;s corner to resize it in 56px steps.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => addDialogRef.current?.close()} className={BTN}>
                Cancel
              </button>
              <button type="submit" className={BTN_PRIMARY}>
                Add
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* ── FOOTER ── */}
      <footer className="mx-auto mt-10 flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-xs text-faint">
        <span className="flex items-center gap-3">
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
