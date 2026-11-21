// ---------------------------------------------------------------------------
// The 16 principal Odù Meji of Ifá — modeled as DATA so every symbol is drawn
// from its binary pattern (see components/configurator/OduGlyph.tsx), never from
// image assets. Adding or editing a symbol = editing data here, nothing else.
//
// Each Odù is two columns of 4 positions, top→bottom; a position is a SINGLE
// mark (1, "I") or a DOUBLE mark (2, "II"). Verified against the workshop's own
// reference chart (Eji-Ogbe all-single, Oyeku all-double; the 16 form the full
// set of 4-position patterns). Names follow the shop's chart (Yoruba/Lucumí).
//
// Cultural note: these are sacred signs of a living Yoruba/Lucumí tradition. The
// meanings below are brief heritage context only — an Odù's true reading belongs
// to the tradition and is revealed by a babaláwo in consultation, never fixed to
// a product. Copy must honor the sign as identity/heritage, not as a charm.
// ---------------------------------------------------------------------------

/** A single mark position: 1 = single (I / "open"), 2 = double (II / "closed"). */
export type Mark = 1 | 2;
export type OduColumn = readonly [Mark, Mark, Mark, Mark]; // top → bottom

export interface Odu {
  /** URL/DOM-safe id, e.g. "eji-ogbe". */
  id: string;
  /** Traditional order / seniority, 1..16. */
  number: number;
  /** Display name (shop's chart spelling). */
  name: string;
  /** Left and right columns of the sign, top → bottom. */
  left: OduColumn;
  right: OduColumn;
  /** Short, respectful heritage descriptor (NOT a fortune or instruction). */
  note: string;
}

export const ODU_MEJI: readonly Odu[] = [
  { id: "eji-ogbe", number: 1, name: "Eji Ogbe", left: [1, 1, 1, 1], right: [1, 1, 1, 1], note: "Luz y creación; el camino abierto y los nuevos comienzos." },
  { id: "oyeku-meji", number: 2, name: "Oyeku Meji", left: [2, 2, 2, 2], right: [2, 2, 2, 2], note: "La noche y los ancestros; el cierre de un ciclo." },
  { id: "iwori-meji", number: 3, name: "Iwori Meji", left: [2, 1, 1, 2], right: [2, 1, 1, 2], note: "La mirada profunda; introspección y transformación." },
  { id: "odi-meji", number: 4, name: "Odi Meji", left: [1, 2, 2, 1], right: [1, 2, 2, 1], note: "El sello y el fundamento; contención y protección." },
  { id: "irosun-meji", number: 5, name: "Irosun Meji", left: [1, 1, 2, 2], right: [1, 1, 2, 2], note: "La memoria ancestral; sabiduría que emerge." },
  { id: "owonrin-meji", number: 6, name: "Owonrin Meji", left: [2, 2, 1, 1], right: [2, 2, 1, 1], note: "El movimiento y el cambio inesperado." },
  { id: "obara-meji", number: 7, name: "Obara Meji", left: [1, 2, 2, 2], right: [1, 2, 2, 2], note: "El discernimiento y la palabra." },
  { id: "okanran-meji", number: 8, name: "Okanran Meji", left: [2, 2, 2, 1], right: [2, 2, 2, 1], note: "La fuerza súbita; firmeza con humildad." },
  { id: "ogunda-meji", number: 9, name: "Ogunda Meji", left: [1, 1, 1, 2], right: [1, 1, 1, 2], note: "Quien abre el camino; fuerza guiada por la sabiduría." },
  { id: "osa-meji", number: 10, name: "Osa Meji", left: [2, 1, 1, 1], right: [2, 1, 1, 1], note: "Los vientos de Oyá; poder y seriedad espiritual." },
  { id: "ika-meji", number: 11, name: "Ika Meji", left: [2, 1, 2, 2], right: [2, 1, 2, 2], note: "El resguardo; prudencia y sabiduría guardada." },
  { id: "oturupon-meji", number: 12, name: "Oturupon Meji", left: [2, 2, 1, 2], right: [2, 2, 1, 2], note: "Quien sostiene la carga; constancia y aguante." },
  { id: "otura-meji", number: 13, name: "Otura Meji", left: [1, 2, 1, 1], right: [1, 2, 1, 1], note: "El consuelo; fe y conocimiento con buen carácter." },
  { id: "irete-meji", number: 14, name: "Irete Meji", left: [1, 1, 2, 1], right: [1, 1, 2, 1], note: "El empuje; perseverancia y reverencia." },
  { id: "ose-meji", number: 15, name: "Ose Meji", left: [1, 2, 1, 2], right: [1, 2, 1, 2], note: "La victoria; sabiduría refinada por el sacrificio." },
  { id: "ofun-meji", number: 16, name: "Ofun Meji", left: [2, 1, 2, 1], right: [2, 1, 2, 1], note: "La bendición; autoridad espiritual y reverencia." },
] as const;

export function getOdu(id: string): Odu | undefined {
  return ODU_MEJI.find((o) => o.id === id);
}

// ---------------------------------------------------------------------------
// Ring faces the customer can decorate. Order = left → front → right so the UI
// reads like the ring wrapping the finger. Adding a face (e.g. inner band) is a
// data-only change here; the configurator maps over RING_SLOTS.
// ---------------------------------------------------------------------------
export type RingSlotId = "left" | "front" | "right";

export interface RingSlot {
  id: RingSlotId;
  /** Full accessible label. */
  label: string;
  /** Compact label for chips/summary. */
  short: string;
}

export const RING_SLOTS: readonly RingSlot[] = [
  { id: "left", label: "Lateral izquierdo", short: "Izquierdo" },
  { id: "front", label: "Frente del anillo", short: "Frente" },
  { id: "right", label: "Lateral derecho", short: "Derecho" },
] as const;

/** A saved design: which Odù (by id) sits on each ring face. */
export type RingConfig = Record<RingSlotId, string | null>;

export const EMPTY_RING_CONFIG: RingConfig = { left: null, front: null, right: null };

/** True when at least one face has a symbol (i.e. worth ordering). */
export function hasAnySymbol(config: RingConfig): boolean {
  return RING_SLOTS.some((s) => config[s.id]);
}

// ---------------------------------------------------------------------------
// LUCUMÍ NAMES — the name the Cuban/Lucumí libreta uses for each Meyi. Kept as
// a separate map (not a new field on ODU_MEJI) so the verified patterns above
// are never touched. `name` above stays the shop chart's Yoruba spelling; the
// watch shows the Lucumí name first and the Yoruba one second.
// ---------------------------------------------------------------------------
export const ODU_LUCUMI: Readonly<Record<string, string>> = {
  "eji-ogbe": "Baba Ejiogbe",
  "oyeku-meji": "Oyekun Meyi",
  "iwori-meji": "Iwori Meyi",
  "odi-meji": "Odi Meyi",
  "irosun-meji": "Iroso Meyi",
  "owonrin-meji": "Ojuani Meyi",
  "obara-meji": "Obara Meyi",
  "okanran-meji": "Okana Meyi",
  "ogunda-meji": "Ogunda Meyi",
  "osa-meji": "Osa Meyi",
  "ika-meji": "Ika Meyi",
  "oturupon-meji": "Otrupon Meyi",
  "otura-meji": "Otura Meyi",
  "irete-meji": "Irete Meyi",
  "ose-meji": "Oshe Meyi",
  "ofun-meji": "Ofun Meyi",
};

/** Lucumí display name of a Meyi ("Ofun Meyi"), or undefined for an unknown id. */
export function lucumiName(oduId: string): string | undefined {
  return ODU_LUCUMI[oduId];
}

/** Lucumí name of ONE leg (column) of a sign — "Otura", "Ika", "Ogbe". Used to
 *  tell the workshop which column goes where in a combination sign. It is a
 *  column label, never the name of the customer's sign: combination names are
 *  typed by the customer exactly as in their libreta, never generated. */
export function lucumiLeg(oduId: string): string | undefined {
  if (oduId === "eji-ogbe") return "Ogbe";
  return ODU_LUCUMI[oduId]?.replace(/ Meyi$/, "");
}

// ---------------------------------------------------------------------------
// SHARED MARK GEOMETRY — the one place that decides where a single (I) or a
// double (II) mark sits. OduGlyph (React), glyph-svg (cart thumbnail), the
// watch dial / caseback (lib/watch-art.ts) and the laser file all draw from
// oduMarks(), so a mark can never look different on two surfaces.
//
// COLUMN CONVENTION (unchanged from OduGlyph): a sign is drawn as on the chart,
// seen from the front. `odu.left` sits on the viewer's LEFT (x = 27 in the
// 100-wide box) and `odu.right` on the viewer's RIGHT (x = 73). The RIGHT
// column is the pierna DERECHA: it is read first and names the sign ("Otura
// Ika" = Otura on the right, Ika on the left). Marks run top → bottom, and a
// sign is ALWAYS drawn upright (12 o'clock up) and never mirrored: flipping it
// turns 12 of the 16 Meyi into a different sign (see flipVertical).
//
// Units: the chart cell. One column is 50 × 106; the full sign is 100 × 106
// with the column centres 23 either side of the middle (27 / 73).
// ---------------------------------------------------------------------------
export const ODU_GLYPH = {
  /** Height of a column cell — `box.h` maps to this, so it sets the scale. */
  colH: 106,
  /** Width of a one-column cell (tower). */
  colW: 50,
  /** Width of the full two-column sign. */
  signW: 100,
  /** Each column centre sits this far from the sign's centre line. */
  colOffset: 23,
  /** Top of each of the 4 mark rows. */
  rowY: [8, 33, 58, 83] as const,
  markW: 5,
  markH: 15,
  markRx: 2,
  /** A double mark = two bars, each this far from the column centre. */
  doubleHalf: 7,
  /** Ink extents of a column: rows start at 8 and end at 83 + 15 = 98. */
  inkTop: 8,
  inkBottom: 98,
  /** Ink half-width of one column (a double: 7 + 5/2). */
  inkHalfW: 9.5,
} as const;

/** A layout box in any unit (SVG user units, mm…): x/y = top-left corner. */
export interface OduBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One bar of a mark, in the box's units. */
export interface OduMarkRect {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
}

/** The bars of ONE column laid out in `box`. `box.h` sets the scale (marks keep
 *  the chart's proportions, 1 unit = box.h / 106); `box.w` only centres the
 *  column horizontally. With box = {x:0, y:0, w:50, h:106} this returns the
 *  exact numbers OduGlyph always drew. */
export function oduMarks(column: readonly Mark[], box: OduBox): OduMarkRect[] {
  const g = ODU_GLYPH;
  const u = box.h / g.colH;
  const cx = box.x + box.w / 2;
  const rects: OduMarkRect[] = [];
  column.forEach((mark, r) => {
    const xs = mark === 2 ? [cx - g.doubleHalf * u, cx + g.doubleHalf * u] : [cx];
    for (const x of xs) rects.push(markBar(x, box.y + g.rowY[r] * u, u));
  });
  return rects;
}

/** One bar centred on `x`, its top at `top`, at scale `u`. */
function markBar(x: number, top: number, u: number): OduMarkRect {
  const g = ODU_GLYPH;
  return {
    x: x - (g.markW / 2) * u,
    y: top,
    w: g.markW * u,
    h: g.markH * u,
    rx: g.markRx * u,
  };
}

/** The two column cells of a FULL sign laid out in `box` (chart proportions:
 *  100 × 106 → column centres at 27 and 73). */
export function oduSignBoxes(box: OduBox): { left: OduBox; right: OduBox } {
  const g = ODU_GLYPH;
  const u = box.h / g.colH;
  const mid = box.x + box.w / 2;
  const cell = (cx: number): OduBox => ({
    x: cx - (g.colW / 2) * u,
    y: box.y,
    w: g.colW * u,
    h: box.h,
  });
  return { left: cell(mid - g.colOffset * u), right: cell(mid + g.colOffset * u) };
}

/** Every bar of a full sign — left column first, then right (the order the
 *  glyphs have always been drawn in). */
export function oduSignMarks(
  sign: { left: readonly Mark[]; right: readonly Mark[] },
  box: OduBox,
): OduMarkRect[] {
  const cells = oduSignBoxes(box);
  return [...oduMarks(sign.left, cells.left), ...oduMarks(sign.right, cells.right)];
}

/** A mark in the LIBRETA notation (Cuban written practice): a single stays a
 *  bar "I"; a double is written as a zero "0" — returned as an elliptical ring
 *  (outer radii rx/ry, wall thickness t) so it can be filled even-odd, which
 *  is what a fiber laser wants. Same rows and scale as oduMarks(). */
export type OduLibretaMark =
  | ({ kind: "barra" } & OduMarkRect)
  | { kind: "cero"; cx: number; cy: number; rx: number; ry: number; t: number };

export function oduLibretaMarks(column: readonly Mark[], box: OduBox): OduLibretaMark[] {
  const g = ODU_GLYPH;
  const u = box.h / g.colH;
  const cx = box.x + box.w / 2;
  const marks: OduLibretaMark[] = [];
  column.forEach((mark, r) => {
    if (mark === 1) {
      marks.push({ kind: "barra", ...markBar(cx, box.y + g.rowY[r] * u, u) });
    } else {
      marks.push({
        kind: "cero",
        cx,
        cy: box.y + (g.rowY[r] + g.markH / 2) * u,
        rx: 5.5 * u,
        ry: (g.markH / 2) * u,
        t: 2.6 * u,
      });
    }
  });
  return marks;
}

/** A column turned upside down (top ↔ bottom). Used ONLY by the orientation
 *  tests (scripts/check-watch-data.ts): it proves that 6 pairs of Meyi swap
 *  identity when inverted and 4 do not — which is why every renderer keeps
 *  the sign upright. Never use it to draw. */
export function flipVertical(column: OduColumn): OduColumn {
  return [column[3], column[2], column[1], column[0]];
}

/** The Meyi whose column equals `column` (each of the 16 patterns is unique). */
export function oduByColumn(column: readonly Mark[]): Odu | undefined {
  return ODU_MEJI.find((o) => o.right.every((m, i) => m === column[i]));
}
