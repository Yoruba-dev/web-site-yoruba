// ---------------------------------------------------------------------------
// The Ifá coin the customer personalises in /configurador-monedas.
//
// Everything here is measured from the WORKSHOP'S OWN render of the minted
// piece (design-assets/moneda-originales/plano-moneda-36.5mm.jpg), so the
// editor is a true scale model of the coin, not an illustration:
//
//   • 36.5 mm across, 2.9 mm thick, plata 925.
//   • ANVERSO — the 16 Odù Meji are already struck in wedges around the rim;
//     the round central field is where the wearer's own signo is engraved.
//   • REVERSO — a plain polished field ringed by drops and beads, with the
//     workshop's "PYJ" mark at the bottom; free to engrave.
//
// The two `field` radii below were measured off that render (radial variance
// scan), expressed as a fraction of the coin's RADIUS: the engraving area of
// the anverso ends at 0.45, the reverso's polished field at 0.70. The canvas
// uses them so a symbol dropped in the editor lands where the graver can
// actually cut it.
// ---------------------------------------------------------------------------

export type CoinFaceId = "anverso" | "reverso";

export interface CoinFace {
  id: CoinFaceId;
  /** Full accessible label. */
  label: string;
  /** Compact label for the step chips. */
  short: string;
  /** Photo of that face of the real coin, cut out on transparency. */
  image: string;
  /** Alt text — describes the minted piece, not the design on top. */
  alt: string;
  /** Engravable field, as a fraction of the coin's radius (0..1). */
  field: number;
  /** One line telling the customer what this face is for. */
  hint: string;
}

export const COIN_FACES: readonly CoinFace[] = [
  {
    id: "anverso",
    label: "Anverso · tu signo",
    short: "Anverso",
    image: "/assets/images/configurador/moneda-anverso.webp",
    alt: "Anverso de la moneda de Ifá: los 16 Odù Meji acuñados en cuñas alrededor del borde, con el campo central libre",
    field: 0.45,
    hint: "Los 16 Meyis ya vienen acuñados en el borde. Coloca aquí, en el centro, el signo que quieres grabado.",
  },
  {
    id: "reverso",
    label: "Reverso · libre",
    short: "Reverso",
    image: "/assets/images/configurador/moneda-reverso.webp",
    alt: "Reverso de la moneda de Ifá: campo liso pulido, rodeado de gotas y perlas, con el sello PYJ del taller",
    field: 0.7,
    hint: "El campo liso del reverso queda a tu gusto: otro signo, un símbolo o déjalo en blanco.",
  },
] as const;

/** Real, verified specs of the minted coin — shown to the customer as-is. */
export const COIN_SPECS = {
  diameterMm: 36.5,
  thicknessMm: 2.9,
  metal: "Plata 925",
} as const;

/** A coin design: which symbols sit on each face. */
export type CoinDesign = Record<CoinFaceId, unknown[]>;

export const EMPTY_COIN_DESIGN = { anverso: [], reverso: [] };
