// Tipos compartidos entre la escena 3D (diferida) y su envoltorio
// (components/watch/WatchStage3D.tsx). Sin three: el envoltorio los importa
// solo como tipos. El contrato con el editor vive en ../stage3d-contract.ts.
import type { WatchConfig } from "@/lib/watch";
import type { CaptureOptions, PartMask, Stage3DMode, View3D, ViewInsets, WatchPart } from "../stage3d-contract";

/** Un paso pedido con el teclado sobre el visor (flechas, + y −). */
export interface Nudge {
  seq: number;
  /** Radianes de acimut y de ángulo polar. */
  az: number;
  pol: number;
  /** Factor de distancia (1 = sin cambio; 0.85 acerca, 1.18 aleja). */
  zoom: number;
}

/** Los recuadros tapados por la interfaz, leídos sin volver a pintar React
 *  (el editor los cambia hasta una vez por fotograma al arrastrar la hoja). */
export interface InsetsSource {
  get(): ViewInsets;
  subscribe(fn: () => void): () => void;
}

/** Lo que la escena ofrece hacia fuera (la foto de estudio). */
export interface SceneApi {
  capture(opts?: CaptureOptions): Promise<Blob | null>;
}

export interface WatchSceneProps {
  config: WatchConfig;
  confirmed: PartMask;
  view: View3D;
  /** Sube con cada encuadre pedido (aunque se repita). */
  viewSeq: number;
  noche: boolean;
  mode: Stage3DMode;
  /** false = "Foto real" delante: no se pinta nada (el contexto se conserva). */
  active: boolean;
  insets: InsetsSource;
  nudge: Nudge;
  /** Primer fotograma completo (texturas pintadas). */
  onReady?: () => void;
  onContextLost?: () => void;
  onInteract?: () => void;
  onPartPick?: (p: WatchPart) => void;
  onPartHover?: (p: WatchPart | null, x: number, y: number) => void;
  /** La escena entrega su API al montarse (y null al desmontarse). */
  onApi?: (api: SceneApi | null) => void;
}
