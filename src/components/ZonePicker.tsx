"use client";

// The nav's zone menu: a themed listbox (button + menu) instead of a native
// <select>. Picking any zone — even the current one — calls onPick, so it can
// re-centre the board. Keyboard: ↑/↓/Home/End move, Enter/Space pick, Esc closes.
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import type { Zone } from "@/tiles";
import { BTN, PANEL, SECTION } from "./cards";

export default function ZonePicker({
  zones,
  current,
  onPick,
}: {
  zones: Zone[];
  current: string | null;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = zones.find((z) => z.id === current);

  const show = () => {
    setActive(Math.max(0, zones.findIndex((z) => z.id === current)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const pick = (z: Zone) => {
    onPick(z.id);
    close();
  };

  // Focus the menu when it opens; close it on any click outside.
  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const outside = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    const last = zones.length - 1;
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => zones[active] && pick(zones[active]),
      " ": () => zones[active] && pick(zones[active]),
      Escape: () => close(),
      Tab: () => close(false),
    };
    if (!moves[e.key]) return;
    if (e.key !== "Tab") e.preventDefault();
    moves[e.key]();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => (e.key === "ArrowDown" || e.key === "ArrowUp") && (e.preventDefault(), show())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Zone: ${selected?.name ?? "none"}. Go to zone`}
        className={`${BTN} max-w-[40vw] ${open ? "border-line-strong text-fg" : ""}`}
      >
        <span className="size-2 shrink-0 rounded-theme bg-accent shadow-[0_0_8px_var(--t-accent)]" />
        <span className="truncate">{selected?.name ?? "Zones"}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={13}
          strokeWidth={1.75}
          className={`shrink-0 text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className={`${PANEL} absolute top-[calc(100%+8px)] left-0 z-50 w-max max-w-[min(320px,80vw)] min-w-[220px] p-1.5`}>
          <div className={`${SECTION} px-2.5 pt-1.5 pb-2`}>Go to zone</div>
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-label="Zones"
            aria-activedescendant={zones[active] ? `zone-opt-${zones[active].id}` : undefined}
            onKeyDown={onKey}
            className="m-0 flex max-h-[60dvh] list-none flex-col gap-0.5 overflow-y-auto p-0 outline-none [scrollbar-width:thin]"
          >
            {zones.map((z, i) => {
              const isCurrent = z.id === current;
              return (
                <li
                  key={z.id}
                  id={`zone-opt-${z.id}`}
                  role="option"
                  aria-selected={isCurrent}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(z)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-theme-sm px-2.5 py-2 text-[13px] transition-colors ${
                    i === active ? "bg-fg/10 text-fg" : "text-muted"
                  }`}
                >
                  <span className={`size-1.5 shrink-0 rounded-theme ${isCurrent ? "bg-accent" : "bg-faint/60"}`} />
                  <span className="min-w-0 flex-1 truncate">{z.name}</span>
                  {isCurrent && <HugeiconsIcon icon={Tick01Icon} size={13} strokeWidth={2} className="shrink-0 text-accent" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
