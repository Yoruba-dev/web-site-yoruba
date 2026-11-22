"use client";

import OptionGroup from "../OptionGroup";
import { LayerThumb, swatchHex } from "../Swatches";
import { layerUrl } from "../creator-state";
import { tileState, type StepProps } from "./types";
import { previewPart } from "./preview";
import { FINISHES, WATCH_SPECS, getStrap, isPartId, optionState, visibleParts, type FinishId } from "@/lib/watch";
import { nombresCapas } from "@/lib/watch-capas";

/** Paso 1 · Caja: el acabado (Acero, Negro PVD, Oro rosa). La forma es una sola. */
export default function StepCaja({ config, dispatch }: StepProps) {
  const brazalete = getStrap(config.correa)?.tipo === "brazalete";
  return (
    <>
      <p className="rl-lead">
        Caja octogonal de {WATCH_SPECS.caseMm} mm en acero 316L, automática. Elige el acabado.
      </p>
      <OptionGroup<FinishId>
        label="Acabado"
        variant="tiles"
        columns={3}
        field="acabado"
        hint={brazalete ? "Tu brazalete va en el mismo acabado." : undefined}
        value={config.acabado}
        onChange={(id) => isPartId("acabado", id) && dispatch({ type: "pieza", cat: "acabado", id })}
        onPreview={(id) => previewPart(config, "acabado", id)}
        options={visibleParts(FINISHES).map((f) => ({
          id: f.id,
          label: f.label,
          visual: (
            <LayerThumb
              crop="caja"
              layers={[layerUrl(`caja-${f.id}`), layerUrl(nombresCapas(config).esfera)]}
              fallbackHex={swatchHex(f.swatch)}
            />
          ),
          ...tileState(optionState(config, "acabado", f.id)),
        }))}
      />
    </>
  );
}
