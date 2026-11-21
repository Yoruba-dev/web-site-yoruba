"use client";

import WatchFront from "@/components/watch/WatchFront";
import WatchStage3D, { useWebGL } from "./WatchStage3D";
import OptionGroup, { type OptionItem } from "./OptionGroup";
import { WATCH_RENDER_NOTE, type WatchConfig } from "@/lib/watch";

// ---------------------------------------------------------------------------
// El escenario del creador: el reloj de FRENTE que se va armando con cada
// elección (WatchFront, el compositor de capas fotográficas), con las vistas
// Frente / Tapa / Noche / 3D y la nota de render debajo. Este componente solo
// decide QUÉ se muestra; cómo se pinta es cosa de WatchFront (o, con "3D", de
// WatchStage3D, que descarga la escena 3D solo cuando se pide).
//
// UNA sola vista 3D en la página: en el resumen del escritorio la 3D va AQUÍ
// (el escenario grande; el resumen no monta otra) y en el del móvil va en el
// propio resumen, porque este escenario se oculta: aquí no se monta (`sin3d`).
// ---------------------------------------------------------------------------

export type StageView = "frente" | "tapa" | "noche" | "3d";

const VIEWS: readonly OptionItem<StageView>[] = [
  { id: "frente", label: "Frente" },
  { id: "tapa", label: "Tapa" },
  { id: "noche", label: "Noche" },
];
const VIEWS_3D: readonly OptionItem<StageView>[] = [...VIEWS, { id: "3d", label: "3D" }];

export default function WatchStage({
  config,
  view,
  onView,
  armar,
  code,
  sin3d = false,
  compacto = false,
}: {
  config: WatchConfig;
  view: StageView;
  onView: (v: StageView) => void;
  /** Animación de montaje: solo en la primera entrada. */
  armar: boolean;
  code: string;
  /** La 3D está en otro sitio de la página (resumen del móvil): aquí no. */
  sin3d?: boolean;
  /** Escenario pequeño (móvil): la 3D encuadra la cabeza del reloj. */
  compacto?: boolean;
}) {
  // El chip "3D" solo aparece si el navegador puede pintarlo.
  const webgl = useWebGL();
  const puede3d = webgl === true && !sin3d;
  const tres = view === "3d" && puede3d;
  return (
    <div className="pyj-reloj_stage">
      <div className={`pyj-reloj_stagebox${tres ? " is-3d" : ""}`}>
        {tres ? (
          <WatchStage3D config={config} compacto={compacto} className="pyj-reloj3d--stage" />
        ) : (
          <WatchFront
            config={config}
            vista={view === "tapa" ? "tapa" : "frente"}
            noche={view === "noche"}
            armar={armar}
            priority
            className="pyj-reloj_watch"
          />
        )}
        <span className="pyj-reloj_code" aria-label={`Código de diseño ${code}`}>
          {code}
        </span>
      </div>
      <div className="pyj-reloj_views">
        <OptionGroup<StageView>
          label="Vista del reloj"
          hideLabel
          variant="chips"
          value={tres || view !== "3d" ? view : "frente"}
          onChange={onView}
          options={puede3d ? VIEWS_3D : VIEWS}
        />
      </div>
      <p className="pyj-reloj_rendernote">{WATCH_RENDER_NOTE}</p>
    </div>
  );
}
