// Card rendering shared by the grid ("website mode") and the board: every
// card kind, the edit-mode controls, and the shared class sets / helpers.
import React, { useState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  ArrowExpandDiagonal01Icon,
  Cursor01Icon,
  ComputerIcon,
  SmartPhone01Icon,
  BorderFullIcon,
  BorderNone01Icon,
  ArchiveArrowDownIcon,
  Cancel01Icon,
  Drag01Icon,
} from "@hugeicons/core-free-icons";
import { Tile, Tone } from "@/tiles";

// Per-tile accent, exposed as --tone (bg-(--tone), text-(--tone), tile wash).
export const TONE: Record<Tone, string> = {
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
export const BTN =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-theme border border-line bg-fg/5 text-muted text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:text-fg hover:bg-fg/10 hover:border-line-strong aria-pressed:text-fg aria-pressed:border-accent/60 aria-pressed:bg-accent/15 disabled:opacity-50 disabled:cursor-not-allowed";
export const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-theme border border-fg bg-fg text-bg text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors hover:bg-fg/85 disabled:opacity-50 disabled:cursor-not-allowed";
export const CTL =
  "absolute z-[2] flex items-center justify-center min-w-5 h-5 px-1 text-[10px] leading-none text-fg bg-bg/80 backdrop-blur border border-line-strong rounded-theme";
export const CTL_BTN = `${CTL} cursor-pointer transition-colors hover:bg-fg hover:text-bg`;
export const FIELD =
  "w-full bg-fg/5 border border-line rounded-theme px-3 py-2 text-sm text-fg placeholder:text-faint outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/25";
export const SECTION = "text-[11px] uppercase tracking-[0.14em] text-faint";
export const PANEL =
  "bg-surface/95 backdrop-blur-xl border border-line-strong rounded-theme text-fg shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]";

export const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");
export const favicon = (url: string) => `https://www.google.com/s2/favicons?domain=${host(url)}&sz=128`;
export const KIND_LABEL: Record<Tile["kind"], string> = {
  intro: "Intro",
  bookmark: "Bookmark",
  website: "Website",
  note: "Note",
  todo: "To-do",
  list: "List",
  clock: "Clock",
};
export const labelOf = (t: Tile) =>
  (t.kind === "bookmark" || t.kind === "website" ? t.title : t.kind === "intro" ? t.name : t.label) ||
  KIND_LABEL[t.kind];

// ponytail: microlink's free tier (~50 previews/day per visitor IP); set `image`
// on the tile or self-host screenshots if that ever runs dry.
const previewImage = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

export const ARROWS: Record<string, [number, number]> = {
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

// Website preview: the site gets a real window the size of the tile (in
// desktop view it's laid out at DESKTOP_W and scaled down to fit). Look-only
// previews can't be scrolled or clicked; only interact mode can. Browsers
// don't expose another site's scroll position, so it isn't saved.
const DESKTOP_W = 1280;

// Full-bleed by default: the site covers the whole tile and the controls slide
// in when you hover the top edge. The frame button switches to the bordered
// layout with header and title. Look-only until the cursor button turns
// interaction on (always look-only while editing, so dragging works).
// Screenshot if the site can't be framed.
function WebsiteTile({
  tile,
  isEditing,
  style,
  onChange,
}: {
  tile: Extract<Tile, { kind: "website" }>;
  isEditing: boolean;
  style: React.CSSProperties;
  onChange: (patch: Partial<Tile>) => void;
}) {
  const [live, setLive] = useState(false);
  const interactive = live && !isEditing;
  const site = host(tile.url);
  const embed = tile.embed !== false && !tile.image;
  const desktop = tile.view !== "mobile";
  const framed = tile.frame === true;
  const iconBtn =
    "grid size-7 shrink-0 cursor-pointer place-items-center rounded-theme border border-line bg-bg/40 text-muted transition-colors hover:border-line-strong hover:text-fg";
  const guard = (e: React.MouseEvent) => isEditing && e.preventDefault();

  // Measure the preview box: it decides the iframe's width (mobile) or scale (desktop).
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setBox({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const boxW = box.w;
  const viewW = desktop ? DESKTOP_W : boxW;
  const scale = viewW ? boxW / viewW : 1;
  const viewH = box.h / scale;

  const header = (
    <>
      <img src={favicon(tile.url)} alt="" width={14} height={14} draggable={false} className="shrink-0" />
      <span className="min-w-0 truncate">{site}</span>
      <span className="ml-auto flex shrink-0 gap-1.5">
        {embed && (
          <button
            type="button"
            data-swapy-no-drag
            onClick={() => onChange({ view: desktop ? "mobile" : "desktop" })}
            title={desktop ? "Desktop view — switch to mobile" : "Mobile view — switch to desktop"}
            aria-label={desktop ? "Switch to mobile view" : "Switch to desktop view"}
            className={iconBtn}
          >
            <HugeiconsIcon icon={desktop ? ComputerIcon : SmartPhone01Icon} size={13} strokeWidth={1.75} />
          </button>
        )}
        {embed && !isEditing && (
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            aria-pressed={live}
            title={live ? "Stop interacting" : "Interact with the site"}
            className={`${iconBtn} aria-pressed:border-accent aria-pressed:bg-accent/15 aria-pressed:text-fg`}
          >
            <HugeiconsIcon icon={live ? Cancel01Icon : Cursor01Icon} size={13} strokeWidth={1.75} />
          </button>
        )}
        <button
          type="button"
          data-swapy-no-drag
          onClick={() => onChange({ frame: !framed })}
          title={framed ? "Hide frame (full-bleed)" : "Show frame and controls"}
          aria-label={framed ? "Hide frame" : "Show frame"}
          className={iconBtn}
        >
          <HugeiconsIcon icon={framed ? BorderNone01Icon : BorderFullIcon} size={13} strokeWidth={1.75} />
        </button>
        <a
          href={tile.url}
          target="_blank"
          rel="noreferrer"
          draggable={false}
          onClick={guard}
          aria-label={`Open ${site} in a new tab`}
          className={iconBtn}
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.75} />
        </a>
      </span>
    </>
  );

  const preview = (
    <div
      ref={boxRef}
      className={`overflow-hidden bg-raised ${
        framed
          ? `relative min-h-0 min-w-0 flex-1 rounded-theme-sm border transition-colors ${interactive ? "border-accent ring-1 ring-accent" : "border-line"}`
          : `absolute inset-0 ${interactive ? "ring-2 ring-inset ring-accent" : ""}`
      }`}
    >
      {embed ? (
        <div className="relative h-full">
          {/* Always rendered (hidden until measured): a remounted card must keep
              the same DOM shape, or Swapy's swap animation throws. */}
          <iframe
            key={tile.view ?? "desktop"}
            src={tile.url}
            title={`${tile.title} (${site})`}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            tabIndex={interactive ? 0 : -1}
            style={
              boxW > 0
                ? { width: viewW, height: viewH, transform: `scale(${scale})`, transformOrigin: "0 0" }
                : { visibility: "hidden" }
            }
            className={`absolute top-0 left-0 border-0 ${interactive ? "" : "pointer-events-none"}`}
          />
        </div>
      ) : (
        // absolute img: a 2560px screenshot must not stretch the grid row
        <img
          src={tile.image ?? previewImage(tile.url)}
          alt={`Preview of ${site}`}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-top opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
      )}
    </div>
  );

  if (!framed) {
    return (
      <div className="tile tile-bare group h-full w-full" style={style}>
        {preview}
        {/* A thin strip along the top edge; hovering it (or tabbing into it)
            slides the controls bar in. Hidden bar = no pointer events, so the
            site underneath stays usable. */}
        <div className="group/top absolute inset-x-0 top-0 z-[1] h-2">
          <div
            className={`invisible absolute inset-x-0 top-0 flex items-center gap-2 border-b border-line bg-bg/85 py-2 text-[11px] text-faint opacity-0 backdrop-blur-md transition-[opacity,visibility] duration-200 group-focus-within/top:visible group-focus-within/top:opacity-100 group-hover/top:visible group-hover/top:opacity-100 ${isEditing ? "px-9" : "px-3"}`}
          >
            {header}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tile group flex h-full w-full flex-col gap-3 p-4" style={style}>
      <div className="flex items-center gap-2 text-[11px] text-faint">{header}</div>
      {preview}
      <a href={tile.url} target="_blank" rel="noreferrer" draggable={false} onClick={guard} className="min-w-0 text-fg no-underline">
        <div className="truncate text-base font-semibold leading-tight tracking-tight">{tile.title}</div>
        <div className="truncate text-xs text-muted">{tile.note ?? site}</div>
      </a>
    </div>
  );
}

// To-do list: tick, add and delete items any time; the label is edited in edit mode.
function TodoTile({
  tile,
  isEditing,
  style,
  onChange,
}: {
  tile: Extract<Tile, { kind: "todo" }>;
  isEditing: boolean;
  style: React.CSSProperties;
  onChange: (patch: Partial<Tile>) => void;
}) {
  const [draft, setDraft] = useState("");
  const items = tile.items ?? [];
  const setItems = (next: typeof items) => onChange({ items: next });
  const done = items.filter((i) => i.done).length;

  return (
    <div className="tile flex h-full w-full flex-col gap-3 p-5" style={style}>
      <div className={`flex items-center gap-2 ${SECTION}`}>
        {tile.tone !== "plain" && <span className="size-1.5 rounded-theme bg-(--tone) shadow-[0_0_10px_var(--tone)]" />}
        {isEditing ? (
          <input
            data-swapy-no-drag
            aria-label="List label"
            value={tile.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="to-do"
            maxLength={40}
            className="min-w-0 flex-1 bg-transparent uppercase tracking-[0.14em] outline-none placeholder:text-faint/60"
          />
        ) : (
          <span className="min-w-0 truncate">{tile.label || "to-do"}</span>
        )}
        <span className="ml-auto tabular-nums tracking-normal">
          {done}/{items.length}
        </span>
      </div>
      <ul className="m-0 min-h-0 flex-1 list-none space-y-1.5 overflow-y-auto p-0 [scrollbar-width:thin]">
        {items.map((item, i) => (
          <li key={i} className="group/item flex items-start gap-2 text-[13px] leading-snug">
            <input
              data-swapy-no-drag
              type="checkbox"
              checked={item.done}
              onChange={() => setItems(items.map((it, j) => (j === i ? { ...it, done: !it.done } : it)))}
              aria-label={item.text}
              className="mt-0.5 size-3.5 shrink-0 cursor-pointer accent-accent"
            />
            <span className={`min-w-0 flex-1 break-words ${item.done ? "text-faint line-through" : ""}`}>{item.text}</span>
            <button
              type="button"
              data-swapy-no-drag
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              aria-label={`Delete "${item.text}"`}
              className="shrink-0 cursor-pointer text-faint opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-fg focus:opacity-100"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>
      <form
        data-swapy-no-drag
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          setItems([...items, { text, done: false }]);
          setDraft("");
        }}
      >
        <input
          aria-label="Add a to-do"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a to-do…"
          maxLength={200}
          className="w-full border-t border-line bg-transparent pt-2 text-[13px] text-fg outline-none placeholder:text-faint"
        />
      </form>
    </div>
  );
}

export function TileCard({
  tile,
  isEditing,
  onChange,
}: {
  tile: Tile;
  isEditing: boolean;
  onChange: (patch: Partial<Tile>) => void;
}) {
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

      return <WebsiteTile tile={tile} isEditing={isEditing} style={style} onChange={onChange} />;
    }

    case "note":
      // Edit mode turns the note into fields you type into; otherwise it's text.
      if (isEditing) {
        return (
          <div className={`${base} flex-col gap-2 p-4 pt-9`} style={style}>
            <input
              data-swapy-no-drag
              aria-label="Note label"
              value={tile.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="Label (optional)"
              maxLength={40}
              className={`${SECTION} bg-transparent outline-none placeholder:text-faint/60`}
            />
            <textarea
              data-swapy-no-drag
              aria-label="Note text"
              value={tile.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Type anything…"
              maxLength={3000}
              autoFocus={!tile.text}
              className="min-h-0 flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-fg outline-none placeholder:text-faint"
            />
          </div>
        );
      }
      return (
        <div className={`${base} flex-col gap-3 p-5`} style={style}>
          {tile.label && <Label dot={dot}>{tile.label}</Label>}
          <p
            className={`m-0 mt-auto min-h-0 overflow-y-auto whitespace-pre-wrap break-words [scrollbar-width:thin] ${
              tile.text.length > 90 ? "text-sm leading-relaxed" : "text-lg font-medium leading-snug tracking-tight sm:text-xl"
            }`}
          >
            {tile.text}
          </p>
        </div>
      );

    case "todo":
      return <TodoTile tile={tile} isEditing={isEditing} style={style} onChange={onChange} />;

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

// Edit-mode overlay on a card: archive (top-left), delete (top-right), size and
// the resize handle (drag it, or focus it and use the arrow keys). The grip and
// size badge only show where there's room.
export function TileControls({
  tile,
  onArchive,
  onDelete,
  onResizeStart,
  onResizeBy,
}: {
  tile: Tile;
  onArchive: () => void;
  onDelete: () => void;
  onResizeStart: (e: React.PointerEvent) => void;
  onResizeBy: (dw: number, dh: number) => void;
}) {
  const roomy = tile.w > 1 && tile.h > 1;
  return (
    <>
      {roomy && (
        <div aria-hidden className={`${CTL} pointer-events-none top-1.5 left-1/2 -translate-x-1/2 px-2`}>
          <HugeiconsIcon icon={Drag01Icon} size={12} strokeWidth={1.75} />
        </div>
      )}
      <button
        data-swapy-no-drag
        onClick={onArchive}
        aria-label={`Archive ${labelOf(tile)}`}
        title="Archive"
        className={`${CTL_BTN} top-1.5 left-1.5`}
      >
        <HugeiconsIcon icon={ArchiveArrowDownIcon} size={11} strokeWidth={2} />
      </button>
      <button
        data-swapy-no-drag
        onClick={onDelete}
        aria-label={`Delete ${labelOf(tile)}`}
        title="Delete"
        className={`${CTL_BTN} top-1.5 right-1.5`}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={11} strokeWidth={2} />
      </button>
      {roomy && (
        <span aria-hidden className={`${CTL} pointer-events-none bottom-1.5 left-1.5`}>
          {tile.w}×{tile.h}
        </span>
      )}
      <button
        data-swapy-no-drag
        onPointerDown={onResizeStart}
        onKeyDown={(e) => {
          const d = ARROWS[e.key];
          if (!d) return;
          e.preventDefault();
          onResizeBy(d[0], d[1]);
        }}
        aria-label={`Resize ${labelOf(tile)}, ${tile.w} by ${tile.h}. Drag, or use arrow keys.`}
        className={`${CTL_BTN} right-1.5 bottom-1.5 cursor-nwse-resize touch-none`}
      >
        <HugeiconsIcon icon={ArrowExpandDiagonal01Icon} size={11} strokeWidth={2} />
      </button>
    </>
  );
}
