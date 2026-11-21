"use client";

import WatchFront from "@/components/watch/WatchFront";
import OptionGroup from "./OptionGroup";
import { WATCH_RENDER_NOTE, type WatchConfig } from "@/lib/watch";

// ---------------------------------------------------------------------------
// El escenario del creador: el reloj de FRENTE que se va armando con cada
// elección (WatchFront, el compositor de capas fotográficas), con las vistas
// Frente / Tapa / Noche y la nota de render debajo. Este componente solo
// decide QUÉ se muestra; cómo se pinta es cosa de WatchFront.
// ---------------------------------------------------------------------------

export type StageView = "frente" | "tapa" | "noche";

export default function WatchStage({
  config,
  view,
  onView,
  armar,
  code,
}: {
  config: WatchConfig;
  view: StageView;
  onView: (v: StageView) => void;
  /** Animación de montaje: solo en la primera entrada. */
  armar: boolean;
  code: string;
}) {
  return (
    <div className="pyj-reloj_stage">
      <div className="pyj-reloj_stagebox">
        <WatchFront
          config={config}
          vista={view === "tapa" ? "tapa" : "frente"}
          noche={view === "noche"}
          armar={armar}
          priority
          className="pyj-reloj_watch"
        />
        <span className="pyj-reloj_code" aria-label={`Código de diseño ${code}`}>
          {code}
        </span>
      </div>
      <div className="pyj-reloj_views">
        <OptionGroup<StageView>
          label="Vista del reloj"
          hideLabel
          variant="chips"
          value={view}
          onChange={onView}
          options={[
            { id: "frente", label: "Frente" },
            { id: "tapa", label: "Tapa" },
            { id: "noche", label: "Noche" },
          ]}
        />
      </div>
      <p className="pyj-reloj_rendernote">{WATCH_RENDER_NOTE}</p>
    </div>
  );
}
