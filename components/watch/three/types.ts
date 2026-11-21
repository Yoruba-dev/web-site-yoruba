// Tipos compartidos entre la vista 3D (diferida) y su envoltorio. Sin three:
// el envoltorio los importa solo como tipos.
import type { WatchConfig } from "@/lib/watch";

/** Encuadres de la cámara: perspectiva (3/4, el de presentación), de frente,
 *  de perfil (el lado de la corona) y la tapa. */
export type Vista3D = "tres4" | "frente" | "perfil" | "tapa";

export interface WatchSceneProps {
  config: WatchConfig;
  vista: Vista3D;
  /** Sube cada vez que se pulsa un encuadre (aunque sea el mismo). */
  vistaSeq: number;
  /** Un paso de giro pedido con el teclado (radianes de acimut y polar). */
  nudge?: { seq: number; az: number; pol: number };
  noche: boolean;
  /** Sube cada vez que se pide "Descargar foto". */
  fotoSeq: number;
  /** Giro de presentación al abrir (se para al primer gesto). */
  intro?: boolean;
  /** Encuadre de la cabeza (el escenario pequeño del móvil). */
  compacto?: boolean;
  onReady?: () => void;
  /** La foto de estudio (JPEG) o null si no se pudo. */
  onFoto?: (img: Blob | null) => void;
  onContextLost?: () => void;
  /** El cliente tocó el reloj (para dejar de mostrar pistas). */
  onInteract?: () => void;
}
