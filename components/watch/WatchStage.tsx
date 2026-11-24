"use client";

// ---------------------------------------------------------------------------
// El escenario del creador (spec V2 §4.8 / §4.10). El reloj 3D es la vista
// PRINCIPAL; la foto real (el compositor de capas, WatchFront) es la opción
// "Foto real", el póster mientras la 3D carga y la vista de siempre sin WebGL
// o en un equipo modesto. Las dos enseñan la MISMA máscara de cristal.
//
//   • support "completo" → se monta WatchStage3D (UN lienzo por página; "Foto
//     real" solo lo pone en pausa: active=false, el contexto se conserva).
//   • "ligero" → foto + "Ver en 3D" (se monta al pedirlo).
//   • "no" → solo foto.
// La foto se queda ENCIMA del visor hasta que este dice "listo" y entonces se
// funde (400 ms): el cambio del póster de servidor al lienzo no parpadea.
// Los controles (chips, dock, hoja) los pone el editor como hijos.
// ---------------------------------------------------------------------------
import { useState, type ReactNode, type Ref } from "react";
import WatchFront from "./WatchFront";
import { WatchStage3D } from "./shell/stage3d";
import type {
  PartMask,
  Stage3DMode,
  Stage3DStatus,
  View3D,
  ViewInsets,
  WatchPart,
  WatchStage3DHandle,
} from "./stage3d-contract";
import type { WatchConfig } from "@/lib/watch";

/** El reloj de foto, encajado en el rectángulo que la interfaz deja libre. */
function PhotoFit({ insets, children }: { insets: ViewInsets; children: ReactNode }) {
  return (
    <div className="rl-fit" style={{ top: insets.top, right: insets.right, bottom: insets.bottom, left: insets.left }}>
      {children}
    </div>
  );
}

export interface WatchStageProps {
  config: WatchConfig;
  mask: PartMask;
  mode: Stage3DMode;
  view: View3D;
  viewSeq: number;
  noche: boolean;
  /** Montar el visor 3D (support "completo" o pedido por el cliente). */
  mount3d: boolean;
  /** La foto real delante (el visor, en pausa). */
  foto: boolean;
  fotoVista: "frente" | "tapa";
  insets: ViewInsets;
  status: Stage3DStatus;
  onStatus: (s: Stage3DStatus) => void;
  onPartPick?: (p: WatchPart) => void;
  onPartHover?: (p: WatchPart | null, x: number, y: number) => void;
  onViewRequest?: (v: View3D) => void;
  onInteract?: () => void;
  stage3dRef?: Ref<WatchStage3DHandle>;
  stageRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

export default function WatchStage({
  config,
  mask,
  mode,
  view,
  viewSeq,
  noche,
  mount3d,
  foto,
  fotoVista,
  insets,
  status,
  onStatus,
  onPartPick,
  onPartHover,
  onViewRequest,
  onInteract,
  stage3dRef,
  stageRef,
  children,
}: WatchStageProps) {
  // Una vez montado, el visor no se desmonta (se conserva el contexto WebGL).
  const [montado, setMontado] = useState(mount3d);
  if (mount3d && !montado) setMontado(true);

  const sin3d = !montado || status === "sin-3d";
  const tres = !sin3d && !foto;
  // La foto va delante: sin 3D, con "Foto real", o mientras la 3D carga.
  const fotoDelante = sin3d || foto || status === "cargando";
  const vista = tres ? "frente" : fotoVista;

  return (
    <div ref={stageRef} className="rl-stage" data-tres={tres ? "" : undefined}>
      {montado && (
        <div className={`rl-stage_3d${foto || status === "sin-3d" ? " is-hidden" : ""}`}>
          <WatchStage3D
            ref={stage3dRef}
            config={config}
            confirmed={mask}
            view={view}
            viewSeq={viewSeq}
            noche={noche}
            mode={mode}
            active={tres}
            insets={insets}
            // Mientras la foto del editor va delante (carga, "Foto real"), el
            // visor no pinta su propio póster: dos fotos casi iguales una sobre
            // otra se verían dobles en las piezas en cristal. Con error o
            // contexto perdido, la foto del editor se aparta y el póster es
            // el del visor (con su mensaje).
            poster={
              fotoDelante ? null : (
                <PhotoFit insets={insets}>
                  <WatchFront config={config} fantasma={mask} noche={noche} className="rl-watch" />
                </PhotoFit>
              )
            }
            onStatus={onStatus}
            onPartPick={onPartPick}
            onPartHover={onPartHover}
            onViewRequest={onViewRequest}
            onInteract={onInteract}
          />
        </div>
      )}
      <div className={`rl-stage_photo${fotoDelante ? "" : " is-gone"}`} aria-hidden={!fotoDelante || undefined}>
        <PhotoFit insets={insets}>
          <WatchFront
            config={config}
            vista={vista}
            noche={noche}
            fantasma={mask}
            priority
            className="rl-watch"
          />
        </PhotoFit>
      </div>
      {children}
    </div>
  );
}
