// ---------------------------------------------------------------------------
// The Ifá coin the customer personalises in /configurador-monedas.
//
// Everything here is measured from the WORKSHOP'S OWN render of the minted
// piece (design-assets/moneda-originales/plano-moneda-36.5mm.jpg), so the
// editor is a true scale model of the coin, not an illustration:
//
//   • 36.5 mm across, 2.9 mm thick, plata 925.
//   • The ANVERSO comes STRUCK — the 16 Odù Meji in wedges around the rim and
//     "IFA" in the central field. Nothing can be added to it, so it is not an
//     editable face and deliberately does not appear below.
//   • The REVERSO is the engraving side: a plain polished field ringed by drops
//     and beads, with the workshop's "PYJ" mark at the bottom.
//
// The `field` radius was measured off that render (radial variance scan) and is
// expressed as a fraction of the coin's RADIUS: the polished field ends at 0.70.
// The canvas uses it so a symbol dropped in the editor lands where the graver
// can actually cut it.
// ---------------------------------------------------------------------------

// "reverso" es la cara grabable de la moneda; "frente" el sello del anillo.
// Este tipo describe cualquier cara que se monte SOBRE FOTO REAL de la pieza,
// no solo monedas — ver lib/ring.ts.
export type CoinFaceId = "reverso" | "frente";

export interface CoinFace {
  id: CoinFaceId;
  /** Full accessible label — also the key the workshop reads on the order. */
  label: string;
  /** Compact label. */
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

// One entry, on purpose: only the reverso is engravable. Kept as a list (not a
// single object) because FaceCanvas, the order panel and the design sheet are
// shared with the ring editor, which has three faces.
export const COIN_FACES: readonly CoinFace[] = [
  {
    id: "reverso",
    label: "Reverso · tu grabado",
    short: "Reverso",
    image: "/assets/images/configurador/moneda-reverso.webp",
    alt: "Reverso de la moneda de Ifá: campo liso pulido, rodeado de gotas y perlas, con el sello PYJ del taller",
    field: 0.7,
    hint: "El anverso ya viene acuñado con los 16 Odù Meji. Esta es la cara que se graba: coloca aquí tu signo.",
  },
] as const;

/** Real, verified specs of the minted coin — shown to the customer as-is. */
export const COIN_SPECS = {
  diameterMm: 36.5,
  thicknessMm: 2.9,
  metal: "Plata 925",
} as const;
