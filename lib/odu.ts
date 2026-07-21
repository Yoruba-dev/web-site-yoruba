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
