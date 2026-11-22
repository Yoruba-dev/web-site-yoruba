// CONTRATO CONGELADO entre la interfaz del editor (constructor B) y el escenario
// 3D (constructor A). Spec: design-assets/creador-relojes/SPEC-EDITOR-V2.md §5.
// Solo tipos y constantes: nada de three, React solo como tipos.
import type { ReactNode, Ref } from "react";
import type { WatchConfig } from "@/lib/watch";

/** Las seis piezas que pueden estar "en cristal" (fantasma) o reales. */
export type WatchPart = "caja" | "esfera" | "agujas" | "correa" | "cierre" | "tapa";

export const WATCH_PARTS: readonly WatchPart[] = ["caja", "esfera", "agujas", "correa", "cierre", "tapa"];

/** true = pieza real (sólida); false = cristal (fantasma). */
export type PartMask = Readonly<Record<WatchPart, boolean>>;

export const ALL_SOLID: PartMask = { caja: true, esfera: true, agujas: true, correa: true, cierre: true, tapa: true };
export const ALL_GHOST: PartMask = { caja: false, esfera: false, agujas: false, correa: false, cierre: false, tapa: false };

/** "101100" — para comparar máscaras sin depender de la identidad del objeto. */
export function maskKey(m: PartMask): string {
  return WATCH_PARTS.map((p) => (m[p] ? "1" : "0")).join("");
}

/** Encuadres de la cámara. 'cierre' solo lo pide el editor (al elegir cierre). */
export type View3D = "tres4" | "lado" | "esfera" | "tapa" | "cierre";

/** Movimiento propio del escenario: giro en la entrada, quieto al editar,
 *  una vuelta de presentación al llegar a "Listo". */
export type Stage3DMode = "entrada" | "editor" | "final";

/** Píxeles del lienzo tapados por la interfaz (chips, dock, hoja): el reloj se
 *  encuadra en el rectángulo que queda libre. */
export interface ViewInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export const NO_INSETS: ViewInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Estado del visor, para que el editor adapte el dock. */
export type Stage3DStatus = "cargando" | "listo" | "sin-3d" | "error" | "pausado";

/** Qué puede pintar este dispositivo. */
export type Support3D = "completo" | "ligero" | "no";

export interface CaptureOptions {
  /** Paneles de izquierda a derecha. Por defecto ["tres4", "tapa"]. */
  views?: readonly View3D[];
  /** Lado de cada panel en px. Por defecto 1600 (1200 en táctil). */
  size?: number;
  /** Pasadas de supermuestreo. Por defecto 8 (4 en táctil). */
  ssaa?: 1 | 4 | 8;
  /** Calidad JPEG 0–1. Por defecto 0.92. */
  quality?: number;
}

export interface WatchStage3DHandle {
  /** Foto de estudio JPEG del reloj ACTUAL con TODAS las piezas reales (ignora
   *  la máscara), correa cerrada salvo en 'tapa' (abierta). null si la 3D no
   *  está lista o falla. Nunca rechaza. */
  capture(opts?: CaptureOptions): Promise<Blob | null>;
}

export interface WatchStage3DProps {
  /** El reloj normalizado (referencia estable entre renders sin cambios). */
  config: WatchConfig;
  /** Qué piezas son reales. Los cambios se animan (§4.4). */
  confirmed: PartMask;
  /** Encuadre pedido; se aplica cada vez que cambia viewSeq. */
  view: View3D;
  viewSeq: number;
  noche: boolean;
  mode: Stage3DMode;
  /** false = la vista "Foto real" está delante: no pintar, conservar el contexto. */
  active: boolean;
  /** Zona tapada por la interfaz (actualizar como mucho 1 vez por fotograma). */
  insets: ViewInsets;
  /** Lo que se ve debajo mientras carga y si no hay 3D (el compositor de fotos
   *  con la misma máscara). */
  poster: ReactNode;
  className?: string;
  ref?: Ref<WatchStage3DHandle>;
  onStatus?: (s: Stage3DStatus) => void;
  /** Toque (sin arrastre) sobre una pieza, real o en cristal. */
  onPartPick?: (p: WatchPart) => void;
  /** Teclas 1–4 con el visor enfocado. */
  onViewRequest?: (v: View3D) => void;
  /** Primer gesto del cliente sobre el visor (para ocultar pistas). */
  onInteract?: () => void;
}
