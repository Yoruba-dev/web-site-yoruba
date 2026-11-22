// ---------------------------------------------------------------------------
// CREADOR DE RELOJES — el contrato de datos del reloj personalizado.
//
// Todo lo que el creador, la hoja del taller (/diseno), el carrito, la vista 3D
// y los archivos de producción saben del reloj sale de ESTE archivo: medidas,
// catálogo de piezas, reglas, presets por Orisha y textos. Datos puros y
// funciones puras: sin React, sin three, sin DOM, y solo imports RELATIVOS para
// que los chequeos del prebuild (tsx scripts/check-watch-data.ts) lo carguen.
//
// Decisiones del dueño (design-assets/creador-relojes/DECISIONES-DUENO.md) que
// mandan sobre spec.json:
//   • Solo la caja octogonal; acabados Acero / Negro PVD / Oro rosa.
//   • La esfera NO es un SKU por Orisha: es un color base (sol) + impresión por
//     pedido: el texto a las 6 (editable, ortografía canónica por defecto), la
//     pista de cuentas en los colores del Orisha (o rayas) y, si se quiere, el
//     signo Odù. Por eso FLAGS.DIAL_FREE_TEXT y FLAGS.ODU_ON_DIAL están en true.
//   • Todavía NO hay producto en Shopify (precios pendientes): todo lo que toca
//     precio funciona sin producto y devuelve null = "precio por confirmar".
//   • Lo que aparece en las fotos/renders del dueño está 'verificado' PARA EL
//     PROTOTIPO; la Fase 0 (calibrador y prueba en seco) lo confirma después.
//
// Copy: solo herencia e identidad ("en los colores de…", "joya de autor"). Nunca
// resultados espirituales ni nombres de marcas o modelos de terceros —
// scripts/check-copy.mjs lo vigila en los archivos del reloj.
// ---------------------------------------------------------------------------
import { HEX, getOrisha } from "./orisha-colors";
import { getOdu, lucumiLeg, lucumiName, type OduColumn } from "./odu";
import { decodeDesign, isWatchPayload } from "./design-code";

// ===========================================================================
// MEDIDAS — marcadores de posición hasta la Fase 0 (measured:false).
// ===========================================================================
export const WATCH_SPECS = {
  caseMm: 40,
  thicknessMm: 9.95,
  dialMm: 30.5,
  /** Diámetro de la esfera que deja ver la ventana de la caja (la pestaña tapa
   *  el resto del disco de 30.5). De la plantilla de capas fotográficas
   *  (public/assets/images/reloj/capas/plantilla.json): R_ABERTURA 236 px a
   *  16.39 px/mm = 14.4 mm de radio. Marcador hasta la Fase 0. Todo lo impreso
   *  y lo aplicado queda 0.25 mm por dentro (DIAL_LAYOUT.printR). */
  aberturaVisibleMm: 28.8,
  crystalMm: 31.5,
  /** Alto del aplique PY (máscara + letras), según el plano del proveedor. */
  appliqueMm: 6,
  /** Diámetro del campo grabable de la tapa. */
  casebackFieldMm: 24,
  /** Ventana de fecha 3H del NH35: centro a 10.55 mm del centro, 2.9 × 2.0 mm. */
  dateWindow: { at: 3, centerMm: 10.55, wMm: 2.9, hMm: 2.0 },
  /** Holgura bajo la aguja horaria (aplique e índices deben quedar por debajo). */
  hourHandClearanceMm: 0.78,
  movement: "NH35",
  movementType: "M",
  /** false = cifras de catálogo; pasa a true cuando el taller mida con calibrador. */
  measured: false,
} as const;

// ===========================================================================
// BANDERAS — encender o apagar una función es un cambio de UNA línea aquí.
// ===========================================================================
export const FLAGS = {
  /** El cliente puede editar el texto de la esfera (decisión del dueño §3). */
  DIAL_FREE_TEXT: true,
  /** Signo Odù impreso en la esfera (decisión del dueño §3). */
  ODU_ON_DIAL: true,
  /** Esferas de franjas horizontales (imágenes 4, 11, 17, 20): fuera (§5). */
  STRIPE_DIALS: false,
  /** Caja redonda con bisel de 24 h: fuera del lanzamiento. */
  ROUND_CASE: false,
  /** "Ver en tu espacio" (realidad aumentada). */
  AR: false,
  /** Foto trazada por WebGPU, reservada. */
  ULTRA_RENDER: false,
} as const;

/** Forma de FLAGS con valores libres — para que validate() pueda probar las
 *  reglas que dependen de una bandera con la bandera apagada. */
export type WatchFlags = { readonly [K in keyof typeof FLAGS]: boolean };

// ===========================================================================
// COLORES — una sola tabla: los HEX salen de lib/orisha-colors.ts.
// ===========================================================================
export type WatchColorId =
  | "rojo"
  | "negro"
  | "blanco"
  | "plateado"
  | "gris"
  | "azul"
  | "azul-marino"
  | "amarillo"
  | "ambar"
  | "naranja"
  | "verde"
  | "marron"
  | "vinotinto"
  | "tan"
  | "dorado";

export interface WatchColor {
  hex: string;
  /** Nombre en español para la interfaz y la hoja del taller. */
  nombre: string;
}

export const WATCH_COLORS: Readonly<Record<WatchColorId, WatchColor>> = {
  rojo: { hex: HEX.rojo, nombre: "Rojo" },
  negro: { hex: HEX.negro, nombre: "Negro" },
  blanco: { hex: HEX.blanco, nombre: "Blanco" },
  plateado: { hex: HEX.plateado, nombre: "Blanco plateado" },
  gris: { hex: HEX.gris, nombre: "Gris" },
  azul: { hex: HEX.azul, nombre: "Azul" },
  "azul-marino": { hex: HEX["azul-marino"], nombre: "Azul marino" },
  amarillo: { hex: HEX.amarillo, nombre: "Amarillo" },
  ambar: { hex: HEX.ambar, nombre: "Ámbar" },
  naranja: { hex: HEX.naranja, nombre: "Naranja" },
  verde: { hex: HEX.verde, nombre: "Verde" },
  marron: { hex: HEX.marron, nombre: "Carmelita" },
  vinotinto: { hex: HEX.vinotinto, nombre: "Vino" },
  tan: { hex: HEX.tan, nombre: "Tan" },
  dorado: { hex: HEX.dorado, nombre: "Dorado" },
};

/** Tonos de MATERIAL (metales, lume, tintas de impresión). No son colores que el
 *  cliente elige: los usa el render (SVG / 3D) para pintar cada pieza. */
export const WATCH_MATERIALS = {
  acero: "#c9cbcd",
  "acero-pulido": "#eef0f2",
  /** Acero pulido tal como se ve sobre la esfera (refleja el entorno oscuro):
   *  aros de los índices y marco de la fecha. */
  "acero-aro": "#a3a8ae",
  "oro-rosa-aro": "#b98a74",
  "pvd-negro": "#2b2c30",
  "oro-rosa": "#e3b49c",
  /** Aplique PY dorado. */
  oro: "#f2c46d",
  /** Aplique PY plateado. */
  plata: "#d5d8dc",
  /** Lume a la luz del día (puntos, triángulo, barras, agujas). */
  lume: "#e4eee1",
  /** Tinta dorada clara: texto sobre esferas oscuras o de color. */
  "tinta-oro": "#f2d27a",
  /** Tinta dorada oscura: texto sobre esfera blanca. */
  "tinta-oro-oscuro": "#7d5a10",
  /** Tinta negra: solo en las esferas de degradado, donde ninguna de las dos
   *  doradas llega a 3:1 (la zona de mezcla de amarillo → verde, por ejemplo). */
  "tinta-negra": "#16130e",
  /** Disco de fecha. */
  fecha: "#ffffff",
} as const;

export type MaterialId = keyof typeof WATCH_MATERIALS;

// ===========================================================================
// CATÁLOGO DE PIEZAS — solo lo 'verificado' se muestra; lo 'pendiente' queda
// oculto hasta que el taller lo consiga; lo 'bloqueado' no se ofrece.
//
// Decisión del dueño §7: TODO lo que aparece en sus fotos o renders está
// 'verificado' PARA EL PROTOTIPO (la Fase 0 lo confirma con calibrador). Las
// únicas piezas 'pendiente' son las que él nombró (caucho amarillo, caucho
// vino, segunderos verde y carmelita) y las que no salen en ninguna foto (la
// esfera azul). scripts/check-watch-data.ts lo vigila.
//
// Una pieza verificada que el dueño deja fuera por decisión (no por falta de
// pieza) lleva `flag`: solo se ofrece con esa bandera de FLAGS encendida.
// ===========================================================================
export type PartStatus = "verificado" | "pendiente" | "bloqueado";

export interface Part {
  id: string;
  /** Nombre en la interfaz y en el pedido. */
  label: string;
  status: PartStatus;
  /** Solo se ofrece con esta bandera encendida (ej. las esferas de franjas). */
  flag?: keyof WatchFlags;
  /** Referencia del proveedor, cuando exista (Fase 0). */
  sku?: string;
  /** Muestra: un WatchColorId o la ruta de una foto real de la pieza. */
  swatch: string;
  /** Nota interna para el taller / la hoja. */
  nota?: string;
}

/** Categorías del catálogo. Una entrada de la lista reloj.agotados de Shopify se
 *  escribe "categoria:id" (ej. "segundero:rojo", "correa:caucho-azul"): los ids
 *  se repiten entre categorías (hay esfera "negro" y segundero "negro"). */
export type PartCategory =
  | "caja"
  | "acabado"
  | "esfera"
  | "pista"
  | "aplique"
  | "segundero"
  | "correa"
  | "cierre";

// — Caja ———————————————————————————————————————————————————————————————
export type CaseId = "octogonal-40";

export const CASES: readonly (Part & { id: CaseId })[] = [
  {
    id: "octogonal-40",
    label: "Octogonal 40 mm",
    status: "verificado",
    swatch: "acero",
    nota: "Acero 316L, caja integrada (imágenes 2 y 16). Única forma al lanzamiento.",
  },
];

// — Acabado (cambia el precio: opción de Shopify "Acabado") ————————————————
export type FinishId = "acero" | "pvd-negro" | "oro-rosa";

export interface FinishPart extends Part {
  id: FinishId;
  shopifyValue: "Acero" | "Negro PVD" | "Oro rosa";
  material: MaterialId;
  /** Metal de las agujas de hora y minuto y de los aros de los índices. Sigue
   *  en acero hasta que haya un juego oro rosa verificado. */
  metalAgujas: "acero" | "oro-rosa";
}

export const FINISHES: readonly FinishPart[] = [
  {
    id: "acero",
    label: "Acero",
    status: "verificado",
    swatch: "acero",
    shopifyValue: "Acero",
    material: "acero",
    metalAgujas: "acero",
    nota: "Tapa cepillada + chaflán pulido.",
  },
  {
    id: "pvd-negro",
    label: "Negro PVD",
    status: "verificado",
    swatch: "pvd-negro",
    shopifyValue: "Negro PVD",
    material: "pvd-negro",
    metalAgujas: "acero",
  },
  {
    id: "oro-rosa",
    label: "Oro rosa",
    status: "verificado",
    swatch: "oro-rosa",
    shopifyValue: "Oro rosa",
    material: "oro-rosa",
    metalAgujas: "acero",
    nota: "Agujas en acero hasta verificar un juego oro rosa.",
  },
];

// — Esfera: color base (sol) ——————————————————————————————————————————————
/** Los degradados sol por Orisha (DECISIONES-DUENO §14), de arriba abajo. */
export type DialGradientKey =
  | "orula"
  | "eleggua"
  | "chango"
  | "yemaya"
  | "oshun"
  | "oya"
  | "ogun"
  | "obatala"
  | "babalu-aye"
  | "olokun";
export type DialBaseId = "blanco" | "negro" | "rojo" | "verde" | "azul" | "franjas" | `degradado-${DialGradientKey}`;
export type DialTexture = "sol" | "franjas" | "degradado";

export interface DialGradient {
  key: DialGradientKey;
  /** De quién son los colores, como se escribe en la interfaz. */
  orisha: string;
  /** Color de arriba y de abajo (sRGB): los MISMOS de piezas/esferas.py
   *  DEGRADADOS, que pintó las capas. check-watch-data vigila que coincidan. */
  arriba: string;
  abajo: string;
  /** Los dos colores en palabras ("amarillo", "verde") para la ficha y el taller. */
  nombres: readonly [string, string];
}

export interface DialBasePart extends Part {
  id: DialBaseId;
  /** Color del catálogo más parecido. En un degradado es el de abajo y solo
   *  sirve de respaldo (muestra sin foto): el color real lo da `degradado`. */
  color: WatchColorId;
  textura: DialTexture;
  /** Pigmento luminoso de los índices, fijo por esfera. */
  lume: "C3" | "BGW9";
  degradado?: DialGradient;
}

/** Arriba → abajo, como la esfera amarillo → verde de la foto 20 del dueño. */
export const DIAL_GRADIENTS: readonly (DialGradient & { color: WatchColorId })[] = [
  { key: "orula", orisha: "Orula", arriba: "#e8c022", abajo: "#0e622a", nombres: ["amarillo", "verde"], color: "verde" },
  { key: "eleggua", orisha: "Elegguá", arriba: "#b2141a", abajo: "#100e0e", nombres: ["rojo", "negro"], color: "negro" },
  { key: "chango", orisha: "Changó", arriba: "#eeeae4", abajo: "#a81018", nombres: ["blanco", "rojo"], color: "rojo" },
  { key: "yemaya", orisha: "Yemayá", arriba: "#96c0e8", abajo: "#102c7c", nombres: ["azul claro", "azul"], color: "azul" },
  { key: "oshun", orisha: "Oshún", arriba: "#eec840", abajo: "#b06412", nombres: ["amarillo", "ámbar"], color: "ambar" },
  { key: "oya", orisha: "Oyá", arriba: "#965c34", abajo: "#601224", nombres: ["carmelita", "vino"], color: "vinotinto" },
  { key: "ogun", orisha: "Oggún", arriba: "#166030", abajo: "#0e100f", nombres: ["verde", "negro"], color: "negro" },
  { key: "obatala", orisha: "Obatalá", arriba: "#f2f0ea", abajo: "#b2b8c0", nombres: ["blanco", "plata"], color: "plateado" },
  { key: "babalu-aye", orisha: "Babalú Ayé", arriba: "#b292d2", abajo: "#4e2470", nombres: ["lila", "morado"], color: "azul-marino" },
  { key: "olokun", orisha: "Olokun", arriba: "#167680", abajo: "#0a1c4e", nombres: ["turquesa", "azul profundo"], color: "azul-marino" },
];

export const DIAL_BASES: readonly DialBasePart[] = [
  { id: "blanco", label: "Blanca sol", status: "verificado", swatch: "plateado", color: "plateado", textura: "sol", lume: "C3" },
  { id: "negro", label: "Negra sol", status: "verificado", swatch: "negro", color: "negro", textura: "sol", lume: "C3" },
  { id: "rojo", label: "Roja sol", status: "verificado", swatch: "rojo", color: "rojo", textura: "sol", lume: "C3" },
  { id: "verde", label: "Verde sol", status: "verificado", swatch: "verde", color: "verde", textura: "sol", lume: "C3" },
  { id: "azul", label: "Azul sol", status: "pendiente", swatch: "azul", color: "azul", textura: "sol", lume: "C3", nota: "No aparece en las fotos del dueño: por conseguir." },
  {
    id: "franjas",
    label: "Franjas horizontales",
    // Sale en las fotos del dueño (§7 → verificada); la deja fuera su §5, por
    // eso va detrás de la bandera y no de su estado.
    status: "verificado",
    flag: "STRIPE_DIALS",
    swatch: "negro",
    color: "negro",
    textura: "franjas",
    lume: "C3",
    nota: "Imágenes 4, 11, 17, 20: fuera del lanzamiento por riesgo de parecido con un diseño ajeno (FLAGS.STRIPE_DIALS).",
  },
  // Pedido del dueño (§14): ofrecidos ya; el proveedor confirma cada degradado
  // en la Fase 0 (solo el amarillo → verde sale en sus fotos, y con franjas).
  ...DIAL_GRADIENTS.map(
    ({ color, ...g }): DialBasePart => ({
      id: `degradado-${g.key}`,
      label: `Degradado ${g.orisha}`,
      status: "verificado",
      swatch: color,
      color,
      textura: "degradado",
      lume: "C3",
      degradado: g,
      nota: `Sol en degradado ${g.nombres[0]} → ${g.nombres[1]}: confirmar con el proveedor (Fase 0).`,
    }),
  ),
];

// — Degradado: dónde ocurre el cambio de color (un ajuste sencillo de 5 pasos) —
export type DialGradientStep = 1 | 2 | 3 | 4 | 5;
export const DIAL_GRADIENT_STEPS: readonly DialGradientStep[] = [1, 2, 3, 4, 5];
export const DIAL_GRADIENT_DEFAULT: DialGradientStep = 3;
/** Centro de la mezcla por paso, en fracción del diámetro desde arriba: 1 =
 *  más color de arriba (la mezcla baja), 5 = más color de abajo. Los MISMOS
 *  números que piezas/esferas.py POSICIONES y ANCHO_TRANSICION. */
export const DIAL_GRADIENT_CENTERS: Readonly<Record<DialGradientStep, number>> = { 1: 0.68, 2: 0.59, 3: 0.5, 4: 0.41, 5: 0.32 };
export const DIAL_GRADIENT_WIDTH = 0.76;

export function isGradientStep(v: unknown): v is DialGradientStep {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5;
}

// — Pista de minutos ———————————————————————————————————————————————————————
export type TrackStyle = "cuentas" | "rayas";

export const TRACKS: readonly (Part & { id: TrackStyle })[] = [
  {
    id: "cuentas",
    label: "Pista de cuentas",
    status: "verificado",
    swatch: "dorado",
    nota: "Los 60 minutos como cuentas en la secuencia de colores del Orisha, impresas por pedido.",
  },
  {
    id: "rayas",
    label: "Rayas",
    status: "verificado",
    swatch: "plateado",
    nota: "Marcas de minuto. Con Orisha, en sus colores (como en los renders del dueño); sin Orisha, lisas.",
  },
];

// — Aplique PY (incluido) ————————————————————————————————————————————————
export type AppliqueId = "oro" | "plata";

export const APPLIQUES: readonly (Part & { id: AppliqueId; metal: "oro" | "plata" })[] = [
  { id: "oro", label: "PY oro", status: "verificado", swatch: "dorado", metal: "oro", nota: "Stock inicial 20." },
  { id: "plata", label: "PY plata", status: "verificado", swatch: "plateado", metal: "plata", nota: "Stock inicial 20." },
];

// — Segundero (incluido) ——————————————————————————————————————————————————
export type SecondsId =
  | "negro"
  | "blanco"
  | "rojo"
  | "azul"
  | "naranja"
  | "amarillo"
  | "verde"
  | "marron";

export const SECONDS: readonly (Part & { id: SecondsId; color: WatchColorId })[] = [
  { id: "negro", label: "Negro", status: "verificado", swatch: "negro", color: "negro" },
  { id: "blanco", label: "Blanco", status: "verificado", swatch: "plateado", color: "plateado" },
  { id: "rojo", label: "Rojo", status: "verificado", swatch: "rojo", color: "rojo" },
  { id: "azul", label: "Azul", status: "verificado", swatch: "azul", color: "azul" },
  { id: "naranja", label: "Naranja", status: "verificado", swatch: "naranja", color: "naranja" },
  { id: "amarillo", label: "Amarillo", status: "verificado", swatch: "amarillo", color: "amarillo" },
  { id: "verde", label: "Verde", status: "pendiente", swatch: "verde", color: "verde", nota: "No está en la imagen 15: por conseguir." },
  { id: "marron", label: "Carmelita", status: "pendiente", swatch: "marron", color: "marron", nota: "No está en la imagen 15: por conseguir." },
];

// — Correa (cambia el precio: opción de Shopify "Correa") ——————————————————
export type StrapId =
  | "caucho-negro"
  | "caucho-gris"
  | "caucho-blanco"
  | "caucho-azul-marino"
  | "caucho-azul"
  | "caucho-naranja"
  | "caucho-verde"
  | "caucho-rojo"
  | "caucho-tan"
  | "caucho-amarillo"
  | "caucho-vino"
  | "piel-verde"
  | "piel-rojo"
  | "piel-azul-marino"
  | "brazalete";

export type StrapType = "caucho" | "piel" | "brazalete";

export interface StrapPart extends Part {
  id: StrapId;
  tipo: StrapType;
  /** null = sigue el acabado de la caja (el brazalete). */
  color: WatchColorId | null;
  shopifyValue: "Caucho" | "Piel" | "Brazalete";
}

/** `nombre` es a la vez el final del id ("caucho-azul-marino") y la etiqueta. */
const caucho = (
  nombre: string,
  color: WatchColorId,
  status: PartStatus = "verificado",
  nota?: string,
): StrapPart => ({
  id: `caucho-${nombre.replace(/ /g, "-")}` as StrapId,
  label: `Caucho ${nombre}`,
  status,
  swatch: color,
  tipo: "caucho",
  color,
  shopifyValue: "Caucho",
  ...(nota ? { nota } : {}),
});

const piel = (color: WatchColorId, label: string): StrapPart => ({
  id: `piel-${color}` as StrapId,
  label: `Piel ${label}`,
  status: "verificado",
  swatch: color,
  tipo: "piel",
  color,
  shopifyValue: "Piel",
  nota: "Grabado cocodrilo con terminales (imágenes 5, 9, 10).",
});

export const STRAPS: readonly StrapPart[] = [
  caucho("negro", "negro"),
  caucho("gris", "gris"),
  // El blanco del caucho es frío, como la esfera blanca: tono "plateado".
  caucho("blanco", "plateado"),
  caucho("azul marino", "azul-marino"),
  caucho("azul", "azul"),
  caucho("naranja", "naranja"),
  caucho("verde", "verde"),
  caucho("rojo", "rojo"),
  caucho("tan", "tan"),
  caucho("amarillo", "amarillo", "pendiente", "No está en las imágenes 1 y 7: por conseguir."),
  caucho("vino", "vinotinto", "pendiente", "No está en las imágenes 1 y 7: por conseguir."),
  piel("verde", "verde"),
  piel("rojo", "roja"),
  piel("azul-marino", "azul marino"),
  {
    id: "brazalete",
    label: "Brazalete integrado",
    status: "verificado",
    swatch: "acero",
    tipo: "brazalete",
    color: null,
    shopifyValue: "Brazalete",
    nota: "En el acabado de la caja (imágenes 2 y 16). Trae su propio cierre.",
  },
];

// — Cierre ————————————————————————————————————————————————————————————————
export type ClaspId = "puas" | "desplegable";

export const CLASPS: readonly (Part & { id: ClaspId; shopifyValue: "Hebilla" | "Desplegable" })[] = [
  { id: "puas", label: "Hebilla de púa", status: "verificado", swatch: "acero", shopifyValue: "Hebilla" },
  {
    id: "desplegable",
    label: "Desplegable",
    status: "verificado",
    swatch: "acero",
    shopifyValue: "Desplegable",
    nota: "Imagen 10 (mariposa, oro rosa en la foto): verificado PARA EL PROTOTIPO (§7); la Fase 0 confirma acabado y ajuste. No cambia el precio (§1: solo Acabado × Correa).",
  },
];

/** Todo el catálogo, por categoría. */
export const CATALOG: Readonly<Record<PartCategory, readonly Part[]>> = {
  caja: CASES,
  acabado: FINISHES,
  esfera: DIAL_BASES,
  pista: TRACKS,
  aplique: APPLIQUES,
  segundero: SECONDS,
  correa: STRAPS,
  cierre: CLASPS,
};

/** El tipo de id de cada categoría (para withPart / isPartId). */
export interface PartIdMap {
  caja: CaseId;
  acabado: FinishId;
  esfera: DialBaseId;
  pista: TrackStyle;
  aplique: AppliqueId;
  segundero: SecondsId;
  correa: StrapId;
  cierre: ClaspId;
}

export function getPart(cat: PartCategory, id: string): Part | undefined {
  return CATALOG[cat].find((p) => p.id === id);
}

/** true si `id` es una pieza del catálogo de `cat` (estrecha el tipo). */
export function isPartId<K extends PartCategory>(cat: K, id: string): id is PartIdMap[K] {
  return !!getPart(cat, id);
}

export const getFinish = (id: string) => FINISHES.find((p) => p.id === id);
export const getDialBase = (id: string) => DIAL_BASES.find((p) => p.id === id);
export const getAppliquePart = (id: string) => APPLIQUES.find((p) => p.id === id);
export const getSecondsPart = (id: string) => SECONDS.find((p) => p.id === id);
export const getStrap = (id: string) => STRAPS.find((p) => p.id === id);
export const getClasp = (id: string) => CLASPS.find((p) => p.id === id);

// ===========================================================================
// ORISHAS DEL RELOJ — la alineación del dueño (imágenes 8, 13, 18, 19).
// Los ids son los de ORISHAS en lib/orisha-colors.ts; el nombre visible sale de
// ahí. Añadir Obatalá u Ogún después = añadir datos aquí, nada más.
// ===========================================================================
export type OrishaId = "eleggua" | "chango" | "yemaya" | "oshun" | "orula" | "oya";

export const WATCH_ORISHAS: readonly OrishaId[] = ["eleggua", "chango", "yemaya", "oshun", "orula", "oya"];

export function isOrishaId(id: unknown): id is OrishaId {
  return typeof id === "string" && (WATCH_ORISHAS as readonly string[]).includes(id);
}

/** Nombre visible del Orisha ("Elegguá"), de la tabla única del sitio. */
export function orishaName(id: OrishaId): string {
  return getOrisha(id)?.name ?? id;
}

/** Ortografía canónica del texto de la esfera (decisión del dueño §6): las
 *  mayúsculas conservan la tilde (RAE). Es el texto por defecto; el cliente
 *  puede editarlo y la prueba previa cubre cualquier error. */
export const DIAL_NAMES: Readonly<Record<OrishaId, string>> = {
  eleggua: "ELEGGUÁ",
  chango: "CHANGÓ",
  yemaya: "YEMAYÁ",
  oshun: "OSHÚN",
  orula: "ORULA",
  oya: "OYÁ",
};

export const DIAL_NAMES_APPROVAL = {
  aprobadoPor: "Dueño — DECISIONES-DUENO.md §6",
  fecha: "2026-11-21",
} as const;

/** La pista de cuentas: la secuencia se repite a lo largo de los 60 minutos
 *  (posición 0 = las 12). `acento` cambia una de cada `cada` cuentas. Solo se
 *  usan los números confirmados: el único acento es el de Oyá. */
export interface BeadSequence {
  secuencia: readonly WatchColorId[];
  acento?: { cada: number; color: WatchColorId; raya?: WatchColorId };
  nota: string;
}

export const TRACK_SEQUENCES: Readonly<Record<OrishaId, BeadSequence>> = {
  eleggua: { secuencia: ["rojo", "negro"], nota: "Rojo y negro alternos." },
  chango: { secuencia: ["rojo", "blanco"], nota: "Rojo y blanco alternos." },
  yemaya: { secuencia: ["azul", "blanco"], nota: "Azul y blanco alternos." },
  oshun: { secuencia: ["amarillo", "ambar"], nota: "Amarillo y ámbar alternos." },
  orula: { secuencia: ["verde", "amarillo"], nota: "Verde y amarillo alternos, como su eleke." },
  oya: {
    secuencia: ["marron"],
    acento: { cada: 10, color: "marron", raya: "negro" },
    nota: "Carmelita, con una cuenta rayada cada 10.",
  },
};

/** Color de la cuenta / raya en la posición `i` (0 = las 12, sentido horario). */
export function beadAt(
  seq: BeadSequence,
  i: number,
): { color: WatchColorId; acento: boolean; raya?: WatchColorId } {
  if (seq.acento && i % seq.acento.cada === 0) {
    return { color: seq.acento.color, acento: true, raya: seq.acento.raya };
  }
  return { color: seq.secuencia[i % seq.secuencia.length], acento: false };
}

// ===========================================================================
// SIGNO ODÙ — de la esfera y de la tapa.
// ===========================================================================
/** Un Meyi (los 16 de lib/odu.ts) o una combinación de dos piernas (256). La
 *  pierna DERECHA se lee primero y nombra el signo. El nombre de una
 *  combinación lo escribe el cliente tal como está en su libreta: nunca se
 *  genera. */
export type OduSign =
  | { tipo: "meyi"; oduId: string }
  | { tipo: "combinacion"; derecha: string; izquierda: string; nombre: string };

/** Las dos columnas del signo, listas para dibujar con oduMarks(): `right` es la
 *  pierna derecha (a la derecha del que mira), `left` la izquierda. */
export function signColumns(sign: OduSign): { left: OduColumn; right: OduColumn } | null {
  if (sign.tipo === "meyi") {
    const o = getOdu(sign.oduId);
    return o ? { left: o.left, right: o.right } : null;
  }
  const d = getOdu(sign.derecha);
  const i = getOdu(sign.izquierda);
  return d && i ? { left: i.left, right: d.right } : null;
}

/** Nombre que se graba bajo el signo: el lucumí para un Meyi ("Ofun Meyi"), el
 *  que escribió el cliente para una combinación. */
export function signName(sign: OduSign): string {
  if (sign.tipo === "meyi") return lucumiName(sign.oduId) ?? "";
  return sign.nombre.trim();
}

/** Dónde va el signo en la esfera: 'nueve' = zona interior a las 9, haciendo
 *  pareja con la ventana de fecha a las 3 (4.0 mm de alto); 'seis' = entre el
 *  centro y el nombre (3.8 mm: es lo que cabe sin tocar el nombre). Siempre
 *  derecho respecto a las 12, nunca girado.
 *  OJO: spec.json pedía "~4 mm a las 6"; el valor por defecto es 'nueve'
 *  (DIAL_SIGN_DEFAULT_POS) hasta que el dueño lo confirme. Medidas en
 *  DIAL_LAYOUT.sign (lib/watch-art.ts). */
export type DialSignPos = "nueve" | "seis";

/** Posición del signo cuando el cliente no elige (pendiente de confirmar por
 *  el dueño: ver DialSignPos). */
export const DIAL_SIGN_DEFAULT_POS: DialSignPos = "nueve";

// ===========================================================================
// MODELO DE ESFERA — qué se imprime y qué índices lleva, sobre el color base.
//   'clasica' = índices luminosos (puntos, triángulo a las 12, barras a las 6
//               y a las 9) + el texto a las 6 + el signo opcional.
//   'ifa'     = la Esfera Ifá (decisión del dueño §12): los 16 Meyis impresos
//               alrededor de la esfera en su orden tradicional (ODU_MEJI:
//               Baba Ejiogbe a las 12 y después en sentido horario, uno cada
//               22.5°), cada uno DERECHO respecto a las 12. Son los índices: no
//               lleva puntos, ni triángulo, ni barras. "IFÁ" a las 6. El signo
//               personal va en la tapa, no en la esfera (regla
//               'signo-esfera-ifa'). Medidas en DIAL_LAYOUT.ifa (watch-art).
// Un enlace viejo sin `modelo` se lee como 'clasica' (normalize).
// ===========================================================================
export type DialModelId = "clasica" | "ifa";

export interface DialModel {
  id: DialModelId;
  /** Nombre en la interfaz y en el pedido. */
  label: string;
  /** Lo que lleva, en una línea (ficha y hoja del taller). */
  nota: string;
  /** ¿Lleva ventana de fecha a las 3? false = disco SIN ventana (otro disco
   *  del proveedor, por verificar en la Fase 0). */
  ventanaFecha: boolean;
}

export const DIAL_MODELS: Readonly<Record<DialModelId, DialModel>> = {
  clasica: {
    id: "clasica",
    label: "Clásica",
    nota: "Índices luminosos, tu texto a las 6 y, si quieres, tu signo.",
    ventanaFecha: true,
  },
  ifa: {
    id: "ifa",
    label: "Esfera Ifá",
    nota: "Los 16 Meyis en su orden tradicional alrededor de la esfera, con Baba Ejiogbe a las 12, e IFÁ a las 6.",
    // PENDIENTE DEL DUEÑO (por defecto SIN fecha): sin ventana, los 16 Meyis
    // quedan en un anillo perfecto a 10.75 mm, como pide §12 ("alrededor de la
    // esfera"). Con fecha (true), Iroso Meyi (las 3) tiene que meterse hacia
    // el centro (≈ 7.8 mm) para dejar ver la ventana y el anillo se rompe en
    // la pieza estrella. Sin fecha hace falta el disco sin ventana del
    // proveedor (Fase 0); la hoja del taller lo dice. Para volver a la
    // ventana basta con poner true: todo lo demás (anillo, agujas, archivos,
    // check-watch-data) ya contempla las dos opciones. Ver DIAL_LAYOUT.ifa.
    ventanaFecha: false,
  },
};

export function isDialModelId(id: unknown): id is DialModelId {
  return id === "clasica" || id === "ifa";
}

/** Texto de la Esfera Ifá a las 6 (canónico; el cliente puede editarlo). */
export const DIAL_TEXT_IFA = "IFÁ";

// ===========================================================================
// TEXTOS — listas permitidas y límites (una sola fuente para la UI y validate).
// ===========================================================================
export const DIAL_TEXT_MAX = 12;
/** Esfera: MAYÚSCULAS A–Z con tildes y Ñ, dígitos, espacio y . · ' - */
export const DIAL_TEXT_ALLOW = /^[A-Z0-9ÁÉÍÓÚÜÑ .·'-]*$/;

export const CASEBACK_MAX = 20;
/** Tapa: letras (mayúsculas y minúsculas, tildes, Ñ), dígitos, espacio y . , ' · & / - */
export const CASEBACK_ALLOW = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,'·&/-]*$/;

/** Nombre de una combinación: mismo alfabeto que la tapa, hasta 24. */
export const SIGN_NAME_MAX = 24;
export const SIGN_NAME_ALLOW = CASEBACK_ALLOW;

/** Comillas tipográficas → apóstrofo recto; acentos compuestos (NFD, teclado
 *  de Mac) → una sola letra (NFC); espacios repetidos → uno. No recorta los
 *  extremos (el cliente puede estar escribiendo dos palabras): normalize() sí. */
function tidy(raw: string): string {
  return raw.normalize("NFC").replace(/[‘’´`]/g, "'").replace(/\s+/g, " ");
}

/** Texto de esfera tal como se teclea: en mayúsculas, sin caracteres fuera de
 *  la lista y como máximo DIAL_TEXT_MAX. Úsalo en el onChange del campo. */
export function cleanDialText(raw: string): string {
  return [...tidy(raw).toLocaleUpperCase("es")]
    .filter((ch) => DIAL_TEXT_ALLOW.test(ch))
    .join("")
    .slice(0, DIAL_TEXT_MAX);
}

/** Una línea de la tapa tal como se teclea (mayúsculas y minúsculas). */
export function cleanCasebackLine(raw: string): string {
  return [...tidy(raw)].filter((ch) => CASEBACK_ALLOW.test(ch)).join("").slice(0, CASEBACK_MAX);
}

/** El nombre de una combinación tal como se teclea. */
export function cleanSignName(raw: string): string {
  return [...tidy(raw)].filter((ch) => SIGN_NAME_ALLOW.test(ch)).join("").slice(0, SIGN_NAME_MAX);
}

export const isValidDialText = (s: string) => s.length <= DIAL_TEXT_MAX && DIAL_TEXT_ALLOW.test(s);
export const isValidCasebackLine = (s: string) => s.length <= CASEBACK_MAX && CASEBACK_ALLOW.test(s);
export const isValidSignName = (s: string) =>
  s.trim().length > 0 && s.length <= SIGN_NAME_MAX && SIGN_NAME_ALLOW.test(s);

/** "1984-03-15" → "15 · 03 · 1984": la fecha tal como se graba, y como se
 *  escribe en todo lo que lee una persona (resumen, WhatsApp, pedido, hoja del
 *  taller). El valor ISO solo viaja dentro de ?d=. */
export function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d} · ${m} · ${y}`;
}

/** Fecha de la tapa: AAAA-MM-DD y un día que exista (no 2025-02-30). */
export function isValidFecha(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return y >= 1900 && y <= 2100 && dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

// ===========================================================================
// LA CONFIGURACIÓN
// ===========================================================================
export interface Tapa {
  signo: OduSign | null;
  /** 'barras' = I / II (como el tablero); 'libreta' = I / 0 (escritura cubana). */
  marcas: "barras" | "libreta";
  linea1: string;
  linea2: string;
  /** Opcional, AAAA-MM-DD (Itá, Mano de Orula o la que elija). */
  fecha?: string;
  /** 'clasica' = py-dial (Cinzel); 'fina' = py-dial-fina (Cormorant). */
  fuente: "clasica" | "fina";
}

export interface Esfera {
  /** Qué se imprime: 'clasica' o 'ifa' (ver DIAL_MODELS). */
  modelo: DialModelId;
  base: DialBaseId;
  /** 'cuentas' necesita un Orisha (de él salen los colores). 'rayas' con
   *  Orisha = rayas en sus colores; sin Orisha = rayas lisas. */
  pista: { estilo: TrackStyle; orisha?: OrishaId };
  /** Texto impreso sobre las 6. '' = sin texto. Ver DIAL_TEXT_ALLOW. */
  texto: string;
  signo: OduSign | null;
  signoPos: DialSignPos;
  /** Solo con una base de degradado: dónde cambia el color (1–5, 3 = centro). */
  degradado?: DialGradientStep;
}

/** 'ifa' = la pieza estrella: Esfera Ifá con la pista de Orula (§12). */
export type PresetId = OrishaId | "cero" | "ifa";

export function isPresetId(id: unknown): id is PresetId {
  return id === "cero" || id === "ifa" || isOrishaId(id);
}

export interface WatchConfig {
  v: 1;
  caja: CaseId;
  acabado: FinishId;
  esfera: Esfera;
  aplique: AppliqueId;
  segundero: SecondsId;
  correa: StrapId;
  cierre: ClaspId;
  tapa: Tapa;
  /** Desde qué preset se empezó (solo informativo; no cambia el reloj). */
  preset?: PresetId;
}

export const DEFAULT_TAPA: Tapa = {
  signo: null,
  marcas: "barras",
  linea1: "",
  linea2: "",
  fuente: "clasica",
};

// ===========================================================================
// DISPONIBILIDAD — 'pendiente' y 'bloqueado' nunca se muestran; lo que está en
// el metafield reloj.agotados se muestra en gris.
// ===========================================================================
export interface Availability {
  /** Claves "categoria:id" agotadas (de reloj.agotados). */
  agotados: ReadonlySet<string>;
}

export const partKey = (cat: PartCategory, id: string) => `${cat}:${id}`;

/** Construye la disponibilidad a partir del metafield reloj.agotados (lista de
 *  "categoria:id"; mayúsculas y espacios se ignoran). Sin metafield = []. */
export function availability(agotados: readonly string[] = []): Availability {
  return { agotados: new Set(agotados.map((s) => s.trim().toLowerCase()).filter(Boolean)) };
}

export type PartState = "disponible" | "agotado" | "oculto";

/** Se ofrece: verificada y, si va detrás de una bandera, con la bandera encendida. */
const isOffered = (p: Part, flags: WatchFlags) => p.status === "verificado" && (!p.flag || flags[p.flag]);

/** 'oculto' = no existe, no está verificada o su bandera está apagada (no se
 *  pinta la ficha); 'agotado' = se pinta en gris; 'disponible' = se puede elegir. */
export function partState(cat: PartCategory, id: string, disp: Availability, flags: WatchFlags = FLAGS): PartState {
  const p = getPart(cat, id);
  if (!p || !isOffered(p, flags)) return "oculto";
  return disp.agotados.has(partKey(cat, id)) ? "agotado" : "disponible";
}

/** Las fichas que se pintan en una categoría (las que se ofrecen; las agotadas
 *  incluidas, en gris), en el orden del catálogo. */
export function visibleParts<P extends Part>(list: readonly P[], flags: WatchFlags = FLAGS): P[] {
  return list.filter((p) => isOffered(p, flags));
}

const isUsable = (cat: PartCategory, id: string, disp: Availability) =>
  partState(cat, id, disp) === "disponible";

// ===========================================================================
// PRESETS POR ORISHA — listas de preferencia: cada una se resuelve a la
// primera pieza verificada y disponible, así un preset nunca muestra una pieza
// que el taller no tiene. Se basan en los renders del dueño, no en el orden del
// eleke (getOrishaGems le daría a Changó una esfera roja; el dueño la quiere
// blanca).
// ===========================================================================
export interface WatchPreset {
  id: PresetId;
  /** Nombre en la interfaz ("Oshún", "Ifá", "Desde cero"). */
  label: string;
  /** De qué Orisha son los colores de la pista (Ifá → Orula). */
  orisha: OrishaId | null;
  /** Modelo de esfera con el que abre. */
  modelo: DialModelId;
  /** Texto a las 6 con el que abre; sin él, el nombre canónico del Orisha. */
  texto?: string;
  prefer: {
    acabado: readonly FinishId[];
    base: readonly DialBaseId[];
    pista: readonly TrackStyle[];
    aplique: readonly AppliqueId[];
    segundero: readonly SecondsId[];
    correa: readonly StrapId[];
    cierre: readonly ClaspId[];
  };
}

const orishaPreset = (
  orisha: OrishaId,
  base: DialBaseId[],
  segundero: SecondsId[],
  correa: StrapId[],
): WatchPreset => ({
  id: orisha,
  label: orishaName(orisha),
  orisha,
  modelo: "clasica",
  prefer: {
    acabado: ["acero"],
    base: [...base, "blanco"],
    pista: ["cuentas", "rayas"],
    aplique: ["oro", "plata"],
    segundero: [...segundero, "negro"],
    correa: [...correa, "caucho-negro"],
    cierre: ["puas"],
  },
});

export const ORISHA_WATCH_PRESETS: Readonly<Record<PresetId, WatchPreset>> = {
  eleggua: orishaPreset("eleggua", ["rojo"], ["negro"], ["caucho-negro"]),
  chango: orishaPreset("chango", ["blanco"], ["rojo"], ["caucho-rojo"]),
  yemaya: orishaPreset("yemaya", ["blanco"], ["azul"], ["caucho-azul-marino", "caucho-azul"]),
  oshun: orishaPreset("oshun", ["blanco"], ["amarillo"], ["caucho-amarillo", "caucho-blanco"]),
  orula: orishaPreset("orula", ["verde"], ["amarillo"], ["caucho-verde"]),
  oya: orishaPreset("oya", ["blanco"], ["marron", "negro"], ["caucho-vino", "caucho-tan"]),
  // La pieza estrella (§12): esfera verde sol con los 16 Meyis, pista de cuentas
  // verde y amarillo (las de Orula), aplique oro, segundero amarillo, caucho
  // verde, caja de acero. El signo personal del cliente va en la tapa.
  ifa: {
    id: "ifa",
    label: "Ifá",
    orisha: "orula",
    modelo: "ifa",
    texto: DIAL_TEXT_IFA,
    prefer: {
      acabado: ["acero"],
      base: ["verde", "negro"],
      pista: ["cuentas", "rayas"],
      aplique: ["oro", "plata"],
      segundero: ["amarillo", "negro"],
      correa: ["caucho-verde", "caucho-negro"],
      cierre: ["puas"],
    },
  },
  cero: {
    id: "cero",
    label: "Desde cero",
    orisha: null,
    modelo: "clasica",
    prefer: {
      acabado: ["acero"],
      base: ["blanco"],
      pista: ["rayas"],
      aplique: ["plata", "oro"],
      segundero: ["negro"],
      correa: ["caucho-negro"],
      cierre: ["puas"],
    },
  },
};

/** Orden de las fichas de preset en la interfaz: Ifá primero (la pieza
 *  estrella, §12), luego los Orishas y al final "Desde cero". */
export const PRESET_ORDER: readonly PresetId[] = ["ifa", "eleggua", "chango", "yemaya", "oshun", "orula", "oya", "cero"];

/** Texto canónico a las 6 para esta esfera: "IFÁ" en la Esfera Ifá, el nombre
 *  del Orisha de la pista en la clásica; undefined sin Orisha. */
export function canonicalDialText(e: Pick<Esfera, "modelo" | "pista">): string | undefined {
  if (e.modelo === "ifa") return DIAL_TEXT_IFA;
  return e.pista.orisha ? DIAL_NAMES[e.pista.orisha] : undefined;
}

/** Primera pieza utilizable de la lista; si ninguna lo es, la primera utilizable
 *  del catálogo; y si todo estuviera agotado, la primera que se ofrece. */
function firstUsable<T extends string>(cat: PartCategory, prefer: readonly T[], disp: Availability): T {
  const hit = prefer.find((id) => isUsable(cat, id, disp));
  if (hit) return hit;
  const all = CATALOG[cat];
  const any = all.find((p) => isUsable(cat, p.id, disp)) ?? all.find((p) => isOffered(p, FLAGS)) ?? all[0];
  return any.id as T;
}

export function resolvePreset(id: PresetId, disp: Availability = availability()): WatchConfig {
  const p = ORISHA_WATCH_PRESETS[id] ?? ORISHA_WATCH_PRESETS.cero;
  const estilo = firstUsable("pista", p.prefer.pista, disp);
  return {
    v: 1,
    caja: "octogonal-40",
    acabado: firstUsable("acabado", p.prefer.acabado, disp),
    esfera: {
      modelo: p.modelo,
      base: firstUsable("esfera", p.prefer.base, disp),
      pista: p.orisha ? { estilo, orisha: p.orisha } : { estilo: estilo === "cuentas" ? "rayas" : estilo },
      texto: p.texto ?? (p.orisha ? DIAL_NAMES[p.orisha] : ""),
      signo: null,
      signoPos: DIAL_SIGN_DEFAULT_POS,
    },
    aplique: firstUsable("aplique", p.prefer.aplique, disp),
    segundero: firstUsable("segundero", p.prefer.segundero, disp),
    correa: firstUsable("correa", p.prefer.correa, disp),
    cierre: firstUsable("cierre", p.prefer.cierre, disp),
    tapa: { ...DEFAULT_TAPA },
    preset: p.id,
  };
}

/** El reloj con el que abre el creador sin ?d= ni preset. */
export const DEFAULT_WATCH: WatchConfig = resolvePreset("cero");

// ===========================================================================
// CONTRASTE — WCAG, para el texto de la esfera y el aviso del segundero.
// ===========================================================================
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Mínimo para el texto impreso de la esfera. */
export const DIAL_TEXT_MIN_CONTRAST = 3;
/** Por debajo de esto un segundero "casi no se ve" (aviso, no bloqueo). */
export const SECONDS_MIN_CONTRAST = 1.3;

/** Color de una esfera LISA (en un degradado, su color de respaldo: usa
 *  dialColorAt para el color real en cada punto). */
export function dialBaseHex(base: DialBaseId): string {
  const b = getDialBase(base) ?? DIAL_BASES[0];
  return WATCH_COLORS[b.color].hex;
}

/** El paso del degradado de esta esfera; null si la base es lisa. */
export function gradientStepOf(e: Pick<Esfera, "base" | "degradado">): DialGradientStep | null {
  if (!getDialBase(e.base)?.degradado) return null;
  return isGradientStep(e.degradado) ? e.degradado : DIAL_GRADIENT_DEFAULT;
}

const toLin = (hex: string) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
const toHex = (lin: number[]) =>
  `#${lin
    .map((c) => {
      const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
      return Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;

/** Cuánto del color de abajo hay a la altura `yMm` (mm desde el centro, + hacia
 *  abajo): smoothstep sobre el diámetro de la esfera, como piezas/esferas.py. */
export function gradientMix(step: DialGradientStep, yMm: number): number {
  const R = WATCH_SPECS.dialMm / 2;
  const t = (yMm + R) / (2 * R);
  const u = Math.min(1, Math.max(0, (t - (DIAL_GRADIENT_CENTERS[step] - DIAL_GRADIENT_WIDTH / 2)) / DIAL_GRADIENT_WIDTH));
  return u * u * (3 - 2 * u);
}

/** El color de la esfera a la altura `yMm` (mm desde el centro, + hacia abajo).
 *  En una esfera lisa es su color; en un degradado, la mezcla en luz lineal
 *  (la misma cuenta que pintó la capa). */
export function dialColorAt(e: Pick<Esfera, "base" | "degradado">, yMm: number): string {
  const g = getDialBase(e.base)?.degradado;
  const step = gradientStepOf(e);
  if (!g || !step) return dialBaseHex(e.base);
  const t = gradientMix(step, yMm);
  const a = toLin(g.arriba);
  const b = toLin(g.abajo);
  return toHex(a.map((v, i) => v * (1 - t) + b[i] * t));
}

export type DialInkId = "oro" | "oro-oscuro" | "negra";
export interface DialInk {
  id: DialInkId;
  hex: string;
  contraste: number;
}

const INK_HEX: Readonly<Record<DialInkId, string>> = {
  oro: WATCH_MATERIALS["tinta-oro"],
  "oro-oscuro": WATCH_MATERIALS["tinta-oro-oscuro"],
  negra: WATCH_MATERIALS["tinta-negra"],
};

export const DIAL_INK_NOMBRE: Readonly<Record<DialInkId, string>> = {
  oro: "Dorada clara",
  "oro-oscuro": "Dorada oscura",
  negra: "Negra",
};

/** Altura (mm) a la que se mide el color bajo el nombre de las 6: el centro de
 *  sus mayúsculas (DIAL_LAYOUT.name.baseline 7.6 − ~0.6). check-watch-data
 *  comprueba que siga dentro del nombre de las dos esferas. */
export const DIAL_NAME_Y = 7.0;

/** Tinta de lo impreso a la altura `yMm`, elegida sola.
 *  • Esfera lisa: la dorada de más contraste (oscura sobre la blanca), igual
 *    en toda la esfera.
 *  • Degradado: contra el color que queda DEBAJO de cada pieza impresa, la
 *    primera que llega a 3:1 en este orden: dorada clara, dorada oscura, negra
 *    (la negra salva la zona de mezcla). Si ninguna llega, la de más contraste. */
export function dialInkAt(e: Pick<Esfera, "base" | "degradado">, yMm: number): DialInk {
  const bg = dialColorAt(e, yMm);
  const of = (id: DialInkId): DialInk => ({ id, hex: INK_HEX[id], contraste: contrastRatio(INK_HEX[id], bg) });
  if (!gradientStepOf(e)) {
    const l = of("oro");
    const d = of("oro-oscuro");
    return l.contraste >= d.contraste ? l : d;
  }
  const all = (["oro", "oro-oscuro", "negra"] as const).map(of);
  return all.find((i) => i.contraste >= DIAL_TEXT_MIN_CONTRAST) ?? all.reduce((a, b) => (b.contraste > a.contraste ? b : a));
}

/** Tinta del texto de la esfera (el nombre de las 6). En una esfera lisa es la
 *  de toda la esfera. */
export function dialInk(base: DialBaseId, degradado?: DialGradientStep): DialInk {
  return dialInkAt({ base, degradado }, DIAL_NAME_Y);
}

/** La esfera en palabras: "Verde sol" o "Degradado Orula (amarillo → verde),
 *  paso 3 de 5". Una sola fuente para el resumen, el pedido y la hoja. */
export function dialBaseLabel(e: Pick<Esfera, "base" | "degradado">): string {
  const b = getDialBase(e.base);
  if (!b) return e.base;
  const g = b.degradado;
  const step = gradientStepOf(e);
  return g && step ? `${b.label} (${g.nombres[0]} → ${g.nombres[1]}), paso ${step} de 5` : b.label;
}

// ===========================================================================
// REGLAS — cada una con su motivo en español, que es el que se ve en la ficha.
// 'bloqueo' impide pedir; 'aviso' solo informa.
// ===========================================================================
export type WatchField =
  | "caja"
  | "acabado"
  | "esfera.modelo"
  | "esfera.base"
  | "esfera.pista"
  | "esfera.texto"
  | "esfera.signo"
  | "aplique"
  | "segundero"
  | "correa"
  | "cierre"
  | "tapa.signo"
  | "tapa.linea1"
  | "tapa.linea2"
  | "tapa.fecha";

export interface Rule {
  id: string;
  nivel: "bloqueo" | "aviso";
  motivo: string;
  /** Los campos de `c` que incumplen la regla ([] = no aplica). */
  campos(c: WatchConfig, disp: Availability, flags: WatchFlags): WatchField[];
}

/** Campo ↔ categoría del catálogo, para las reglas de piezas. */
const PART_FIELDS: readonly { campo: WatchField; cat: PartCategory; get: (c: WatchConfig) => string }[] = [
  { campo: "caja", cat: "caja", get: (c) => c.caja },
  { campo: "acabado", cat: "acabado", get: (c) => c.acabado },
  { campo: "esfera.base", cat: "esfera", get: (c) => c.esfera.base },
  { campo: "esfera.pista", cat: "pista", get: (c) => c.esfera.pista.estilo },
  { campo: "aplique", cat: "aplique", get: (c) => c.aplique },
  { campo: "segundero", cat: "segundero", get: (c) => c.segundero },
  { campo: "correa", cat: "correa", get: (c) => c.correa },
  { campo: "cierre", cat: "cierre", get: (c) => c.cierre },
];

/** Los signos del reloj con el campo al que pertenecen. */
function signsOf(c: WatchConfig): { campo: WatchField; signo: OduSign }[] {
  const out: { campo: WatchField; signo: OduSign }[] = [];
  if (c.esfera.signo) out.push({ campo: "esfera.signo", signo: c.esfera.signo });
  if (c.tapa.signo) out.push({ campo: "tapa.signo", signo: c.tapa.signo });
  return out;
}

const signIdsKnown = (s: OduSign) =>
  s.tipo === "meyi" ? !!getOdu(s.oduId) : !!getOdu(s.derecha) && !!getOdu(s.izquierda);

/** Orden = prioridad: la primera regla que bloquea un campo da el motivo que se
 *  ve en la ficha, así que las específicas van antes que las generales. */
export const RULES: readonly Rule[] = [
  {
    id: "pieza-desconocida",
    nivel: "bloqueo",
    motivo: "Esta pieza ya no está en el catálogo.",
    campos: (c) => {
      const bad = PART_FIELDS.filter((f) => !getPart(f.cat, f.get(c))).map((f) => f.campo);
      if (c.esfera.pista.orisha !== undefined && !isOrishaId(c.esfera.pista.orisha)) bad.push("esfera.pista");
      if (!isDialModelId(c.esfera.modelo)) bad.push("esfera.modelo");
      return bad;
    },
  },
  {
    id: "franjas-octogonal",
    nivel: "bloqueo",
    motivo: "Las esferas de franjas no se ofrecen con la caja octogonal.",
    campos: (c, _d, flags) =>
      !flags.STRIPE_DIALS && getDialBase(c.esfera.base)?.textura === "franjas" ? ["esfera.base"] : [],
  },
  {
    id: "pieza-no-verificada",
    nivel: "bloqueo",
    motivo: "Todavía no disponible: la estamos verificando en el taller.",
    campos: (c) =>
      PART_FIELDS.filter((f) => {
        const p = getPart(f.cat, f.get(c));
        return p && p.status !== "verificado";
      }).map((f) => f.campo),
  },
  {
    id: "pieza-agotada",
    nivel: "bloqueo",
    motivo: "Agotada por ahora.",
    campos: (c, disp) =>
      PART_FIELDS.filter((f) => disp.agotados.has(partKey(f.cat, f.get(c)))).map((f) => f.campo),
  },
  {
    id: "cuentas-sin-orisha",
    nivel: "bloqueo",
    motivo: "Elige de qué Orisha son las cuentas.",
    campos: (c) => (c.esfera.pista.estilo === "cuentas" && !c.esfera.pista.orisha ? ["esfera.pista"] : []),
  },
  {
    id: "texto-esfera",
    nivel: "bloqueo",
    motivo: "Hasta 12 caracteres: letras A–Z (con tildes y Ñ), números, espacio y . · ' -",
    campos: (c) => (isValidDialText(c.esfera.texto) ? [] : ["esfera.texto"]),
  },
  {
    id: "texto-esfera-fijo",
    nivel: "bloqueo",
    motivo: "Por ahora la esfera solo lleva el nombre del Orisha.",
    campos: (c, _d, flags) => {
      if (flags.DIAL_FREE_TEXT || c.esfera.texto === "") return [];
      return c.esfera.texto === canonicalDialText(c.esfera) ? [] : ["esfera.texto"];
    },
  },
  {
    id: "signo-esfera-ifa",
    nivel: "bloqueo",
    motivo: "La Esfera Ifá ya lleva los 16 Meyis: tu signo va grabado en la tapa.",
    campos: (c) => (c.esfera.modelo === "ifa" && c.esfera.signo ? ["esfera.signo"] : []),
  },
  {
    id: "signo-esfera-apagado",
    nivel: "bloqueo",
    motivo: "El signo en la esfera aún no está disponible: ponlo en la tapa.",
    campos: (c, _d, flags) => (!flags.ODU_ON_DIAL && c.esfera.signo ? ["esfera.signo"] : []),
  },
  {
    id: "signo-desconocido",
    nivel: "bloqueo",
    motivo: "No reconocemos este signo. Vuelve a elegirlo.",
    campos: (c) => signsOf(c).filter((s) => !signIdsKnown(s.signo)).map((s) => s.campo),
  },
  {
    id: "combinacion-sin-nombre",
    nivel: "bloqueo",
    motivo: "Escribe el nombre de tu signo tal como aparece en tu libreta.",
    campos: (c) =>
      signsOf(c)
        .filter((s) => s.signo.tipo === "combinacion" && s.signo.nombre.trim() === "")
        .map((s) => s.campo),
  },
  {
    id: "nombre-combinacion",
    nivel: "bloqueo",
    motivo: "El nombre del signo: hasta 24 caracteres (letras, números, espacio y . , ' · & / -).",
    campos: (c) =>
      signsOf(c)
        .filter((s) => s.signo.tipo === "combinacion" && s.signo.nombre.trim() !== "" && !isValidSignName(s.signo.nombre))
        .map((s) => s.campo),
  },
  {
    id: "texto-tapa",
    nivel: "bloqueo",
    motivo: "Hasta 20 caracteres por línea: letras (con tildes y Ñ), números, espacio y . , ' · & / -",
    campos: (c) => {
      const bad: WatchField[] = [];
      if (!isValidCasebackLine(c.tapa.linea1)) bad.push("tapa.linea1");
      if (!isValidCasebackLine(c.tapa.linea2)) bad.push("tapa.linea2");
      return bad;
    },
  },
  {
    id: "fecha-tapa",
    nivel: "bloqueo",
    motivo: "Escribe una fecha válida (día, mes y año).",
    campos: (c) => (c.tapa.fecha && !isValidFecha(c.tapa.fecha) ? ["tapa.fecha"] : []),
  },
  {
    // §12: la pieza estrella lleva el signo personal al dorso. No bloquea
    // (se puede pedir con la tapa lisa), pero se avisa con "Corregir" → Tu tapa.
    id: "ifa-sin-signo",
    nivel: "aviso",
    motivo: "La Esfera Ifá lleva tu signo al dorso: elígelo en Tu tapa.",
    campos: (c) => (c.esfera.modelo === "ifa" && !c.tapa.signo ? ["tapa.signo"] : []),
  },
  {
    id: "contraste-segundero",
    nivel: "aviso",
    motivo: "Este segundero casi no se ve sobre esta esfera.",
    campos: (c) => {
      const s = getSecondsPart(c.segundero);
      const b = getDialBase(c.esfera.base);
      if (!s || !b) return [];
      // En un degradado, el peor de sus dos extremos (donde la punta recorre la pista).
      const fondos = gradientStepOf(c.esfera) ? [-12, 12].map((y) => dialColorAt(c.esfera, y)) : [WATCH_COLORS[b.color].hex];
      return fondos.some((bg) => contrastRatio(WATCH_COLORS[s.color].hex, bg) < SECONDS_MIN_CONTRAST) ? ["segundero"] : [];
    },
  },
];

export interface WatchIssue {
  regla: string;
  campo: WatchField;
  nivel: "bloqueo" | "aviso";
  motivo: string;
}

export interface Validation {
  /** true = se puede pedir (no hay ningún 'bloqueo'; los avisos no cuentan). */
  ok: boolean;
  issues: WatchIssue[];
}

/** Revisa un reloj completo: piezas, reglas, textos, signos y el contraste del
 *  texto de la esfera (≥ 3:1; la tinta es automática, así que solo saltaría si
 *  se añade una esfera nueva sin tinta que contraste). */
export function validate(c: WatchConfig, disp: Availability = availability(), flags: WatchFlags = FLAGS): Validation {
  const issues: WatchIssue[] = [];
  for (const rule of RULES) {
    for (const campo of rule.campos(c, disp, flags)) {
      issues.push({ regla: rule.id, campo, nivel: rule.nivel, motivo: rule.motivo });
    }
  }
  if (getDialBase(c.esfera.base) && dialInkAt(c.esfera, DIAL_NAME_Y).contraste < DIAL_TEXT_MIN_CONTRAST) {
    issues.push({
      regla: "contraste-texto",
      campo: "esfera.base",
      nivel: "bloqueo",
      motivo: "El texto no se leería bien sobre esta esfera.",
    });
  }
  return { ok: !issues.some((i) => i.nivel === "bloqueo"), issues };
}

/** Cambia UNA pieza del reloj (inmutable). `cat` 'pista' cambia el estilo. El
 *  id va tipado por categoría; un id que no está en el catálogo (p. ej. uno
 *  forzado con `as`) devuelve `c` sin cambios. Con un id de tipo string (una
 *  ficha del catálogo), estréchalo antes con isPartId(cat, id). */
export function withPart<K extends PartCategory>(c: WatchConfig, cat: K, id: PartIdMap[K]): WatchConfig {
  return getPart(cat, id) ? setPart(c, cat, id) : c;
}

/** Cambia el modelo de esfera (inmutable). Si el texto a las 6 era el canónico
 *  del modelo anterior ("ORULA"), pasa al del nuevo ("IFÁ") y al revés; un
 *  texto escrito por el cliente se respeta. Pasar a 'ifa' quita el signo de la
 *  esfera (la Esfera Ifá ya lleva los 16; el personal va en la tapa). */
export function withDialModel(c: WatchConfig, modelo: DialModelId): WatchConfig {
  if (!isDialModelId(modelo) || c.esfera.modelo === modelo) return c;
  const next = { ...c.esfera, modelo };
  const wasCanon = c.esfera.texto === (canonicalDialText(c.esfera) ?? "");
  return {
    ...c,
    esfera: {
      ...next,
      texto: wasCanon ? canonicalDialText(next) ?? "" : c.esfera.texto,
      signo: modelo === "ifa" ? null : c.esfera.signo,
    },
  };
}

/** Mueve el cambio de color de un degradado (1–5). Sin base de degradado, o
 *  con un paso que no existe, devuelve `c` sin cambios. */
export function withGradientStep(c: WatchConfig, step: DialGradientStep): WatchConfig {
  if (!getDialBase(c.esfera.base)?.degradado || !isGradientStep(step) || c.esfera.degradado === step) return c;
  return { ...c, esfera: { ...c.esfera, degradado: step } };
}

/** El cambio sin comprobar: solo para ids que ya se sabe que existen. */
function setPart(c: WatchConfig, cat: PartCategory, id: string): WatchConfig {
  switch (cat) {
    case "caja":
      return { ...c, caja: id as CaseId };
    case "acabado":
      return { ...c, acabado: id as FinishId };
    case "esfera": {
      // El paso del degradado se guarda solo con una base de degradado (y se
      // conserva al pasar de un degradado a otro).
      const { degradado, ...rest } = c.esfera;
      const base = id as DialBaseId;
      return getDialBase(base)?.degradado
        ? { ...c, esfera: { ...rest, base, degradado: degradado ?? DIAL_GRADIENT_DEFAULT } }
        : { ...c, esfera: { ...rest, base } };
    }
    case "pista":
      return { ...c, esfera: { ...c.esfera, pista: { ...c.esfera.pista, estilo: id as TrackStyle } } };
    case "aplique":
      return { ...c, aplique: id as AppliqueId };
    case "segundero":
      return { ...c, segundero: id as SecondsId };
    case "correa":
      return { ...c, correa: id as StrapId };
    case "cierre":
      return { ...c, cierre: id as ClaspId };
  }
}

const CAT_FIELD: Readonly<Record<PartCategory, WatchField>> = {
  caja: "caja",
  acabado: "acabado",
  esfera: "esfera.base",
  pista: "esfera.pista",
  aplique: "aplique",
  segundero: "segundero",
  correa: "correa",
  cierre: "cierre",
};

/** Estado de una ficha de opción: qué pasa si el cliente elige `id` en `cat`.
 *  'oculto' no se pinta; 'agotado' y 'bloqueado' se pintan en gris con el
 *  motivo; 'aviso' se puede elegir pero se muestra el motivo. */
export function optionState(
  c: WatchConfig,
  cat: PartCategory,
  id: string,
  disp: Availability = availability(),
  flags: WatchFlags = FLAGS,
): { estado: "disponible" | "aviso" | "agotado" | "bloqueado" | "oculto"; motivo?: string } {
  const st = partState(cat, id, disp, flags);
  if (st === "oculto") return { estado: "oculto" };
  if (st === "agotado") return { estado: "agotado", motivo: "Agotada por ahora." };
  const field = CAT_FIELD[cat];
  // partState ya comprobó que `id` existe en `cat`.
  const mine = validate(setPart(c, cat, id), disp, flags).issues.filter((i) => i.campo === field);
  const block = mine.find((i) => i.nivel === "bloqueo");
  if (block) return { estado: "bloqueado", motivo: block.motivo };
  const warn = mine.find((i) => i.nivel === "aviso");
  return warn ? { estado: "aviso", motivo: warn.motivo } : { estado: "disponible" };
}

// ===========================================================================
// NORMALIZE — lo que llega de un enlace (?d=), de localStorage o de un pedido
// viejo pasa SIEMPRE por aquí antes de usarse. Ids desconocidos → valor por
// defecto, y queda anotado como 'descontinuado' para la hoja del taller. No
// mira el stock: un pedido hecho con una pieza hoy agotada se respeta.
// ===========================================================================
export interface Descontinuado {
  campo: string;
  /** Lo que traía el enlace (como texto). */
  valor: string;
  /** Lo que se usa en su lugar. */
  usado: string;
}

export interface NormalizeReport {
  config: WatchConfig;
  descontinuado: Descontinuado[];
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const str = (x: unknown): string => (typeof x === "string" ? x : "");

function normSign(raw: unknown, campo: string, log: Descontinuado[]): OduSign | null {
  if (raw == null) return null;
  const drop = (): null => {
    log.push({ campo, valor: JSON.stringify(raw), usado: "sin signo" });
    return null;
  };
  if (!isObj(raw)) return drop();
  if (raw.tipo === "meyi") {
    const id = str(raw.oduId);
    return getOdu(id) ? { tipo: "meyi", oduId: id } : drop();
  }
  if (raw.tipo === "combinacion") {
    const d = str(raw.derecha);
    const i = str(raw.izquierda);
    if (!getOdu(d) || !getOdu(i)) return drop();
    // Las dos piernas iguales SON un Meyi: se guarda como tal (su nombre es fijo).
    if (d === i) return { tipo: "meyi", oduId: d };
    const nombre = cleanSignName(str(raw.nombre)).trim();
    if (nombre !== str(raw.nombre).trim()) log.push({ campo: `${campo}.nombre`, valor: str(raw.nombre), usado: nombre });
    return { tipo: "combinacion", derecha: d, izquierda: i, nombre };
  }
  return drop();
}

export function normalizeWithReport(raw: unknown): NormalizeReport {
  const log: Descontinuado[] = [];
  const r = isObj(raw) ? raw : {};
  const e = isObj(r.esfera) ? r.esfera : {};
  const pista = isObj(e.pista) ? e.pista : {};
  const t = isObj(r.tapa) ? r.tapa : {};
  const d = DEFAULT_WATCH;

  const pick = <T extends string>(campo: string, cat: PartCategory, value: unknown, fallback: T): T => {
    const v = str(value);
    if (getPart(cat, v)) return v as T;
    if (value !== undefined) log.push({ campo, valor: String(value), usado: fallback });
    return fallback;
  };
  const text = (campo: string, value: unknown, clean: (s: string) => string): string => {
    const v = str(value);
    const out = clean(v).trim();
    if (out !== v.trim()) log.push({ campo, valor: v, usado: out });
    return out;
  };

  let orisha: OrishaId | undefined;
  if (pista.orisha !== undefined) {
    if (isOrishaId(pista.orisha)) orisha = pista.orisha;
    else log.push({ campo: "esfera.pista.orisha", valor: String(pista.orisha), usado: "sin Orisha" });
  }
  let estilo = pick<TrackStyle>("esfera.pista.estilo", "pista", pista.estilo, orisha ? "cuentas" : "rayas");
  if (estilo === "cuentas" && !orisha) {
    log.push({ campo: "esfera.pista.estilo", valor: "cuentas (sin Orisha)", usado: "rayas" });
    estilo = "rayas";
  }

  // Enlaces anteriores a la Esfera Ifá no traen `modelo`: son la clásica.
  let modelo: DialModelId = "clasica";
  if (isDialModelId(e.modelo)) modelo = e.modelo;
  else if (e.modelo !== undefined) log.push({ campo: "esfera.modelo", valor: String(e.modelo), usado: "clasica" });

  const fechaRaw = str(t.fecha).trim();
  const fecha = fechaRaw && isValidFecha(fechaRaw) ? fechaRaw : undefined;
  if (fechaRaw && !fecha) log.push({ campo: "tapa.fecha", valor: fechaRaw, usado: "sin fecha" });

  const base = pick<DialBaseId>("esfera.base", "esfera", e.base, d.esfera.base);
  let degradado: DialGradientStep | undefined;
  if (getDialBase(base)?.degradado) {
    degradado = isGradientStep(e.degradado) ? e.degradado : DIAL_GRADIENT_DEFAULT;
    if (e.degradado !== undefined && degradado !== e.degradado)
      log.push({ campo: "esfera.degradado", valor: String(e.degradado), usado: String(degradado) });
  }

  const config: WatchConfig = {
    v: 1,
    caja: pick<CaseId>("caja", "caja", r.caja, d.caja),
    acabado: pick<FinishId>("acabado", "acabado", r.acabado, d.acabado),
    esfera: {
      modelo,
      base,
      ...(degradado ? { degradado } : {}),
      pista: orisha ? { estilo, orisha } : { estilo },
      texto: text("esfera.texto", e.texto, cleanDialText),
      signo: normSign(e.signo, "esfera.signo", log),
      signoPos: e.signoPos === "seis" || e.signoPos === "nueve" ? e.signoPos : DIAL_SIGN_DEFAULT_POS,
    },
    aplique: pick<AppliqueId>("aplique", "aplique", r.aplique, d.aplique),
    segundero: pick<SecondsId>("segundero", "segundero", r.segundero, d.segundero),
    correa: pick<StrapId>("correa", "correa", r.correa, d.correa),
    cierre: pick<ClaspId>("cierre", "cierre", r.cierre, d.cierre),
    tapa: {
      signo: normSign(t.signo, "tapa.signo", log),
      marcas: t.marcas === "libreta" ? "libreta" : "barras",
      linea1: text("tapa.linea1", t.linea1, cleanCasebackLine),
      linea2: text("tapa.linea2", t.linea2, cleanCasebackLine),
      ...(fecha ? { fecha } : {}),
      fuente: t.fuente === "fina" ? "fina" : "clasica",
    },
  };
  if (isPresetId(r.preset)) config.preset = r.preset;
  return { config, descontinuado: log };
}

/** normalizeWithReport() sin el informe. */
export function normalize(raw: unknown): WatchConfig {
  return normalizeWithReport(raw).config;
}

/** El reloj de un enlace /diseno?d=<código>, ya normalizado: la única puerta
 *  de un WatchConfig que viene de una URL. null si el código no se lee o no
 *  es de un reloj (anillo, moneda, basura). */
export function decodeWatchDesign(code: string): NormalizeReport | null {
  const p = decodeDesign(code);
  return p && isWatchPayload(p) ? normalizeWithReport(p.watch) : null;
}

// ===========================================================================
// CÓDIGO DE DISEÑO — "PY-R-7K3Q": solo para mostrar (pedido, hoja, WhatsApp).
// FNV-1a de 32 bits del JSON canónico (claves ordenadas, sin `preset`) → 4
// caracteres Crockford base32. Dos relojes iguales dan el mismo código venga
// de donde venga; NO es una clave única (20 bits) ni sirve para reconstruir el
// diseño: eso lo hace el enlace /diseno?d=.
// ===========================================================================
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** JSON con las claves ordenadas y sin valores undefined (estable). */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObj(value)) {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(s)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function designCode(c: WatchConfig): string {
  const { preset: _preset, ...watch } = c;
  const h = fnv1a32(canonicalJson(watch));
  let out = "";
  for (let i = 3; i >= 0; i--) out += CROCKFORD[(h >>> (i * 5)) & 31];
  return `PY-R-${out}`;
}

// ===========================================================================
// TEXTOS DEL PEDIDO — resumen de una línea y propiedades del carrito.
// ===========================================================================
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "Combinación: derecha Otura · izquierda Ika · nombre del cliente: «Otura Ika»" */
function describeSign(s: OduSign): string {
  if (s.tipo === "meyi") {
    const o = getOdu(s.oduId);
    return `${lucumiName(s.oduId) ?? s.oduId}${o ? ` (${o.name})` : ""}`;
  }
  return `Combinación: derecha ${lucumiLeg(s.derecha) ?? s.derecha} · izquierda ${
    lucumiLeg(s.izquierda) ?? s.izquierda
  } · nombre del cliente: «${s.nombre}»`;
}

/** "pista de cuentas de Orula (verde / amarillo)" · "rayas de Oshún" · "rayas lisas" */
export function describeTrack(c: WatchConfig): string {
  const { estilo, orisha } = c.esfera.pista;
  if (!orisha) return estilo === "cuentas" ? "pista de cuentas" : "rayas lisas";
  const seq = TRACK_SEQUENCES[orisha];
  const colores = [...new Set(seq.secuencia)].map((id) => lower(WATCH_COLORS[id].nombre)).join(" / ");
  const acento = seq.acento ? `, una rayada cada ${seq.acento.cada}` : "";
  return estilo === "cuentas"
    ? `pista de cuentas de ${orishaName(orisha)} (${colores}${acento})`
    : `rayas de ${orishaName(orisha)} (${colores})`;
}

const posLabel = (p: DialSignPos) => (p === "nueve" ? "a las 9" : "a las 6");

function strapLabel(c: WatchConfig): string {
  const s = getStrap(c.correa);
  if (!s) return c.correa;
  return s.tipo === "brazalete" ? `${s.label} · ${getFinish(c.acabado)?.label ?? c.acabado}` : s.label;
}

/** Una línea en español para el carrito y el resumen. */
export function summary(c: WatchConfig): string {
  const fin = getFinish(c.acabado)?.label ?? c.acabado;
  const base = dialBaseLabel(c.esfera);
  const ifa = c.esfera.modelo === "ifa" ? "Ifá con los 16 Meyis, " : "";
  const bits = [
    `Reloj octogonal 40 mm en ${lower(fin)}`,
    `esfera ${ifa}${lower(base)}, ${describeTrack(c)}`,
    c.esfera.texto ? `«${c.esfera.texto}»` : "sin texto",
  ];
  if (c.esfera.signo) bits.push(`signo ${signName(c.esfera.signo)} ${posLabel(c.esfera.signoPos)}`);
  bits.push(
    getAppliquePart(c.aplique)?.label ?? c.aplique,
    `segundero ${lower(getSecondsPart(c.segundero)?.label ?? c.segundero)}`,
    lower(strapLabel(c)),
  );
  const tapa = [
    c.tapa.signo ? signName(c.tapa.signo) : "",
    c.tapa.linea1,
    c.tapa.linea2,
    c.tapa.fecha ? formatFecha(c.tapa.fecha) : "",
  ].filter(Boolean);
  bits.push(tapa.length ? `tapa: ${tapa.join(" · ")}` : "tapa lisa");
  return bits.join(" · ");
}

export interface LineProperty {
  key: string;
  value: string;
}

/** Propiedades del artículo en el carrito / pedido de Shopify, en el orden en
 *  que las lee el taller. Las líneas de tapa vacías no se envían. `url` es el
 *  enlace SITE_URL/diseno?d=<código>; `politicaAceptada` la fecha (AAAA-MM-DD)
 *  en que el cliente marcó WATCH_CUSTOM_POLICY. */
export function lineProperties(
  c: WatchConfig,
  code: string,
  url: string,
  opts: { politicaAceptada?: string } = {},
): LineProperty[] {
  const fromPreset = c.preset ? ORISHA_WATCH_PRESETS[c.preset]?.orisha ?? undefined : undefined;
  const orisha = c.esfera.pista.orisha ?? fromPreset;
  const texto = c.esfera.texto;
  const canon = canonicalDialText(c.esfera);
  const modelo = c.esfera.modelo === "ifa" ? `${DIAL_MODELS.ifa.label} (los 16 Meyis) · ` : "";
  const props: LineProperty[] = [
    { key: "Diseño", value: code },
    { key: "Orisha", value: orisha ? orishaName(orisha) : "Personalizado" },
    { key: "Caja", value: `Octogonal 40 mm · ${getFinish(c.acabado)?.shopifyValue ?? c.acabado}` },
    { key: "Esfera", value: `${dialBaseLabel(c.esfera)} · ${modelo}${describeTrack(c)}` },
    {
      key: "Esfera · texto",
      value: texto ? `«${texto}»${canon && texto !== canon ? " · escrito por el cliente" : ""}` : "(sin texto)",
    },
    {
      key: "Esfera · signo",
      value: c.esfera.signo ? `${describeSign(c.esfera.signo)} · ${posLabel(c.esfera.signoPos)}` : "Sin signo",
    },
    { key: "Aplique", value: getAppliquePart(c.aplique)?.label ?? c.aplique },
    { key: "Segundero", value: getSecondsPart(c.segundero)?.label ?? c.segundero },
    { key: "Correa", value: strapLabel(c) },
    {
      key: "Cierre",
      value: getStrap(c.correa)?.tipo === "brazalete" ? "El del brazalete" : getClasp(c.cierre)?.label ?? c.cierre,
    },
    { key: "Tapa · signo", value: c.tapa.signo ? describeSign(c.tapa.signo) : "Sin signo" },
  ];
  if (c.tapa.signo) props.push({ key: "Tapa · marcas", value: c.tapa.marcas === "libreta" ? "Libreta I / 0" : "Barras I / II" });
  if (c.tapa.linea1) props.push({ key: "Tapa · línea 1", value: `«${c.tapa.linea1}»` });
  if (c.tapa.linea2) props.push({ key: "Tapa · línea 2", value: `«${c.tapa.linea2}»` });
  if (c.tapa.fecha) props.push({ key: "Tapa · fecha", value: formatFecha(c.tapa.fecha) });
  if (c.tapa.signo || c.tapa.linea1 || c.tapa.linea2 || c.tapa.fecha) {
    props.push({ key: "Tapa · fuente", value: c.tapa.fuente === "fina" ? "Fina" : "Clásica" });
  }
  if (opts.politicaAceptada) props.push({ key: "Política aceptada", value: `Sí · ${opts.politicaAceptada}` });
  props.push({ key: "🔗 Ver e imprimir el diseño", value: url });
  return props;
}

// ===========================================================================
// PRECIO — solo las variantes de Shopify llevan precio (Acabado × Correa
// [× Cierre]). Mientras no haya producto, todo devuelve null = "por confirmar".
// ===========================================================================
export interface WatchVariantLike {
  id: string;
  availableForSale?: boolean;
  price?: { amount: string; currencyCode: string } | null;
  selectedOptions?: readonly { name: string; value: string }[];
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/** La variante cuyas opciones coinciden con { Acabado, Correa[, Cierre] }.
 *  null si no hay producto, ni variantes, o ninguna coincide. */
export function variantFor<V extends WatchVariantLike>(
  c: WatchConfig,
  variants: readonly V[] | null | undefined,
): V | null {
  if (!variants?.length) return null;
  const want: Record<string, string | undefined> = {
    acabado: getFinish(c.acabado)?.shopifyValue,
    correa: getStrap(c.correa)?.shopifyValue,
    cierre: getClasp(c.cierre)?.shopifyValue,
  };
  return (
    variants.find((v) => {
      const opts = v.selectedOptions;
      if (!opts?.length) return false;
      const has = (name: string) => opts.find((o) => fold(o.name) === name);
      for (const name of ["acabado", "correa"]) {
        const o = has(name);
        if (!o || !want[name] || fold(o.value) !== fold(want[name]!)) return false;
      }
      const cierre = has("cierre");
      return !cierre || (!!want.cierre && fold(cierre.value) === fold(want.cierre));
    }) ?? null
  );
}

function priceOf(v: WatchVariantLike | null): number | null {
  const n = v?.price ? Number(v.price.amount) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Cuánto cambia el precio si se aplica `cambio` (la insignia "+$40" de una
 *  ficha). null = sin producto / sin variante / sin precio. */
export function priceDelta(
  c: WatchConfig,
  cambio: Partial<Pick<WatchConfig, "acabado" | "correa" | "cierre">>,
  variants: readonly WatchVariantLike[] | null | undefined,
): number | null {
  const now = priceOf(variantFor(c, variants));
  const next = priceOf(variantFor({ ...c, ...cambio }, variants));
  if (now === null || next === null) return null;
  return Math.round((next - now) * 100) / 100;
}

// ===========================================================================
// COPY — una sola fuente para cada texto. Solo herencia e identidad.
// Vive en lib/watch-copy.ts (módulo hoja, sin imports) para que /faq pueda
// usar una frase sin cargar todo el modelo del reloj en el navegador.
// ===========================================================================
export {
  WATCH_CUSTOM_POLICY,
  WATCH_RENDER_NOTE,
  WATCH_ODU_NOTE,
  WATCH_PROOF_NOTE,
  WATCH_IFA_NOTE,
  WATCH_LEAD_TIME_DAYS,
  watchLeadTimeLabel,
  WATCH_ORIGIN,
  WATCH_PRICE_TBD,
} from "./watch-copy";
