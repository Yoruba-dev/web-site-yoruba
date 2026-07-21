// ---------------------------------------------------------------------------
// The catalogue of things a customer can place on a ring face — kept as DATA so
// the palette, the canvas and the order summary all read one source. Two kinds:
//   • "tower" — a single column (torre) of an Odù Meji (see lib/odu.ts).
//   • "motif" — a standalone symbol (sun, moon, cross, ray, …), drawn by
//     components/configurator/MotifGlyph.tsx from its id.
// Adding a symbol = adding an entry here (+ a case in MotifGlyph for motifs).
// ---------------------------------------------------------------------------
import { ODU_MEJI } from "./odu";

export type MotifId =
  | "sol"
  | "luna"
  | "estrella"
  | "rayo"
  | "cruz"
  | "ojo"
  | "corona"
  | "hacha";

export interface Motif {
  id: MotifId;
  name: string;
  /** Short, respectful heritage note (association within the tradition). */
  note: string;
}

// Motifs commonly seen in Yoruba/Lucumí adornment. Notes are heritage context
// only (e.g. sun/moon/star ↔ Yemayá; lightning/double-axe ↔ Shangó) — never a
// promise or a fixed "power".
export const MOTIFS: readonly Motif[] = [
  { id: "sol", name: "Sol", note: "Luz y vida; atributo de Yemayá y Olodumare." },
  { id: "luna", name: "Luna", note: "Los ciclos y las aguas; atributo de Yemayá." },
  { id: "estrella", name: "Estrella", note: "Guía y destino." },
  { id: "rayo", name: "Rayo", note: "El trueno; fuerza de Shangó." },
  { id: "hacha", name: "Hacha doble", note: "El oshe, hacha bipenne de Shangó." },
  { id: "corona", name: "Corona", note: "Realeza y coronación (Ocha)." },
  { id: "ojo", name: "Ojo", note: "Vigilancia y resguardo." },
  { id: "cruz", name: "Cruz", note: "Encrucijada y sincretismo." },
] as const;

export type PlaceableKind = "tower" | "motif";

// A thing that can be dropped onto a ring face.
export interface Placeable {
  id: string; // unique, e.g. "tower:eji-ogbe" or "motif:sol"
  kind: PlaceableKind;
  name: string;
  group: "Torres de Ifá" | "Símbolos";
  oduId?: string; // when kind === "tower"
  motif?: MotifId; // when kind === "motif"
}

// One tower per Odù Meji — a Meji's two columns are identical, so a single tower
// represents the sign (and keeps the palette from showing 16 duplicated pairs).
export const PLACEABLES: readonly Placeable[] = [
  ...ODU_MEJI.map(
    (o): Placeable => ({
      id: `tower:${o.id}`,
      kind: "tower",
      name: o.name,
      group: "Torres de Ifá",
      oduId: o.id,
    }),
  ),
  ...MOTIFS.map(
    (m): Placeable => ({
      id: `motif:${m.id}`,
      kind: "motif",
      name: m.name,
      group: "Símbolos",
      motif: m.id,
    }),
  ),
];

export function getPlaceable(id: string): Placeable | undefined {
  return PLACEABLES.find((p) => p.id === id);
}

/** Palette groups, in display order. */
export const PLACEABLE_GROUPS: Placeable["group"][] = ["Torres de Ifá", "Símbolos"];

// ---------------------------------------------------------------------------
// A placed instance on a face (runtime design state). x/y are fractions (0..1)
// of the face box so the design is resolution-independent; scale is a relative
// size multiplier; rotation in degrees.
// ---------------------------------------------------------------------------
export interface PlacedItem {
  uid: string;
  ref: string; // Placeable.id
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export const ITEM_DEFAULTS = { scale: 1, rotation: 0 };
export const ITEM_MIN_SCALE = 0.45;
export const ITEM_MAX_SCALE = 2.4;
