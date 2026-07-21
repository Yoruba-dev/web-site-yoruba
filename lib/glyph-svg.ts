// Serializes a ring design into a standalone SVG data-URL, so the finished piece
// shows as a thumbnail in the cart. Mirrors the shapes in components/configurator/
// OduGlyph + MotifGlyph as plain strings (the React glyphs can't be rendered to a
// string off-screen). Gold on a dark signet. Front-face composition (the hero).
import { getOdu, type Mark } from "./odu";
import { getPlaceable, type MotifId, type PlacedItem } from "./symbols";
import type { RingSlotId } from "./odu";

const GOLD = "#e3b23c";

// A tower (single column) in a 50×106 box.
function towerInner(marks: readonly Mark[]): string {
  const cx = 25;
  const rowY = [8, 33, 58, 83];
  const h = 15;
  const half = 7;
  let s = "";
  marks.forEach((m, r) => {
    const xs = m === 2 ? [cx - half, cx + half] : [cx];
    xs.forEach((x) => {
      s += `<rect x="${x - 2.5}" y="${rowY[r]}" width="5" height="${h}" rx="2" fill="${GOLD}"/>`;
    });
  });
  return s;
}

// A motif in a 100×100 box (mirrors MotifGlyph).
function motifInner(id: MotifId): string {
  switch (id) {
    case "sol": {
      let rays = "";
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        rays += `<line x1="${50 + 25 * Math.cos(a)}" y1="${50 + 25 * Math.sin(a)}" x2="${50 + 41 * Math.cos(a)}" y2="${50 + 41 * Math.sin(a)}" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>`;
      }
      return `<circle cx="50" cy="50" r="17" fill="${GOLD}"/>${rays}`;
    }
    case "luna":
      return `<path d="M62 12 a38 38 0 1 0 0 76 a30 30 0 1 1 0 -76 z" fill="${GOLD}"/>`;
    case "estrella":
      return `<path d="M50 6 L61 38 L95 39 L68 59 L78 92 L50 72 L22 92 L32 59 L5 39 L39 38 Z" fill="${GOLD}"/>`;
    case "rayo":
      return `<path d="M58 5 L24 55 L45 55 L38 95 L76 42 L53 42 Z" fill="${GOLD}"/>`;
    case "cruz":
      return `<rect x="43" y="10" width="14" height="80" rx="2" fill="${GOLD}"/><rect x="26" y="32" width="48" height="14" rx="2" fill="${GOLD}"/>`;
    case "ojo":
      return `<path d="M6 50 Q50 16 94 50 Q50 84 6 50 Z" fill="none" stroke="${GOLD}" stroke-width="6"/><circle cx="50" cy="50" r="13" fill="${GOLD}"/>`;
    case "corona":
      return `<path d="M16 72 L16 36 L33 53 L50 26 L67 53 L84 36 L84 72 Z" fill="${GOLD}"/><rect x="16" y="72" width="68" height="12" rx="2" fill="${GOLD}"/>`;
    case "hacha":
      return `<rect x="46" y="30" width="8" height="62" rx="3" fill="${GOLD}"/><path d="M50 10 Q22 20 27 46 Q41 39 50 39 Q59 39 73 46 Q78 20 50 10 Z" fill="${GOLD}"/>`;
    default:
      return "";
  }
}

function placeable(ref: string): { inner: string; w: number; h: number } | null {
  const p = getPlaceable(ref);
  if (!p) return null;
  if (p.kind === "tower" && p.oduId) {
    const odu = getOdu(p.oduId);
    if (!odu) return null;
    return { inner: towerInner(odu.left), w: 50, h: 106 };
  }
  if (p.kind === "motif" && p.motif) {
    return { inner: motifInner(p.motif), w: 100, h: 100 };
  }
  return null;
}

const BASE = 30; // on-canvas size of a size-1 item

function itemsGroup(items: PlacedItem[], cx: number, cy: number, r: number): string {
  // Place items within a circle of radius r centered at (cx,cy). x/y are 0..1.
  let s = "";
  for (const it of items) {
    const g = placeable(it.ref);
    if (!g) continue;
    const px = cx - r + it.x * 2 * r;
    const py = cy - r + it.y * 2 * r;
    const k = (BASE / Math.max(g.w, g.h)) * it.scale;
    const tx = px - (g.w * k) / 2;
    const ty = py - (g.h * k) / 2;
    s += `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(3)})">${g.inner}</g>`;
  }
  return s;
}

/** Build a data-URL SVG thumbnail of the design (the front face is the hero; if
 *  it's empty, the first non-empty face is used). Safe to drop into an <img>. */
export function designToPreviewDataUrl(
  design: Record<RingSlotId, PlacedItem[]>,
): string | undefined {
  const order: RingSlotId[] = ["front", "right", "left"];
  const faceId = order.find((id) => (design[id] ?? []).length) ?? "front";
  const items = design[faceId] ?? [];
  if (!items.length) return undefined;

  const W = 220;
  const cx = W / 2;
  const cy = W / 2;
  const r = 92;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}">` +
    `<rect width="${W}" height="${W}" fill="#171009"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1d160d" stroke="${GOLD}" stroke-width="4"/>` +
    itemsGroup(items, cx, cy, r - 10) +
    `</svg>`;

  // btoa is fine here (the SVG is pure ASCII). Client-only (called from the panel).
  if (typeof btoa === "undefined") return undefined;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
