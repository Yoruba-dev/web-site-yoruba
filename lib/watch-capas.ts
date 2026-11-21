// ---------------------------------------------------------------------------
// CAPAS FOTOGRÁFICAS DEL RELOJ — qué foto lleva cada pieza del escenario.
//
// El escenario principal del creador (components/watch/WatchFront.tsx) apila
// fotos alineadas a UNA plantilla común (design-assets/creador-relojes/piezas/
// alinear.py → public/assets/images/reloj/capas/plantilla.json):
//   lienzo 1200 × 1600 px (las versiones -600 son exactamente la mitad), centro
//   de la esfera en (600, 800), ventana de la caja de radio R_ABERTURA = 236 px,
//   disco de la esfera de radio R_ESFERA = 250 px, PX_POR_MM = 16.3934.
// Encima de la esfera, todo lo impreso y lo aplicado sale de las primitivas en
// mm de lib/watch-art.ts colocadas con mmToPx(): son las MISMAS cifras que el
// archivo de impresión y el láser.
//
// Puro: sin React ni DOM, solo imports relativos (lo carga tsx en los
// chequeos). Las cifras están copiadas a mano de plantilla.json; el arnés
// scripts/render-watchfront.tsx comprueba que coinciden y que cada archivo de
// CAPA_FILES existe en public/.
// ---------------------------------------------------------------------------
import {
  APPLIQUES,
  DIAL_BASES,
  FINISHES,
  STRAPS,
  WATCH_COLORS,
  getDialBase,
  getStrap,
  type AppliqueId,
  type DialBaseId,
  type FinishId,
  type StrapId,
  type WatchColorId,
  type WatchConfig,
} from "./watch";

// ===========================================================================
// PLANTILLA — cifras de public/assets/images/reloj/capas/plantilla.json.
// ===========================================================================
export const PLANTILLA = {
  W: 1200,
  H: 1600,
  CX: 600,
  CY: 800,
  /** Radio de la ventana de la caja (borde interior del bisel). */
  R_ABERTURA: 236,
  /** Radio de la capa de esfera (entra un poco bajo el bisel). */
  R_ESFERA: 250,
  PX_POR_MM: 16.3934,
} as const;

/** Donde la capa de caja pasa a ser opaca de verdad: alinear.py abre la
 *  ventana a R_ABERTURA + 2 con un borde suave de ±1.2 px (medido sobre
 *  caja-*-1200.webp: alfa 126 a 238 px del centro). Recortar la esfera aquí no
 *  deja ver nada bajo el bisel. */
export const R_VENTANA_PX = PLANTILLA.R_ABERTURA + 2;

/** Tamaños publicados de cada capa (ancho del lienzo). */
export type CapaSize = 1200 | 600;
export const CAPA_SIZES: readonly CapaSize[] = [1200, 600];

/** Media query con la que el escenario elige la capa de 600 (pantallas
 *  pequeñas). La misma cadena la usan el <picture> y el precargador. */
export const CAPA_MEDIA_600 = "(max-width: 767px)";

/** Carpeta pública de las capas. */
export const CAPAS_DIR = "/assets/images/reloj/capas";
const RELOJ_DIR = "/assets/images/reloj";

/** mm (origen en el centro de la esfera, y hacia abajo) → px de la plantilla. */
export function mmToPx(x: number, y: number): { x: number; y: number } {
  return { x: PLANTILLA.CX + x * PLANTILLA.PX_POR_MM, y: PLANTILLA.CY + y * PLANTILLA.PX_POR_MM };
}

/** El transform SVG que lleva las primitivas en mm al lienzo de la plantilla. */
export const MM_TRANSFORM = `translate(${PLANTILLA.CX} ${PLANTILLA.CY}) scale(${PLANTILLA.PX_POR_MM})`;

// ===========================================================================
// FOTOS QUE EXISTEN — una lista por tipo de capa. Añadir una foto = añadirla
// aquí (y el arnés comprueba que el archivo está en public/).
// ===========================================================================
/** Cauchos con foto propia: el final del id de la correa ("caucho-azul-marino"). */
const CAUCHO_FOTOS = ["negro", "gris", "blanco", "azul-marino", "azul", "naranja", "verde", "rojo", "tan"] as const;
/** Pieles con foto propia (una por acabado: los terminales siguen a la caja). */
const PIEL_FOTOS = ["verde", "rojo", "azul-marino"] as const;
/** Esferas sol con foto propia (amarillo existe aunque el catálogo aún no la
 *  ofrezca). */
const ESFERA_FOTOS = ["blanco", "negro", "rojo", "verde", "azul", "amarillo"] as const;
const ACABADO_FOTOS: readonly FinishId[] = ["acero", "pvd-negro", "oro-rosa"];

type CauchoFoto = (typeof CAUCHO_FOTOS)[number];

/** El color de cada caucho con foto (para buscar el más parecido). */
function cauchoColor(nombre: CauchoFoto): WatchColorId {
  const s = getStrap(`caucho-${nombre}`);
  return s?.color ?? "negro";
}

// ===========================================================================
// COLOR MÁS PARECIDO — para una pieza sin foto (caucho amarillo, vino…).
// Distancia en CIELAB (D65): se parece a lo que ve el ojo.
// ===========================================================================
function hexToLab(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const lin = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = lin;
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const fl = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = [fl(X), fl(Y), fl(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** El color de `opciones` que más se parece a `color`. */
export function nearestColor<T extends string>(color: WatchColorId, opciones: readonly T[], colorDe: (o: T) => WatchColorId): T {
  const [L, a, b] = hexToLab(WATCH_COLORS[color].hex);
  let best = opciones[0];
  let bestD = Infinity;
  for (const o of opciones) {
    const [L2, a2, b2] = hexToLab(WATCH_COLORS[colorDe(o)].hex);
    const d = (L - L2) ** 2 + (a - a2) ** 2 + (b - b2) ** 2;
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

// ===========================================================================
// capasDe — WatchConfig → URLs de las capas.
// ===========================================================================
export type CapaId = "correa" | "esfera" | "caja";

/** Una capa sin foto propia que usa la más cercana (se avisa en la interfaz o
 *  en la hoja: "vista aproximada"). */
export interface CapaAproximada {
  capa: CapaId;
  /** Lo que pide el reloj (id del catálogo). */
  pedido: string;
  /** El nombre de la foto que se usa en su lugar. */
  usada: string;
}

export interface CapasReloj {
  correa: string;
  esfera: string;
  caja: string;
  /** El aplique PY (oro o plata), 256 px en la capa de 600 y 512 en la de 1200. */
  aplique: string;
  /** Vacío = cada capa es la foto exacta de la pieza. */
  aproximadas: CapaAproximada[];
}

/** Nombre base (sin tamaño ni extensión) de cada capa del reloj. */
export interface NombresCapas {
  correa: string;
  esfera: string;
  caja: string;
  aplique: "logo-py" | "logo-py-plata";
  aproximadas: CapaAproximada[];
}

export function capaUrl(nombre: string, size: CapaSize = 1200): string {
  return `${CAPAS_DIR}/${nombre}-${size}.webp`;
}

export function apliqueUrl(nombre: NombresCapas["aplique"], size: CapaSize = 1200): string {
  return `${RELOJ_DIR}/${nombre}-${size === 600 ? 256 : 512}.webp`;
}

/** Los nombres de las fotos que lleva el reloj (sin tamaño). Una pieza sin foto
 *  propia cae en la más parecida y queda anotada en `aproximadas`. */
export function nombresCapas(c: Pick<WatchConfig, "acabado" | "correa" | "esfera" | "aplique">): NombresCapas {
  const aproximadas: CapaAproximada[] = [];

  // Caja (y con ella el metal del brazalete y de los terminales de la piel).
  const fin: FinishId = (ACABADO_FOTOS as readonly string[]).includes(c.acabado) ? c.acabado : "acero";
  if (fin !== c.acabado) aproximadas.push({ capa: "caja", pedido: String(c.acabado), usada: `caja-${fin}` });
  const caja = `caja-${fin}`;

  // Correa.
  let correa: string;
  const s = getStrap(c.correa);
  if (!s) {
    correa = "correa-caucho-negro";
    aproximadas.push({ capa: "correa", pedido: String(c.correa), usada: correa });
  } else if (s.tipo === "brazalete") {
    // El brazalete va siempre en el acabado de la caja.
    correa = `brazalete-${fin}`;
  } else if (s.tipo === "piel") {
    const tiene = (PIEL_FOTOS as readonly string[]).includes(s.color ?? "");
    const color = tiene ? (s.color as (typeof PIEL_FOTOS)[number]) : nearestColor(s.color ?? "negro", PIEL_FOTOS, (o) => o);
    correa = `correa-piel-${color}-${fin}`;
    if (!tiene) aproximadas.push({ capa: "correa", pedido: s.id, usada: correa });
  } else {
    const nombre = s.id.replace(/^caucho-/, "");
    const tiene = (CAUCHO_FOTOS as readonly string[]).includes(nombre);
    const foto = tiene ? (nombre as CauchoFoto) : nearestColor(s.color ?? "negro", CAUCHO_FOTOS, cauchoColor);
    correa = `correa-caucho-${foto}`;
    if (!tiene) aproximadas.push({ capa: "correa", pedido: s.id, usada: correa });
  }

  // Esfera (disco sol del color base).
  const b = getDialBase(c.esfera.base);
  let esfera: string;
  if (b && b.textura === "sol" && (ESFERA_FOTOS as readonly string[]).includes(b.id)) {
    esfera = `esfera-${b.id}`;
  } else {
    // Franjas (o un id desconocido): el disco sol del color más parecido.
    const color = b?.color ?? "plateado";
    const foto = nearestColor(color, ESFERA_FOTOS, (o) => (o === "blanco" ? "plateado" : o));
    esfera = `esfera-${foto}`;
    aproximadas.push({ capa: "esfera", pedido: String(c.esfera.base), usada: esfera });
  }

  const metal = APPLIQUES.find((a) => a.id === c.aplique)?.metal ?? "oro";
  return { correa, esfera, caja, aplique: metal === "plata" ? "logo-py-plata" : "logo-py", aproximadas };
}

/** WatchConfig → las URLs de sus capas en el tamaño pedido. */
export function capasDe(c: Pick<WatchConfig, "acabado" | "correa" | "esfera" | "aplique">, size: CapaSize = 1200): CapasReloj {
  const n = nombresCapas(c);
  return {
    correa: capaUrl(n.correa, size),
    esfera: capaUrl(n.esfera, size),
    caja: capaUrl(n.caja, size),
    aplique: apliqueUrl(n.aplique, size),
    aproximadas: n.aproximadas,
  };
}

// ===========================================================================
// TAPA — foto real de una tapa lisa (home/tapa-*.webp, 1024 × 1024).
// Medido una vez sobre tapa-1024.webp (ajuste de círculo por mínimos cuadrados
// al filo oscuro del disco liso, 36 radios): centro (511.9, 507.9), radio
// 247.8 px (±3). El anillo cepillado sigue hasta ~320 px (muescas de la llave).
// Las versiones 720 y 480 son la misma foto escalada.
// ===========================================================================
export const TAPA_FOTO = {
  base: `${RELOJ_DIR}/home/tapa`,
  /** Lado de la foto de referencia (las medidas son sobre esta). */
  size: 1024,
  cx: 512,
  cy: 508,
  /** Radio del disco liso (donde va el grabado). */
  rDisco: 248,
  /** Escala foto → plantilla del escenario: el disco liso queda en 202 px
   *  (12.3 mm), justo por fuera del campo grabable Ø24 a escala real
   *  (CASEBACK_LAYOUT.fieldR · PX_POR_MM = 197 px). */
  k: 0.815,
} as const;

export function tapaUrl(ancho: 1024 | 720 | 480, formato: "webp" | "avif" = "webp"): string {
  return `${TAPA_FOTO.base}-${ancho}.${formato}`;
}

// ===========================================================================
// LISTA DE ARCHIVOS — todo lo que el escenario puede llegar a pedir. El arnés
// (scripts/render-watchfront.tsx) comprueba que cada uno existe en public/ y
// que capasDe() de cada combinación del catálogo cae dentro de esta lista.
// ===========================================================================
export function capaFiles(): string[] {
  const nombres: string[] = [];
  for (const f of ACABADO_FOTOS) nombres.push(`caja-${f}`, `brazalete-${f}`);
  for (const c of CAUCHO_FOTOS) nombres.push(`correa-caucho-${c}`);
  for (const c of PIEL_FOTOS) for (const f of ACABADO_FOTOS) nombres.push(`correa-piel-${c}-${f}`);
  for (const e of ESFERA_FOTOS) nombres.push(`esfera-${e}`);
  const out = nombres.flatMap((n) => CAPA_SIZES.map((s) => capaUrl(n, s)));
  for (const a of ["logo-py", "logo-py-plata"] as const) for (const s of CAPA_SIZES) out.push(apliqueUrl(a, s));
  for (const w of [1024, 720, 480] as const) for (const fmt of ["webp", "avif"] as const) out.push(tapaUrl(w, fmt));
  return out;
}

/** Todas las combinaciones del catálogo que cambian una foto (acabado ×
 *  correa × esfera × aplique), para el arnés. */
export function catalogCombos(): Pick<WatchConfig, "acabado" | "correa" | "esfera" | "aplique">[] {
  const out: Pick<WatchConfig, "acabado" | "correa" | "esfera" | "aplique">[] = [];
  for (const f of FINISHES)
    for (const s of STRAPS)
      for (const b of DIAL_BASES)
        for (const a of APPLIQUES)
          out.push({
            acabado: f.id,
            correa: s.id as StrapId,
            aplique: a.id as AppliqueId,
            esfera: {
              modelo: "clasica",
              base: b.id as DialBaseId,
              pista: { estilo: "rayas" },
              texto: "",
              signo: null,
              signoPos: "nueve",
            },
          });
  return out;
}
