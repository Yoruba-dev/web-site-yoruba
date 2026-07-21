"use client";

import { useRef } from "react";
import { getPlaceable, type PlacedItem } from "@/lib/symbols";
import PlaceableGlyph from "./PlaceableGlyph";

// A free composition canvas for ONE ring face. Drop symbols from the palette
// (or tap one to drop it in the middle), then drag each to position, and use the
// toolbar to resize / rotate / remove the selected one. Positions are fractions
// (0..1) of the canvas so the design is resolution-independent. Works with mouse,
// touch and pen via pointer events.
function ToolIcon({ d, fill = false }: { d: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d={d}
        fill={fill ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={fill ? 0 : 2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FaceCanvas({
  shape,
  items,
  selectedUid,
  emptyHint = "Arrastra aquí tus símbolos, o toca uno de la paleta",
  onAdd,
  onMove,
  onSelect,
  onRemove,
  onScale,
  onRotate,
}: {
  shape: "round" | "shoulder";
  items: PlacedItem[];
  selectedUid: string | null;
  emptyHint?: string;
  onAdd: (ref: string, x: number, y: number) => void;
  onMove: (uid: string, x: number, y: number) => void;
  onSelect: (uid: string | null) => void;
  onRemove: (uid: string) => void;
  onScale: (uid: string, delta: number) => void;
  onRotate: (uid: string, delta: number) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<string | null>(null);

  function toFraction(clientX: number, clientY: number) {
    const el = canvasRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
    };
  }

  return (
    <div className={`pyj-face pyj-face--${shape}`}>
      <div
        ref={canvasRef}
        className="pyj-face_canvas"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const ref = e.dataTransfer.getData("text/plain");
          const p = toFraction(e.clientX, e.clientY);
          if (ref && p) onAdd(ref, p.x, p.y);
        }}
        onClick={(e) => {
          if (e.target === canvasRef.current) onSelect(null);
        }}
      >
        {items.map((it) => {
          const p = getPlaceable(it.ref);
          if (!p) return null;
          const selected = selectedUid === it.uid;
          return (
            <div
              key={it.uid}
              className={`pyj-item${selected ? " is-selected" : ""}`}
              style={{
                left: `${it.x * 100}%`,
                top: `${it.y * 100}%`,
                transform: `translate(-50%, -50%) rotate(${it.rotation}deg) scale(${it.scale})`,
              }}
              role="button"
              tabIndex={0}
              aria-label={`${p.name}. Arrástralo para moverlo`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = it.uid;
                onSelect(it.uid);
              }}
              onPointerMove={(e) => {
                if (drag.current !== it.uid) return;
                const f = toFraction(e.clientX, e.clientY);
                if (f) onMove(it.uid, f.x, f.y);
              }}
              onPointerUp={(e) => {
                if (drag.current === it.uid) {
                  e.currentTarget.releasePointerCapture?.(e.pointerId);
                  drag.current = null;
                }
              }}
              onKeyDown={(e) => {
                const step = 0.04;
                if (e.key === "ArrowLeft") { e.preventDefault(); onMove(it.uid, it.x - step, it.y); }
                else if (e.key === "ArrowRight") { e.preventDefault(); onMove(it.uid, it.x + step, it.y); }
                else if (e.key === "ArrowUp") { e.preventDefault(); onMove(it.uid, it.x, it.y - step); }
                else if (e.key === "ArrowDown") { e.preventDefault(); onMove(it.uid, it.x, it.y + step); }
                else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onRemove(it.uid); }
              }}
            >
              <PlaceableGlyph placeable={p} className="pyj-item_glyph" />
            </div>
          );
        })}

        {items.length === 0 && <span className="pyj-face_empty">{emptyHint}</span>}
      </div>

      {selectedUid && (
        <div className="pyj-face_tools" role="toolbar" aria-label="Editar símbolo">
          <button type="button" onClick={() => onScale(selectedUid, -0.15)} aria-label="Más pequeño">
            <ToolIcon d="M5 12h14" />
          </button>
          <button type="button" onClick={() => onScale(selectedUid, 0.15)} aria-label="Más grande">
            <ToolIcon d="M12 5v14M5 12h14" />
          </button>
          <button type="button" onClick={() => onRotate(selectedUid, 15)} aria-label="Girar">
            <ToolIcon d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </button>
          <button type="button" className="pyj-face_tool-del" onClick={() => onRemove(selectedUid)} aria-label="Quitar">
            <ToolIcon d="M6 6l12 12M18 6L6 18" />
          </button>
        </div>
      )}
    </div>
  );
}
