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

// Camera that fits a cell rect below the nav, leaving room above it for a zone's label.
function fit(r: Rect, vw: number, vh: number): Camera {
  const w = span(r.w);
  const h = span(r.h);
  const top = TOP + 48;
  const z = clamp(Math.min((vw - 96) / w, (vh - top - 40) / h), MIN_Z, 1.25);
  return { z, x: (vw - w * z) / 2 - r.x * PITCH * z, y: top + (vh - top - 40 - h * z) / 2 - r.y * PITCH * z };
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

export default function Board({
  tiles,
  zones,
  editing,
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
}: {
  tiles: Tile[];
  zones: Zone[];
  editing: boolean;
  activeZoneId: string | null;
  flyNonce: number;
  viewRef: React.RefObject<BoardView | null>;
  onTileChange: (id: string, patch: Partial<Tile>) => void;
  onArchive: (t: Tile) => void;
  onDelete: (t: Tile) => void;
  onZoneChange: (id: string, patch: Partial<Zone>) => void;
  onZoneMove: (id: string, dx: number, dy: number, tileIds: string[]) => void;
  onZoneDelete: (z: Zone) => void;
  onZoneSelect: (id: string) => void;
}) {
  const vpRef = useRef<HTMLDivElement>(null);
  const [cam, setCam] = useState<Camera | null>(null);
  const [animate, setAnimate] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const camRef = useRef(cam);
  useEffect(() => {
    camRef.current = cam;
  }, [cam]);

  // Where to look: the active zone, else everything.
  const target = (): Rect => {
    const zone = zones.find((z) => z.id === activeZoneId);
    return zone ?? bounds(tiles) ?? { x: 0, y: 0, w: 18, h: 10 };
  };

  // First paint: jump straight there. Later zone picks (flyNonce): glide.
  useLayoutEffect(() => {
    const el = vpRef.current;
    if (el) setCam(fit(target(), el.clientWidth, el.clientHeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = vpRef.current;
    if (!el) return;
    setAnimate(true);
    setCam(fit(target(), el.clientWidth, el.clientHeight));
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
    if ((e.target as HTMLElement).closest("[data-card], [data-zone-ui]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimate(false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
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
  const onPointerUp = (e: React.PointerEvent) => pointers.current.delete(e.pointerId);

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
  const startCardDrag = (e: React.PointerEvent, t: Tile) => {
    if (!editing || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("input, textarea, button, a, select, [data-swapy-no-drag]")) return;
    track(
      e,
      (dx, dy) => setDrag({ ids: [t.id], dx, dy }),
      (dx, dy) => {
        setDrag(null);
        if (cells(dx) || cells(dy)) onTileChange(t.id, { x: (t.x ?? 0) + cells(dx), y: (t.y ?? 0) + cells(dy) });
      }
    );
  };

  const startCardResize = (e: React.PointerEvent, t: Tile) => {
    const [mw, mh] = MIN_SIZE[t.kind];
    const size = (dx: number, dy: number) => ({
      w: clamp(t.w + cells(dx), mw, MAX_SPAN),
      h: clamp(t.h + cells(dy), mh, MAX_SPAN),
    });
    track(
      e,
      (dx, dy) => onTileChange(t.id, size(dx, dy)),
      (dx, dy) => onTileChange(t.id, size(dx, dy))
    );
  };

  // Edit mode: drag a zone by its label (its cards come along) or resize it.
  const startZoneDrag = (e: React.PointerEvent, z: Zone) => {
    if (!editing || e.button !== 0 || (e.target as HTMLElement).closest("input, button")) return;
    const ids = tiles.filter((t) => inside({ x: t.x ?? 0, y: t.y ?? 0, w: t.w, h: t.h }, z)).map((t) => t.id);
    track(
      e,
      (dx, dy) => setDrag({ ids, zoneId: z.id, dx, dy }),
      (dx, dy) => {
        setDrag(null);
        if (cells(dx) || cells(dy)) onZoneMove(z.id, cells(dx), cells(dy), ids);
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
    return (
      <>
        {zones.map((z) => {
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
        {dragging && (
          <div
            aria-hidden
            className="absolute rounded-theme border border-dashed border-accent bg-accent/5"
            style={{
              left: ((dragging.x ?? 0) + cells(drag!.dx)) * PITCH,
              top: ((dragging.y ?? 0) + cells(drag!.dy)) * PITCH,
              width: span(dragging.w),
              height: span(dragging.h),
            }}
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
                onResizeBy={(dw, dh) =>
                  onTileChange(t.id, {
                    w: clamp(t.w + dw, MIN_SIZE[t.kind][0], MAX_SPAN),
                    h: clamp(t.h + dh, MIN_SIZE[t.kind][1], MAX_SPAN),
                  })
                }
              />
            )}
          </div>
        ))}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers are recreated each render but only read props/state listed here
  }, [tiles, zones, editing, drag, activeZoneId]);

  const k = cam ? PITCH * cam.z : PITCH;
  return (
    <div
      ref={vpRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="fixed inset-0 z-0 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      style={{
        // Faint dot at every cell corner; follows the camera.
        backgroundImage: "radial-gradient(color-mix(in oklab, var(--t-fg) 14%, transparent) 1px, transparent 1.5px)",
        backgroundSize: `${k}px ${k}px`,
        backgroundPosition: cam ? `${cam.x - (GAP / 2) * cam.z}px ${cam.y - (GAP / 2) * cam.z}px` : undefined,
      }}
    >
      {/* Edit mode: faint outline of every cell, like the grid view. */}
      {editing && cam && (
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
        </div>
      )}
    </div>
  );
}
