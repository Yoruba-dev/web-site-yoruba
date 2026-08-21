// ---------------------------------------------------------------------------
// Las piezas que se pueden diseñar en la web, DESCRITAS COMO DATOS.
//
// Antes había un orquestador por pieza (RingConfigurator + CoinConfigurator),
// casi idénticos. Eso hizo que una función que existía en el anillo — elegir
// torre izquierda / derecha / ambas — se perdiera en la moneda sin que nadie lo
// notara. Ahora hay UN solo componente (PieceConfigurator) que lee de aquí, así
// que añadir una pieza es añadir una entrada a este archivo, y cualquier mejora
// del editor le llega a todas a la vez.
//
// Para añadir una pieza nueva: describe sus caras abajo. No hace falta tocar el
// componente.
// ---------------------------------------------------------------------------
import { COIN_FACES, COIN_SPECS, type CoinFace } from "./coin";
import { RING_FRONT_FACE, RING_SPECS } from "./ring";
import { ITEM_MAX_SCALE, ITEM_MIN_SCALE, type Placeable } from "./symbols";

/** Cómo aterriza un símbolo al soltarlo o tocarlo en esta cara. */
export type Placement =
  /** Al centro de la cara (el sello del frente del anillo). */
  | "centro"
  /** Las torres encajan en la puerta del hombro; lo demás cae donde se suelte. */
  | "puerta"
  /** Donde se suelte, sin encajar (la moneda: campo libre). */
  | "libre";

export interface PieceFace {
  id: string;
  /** Etiqueta completa — es la que lee el taller en el pedido y en la hoja. */
  label: string;
  /** Etiqueta corta para los pasos. */
  short: string;
  shape: "round" | "shoulder" | "coin";
  placement: Placement;
  /** Tamaño de partida de un símbolo en esta cara (multiplica ITEM_DEFAULTS). */
  itemScale: number;
  /** Solo cuando shape === "coin": la foto y el campo grabable reales. */
  coin?: CoinFace;
  /** Línea de ayuda sobre el lienzo. */
  hint?: string;
  /** Texto del lienzo vacío. */
  emptyHint?: string;
}

export interface ConfigurablePiece {
  id: "anillo" | "moneda";
  faces: readonly PieceFace[];
  /** Título de la paleta. */
  paletteTitle: string;
  /** Etiqueta accesible de la lista de pasos. */
  stepsLabel: string;
  /** Ficha técnica bajo el lienzo, si la pieza tiene medidas publicadas. */
  specs?: string;
  /** Gemas del santo: solo en las piezas donde el taller engasta piedras. */
  orishaGems: boolean;
  /** Grupos de la paleta disponibles. Sin definir = todos. */
  groups?: readonly Placeable["group"][];
  /** Marca el símbolo seleccionado con un recuadro. En la moneda estorba: lo
   *  que se ve tiene que parecerse al grabado, no a un editor. */
  selectionOutline: boolean;
  /** Hasta dónde puede encoger y crecer un símbolo en esta pieza. El tamaño
   *  base sale del CSS y es distinto por pieza (el anillo en píxeles, la moneda
   *  en % del campo grabable), así que el rango también lo es. */
  minScale: number;
  maxScale: number;
}

export const RING_PIECE: ConfigurablePiece = {
  id: "anillo",
  paletteTitle: "Arrastra tus símbolos",
  stepsLabel: "Pasos del diseño",
  specs: `Sello real: ${RING_SPECS.metal} · ${RING_SPECS.diameterMm} mm de diámetro`,
  orishaGems: true,
  selectionOutline: true,
  minScale: ITEM_MIN_SCALE,
  maxScale: ITEM_MAX_SCALE,
  faces: [
    {
      id: "front",
      label: "Frente",
      short: "Frente",
      // "coin" no quiere decir moneda: quiere decir CARA SOBRE FOTO REAL de la
      // pieza, con su campo grabable medido. El frente del anillo pasó a serlo
      // en cuanto hubo render — antes se dibujaba a mano (RingFrame).
      shape: "coin",
      placement: "libre",
      // 1 = el tamaño base del CSS, que ya entra llenando el campo grabable.
      itemScale: 1,
      coin: RING_FRONT_FACE,
      hint: RING_FRONT_FACE.hint,
      emptyHint: "Coloca aquí tu signo",
    },
    {
      id: "right",
      label: "Lateral derecho",
      short: "Derecho",
      shape: "shoulder",
      placement: "puerta",
      itemScale: 1,
    },
    {
      id: "left",
      label: "Lateral izquierdo",
      short: "Izquierdo",
      shape: "shoulder",
      placement: "puerta",
      itemScale: 1,
    },
  ],
};

// La moneda tiene UNA cara editable: el anverso viene acuñado de fábrica con los
// 16 Odù Meji y la palabra "IFA". Ver lib/coin.ts.
const REVERSO = COIN_FACES[0];

export const COIN_PIECE: ConfigurablePiece = {
  id: "moneda",
  paletteTitle: "Elige tu signo",
  stepsLabel: "Cara de la moneda",
  specs: `Moneda real: ${COIN_SPECS.metal} · ${COIN_SPECS.diameterMm} mm de diámetro · ${COIN_SPECS.thicknessMm} mm de grosor`,
  // En la moneda solo van los signos: ni motivos sueltos ni gemas de santo — el
  // taller no engasta piedras en ella, la graba.
  groups: ["Torres de Ifá"],
  orishaGems: false,
  selectionOutline: false,
  // El signo entra ya llenando el campo, asi que el margen es corto: encoger
  // bastante, crecer poco (mas alla del campo el grabador no puede cortar).
  minScale: 0.4,
  maxScale: 1.15,
  faces: [
    {
      id: REVERSO.id,
      label: REVERSO.label,
      short: REVERSO.short,
      shape: "coin",
      placement: "libre",
      // 1 = el tamaño base del CSS, que en la moneda ya es el 78% del campo:
      // el signo entra llenándolo, no como un adorno pequeño dentro de él.
      itemScale: 1,
      coin: REVERSO,
      hint: REVERSO.hint,
      emptyHint: "Coloca aquí tu signo",
    },
  ],
};
