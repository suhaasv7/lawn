"use client";

// Board mode: the whole site as one canvas. Cards sit at (x, y) in 56px cells
// (68px pitch with the gap) and drop anywhere, snapped to the cells. Zones are
// named areas; clicking one flies the camera to it. Pan by dragging empty
// space or scrolling; zoom with pinch / ctrl+scroll (free zoom).
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowExpandDiagonal01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { MAX_SPAN, MIN_SIZE, Tile, Zone } from "@/tiles";
import { CTL_BTN, SECTION, TONE, TileCard, TileControls } from "./cards";

export const PITCH = 68; // 56px cell + 12px gap
const GAP = 12;
const MIN_Z = 0.1;
const MAX_Z = 2.5;
const TOP = 84; // the sticky nav covers the top of the board

type Rect = { x: number; y: number; w: number; h: number };
type Camera = { x: number; y: number; z: number };
export type BoardView = { center: () => { x: number; y: number } };

const span = (cells: number) => cells * PITCH - GAP;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const inside = (t: Rect, z: Rect) => t.x >= z.x && t.y >= z.y && t.x + t.w <= z.x + z.w && t.y + t.h <= z.y + z.h;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const rectOf = (t: Tile): Rect => ({ x: t.x ?? 0, y: t.y ?? 0, w: t.w, h: t.h });

// Cards never overlap: the spot closest to r (searching outward ring by ring)
// that doesn't collide with any of `others`.
export function nearestFree(r: Rect, others: Rect[]): Rect {
  const free = (x: number, y: number) => !others.some((o) => overlaps({ ...r, x, y }, o));
  if (free(r.x, r.y)) return r;
  for (let d = 1; d < 300; d++) {
    let best: Rect | null = null;
    let bestDist = Infinity;
    for (let dx = -d; dx <= d; dx++) {
      for (let dy = -d; dy <= d; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== d || !free(r.x + dx, r.y + dy)) continue;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          best = { ...r, x: r.x + dx, y: r.y + dy };
        }
      }
    }
    if (best) return best;
  }
  return r;
}

// Camera that fits a cell rect below the nav, leaving room above it for a zone's label.
function fit(r: Rect, vw: number, vh: number): Camera {
  const w = span(r.w);
  const h = span(r.h);
  const top = TOP + 48;
  const z = clamp(Math.min((vw - 96) / w, (vh - top - 40) / h), MIN_Z, 1.25);
  return { z, x: (vw - w * z) / 2 - r.x * PITCH * z, y: top + (vh - top - 40 - h * z) / 2 - r.y * PITCH * z };
}

// Camera that keeps zoom z and puts the middle of r in the middle of the view.
function centerOn(r: Rect, vw: number, vh: number, z: number): Camera {
  const cx = r.x * PITCH + span(r.w) / 2;
  const cy = r.y * PITCH + span(r.h) / 2;
  return { z, x: vw / 2 - cx * z, y: (vh + TOP) / 2 - cy * z };
}

function bounds(tiles: Tile[]): Rect | null {
  if (!tiles.length) return null;
  const x = Math.min(...tiles.map((t) => t.x ?? 0));
  const y = Math.min(...tiles.map((t) => t.y ?? 0));
  const x2 = Math.max(...tiles.map((t) => (t.x ?? 0) + t.w));
  const y2 = Math.max(...tiles.map((t) => (t.y ?? 0) + t.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

// Gives cards without a board position a spot: first free place, row by row,
// in a COLS-wide band. Returns the same array when nothing needs placing.
export function placeMissing(tiles: Tile[], cols = 24): Tile[] {
  if (!tiles.some((t) => !t.archived && (t.x == null || t.y == null))) return tiles;
  const taken = new Set<string>();
  const mark = (x: number, y: number, w: number, h: number) => {
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) taken.add(`${x + i},${y + j}`);
  };
  const free = (x: number, y: number, w: number, h: number) => {
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) if (taken.has(`${x + i},${y + j}`)) return false;
    return true;
  };
  for (const t of tiles) if (!t.archived && t.x != null && t.y != null) mark(t.x, t.y, t.w, t.h);
  return tiles.map((t) => {
    if (t.archived || (t.x != null && t.y != null)) return t;
    for (let y = 0; y < 10000; y++) {
      for (let x = 0; x + t.w <= Math.max(cols, t.w); x++) {
        if (free(x, y, t.w, t.h)) {
          mark(x, y, t.w, t.h);
          return { ...t, x, y };
        }
      }
    }
    return { ...t, x: 0, y: 0 };
  });
}

// Wheel over something that can still scroll (a long to-do list, a note)
// scrolls that instead of panning the board.
function scrollsInside(target: HTMLElement | null, stop: HTMLElement, dy: number) {
  for (let el = target; el && el !== stop; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) {
      if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight)) return true;
    }
  }
  return false;
}

type Drag = { ids: string[]; zoneId?: string; dx: number; dy: number };
type Sel = { x0: number; y0: number; x1: number; y1: number };
const selRect = (s: Sel): Rect => ({
  x: Math.min(s.x0, s.x1),
  y: Math.min(s.y0, s.y1),
  w: Math.abs(s.x1 - s.x0) + 1,
  h: Math.abs(s.y1 - s.y0) + 1,
});

export default function Board({
  tiles,
  zones,
  editing,
  drawing,
  focusZoneId,
  activeZoneId,
  flyNonce,
  viewRef,
  onTileChange,
  onArchive,
  onDelete,
  onZoneChange,
  onZoneMove,
  onZoneDelete,
  onZoneSelect,
  onZoneDrawn,
  onDrawCancel,
}: {
  tiles: Tile[];
  zones: Zone[];
  editing: boolean;
  drawing: boolean; // "Assign zone": drag across the cells to mark a zone
  focusZoneId: string | null; // just-created zone: focus its name
  activeZoneId: string | null;
  flyNonce: number;
  viewRef: React.RefObject<BoardView | null>;
  onTileChange: (id: string, patch: Partial<Tile>) => void;
  onArchive: (t: Tile) => void;
  onDelete: (t: Tile) => void;
  onZoneChange: (id: string, patch: Partial<Zone>) => void;
  onZoneMove: (id: string, dx: number, dy: number, placements: { id: string; x: number; y: number }[]) => void;
  onZoneDelete: (z: Zone) => void;
  onZoneSelect: (id: string) => void;
  onZoneDrawn: (r: Rect) => void;
  onDrawCancel: () => void;
}) {
  const vpRef = useRef<HTMLDivElement>(null);
  const [cam, setCam] = useState<Camera | null>(null);
  const [animate, setAnimate] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [sel, setSel] = useState<Sel | null>(null);
  const camRef = useRef(cam);
  useEffect(() => {
    camRef.current = cam;
  }, [cam]);

  const activeZone = zones.find((z) => z.id === activeZoneId);

  // First paint: centred on the last zone (at 100%), else everything fitted.
  useLayoutEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    setCam(
      activeZone
        ? centerOn(activeZone, el.clientWidth, el.clientHeight, 1)
        : fit(bounds(tiles) ?? { x: 0, y: 0, w: 18, h: 10 }, el.clientWidth, el.clientHeight)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // Picking a zone pans to its centre, keeping the current zoom.
    const el = vpRef.current;
    if (!el || !activeZone || !camRef.current) return;
    setAnimate(true);
    setCam(centerOn(activeZone, el.clientWidth, el.clientHeight, camRef.current.z));
    const t = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fly only when asked
  }, [activeZoneId, flyNonce]);

  // New cards and zones land in the middle of the view.
  useEffect(() => {
    viewRef.current = {
      center: () => {
        const el = vpRef.current;
        const c = camRef.current;
        if (!el || !c) return { x: 0, y: 0 };
        const k = PITCH * c.z;
        return { x: (el.clientWidth / 2 - c.x) / k, y: ((el.clientHeight + TOP) / 2 - c.y) / k };
      },
    };
  }, [viewRef]);

  // While assigning a zone: Esc cancels; hold Space to pan instead of marking.
  const space = useRef(false);
  useEffect(() => {
    if (!drawing) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDrawCancel();
      if (e.code === "Space" && !(e.target as HTMLElement).closest("input, textarea")) {
        space.current = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && (space.current = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      space.current = false;
    };
  }, [drawing, onDrawCancel]);

  // Screen point → the cell under it.
  const cellAt = (cx: number, cy: number) => {
    const r = vpRef.current!.getBoundingClientRect();
    const c = camRef.current!;
    return { x: Math.floor((cx - r.left - c.x) / c.z / PITCH), y: Math.floor((cy - r.top - c.y) / c.z / PITCH) };
  };

  // Wheel: pan, or zoom around the cursor with ctrl (trackpad pinch sends ctrl+wheel).
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && scrollsInside(e.target as HTMLElement, el, e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1;
      setAnimate(false);
      setCam((c) => {
        if (!c) return c;
        if (e.ctrlKey) {
          const r = el.getBoundingClientRect();
          const px = e.clientX - r.left;
          const py = e.clientY - r.top;
          const z = clamp(c.z * Math.exp(-e.deltaY * unit * 0.01), MIN_Z, MAX_Z);
          return { z, x: px - ((px - c.x) * z) / c.z, y: py - ((py - c.y) * z) / c.z };
        }
        return { ...c, x: c.x - e.deltaX * unit, y: c.y - e.deltaY * unit };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Drag empty space to pan; two fingers to pinch-zoom.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const onPointerDown = (e: React.PointerEvent) => {
    if (drawing && e.isPrimary && e.button === 0 && !space.current && camRef.current) {
      e.currentTarget.setPointerCapture(e.pointerId);
      const c = cellAt(e.clientX, e.clientY);
      setSel({ x0: c.x, y0: c.y, x1: c.x, y1: c.y });
      return;
    }
    if (!drawing && (e.target as HTMLElement).closest("[data-card], [data-zone-ui]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimate(false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drawing && sel) {
      const c = cellAt(e.clientX, e.clientY);
      if (c.x !== sel.x1 || c.y !== sel.y1) setSel({ ...sel, x1: c.x, y1: c.y });
      return;
    }
    const p = pointers.current;
    const prev = p.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    if (p.size === 1) {
      setCam((c) => c && { ...c, x: c.x + next.x - prev.x, y: c.y + next.y - prev.y });
    } else if (p.size === 2) {
      const other = [...p.entries()].find(([id]) => id !== e.pointerId)![1];
      const r = vpRef.current!.getBoundingClientRect();
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y) || 1;
      const d1 = Math.hypot(next.x - other.x, next.y - other.y) || 1;
      const m0 = { x: (prev.x + other.x) / 2 - r.left, y: (prev.y + other.y) / 2 - r.top };
      const m1 = { x: (next.x + other.x) / 2 - r.left, y: (next.y + other.y) / 2 - r.top };
      setCam((c) => {
        if (!c) return c;
        const z = clamp((c.z * d1) / d0, MIN_Z, MAX_Z);
        return { z, x: m1.x - ((m0.x - c.x) * z) / c.z, y: m1.y - ((m0.y - c.y) * z) / c.z };
      });
    }
    p.set(e.pointerId, next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (drawing && sel) {
      const r = selRect(sel);
      setSel(null);
      if (r.w >= 2 && r.h >= 2) onZoneDrawn(r); // a tap or a one-cell sliver isn't a zone
    }
  };

  // Shared drag loop: reports the pointer's travel in board pixels.
  const track = (e: React.PointerEvent, onMove: (dx: number, dy: number) => void, onEnd: (dx: number, dy: number) => void) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const z = camRef.current?.z ?? 1;
    const move = (ev: PointerEvent) => onMove((ev.clientX - sx) / z, (ev.clientY - sy) / z);
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      onEnd((ev.clientX - sx) / z, (ev.clientY - sy) / z);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const cells = (d: number) => Math.round(d / PITCH);

  // Edit mode: drag a card anywhere (snaps to cells on drop).
  const othersThan = (ids: string[]) => tiles.filter((o) => !ids.includes(o.id)).map(rectOf);
  // Where a dragged card lands: its snapped spot, or the nearest free one.
  const landing = (t: Tile, dx: number, dy: number) =>
    nearestFree({ ...rectOf(t), x: (t.x ?? 0) + cells(dx), y: (t.y ?? 0) + cells(dy) }, othersThan([t.id]));

  const startCardDrag = (e: React.PointerEvent, t: Tile) => {
    if (!editing || drawing || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("input, textarea, button, a, select, [data-swapy-no-drag]")) return;
    track(
      e,
      (dx, dy) => setDrag({ ids: [t.id], dx, dy }),
      (dx, dy) => {
        setDrag(null);
        const to = landing(t, dx, dy);
        if (to.x !== t.x || to.y !== t.y) onTileChange(t.id, { x: to.x, y: to.y });
      }
    );
  };

  // Resizing (drag or arrow keys) stops at the first card in the way.
  const tryResize = (t: Tile, w: number, h: number) => {
    const [mw, mh] = MIN_SIZE[t.kind];
    const next = { w: clamp(w, mw, MAX_SPAN), h: clamp(h, mh, MAX_SPAN) };
    if (!othersThan([t.id]).some((o) => overlaps({ ...rectOf(t), ...next }, o))) onTileChange(t.id, next);
  };
  const startCardResize = (e: React.PointerEvent, t: Tile) => {
    const apply = (dx: number, dy: number) => tryResize(t, t.w + cells(dx), t.h + cells(dy));
    track(e, apply, apply);
  };

  // Edit mode: drag a zone by its label (its cards come along) or resize it.
  const startZoneDrag = (e: React.PointerEvent, z: Zone) => {
    if (!editing || drawing || e.button !== 0 || (e.target as HTMLElement).closest("input, button")) return;
    const ids = tiles.filter((t) => inside({ x: t.x ?? 0, y: t.y ?? 0, w: t.w, h: t.h }, z)).map((t) => t.id);
    track(
      e,
      (dx, dy) => setDrag({ ids, zoneId: z.id, dx, dy }),
      (dx, dy) => {
        setDrag(null);
        const mx = cells(dx);
        const my = cells(dy);
        if (!mx && !my) return;
        const placed = othersThan(ids);
        const placements = tiles
          .filter((t) => ids.includes(t.id))
          .map((t) => {
            const to = nearestFree({ ...rectOf(t), x: (t.x ?? 0) + mx, y: (t.y ?? 0) + my }, placed);
            placed.push(to);
            return { id: t.id, x: to.x, y: to.y };
          });
        onZoneMove(z.id, mx, my, placements);
      }
    );
  };
  const startZoneResize = (e: React.PointerEvent, z: Zone) =>
    track(
      e,
      (dx, dy) => onZoneChange(z.id, { w: Math.max(2, z.w + cells(dx)), h: Math.max(2, z.h + cells(dy)) }),
      () => {}
    );

  // Everything on the board. Memoised so panning/zooming (camera changes)
  // doesn't re-render the cards.
  const content = useMemo(() => {
    const shift = (id: string) => (drag && drag.ids.includes(id) ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined);
    const dragging = drag && !drag.zoneId ? tiles.find((t) => t.id === drag.ids[0]) : undefined;
    const ghost = dragging && drag ? landing(dragging, drag.dx, drag.dy) : undefined;
    return (
      <>
        {(editing || drawing) && zones.map((z) => {
          const tone = TONE[z.tone] === "transparent" ? "var(--t-faint)" : TONE[z.tone];
          const active = z.id === activeZoneId;
          return (
            <div
              key={z.id}
              className="pointer-events-none absolute rounded-theme border-[1.5px] border-dashed"
              style={{
                left: z.x * PITCH - 16,
                top: z.y * PITCH - 16,
                width: span(z.w) + 32,
                height: span(z.h) + 32,
                borderColor: `color-mix(in oklab, ${tone} ${active ? 70 : 40}%, transparent)`,
                background: `color-mix(in oklab, ${tone} 4%, transparent)`,
                transform: drag?.zoneId === z.id ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
              }}
            >
              {/* Label stays readable at any zoom (never smaller than its normal size). */}
              <div
                data-zone-ui
                onPointerDown={(e) => startZoneDrag(e, z)}
                className={`pointer-events-auto absolute bottom-full left-0 mb-1.5 flex origin-bottom-left items-center gap-1.5 rounded-theme border border-line bg-bg/80 px-2 py-1 backdrop-blur [transform:scale(max(1,var(--inv-z)))] ${editing ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <span className="size-2 shrink-0 rounded-theme" style={{ background: tone }} />
                {editing ? (
                  <input
                    aria-label="Zone name"
                    value={z.name}
                    autoFocus={z.id === focusZoneId}
                    onFocus={(e) => e.target.select()}
                    maxLength={40}
                    onChange={(e) => onZoneChange(z.id, { name: e.target.value })}
                    onBlur={(e) => !e.target.value.trim() && onZoneChange(z.id, { name: "Zone" })}
                    className={`${SECTION} w-[16ch] bg-transparent text-fg outline-none`}
                  />
                ) : (
                  <button
                    onClick={() => onZoneSelect(z.id)}
                    className={`${SECTION} cursor-pointer whitespace-nowrap ${active ? "text-fg" : ""} hover:text-fg`}
                  >
                    {z.name}
                  </button>
                )}
                {editing && (
                  <button
                    onClick={() => onZoneDelete(z)}
                    aria-label={`Delete zone ${z.name}`}
                    title="Delete zone (cards stay)"
                    className="grid size-4 cursor-pointer place-items-center text-faint hover:text-fg"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={11} strokeWidth={2} />
                  </button>
                )}
              </div>
              {editing && (
                <button
                  data-zone-ui
                  onPointerDown={(e) => startZoneResize(e, z)}
                  aria-label={`Resize zone ${z.name}`}
                  className={`${CTL_BTN} pointer-events-auto -right-2.5 -bottom-2.5 cursor-nwse-resize touch-none`}
                >
                  <HugeiconsIcon icon={ArrowExpandDiagonal01Icon} size={11} strokeWidth={2} />
                </button>
              )}
            </div>
          );
        })}

        {/* Where the dragged card will land. */}
        {ghost && (
          <div
            aria-hidden
            className="absolute rounded-theme border border-dashed border-accent bg-accent/5"
            style={{ left: ghost.x * PITCH, top: ghost.y * PITCH, width: span(ghost.w), height: span(ghost.h) }}
          />
        )}

        {tiles.map((t) => (
          <div
            key={t.id}
            data-card
            onPointerDown={(e) => startCardDrag(e, t)}
            className={`absolute ${editing ? "cursor-grab active:cursor-grabbing" : ""} ${drag?.ids.includes(t.id) ? "z-50 opacity-90" : ""}`}
            style={{
              left: (t.x ?? 0) * PITCH,
              top: (t.y ?? 0) * PITCH,
              width: span(t.w),
              height: span(t.h),
              transform: shift(t.id),
            }}
          >
            <TileCard tile={t} isEditing={editing} onChange={(patch) => onTileChange(t.id, patch)} />
            {editing && (
              <TileControls
                tile={t}
                onArchive={() => onArchive(t)}
                onDelete={() => onDelete(t)}
                onResizeStart={(e) => startCardResize(e, t)}
                onResizeBy={(dw, dh) => tryResize(t, t.w + dw, t.h + dh)}
              />
            )}
          </div>
        ))}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers are recreated each render but only read props/state listed here
  }, [tiles, zones, editing, drawing, drag, activeZoneId, focusZoneId]);

  const k = cam ? PITCH * cam.z : PITCH;
  return (
    <div
      ref={vpRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`fixed inset-0 z-0 touch-none overflow-hidden ${drawing ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
      style={{
        // Faint dot at every cell corner; follows the camera.
        backgroundImage: "radial-gradient(color-mix(in oklab, var(--t-fg) 14%, transparent) 1px, transparent 1.5px)",
        backgroundSize: `${k}px ${k}px`,
        backgroundPosition: cam ? `${cam.x - (GAP / 2) * cam.z}px ${cam.y - (GAP / 2) * cam.z}px` : undefined,
      }}
    >
      {/* Edit mode: faint outline of every cell, like the grid view. */}
      {(editing || drawing) && cam && (
        <div
          aria-hidden
          className="board-cells pointer-events-none absolute inset-0"
          style={{ maskSize: `${k}px ${k}px`, maskPosition: `${cam.x}px ${cam.y}px`, WebkitMaskSize: `${k}px ${k}px`, WebkitMaskPosition: `${cam.x}px ${cam.y}px` }}
        />
      )}
      {cam && (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={
            {
              transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`,
              transition: animate ? "transform 450ms cubic-bezier(0.2, 0.7, 0.2, 1)" : undefined,
              "--inv-z": 1 / cam.z,
            } as React.CSSProperties
          }
        >
          {content}
          {sel && (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded-theme border-[1.5px] border-dashed border-accent bg-accent/10"
              style={{
                left: selRect(sel).x * PITCH,
                top: selRect(sel).y * PITCH,
                width: span(selRect(sel).w),
                height: span(selRect(sel).h),
              }}
            >
              <span className="absolute top-1.5 left-1.5 rounded-theme bg-bg/80 px-1.5 py-0.5 text-[11px] text-fg [transform:scale(max(1,var(--inv-z)))] origin-top-left">
                {selRect(sel).w}×{selRect(sel).h}
              </span>
            </div>
          )}
        </div>
      )}
      {drawing && (
        <div className="pointer-events-none fixed top-24 left-1/2 z-10 -translate-x-1/2 rounded-theme border border-accent/50 bg-bg/85 px-3 py-1.5 text-xs text-fg backdrop-blur">
          Drag to mark the zone · scroll or hold Space to move around · Esc to cancel
        </div>
      )}
    </div>
  );
}
