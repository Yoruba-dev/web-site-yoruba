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
  type DialGradientStep,
  type DialModelId,
  type DialSignPos,
  type OduSign,
  type OrishaId,
  type PartCategory,
  type PresetId,
  type Tapa,
  type WatchConfig,
  type WatchField,
} from "../../lib/watch";

// ===========================================================================
// PASOS
// ===========================================================================
export type StepId = "caja" | "esfera" | "agujas" | "correa" | "tapa" | "resumen";

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
  { id: "agujas", label: "Agujas", titulo: "Las agujas" },
  { id: "correa", label: "Correa", titulo: "Tu correa" },
  { id: "tapa", label: "Tu tapa", titulo: "Tu tapa: el grabado al dorso" },
  { id: "resumen", label: "Resumen", titulo: "Tu reloj" },
];

export function isStepId(x: unknown): x is StepId {
  return typeof x === "string" && STEPS.some((s) => s.id === x);
}

export const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === id);

/** El paso donde se corrige cada campo (para los enlaces "Corregir"). */
export function stepOfField(f: WatchField): StepId {
  if (f === "caja" || f === "acabado") return "caja";
  if (f.startsWith("esfera.") || f === "aplique") return "esfera";
  if (f === "segundero") return "agujas";
  if (f === "correa" || f === "cierre") return "correa";
  return "tapa";
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
// ===========================================================================
export const DRAFT_KEY = "pyj-reloj-diseno";

export interface Draft {
  v: 1;
  config: WatchConfig;
  step: StepId;
  /** Date.now() del último cambio. */
  at: number;
}

/** Lee un borrador guardado (ya normalizado) o null. Nunca lanza. */
export function parseDraft(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<Draft> | null;
    if (!d || typeof d !== "object" || !d.config) return null;
    return {
      v: 1,
      config: normalize(d.config),
      step: isStepId(d.step) ? d.step : "caja",
      at: typeof d.at === "number" ? d.at : 0,
    };
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
