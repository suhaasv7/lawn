"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { createSwapy, Swapy } from "swapy";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArchiveIcon,
  ArrowTurnBackwardIcon,
  Delete02Icon,
  Cancel01Icon,
  Tick01Icon,
  RefreshIcon,
  PencilEdit01Icon,
  PaintBoardIcon,
  CanvasIcon,
  BrowserIcon,
  ArrowDown01Icon,
  CloudUploadIcon,
} from "@hugeicons/core-free-icons";
import { GithubIcon } from "./BrandIcons";
import Board, { BoardView, nearestFree, placeMissing, rectOf } from "./Board";
import {
  BTN,
  BTN_PRIMARY,
  CTL_BTN,
  FIELD,
  PANEL,
  SECTION,
  TileCard,
  TileControls,
  host,
  labelOf,
} from "./cards";
import { ADD_SIZE, MAX_SPAN, MIN_SIZE, TILES, SITE_NAME, Tile, Zone } from "@/tiles";
import {
  BASE_KEYS,
  BASE_LABELS,
  DEFAULT_LOOK,
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
import {
  backupNow,
  canEmbed,
  deleteTheme,
  listBackups,
  restoreBackup,
  saveSettings,
  saveTheme,
  saveTiles,
  saveZones,
} from "@/app/actions";
import type { Snapshot } from "@/lib/notion";

const TILE_IDS = TILES.map((t) => t.id);

type Draft = ThemeBase & { id?: string };
type SaveState = "idle" | "saving" | "saved" | "error";

// The editor works on the five base colors; non-hex values fall back to Midnight's.
const toDraft = (t: Theme): Draft =>
  ({
    id: t.is_preset ? undefined : t.id,
    name: t.name,
    ...Object.fromEntries(BASE_KEYS.map((k) => [k, HEX.test(t[k]) ? t[k] : DEFAULT_THEME[k]])),
  }) as Draft;

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
      className={`${PANEL} fixed inset-auto top-[76px] right-4 sm:right-6 lg:right-8 m-0 max-h-[calc(100dvh-96px)] w-[min(360px,calc(100vw-32px))] overflow-auto p-4`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-sm font-semibold">Theme center</h2>
          <p className="m-0 mt-0.5 text-[11px] text-faint">Applies live · saved to the site</p>
        </div>
        <button className={BTN} onClick={() => setSettings((s) => ({ ...s, ...DEFAULT_LOOK }))} title="Midnight, Cascadia Code, sharp corners">
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
  initialZones,
  initialThemes,
  initialSettings,
  editable,
}: {
  initialTiles: Tile[];
  initialZones: Zone[];
  initialThemes: Theme[];
  initialSettings: Settings;
  editable: boolean;
}) {
  const [tiles, setTiles] = useState(initialTiles);
  const [zones, setZones] = useState(initialZones);
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
  const [addKind, setAddKind] = useState<"bookmark" | "website" | "note" | "todo">("bookmark");
  const visible = tiles.filter((t) => !t.archived);
  const archived = tiles.filter((t) => t.archived);
  const editing = editable && isEditing;
  // Board mode: the site as a free-form canvas (only with live data).
  const board = editable && settings.mode === "board";
  const [flyNonce, setFlyNonce] = useState(0);
  const boardView = useRef<BoardView | null>(null);
  const [drawingZone, setDrawingZone] = useState(false);
  const [focusZoneId, setFocusZoneId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const swapyRef = useRef<Swapy | null>(null);
  const addDialogRef = useRef<HTMLDialogElement>(null);
  const archiveDialogRef = useRef<HTMLDialogElement>(null);
  const backupDialogRef = useRef<HTMLDialogElement>(null);
  // Backups dialog: null = loading; busy = a backup/restore in flight.
  const [backups, setBackups] = useState<{ connected: boolean; list: Snapshot[] } | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");

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

  const savedZones = useRef(JSON.stringify(initialZones));
  useEffect(() => {
    if (!editable) return;
    const json = JSON.stringify(zones);
    if (json === savedZones.current) return;
    persist("zones", async () => {
      await saveZones(zones);
      savedZones.current = json;
    });
  }, [zones, editable, persist]);

  // Cards that have never been on the board get a spot the first time it shows.
  useEffect(() => {
    if (board) setTiles((prev) => placeMissing(prev));
  }, [board, tiles]);

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
          // Slots are the visible tiles only; archived ones keep their place.
          const shown = prev.filter((t) => !t.archived).map((t, i) => byId.get(map[`slot-${i}`]) ?? t);
          let k = 0;
          return prev.map((t) => (t.archived ? t : shown[k++]));
        })
      );
    });

    return () => {
      swapy.destroy();
      swapyRef.current = null;
    };
  }, [layoutVersion, board]);

  useEffect(() => {
    swapyRef.current?.enable(editing);
  }, [editing, layoutVersion, board]);

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

  const changeTile = (id: string, patch: Partial<Tile>) =>
    setTiles((prev) => prev.map((t) => (t.id === id ? ({ ...t, ...patch } as Tile) : t)));

  // On the board, new cards land in the middle of the view (or the nearest free spot).
  const spot = (w: number, h: number) => {
    const c = board ? boardView.current?.center() : undefined;
    if (!c) return {};
    const to = nearestFree({ x: Math.round(c.x - w / 2), y: Math.round(c.y - h / 2), w, h }, visible.map(rectOf));
    return { x: to.x, y: to.y };
  };

  // ── Zones (board mode)
  const selectZone = (id: string | null) => {
    setSettings((s) => ({ ...s, zone_id: id }));
    setFlyNonce((n) => n + 1);
  };
  // "Assign zone": the drawn cell rectangle becomes a zone, named right away.
  const zoneDrawn = (r: { x: number; y: number; w: number; h: number }) => {
    const id = `zone-${Date.now()}`;
    setZones((prev) => [...prev, { id, name: `Zone ${prev.length + 1}`, ...r, tone: "accent", position: prev.length }]);
    setDrawingZone(false);
    setFocusZoneId(id);
    setIsEditing(true);
  };
  const cancelDraw = useCallback(() => setDrawingZone(false), []);
  const changeZone = (id: string, patch: Partial<Zone>) =>
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  const moveZone = (id: string, dx: number, dy: number, placements: { id: string; x: number; y: number }[]) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, x: z.x + dx, y: z.y + dy } : z)));
    const to = new Map(placements.map((p) => [p.id, p]));
    setTiles((prev) => prev.map((t) => (to.has(t.id) ? { ...t, x: to.get(t.id)!.x, y: to.get(t.id)!.y } : t)));
  };
  const deleteZone = (zone: Zone) => {
    if (!confirm(`Delete the "${zone.name}" zone? Its cards stay on the board.`)) return;
    setZones((prev) => prev.filter((z) => z.id !== zone.id));
    if (settings.zone_id === zone.id) setSettings((s) => ({ ...s, zone_id: null }));
  };

  const setArchived = (tile: Tile, value: boolean) => {
    // Coming back onto the board: its old spot, or the nearest free one.
    const back =
      !value && tile.x != null && tile.y != null
        ? nearestFree(rectOf(tile), visible.filter((t) => t.id !== tile.id).map(rectOf))
        : null;
    setTiles((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, archived: value, ...(back && { x: back.x, y: back.y }) } : t))
    );
    setLayoutVersion((v) => v + 1);
  };

  const removeTile = (tile: Tile) => {
    if (!confirm(`Delete "${labelOf(tile)}" for good?`)) return;
    setTiles((prev) => prev.filter((t) => t.id !== tile.id));
    setLayoutVersion((v) => v + 1);
  };

  const addTile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const done = () => {
      setLayoutVersion((v) => v + 1);
      form.reset();
      addDialogRef.current?.close();
    };
    if (addKind === "note") {
      const [w, h] = ADD_SIZE.note;
      setTiles((prev) => [...prev, { id: `note-${Date.now()}`, kind: "note", label: "", text: "", tone: "plain", w, h, ...spot(w, h) }]);
      setIsEditing(true); // straight into typing
      return done();
    }
    if (addKind === "todo") {
      const [w, h] = ADD_SIZE.todo;
      setTiles((prev) => [...prev, { id: `todo-${Date.now()}`, kind: "todo", label: "", items: [], tone: "plain", w, h, ...spot(w, h) }]);
      return done();
    }
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
    const kind = addKind;
    const [w, h] = ADD_SIZE[kind];
    const embed = kind === "website" ? await canEmbed(href) : undefined;
    setTiles((prev) => [...prev, { id: `link-${Date.now()}`, kind, url: href, title, tone: "plain", w, h, embed, ...spot(w, h) }]);
    done();
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

  // ── Backups (Notion)
  const loadBackups = async () => {
    const r = await listBackups();
    if (r.ok) setBackups({ connected: r.connected, list: r.backups });
    else {
      setBackups({ connected: true, list: [] });
      setBackupMsg(r.error);
    }
  };
  const openBackups = () => {
    backupDialogRef.current?.showModal();
    setBackups(null);
    setBackupMsg("");
    loadBackups();
  };
  const runBackupNow = async () => {
    setBackupBusy(true);
    setBackupMsg("Backing up…");
    const r = await backupNow();
    setBackupMsg(!r.ok ? r.error : r.skipped ? "Already backed up in the last minute." : "Backed up to Notion.");
    if (r.ok) await loadBackups();
    setBackupBusy(false);
  };
  const restore = async (b: Snapshot) => {
    if (!confirm(`Restore "${b.name}"? This replaces all cards, zones and settings on the site with that backup.`)) return;
    setBackupBusy(true);
    setBackupMsg("Restoring…");
    const r = await restoreBackup(b.id);
    if (r.ok) window.location.reload();
    else {
      setBackupMsg(r.error);
      setBackupBusy(false);
    }
  };

  const saveLabel = { idle: "", saving: "Saving…", saved: "Saved", error: "Couldn't save" }[saveState];

  return (
    <div className="flex min-h-screen flex-col p-4 sm:p-6 lg:p-8">
      {/* ── TOP NAV ── */}
      <header className="sticky top-3 z-40 mb-5 flex w-full items-center justify-between gap-3 rounded-theme border border-line bg-bg/70 px-4 py-2.5 backdrop-blur-xl backdrop-saturate-150">
        <a href="#" className="flex h-8 items-center text-[15px] font-semibold tracking-tight text-fg no-underline">
          lawn
          <span
            aria-hidden
            className="ml-1 inline-block h-[1.05em] w-[0.55em] animate-blink bg-accent motion-reduce:animate-none"
          />
        </a>

        {board && (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {zones.length > 0 && (
              // Always shows the current zone; picking any zone (even the same
              // one) pans there, because the select's real value stays "".
              <label className="relative flex items-center">
                <span className="sr-only">Go to zone</span>
                <select
                  value=""
                  onChange={(e) => e.target.value && selectZone(e.target.value)}
                  className={`${BTN} max-w-[40vw] appearance-none truncate pr-8`}
                >
                  <option value="" hidden>
                    {zones.find((z) => z.id === settings.zone_id)?.name ?? "Zones"}
                  </option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={13}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute right-2.5 text-muted"
                />
              </label>
            )}
            {editing && (
              <button
                onClick={() => setDrawingZone((v) => !v)}
                aria-pressed={drawingZone}
                title="Assign a zone: drag across the grid to mark it"
                className={`${BTN} border-dashed`}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={1.75} />
                Assign zone
              </button>
            )}
          </div>
        )}

        {editable && (
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <span
              aria-live="polite"
              className={`hidden text-[11px] sm:inline ${saveState === "error" ? "text-[#fb7185]" : "text-faint"}`}
            >
              {saveLabel}
            </span>
            <div role="group" aria-label="View" className="flex">
              <button
                onClick={() => setSettings((s) => ({ ...s, mode: "website" }))}
                aria-pressed={!board}
                title="Website (grid)"
                aria-label="Website view"
                className={`${BTN} rounded-r-none`}
              >
                <HugeiconsIcon icon={BrowserIcon} size={14} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, mode: "board" }))}
                aria-pressed={board}
                title="Board"
                aria-label="Board view"
                className={`${BTN} -ml-px rounded-l-none`}
              >
                <HugeiconsIcon icon={CanvasIcon} size={14} strokeWidth={1.75} />
              </button>
            </div>
            {editing && !board && (
              <button onClick={handleResetLayout} title="Reset layout to default" className={BTN}>
                <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={1.75} />
                <span className="hidden sm:inline">{resetFeedback ? "Layout reset" : "Reset"}</span>
              </button>
            )}
            <button
              onClick={() => archiveDialogRef.current?.showModal()}
              aria-label={`Archive (${archived.length})`}
              title="Archived cards"
              className={BTN}
            >
              <HugeiconsIcon icon={ArchiveIcon} size={14} strokeWidth={1.75} />
              <span className="hidden sm:inline">Archive</span>
              {archived.length > 0 && <span className="tabular-nums text-faint">{archived.length}</span>}
            </button>
            <button onClick={openBackups} aria-label="Backups" title="Backups (Notion)" className={BTN}>
              <HugeiconsIcon icon={CloudUploadIcon} size={14} strokeWidth={1.75} />
              <span className="hidden sm:inline">Backup</span>
            </button>
            <button popoverTarget="theme-center" aria-label="Theme center" className={BTN}>
              <HugeiconsIcon icon={PaintBoardIcon} size={14} strokeWidth={1.75} />
              <span className="hidden sm:inline">Theme</span>
            </button>
            <button
              onClick={() => {
                setIsEditing((v) => !v);
                setDrawingZone(false);
              }}
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

      {board && (
        <Board
          tiles={visible}
          zones={zones}
          editing={editing}
          drawing={drawingZone && editing}
          focusZoneId={focusZoneId}
          activeZoneId={settings.zone_id}
          flyNonce={flyNonce}
          viewRef={boardView}
          onTileChange={changeTile}
          onArchive={(t) => setArchived(t, true)}
          onDelete={removeTile}
          onZoneChange={changeZone}
          onZoneMove={moveZone}
          onZoneDelete={deleteZone}
          onZoneSelect={selectZone}
          onZoneDrawn={zoneDrawn}
          onDrawCancel={cancelDraw}
        />
      )}

      {/* ── BENTO GRID: square cells, tiles span w x h of them ── */}
      {!board && (
      <div className="bento-wrap w-full">
        <main
          ref={containerRef}
          onPointerMove={trackPointer}
          className={`bento-grid${editing ? " editing" : ""}${entering ? " entering" : ""}`}
        >
          {visible.map((tile, i) => (
            <div
              key={`slot-${i}`}
              data-swapy-slot={`slot-${i}`}
              style={{ "--w": tile.w, "--h": tile.h, "--i": i } as React.CSSProperties}
            >
              <div key={tile.id} data-swapy-item={tile.id} className="relative h-full w-full">
                <TileCard
                  tile={tile}
                  isEditing={editing}
                  onChange={(patch) =>
                    setTiles((prev) => prev.map((t) => (t.id === tile.id ? ({ ...t, ...patch } as Tile) : t)))
                  }
                />
                {editing && (
                  <TileControls
                    tile={tile}
                    onArchive={() => setArchived(tile, true)}
                    onDelete={() => removeTile(tile)}
                    onResizeStart={(e) => startResize(e, tile)}
                    onResizeBy={(dw, dh) => resize(tile, tile.w + dw, tile.h + dh)}
                  />
                )}
              </div>
            </div>
          ))}
        </main>
      </div>
      )}

      {/* ── ADD WEBSITE ── native <dialog>: focus trap, Esc, backdrop for free */}
      {editable && (
        <dialog ref={addDialogRef} className={`add-dialog ${PANEL} m-auto w-[min(420px,calc(100vw-32px))] p-0`}>
          <form onSubmit={addTile} className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold">Add a tile</h2>
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ["bookmark", "Bookmark", "Site icon"],
                    ["website", "Website", "Live preview"],
                    ["note", "Note", "Type anything"],
                    ["todo", "To-do", "Checklist"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer flex-col gap-0.5 rounded-theme border border-line px-3 py-2 text-muted transition-colors hover:border-line-strong has-checked:border-accent has-checked:bg-accent/10 has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-accent"
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={value}
                      checked={addKind === value}
                      onChange={() => setAddKind(value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-[11px] text-faint">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {(addKind === "bookmark" || addKind === "website") && (
              <>
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
              </>
            )}
            <p className="m-0 text-xs text-faint">
              {addKind === "note"
                ? "Opens in edit mode so you can start typing."
                : addKind === "todo"
                ? "Add items right in the card."
                : "Hit Edit and drag a tile\u2019s corner to resize it in 56px steps."}
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

      {/* ── ARCHIVE: a near-fullscreen view of the archived cards, shown as the
          cards themselves; restore puts one back where it was in the grid. ── */}
      {editable && (
        <dialog
          ref={archiveDialogRef}
          className={`add-dialog ${PANEL} m-auto h-[calc(100dvh-48px)] max-h-none w-[calc(100vw-48px)] max-w-none p-0`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="m-0 text-base font-semibold">
                Archive <span className="font-normal text-faint">({archived.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => archiveDialogRef.current?.close()}
                aria-label="Close"
                className="grid size-8 cursor-pointer place-items-center rounded-theme text-muted transition-colors hover:bg-fg/10 hover:text-fg"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
              {archived.length === 0 ? (
                <p className="m-0 grid h-full place-items-center text-sm text-muted">
                  Nothing archived. In Edit mode, use a card&apos;s archive button (top-left) to move it here.
                </p>
              ) : (
                <div className="bento-wrap w-full">
                  <div className="bento-grid">
                    {archived.map((t) => (
                      <div key={t.id} className="relative" style={{ "--w": t.w, "--h": t.h } as React.CSSProperties}>
                        <TileCard
                          tile={t}
                          isEditing={false}
                          onChange={(patch) =>
                            setTiles((prev) => prev.map((x) => (x.id === t.id ? ({ ...x, ...patch } as Tile) : x)))
                          }
                        />
                        <div className="absolute top-1.5 right-1.5 z-[2] flex gap-1">
                          <button
                            onClick={() => setArchived(t, false)}
                            aria-label={`Restore ${labelOf(t)}`}
                            title="Restore to the grid"
                            className="flex size-6 cursor-pointer items-center justify-center rounded-theme border border-line-strong bg-bg/80 text-fg backdrop-blur transition-colors hover:bg-fg hover:text-bg"
                          >
                            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={11} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => removeTile(t)}
                            aria-label={`Delete ${labelOf(t)}`}
                            title="Delete for good"
                            className="flex size-6 cursor-pointer items-center justify-center rounded-theme border border-line-strong bg-bg/80 text-fg backdrop-blur transition-colors hover:bg-fg hover:text-bg"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={11} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}

      {/* ── BACKUPS: snapshots in Notion; back up now, open, restore ── */}
      {editable && (
        <dialog ref={backupDialogRef} className={`add-dialog ${PANEL} m-auto w-[min(560px,calc(100vw-32px))] p-0`}>
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold">Backups</h2>
              <button
                type="button"
                onClick={() => backupDialogRef.current?.close()}
                aria-label="Close"
                className="grid size-7 cursor-pointer place-items-center rounded-theme text-muted transition-colors hover:bg-fg/10 hover:text-fg"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.75} />
              </button>
            </div>
            {backups === null ? (
              <p className="m-0 text-sm text-muted">Checking Notion…</p>
            ) : !backups.connected ? (
              <div className="flex flex-col gap-2 text-sm text-muted">
                <p className="m-0">Notion isn&apos;t connected yet. To turn on backups:</p>
                <ol className="m-0 flex list-decimal flex-col gap-1 pl-5">
                  <li>Create an internal integration at notion.so/profile/integrations and copy its secret.</li>
                  <li>Open the &quot;lawn backups&quot; page in Notion → ••• → Connections → add the integration.</li>
                  <li>Add the secret to Vercel as NOTION_TOKEN and redeploy.</li>
                </ol>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-xs text-faint">Backs up daily at about 02:00 IST, plus whenever you press the button.</p>
                  <button onClick={runBackupNow} disabled={backupBusy} className={BTN_PRIMARY}>
                    <HugeiconsIcon icon={CloudUploadIcon} size={14} strokeWidth={1.75} />
                    Back up now
                  </button>
                </div>
                {backups.list.length === 0 ? (
                  <p className="m-0 text-sm text-muted">No backups yet.</p>
                ) : (
                  <ul className="m-0 flex max-h-[50dvh] list-none flex-col gap-2 overflow-y-auto p-0">
                    {backups.list.map((b) => (
                      <li key={b.id} className="flex items-center gap-3 rounded-theme border border-line px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-fg">
                            {b.taken ? new Date(b.taken).toLocaleString() : b.name}
                          </div>
                          <div className="text-[11px] text-faint">
                            {b.trigger} · {b.cards} cards
                          </div>
                        </div>
                        <a href={b.url} target="_blank" rel="noreferrer" className={`${BTN} no-underline`}>
                          Open
                        </a>
                        <button onClick={() => restore(b)} disabled={backupBusy} className={BTN}>
                          Restore
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {backupMsg && (
              <p aria-live="polite" className="m-0 text-xs text-muted">
                {backupMsg}
              </p>
            )}
          </div>
        </dialog>
      )}

      {/* ── FOOTER ── */}
      {!board && (
      <footer className="mt-10 flex w-full flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-xs text-faint">
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
      )}
    </div>
  );
}

export default Bento;
