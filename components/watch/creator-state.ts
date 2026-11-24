// ---------------------------------------------------------------------------
// Estado del CREADOR DE RELOJES — el reducer y los datos de los pasos.
//
// Funciones puras, sin React ni DOM, y con imports RELATIVOS: así un script de
// node (tsx) puede recorrer todos los presets, editar cada paso y comprobar que
// el enlace ?d= devuelve exactamente el mismo reloj. Las reglas y el catálogo
// NO viven aquí: todo sale de lib/watch.ts (withPart, withDialModel,
// canonicalDialText, cleanDialText…). Esto solo traduce los gestos de la
// interfaz a esas funciones.
// ---------------------------------------------------------------------------
import {
  DIAL_GRADIENTS,
  DIAL_GRADIENT_STEPS,
  canonicalDialText,
  cleanCasebackLine,
  cleanDialText,
  isPartId,
  normalize,
  resolvePreset,
  withDialModel,
  withGradientStep,
  withPart,
  withStrapType,
  type DialGradientStep,
  type DialModelId,
  type DialSignPos,
  type OduSign,
  type OrishaId,
  type PartCategory,
  type PresetId,
  type StrapId,
  type StrapType,
  type Tapa,
  type WatchConfig,
  type WatchField,
} from "../../lib/watch";
import { ALL_GHOST, ALL_SOLID, WATCH_PARTS, type PartMask, type View3D, type WatchPart } from "./stage3d-contract";

// ===========================================================================
// PASOS — 4 pasos para armar el reloj + "Listo" (spec V2 §3.5). Las agujas
// viven dentro de la esfera (Esfera › Detalles).
// ===========================================================================
export type StepId = "caja" | "esfera" | "correa" | "tapa" | "resumen";

/** Sub-pestañas de los pasos que las tienen. */
export type SubId = "color" | "pista" | "texto" | "detalles" | "correa" | "cierre" | "signo" | "grabado";

export interface StepDef {
  id: StepId;
  /** Nombre corto (barra de pasos). */
  label: string;
  /** Título del panel. */
  titulo: string;
}

export const STEPS: readonly StepDef[] = [
  { id: "caja", label: "Caja", titulo: "El acabado de tu caja" },
  { id: "esfera", label: "Esfera", titulo: "Tu esfera" },
  { id: "correa", label: "Correa", titulo: "Tu correa" },
  { id: "tapa", label: "Tapa", titulo: "Tu tapa: el grabado al dorso" },
  { id: "resumen", label: "Listo", titulo: "Tu reloj está listo" },
];

/** Pasos que arman el reloj ("Paso N de 4"); el quinto es "Listo". */
export const BUILD_STEPS = 4;

export const SUBS: Readonly<Partial<Record<StepId, readonly SubId[]>>> = {
  esfera: ["color", "pista", "texto", "detalles"],
  // La correa y su cierre son piezas distintas (PLAN-REALISMO-V3 6.4).
  correa: ["correa", "cierre"],
  tapa: ["signo", "grabado"],
};

export const SUB_LABELS: Readonly<Record<SubId, string>> = {
  color: "Color",
  pista: "Pista",
  texto: "Texto",
  detalles: "Detalles",
  correa: "Correa",
  cierre: "Cierre",
  signo: "Signo",
  grabado: "Grabado",
};

export function isStepId(x: unknown): x is StepId {
  return typeof x === "string" && STEPS.some((s) => s.id === x);
}

export function isSubId(x: unknown): x is SubId {
  return typeof x === "string" && x in SUB_LABELS;
}

export const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === id);

/** Las sub-pestañas de un paso ([] si no tiene). */
export const subsOf = (step: StepId): readonly SubId[] => SUBS[step] ?? [];

/** La sub-pestaña válida para `step`: `sub` si es suya; si no, la primera
 *  (null en un paso sin sub-pestañas). */
export function fixSub(step: StepId, sub: SubId | null | undefined): SubId | null {
  const list = subsOf(step);
  if (!list.length) return null;
  return sub && list.includes(sub) ? sub : list[0];
}

/** El paso que vuelve REAL (sólida) cada pieza del reloj 3D. */
export const PART_STEP: Readonly<Record<WatchPart, StepId>> = {
  caja: "caja",
  esfera: "esfera",
  agujas: "esfera",
  correa: "correa",
  cierre: "correa",
  tapa: "tapa",
};

/** El encuadre de la cámara de cada paso. La correa se enseña por su CARA
 *  (vista 'correa'), no de canto: el canto queda en el botón "Correa entera". */
export const STEP_VIEW: Readonly<Record<StepId, View3D>> = {
  caja: "tres4",
  esfera: "esfera",
  correa: "correa",
  tapa: "tapa",
  resumen: "tres4",
};

/** El encuadre de un paso y su sub-pestaña (el cierre tiene el suyo). */
export function viewOf(step: StepId, sub: SubId | null | undefined): View3D {
  return sub === "cierre" ? "cierre" : STEP_VIEW[step];
}

// ===========================================================================
// PARADAS — lo que "Siguiente" recorre (PLAN-REALISMO-V3 6.2). Una parada es un
// paso sin sub-pestañas, o una sub-pestaña. "Siguiente" lleva a lo que falta
// por ver del paso y luego al paso siguiente; nunca bloquea (R5.2): la barra
// de pasos y "Pedir" siguen saltando a donde se quiera.
// ===========================================================================
export interface Stop {
  step: StepId;
  sub: SubId | null;
}

/** "esfera:pista", "caja": la clave de una parada (para lo ya visto). */
export const stopKey = (step: StepId, sub: SubId | null | undefined): string => (sub ? `${step}:${sub}` : step);

/** Todas las paradas, en orden. */
export const STOPS: readonly Stop[] = STEPS.flatMap((s): Stop[] => {
  const subs = subsOf(s.id);
  return subs.length ? subs.map((sub) => ({ step: s.id, sub })) : [{ step: s.id, sub: null }];
});

/** Las paradas de los pasos con índice ≤ `max` (un borrador sin `seen`, o un
 *  enlace compartido: todo visto). */
export function stopsUpTo(max: number): string[] {
  return STOPS.filter((x) => stepIndex(x.step) <= max).map((x) => stopKey(x.step, x.sub));
}

/** A dónde lleva "Siguiente": primero lo que falta por ver de ESTE paso (lo
 *  que va después y luego lo que quedó atrás); si no falta nada, el paso
 *  siguiente, en su primera sub-pestaña sin ver. null = ya es el último. */
export function nextStop(step: StepId, sub: SubId | null, seen: ReadonlySet<string>): Stop | null {
  const subs = subsOf(step);
  const k = sub ? subs.indexOf(sub) : -1;
  const falta = [...subs.slice(k + 1), ...subs.slice(0, Math.max(0, k))].find((s) => !seen.has(stopKey(step, s)));
  if (falta) return { step, sub: falta };
  const sig = STEPS[stepIndex(step) + 1];
  if (!sig) return null;
  const suyas = subsOf(sig.id);
  return { step: sig.id, sub: suyas.find((s) => !seen.has(stopKey(sig.id, s))) ?? suyas[0] ?? null };
}

/** A dónde lleva "‹": la parada anterior, en orden (null = la primera). */
export function prevStop(step: StepId, sub: SubId | null): Stop | null {
  const i = STOPS.findIndex((x) => x.step === step && x.sub === sub);
  return i > 0 ? STOPS[i - 1] : null;
}

/** Qué piezas son reales: las de los pasos ya alcanzados (índice ≤ `max`), o
 *  todas con `todo` ("Ver completo", un enlace compartido). max = -1 → todo en
 *  cristal (la entrada). */
export function confirmedMask(max: number, todo: boolean): PartMask {
  if (todo) return ALL_SOLID;
  const out = { ...ALL_GHOST } as Record<WatchPart, boolean>;
  for (const p of WATCH_PARTS) out[p] = stepIndex(PART_STEP[p]) <= max;
  return out;
}

/** Dónde se corrige cada campo (los enlaces "Corregir" y los puntos de la
 *  barra de pasos): el paso y su sub-pestaña. */
export function stepOfField(f: WatchField): { step: StepId; sub: SubId | null } {
  switch (f) {
    case "caja":
    case "acabado":
      return { step: "caja", sub: null };
    case "esfera.modelo":
    case "esfera.base":
      return { step: "esfera", sub: "color" };
    case "esfera.pista":
      return { step: "esfera", sub: "pista" };
    case "esfera.texto":
    case "esfera.signo":
      return { step: "esfera", sub: "texto" };
    case "aplique":
    case "segundero":
      return { step: "esfera", sub: "detalles" };
    case "correa":
      return { step: "correa", sub: "correa" };
    case "cierre":
      return { step: "correa", sub: "cierre" };
    case "tapa.signo":
      return { step: "tapa", sub: "signo" };
    case "tapa.linea1":
    case "tapa.linea2":
    case "tapa.fecha":
      return { step: "tapa", sub: "grabado" };
  }
}

// ===========================================================================
// ACCIONES
// ===========================================================================
export type CreatorAction =
  /** Carga un reloj entero (de ?d=, de localStorage): siempre normalizado. */
  | { type: "cargar"; config: unknown }
  | { type: "preset"; id: PresetId }
  /** Una pieza del catálogo; 'pista' cambia el estilo (cuentas / rayas). */
  | { type: "pieza"; cat: PartCategory; id: string }
  /** Tarjeta de tipo de correa: cambia de tipo en un gesto (withStrapType);
   *  `recordado` = la correa que el cliente llevaba antes en ese tipo. */
  | { type: "tipoCorrea"; tipo: StrapType; recordado?: StrapId }
  | { type: "modelo"; modelo: DialModelId }
  /** Dónde cambia el color de una esfera de degradado (1–5). */
  | { type: "degradado"; paso: DialGradientStep }
  /** De qué Orisha son los colores de la pista (null = rayas lisas). */
  | { type: "pistaOrisha"; orisha: OrishaId | null }
  | { type: "texto"; texto: string }
  /** Vuelve al texto canónico de la esfera ("ORULA", "IFÁ"…). */
  | { type: "textoCanonico" }
  | { type: "esferaSigno"; signo: OduSign | null }
  | { type: "signoPos"; pos: DialSignPos }
  | { type: "tapaSigno"; signo: OduSign | null }
  | { type: "tapaMarcas"; marcas: Tapa["marcas"] }
  | { type: "tapaLinea"; linea: 1 | 2; texto: string }
  | { type: "tapaFecha"; fecha: string }
  | { type: "tapaFuente"; fuente: Tapa["fuente"] };

/** El reducer del creador. Inmutable; una acción que no aplica devuelve `c`. */
export function creatorReducer(c: WatchConfig, a: CreatorAction): WatchConfig {
  switch (a.type) {
    case "cargar":
      return normalize(a.config);

    case "preset":
      return resolvePreset(a.id);

    case "pieza":
      return isPartId(a.cat, a.id) ? withPart(c, a.cat, a.id) : c;

    case "tipoCorrea":
      return withStrapType(c, a.tipo, a.recordado);

    case "modelo":
      return withDialModel(c, a.modelo);

    case "degradado":
      return withGradientStep(c, a.paso);

    case "pistaOrisha": {
      const { estilo } = c.esfera.pista;
      const pista = a.orisha
        ? { estilo, orisha: a.orisha }
        : // Sin Orisha no hay de dónde sacar los colores de las cuentas.
          { estilo: estilo === "cuentas" ? ("rayas" as const) : estilo };
      const next = { ...c.esfera, pista };
      // El texto canónico sigue al Orisha ("CHANGÓ" → "OSHÚN"); un texto
      // escrito por el cliente (o "sin texto" elegido a propósito) se respeta.
      const wasCanon = c.esfera.texto === (canonicalDialText(c.esfera) ?? "");
      return {
        ...c,
        esfera: { ...next, texto: wasCanon ? canonicalDialText(next) ?? "" : c.esfera.texto },
      };
    }

    case "texto":
      return { ...c, esfera: { ...c.esfera, texto: cleanDialText(a.texto) } };

    case "textoCanonico":
      return { ...c, esfera: { ...c.esfera, texto: canonicalDialText(c.esfera) ?? "" } };

    case "esferaSigno":
      // La Esfera Ifá ya lleva los 16 Meyis: el signo personal va en la tapa
      // (regla 'signo-esfera-ifa'). La interfaz no lo ofrece; esto lo blinda.
      if (a.signo && c.esfera.modelo === "ifa") return c;
      return { ...c, esfera: { ...c.esfera, signo: a.signo } };

    case "signoPos":
      return { ...c, esfera: { ...c.esfera, signoPos: a.pos } };

    case "tapaSigno":
      return { ...c, tapa: { ...c.tapa, signo: a.signo } };

    case "tapaMarcas":
      return { ...c, tapa: { ...c.tapa, marcas: a.marcas } };

    case "tapaLinea": {
      const texto = cleanCasebackLine(a.texto);
      return { ...c, tapa: a.linea === 1 ? { ...c.tapa, linea1: texto } : { ...c.tapa, linea2: texto } };
    }

    case "tapaFecha": {
      const { fecha: _old, ...rest } = c.tapa;
      const fecha = a.fecha.trim();
      return { ...c, tapa: fecha ? { ...rest, fecha } : rest };
    }

    case "tapaFuente":
      return { ...c, tapa: { ...c.tapa, fuente: a.fuente } };
  }
}

// ===========================================================================
// AUTOGUARDADO — un solo borrador por navegador (localStorage, con try/catch).
// v2 guarda también la sub-pestaña y hasta dónde se armó el reloj (`max`), así
// recargar devuelve el mismo paso con las mismas piezas en cristal. Un
// borrador v1 (6 pasos, con "agujas") se migra: agujas → Esfera › Detalles.
// ===========================================================================
export const DRAFT_KEY = "pyj-reloj-diseno";

export interface Draft {
  v: 2;
  config: WatchConfig;
  step: StepId;
  sub: SubId | null;
  /** Índice del paso más alto alcanzado (−1 = ninguno). */
  max: number;
  /** Paradas ya vistas (stopKey): los aros "sin ver" de las sub-pestañas. Un
   *  borrador anterior no lo trae: se dan por vistos sus pasos alcanzados. */
  seen?: string[];
  /** Date.now() del último cambio. */
  at: number;
}

/** Lee un borrador guardado (v2, o v1 migrado; ya normalizado) o null. Nunca lanza. */
export function parseDraft(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Record<string, unknown> | null;
    if (!d || typeof d !== "object" || !d.config) return null;
    const config = normalize(d.config);
    const at = typeof d.at === "number" ? d.at : 0;
    // v1: 6 pasos; "agujas" vive ahora en Esfera › Detalles.
    const rawStep = d.step === "agujas" ? "esfera" : d.step;
    const step: StepId = isStepId(rawStep) ? rawStep : "caja";
    const sub = d.step === "agujas" ? "detalles" : fixSub(step, isSubId(d.sub) ? d.sub : null);
    const top = STEPS.length - 1;
    const max =
      d.v === 2 && typeof d.max === "number" && Number.isFinite(d.max)
        ? Math.max(stepIndex(step), Math.min(top, Math.round(d.max)))
        : stepIndex(step);
    const claves = new Set(STOPS.map((x) => stopKey(x.step, x.sub)));
    const seen = Array.isArray(d.seen)
      ? d.seen.filter((x): x is string => typeof x === "string" && claves.has(x))
      : stopsUpTo(max);
    return { v: 2, config, step, sub, max, seen, at };
  } catch {
    return null;
  }
}

// ===========================================================================
// CAPAS FOTOGRÁFICAS — las mismas que usa el escenario (plantilla 1200×1600 /
// 600×800, centro de la esfera en el centro). Aquí solo se usan como
// miniaturas de las fichas; el escenario es de components/watch/WatchFront.
// ===========================================================================
const CAPAS = "/assets/images/reloj/capas";

/** Capas que existen en public/ (las fichas sin capa caen a la muestra). */
const KNOWN_LAYERS = new Set([
  "caja-acero",
  "caja-pvd-negro",
  "caja-oro-rosa",
  "brazalete-acero",
  "brazalete-pvd-negro",
  "brazalete-oro-rosa",
  "esfera-blanco",
  "esfera-negro",
  "esfera-rojo",
  "esfera-verde",
  "esfera-azul",
  "esfera-amarillo",
  ...DIAL_GRADIENTS.flatMap((g) => DIAL_GRADIENT_STEPS.map((n) => `esfera-degradado-${g.key}-p${n}`)),
  ...["negro", "gris", "blanco", "azul-marino", "azul", "naranja", "verde", "rojo", "tan"].map((c) => `correa-caucho-${c}`),
  ...["verde", "rojo", "azul-marino"].flatMap((c) =>
    ["acero", "pvd-negro", "oro-rosa"].map((f) => `correa-piel-${c}-${f}`),
  ),
]);

/** URL de una capa a 600 px, o undefined si esa pieza aún no tiene foto. */
export function layerUrl(name: string): string | undefined {
  return KNOWN_LAYERS.has(name) ? `${CAPAS}/${name}-600.webp` : undefined;
}

/** Nombre de la capa de una correa con el acabado de la caja (la piel trae los
 *  terminales en el acabado; el brazalete ES del acabado). */
export function strapLayerName(strapId: string, acabado: string): string {
  if (strapId === "brazalete") return `brazalete-${acabado}`;
  if (strapId.startsWith("piel-")) return `correa-${strapId}-${acabado}`;
  return `correa-${strapId}`;
}

// ===========================================================================
// VITRINA — las imágenes pequeñas de las muestras (scripts/gen-vitrina.py, de
// nuestras capas). Solo las pide el paso que las enseña.
// ===========================================================================
const VITRINA = "/assets/images/reloj/vitrina";

/** Piezas de la vitrina que existen (las que tienen capa). */
const tieneVitrina = (nombre: string) => KNOWN_LAYERS.has(nombre);

/** La punta de una correa, de pie (la piel lleva su terminal en el acabado; el
 *  brazalete ES del acabado), o undefined si aún no tiene foto. */
export function vitrinaCorrea(strapId: string, acabado: string): string | undefined {
  if (!tieneVitrina(strapLayerName(strapId, acabado))) return undefined;
  if (strapId === "brazalete") return `${VITRINA}/brazalete-${acabado}.webp`;
  if (strapId.startsWith("piel-")) return `${VITRINA}/${strapId}-${acabado}.webp`;
  return `${VITRINA}/${strapId}.webp`;
}

/** El macro del material de una correa (tarjetas de Tipo, mismo encuadre). */
export function vitrinaTipo(strapId: string, acabado: string): string | undefined {
  if (!tieneVitrina(strapLayerName(strapId, acabado))) return undefined;
  return `${VITRINA}/tipo-${strapId === "brazalete" ? `brazalete-${acabado}` : strapId}.webp`;
}

/** Los índices sueltos (sin el aplique PY), para ponerlos sobre una capa. */
export function vitrinaIndices(ifa: boolean): string {
  return `${VITRINA}/indices${ifa ? "-ifa" : ""}-sin.svg`;
}

/** Las tres imágenes del mini reloj (de arriba abajo): índices, caja, esfera.
 *  `paso` = el ajuste del degradado (solo con una base de degradado).
 *  undefined = esa esfera aún no tiene foto. */
export function vitrinaMini(
  base: string,
  acabado: string,
  opts: { ifa?: boolean; paso?: number } = {},
): { indices: string; caja: string; dial: string } | undefined {
  if (!tieneVitrina(`esfera-${base}${base.startsWith("degradado-") ? "-p3" : ""}`)) return undefined;
  return {
    indices: `${VITRINA}/${opts.ifa ? "indices-ifa" : "indices"}.svg`,
    caja: `${VITRINA}/caja-${acabado}.webp`,
    dial: `${VITRINA}/dial-${base}${base.startsWith("degradado-") ? `-p${opts.paso ?? 3}` : ""}.webp`,
  };
}
