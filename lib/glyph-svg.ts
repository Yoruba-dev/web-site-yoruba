// Serializes a ring design into a standalone SVG data-URL, so the finished piece
// shows as a thumbnail in the cart. Mirrors the shapes in components/configurator/
// OduGlyph + MotifGlyph as plain strings (the React glyphs can't be rendered to a
// string off-screen). Gold on a dark signet. Front-face composition (the hero).
import { getOdu, type Mark } from "./odu";
import { getPlaceable, type MotifId, type PlacedItem } from "./symbols";

const GOLD = "#e3b23c";

// One Odù column at horizontal center `cx`.
function colInner(marks: readonly Mark[], cx: number): string {
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
    case "yunque":
      return `<g fill="${GOLD}"><path d="M10 42 Q28 37 40 42 L88 42 L88 55 L60 55 L56 66 L44 66 L40 55 L38 55 Q28 59 12 55 Z"/><rect x="43" y="66" width="14" height="9"/><path d="M27 75 L73 75 L66 90 L34 90 Z"/></g>`;
    case "herradura":
      return `<path d="M30 90 L30 48 A20 20 0 0 1 70 48 L70 90 L58 90 L58 48 A8 8 0 0 0 42 48 L42 90 Z" fill="${GOLD}"/>`;
    case "ancla":
      return `<g fill="none" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"><circle cx="50" cy="16" r="7"/><line x1="50" y1="23" x2="50" y2="86"/><line x1="34" y1="40" x2="66" y2="40"/><path d="M50 86 Q24 84 20 58 M50 86 Q76 84 80 58"/></g>`;
    case "flecha":
      return `<path d="M50 6 L68 32 L56 32 L56 94 L44 94 L44 32 L32 32 Z" fill="${GOLD}"/>`;
    default:
      return "";
  }
}

function placeable(
  ref: string,
  tower?: "both" | "left" | "right",
): { inner: string; w: number; h: number } | null {
  const p = getPlaceable(ref);
  if (!p) return null;
  if (p.kind === "tower" && p.oduId) {
    const odu = getOdu(p.oduId);
    if (!odu) return null;
    if (!tower || tower === "both") {
      // The full Odù — both towers, like the chart.
      return { inner: colInner(odu.left, 27) + colInner(odu.right, 73), w: 100, h: 106 };
    }
    return {
      inner: colInner(tower === "right" ? odu.right : odu.left, 25),
      w: 50,
      h: 106,
    };
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
    const g = placeable(it.ref, it.tower);
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

// One face panel: the face outline (round signet or tapering shoulder) with its
// placed symbols and a caption. Used to build the 3-face order diagram below.
function facePanel(
  items: PlacedItem[],
  label: string,
  shape: "round" | "shoulder",
  cx: number,
  cy: number,
  captionY: number,
): string {
  let out: string;
  let region: string;
  if (shape === "round") {
    const r = 76;
    out =
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1d160d" stroke="${GOLD}" stroke-width="3"/>` +
      // the fixed "+" that crowns the front template (upper-middle)
      `<g fill="${GOLD}"><rect x="${cx - 3}" y="${cy - 34}" width="6" height="26" rx="2"/>` +
      `<rect x="${cx - 13}" y="${cy - 24}" width="26" height="6" rx="2"/></g>`;
    region = itemsGroup(items, cx, cy + 8, r - 22);
  } else {
    const w = 92;
    const top = cy - 84;
    const bottom = cy + 84;
    out = `<path d="M${cx - w / 2 + 6} ${top} L${cx + w / 2 - 6} ${top} L${cx} ${bottom} Z" fill="#1d160d" stroke="${GOLD}" stroke-width="3" stroke-linejoin="round"/>`;
    region = itemsGroup(items, cx, cy - 6, 38);
  }
  const caption = `<text x="${cx}" y="${captionY}" fill="${GOLD}" font-family="Georgia, serif" font-size="15" text-anchor="middle">${label}</text>`;
  return out + region + caption;
}

// One coin face: the struck disc with the engravable field marked, the placed
// symbols inside it, and a caption. The `field` fraction comes from lib/coin.ts
// (measured off the workshop render), so the mockup shows the symbols at the
// same relative size the graver will cut them.
function coinPanel(
  items: PlacedItem[],
  label: string,
  field: number,
  cx: number,
  cy: number,
  captionY: number,
): string {
  const r = 150;
  const inner = r * field;
  const out =
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1d160d" stroke="${GOLD}" stroke-width="3"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${inner.toFixed(1)}" fill="none" stroke="${GOLD}" stroke-width="1.4" stroke-dasharray="4 4" opacity="0.55"/>`;
  const caption = `<text x="${cx}" y="${captionY}" fill="${GOLD}" font-family="Georgia, serif" font-size="15" text-anchor="middle">${label}</text>`;
  return out + itemsGroup(items, cx, cy, inner - 6) + caption;
}

/** Build a data-URL SVG diagram of the WHOLE design, for the cart thumbnail and
 *  the printable sheet. Two layouts:
 *   • "anillo" — the FRONT signet on top and the two LATERALS below.
 *   • "moneda" — the two faces of the coin, side by side.
 *  Safe to drop into an <img>. */
export function designToPreviewDataUrl(
  design: Record<string, PlacedItem[]>,
  layout: "anillo" | "moneda" = "anillo",
): string | undefined {
  // The coin has ONE engravable face (the anverso comes struck) — see lib/coin.ts.
  const faces = layout === "moneda" ? ["reverso"] : ["front", "right", "left"];
  if (!faces.some((f) => (design[f] ?? []).length)) return undefined;

  const W = 420;
  const H = layout === "moneda" ? 420 : 400;
  const body =
    layout === "moneda"
      ? // COIN_FACES[0].field = 0.70
        coinPanel(design.reverso ?? [], "Reverso · tu grabado", 0.7, 210, 190, 386)
      : facePanel(design.front ?? [], "Frente", "round", 210, 118, 214) +
        facePanel(design.left ?? [], "Izquierdo", "shoulder", 112, 290, 388) +
        facePanel(design.right ?? [], "Derecho", "shoulder", 308, 290, 388);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="#171009"/>` +
    body +
    `</svg>`;

  // NO usar btoa: las etiquetas llevan acentos y el separador "·" (U+00B7), y
  // btoa serializa en Latin-1 — el byte suelto 0xB7 no es UTF-8 válido y el
  // navegador se niega a pintar la imagen (miniatura rota en el carrito y en la
  // hoja del taller). encodeURIComponent sí produce UTF-8 correcto, y además
  // funciona en el servidor, donde btoa no existe.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
