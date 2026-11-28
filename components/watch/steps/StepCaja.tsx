"use client";

import OptionGroup from "../OptionGroup";
import { CajaMuestra, swatchHex } from "../Swatches";
import { layerUrl, vitrinaIndices } from "../creator-state";
import { tileState, type StepProps } from "./types";
import { previewPart } from "./preview";
import { FINISHES, WATCH_SPECS, getStrap, isPartId, optionState, visibleParts, type FinishId } from "@/lib/watch";
import { apliqueUrl, nombresCapas } from "@/lib/watch-capas";

/** Paso 1 · Caja: el acabado (Acero, Negro PVD, Oro rosa). La forma es una sola.
 *  En la vitrina, como la correa y la esfera: tu reloj en cada acabado. */
export default function StepCaja({ config, dispatch }: StepProps) {
  const brazalete = getStrap(config.correa)?.tipo === "brazalete";
  const esfera = layerUrl(nombresCapas(config).esfera);
  const indices = vitrinaIndices(config.esfera.modelo === "ifa");
  return (
    <>
      <p className="rl-lead">
        Caja octogonal de {WATCH_SPECS.caseMm} mm en acero 316L, automática. Elige el acabado.
      </p>
      <OptionGroup<FinishId>
        label="Acabado"
        variant="vitrina"
        columns={3}
        className="rl-vit--caja"
        field="acabado"
        hint={brazalete ? "Tu brazalete va en el mismo acabado." : undefined}
        value={config.acabado}
        onChange={(id) => isPartId("acabado", id) && dispatch({ type: "pieza", cat: "acabado", id })}
        onPreview={(id) => void previewPart(config, "acabado", id)}
        options={visibleParts(FINISHES).map((f) => ({
          id: f.id,
          label: f.label,
          visual: (
            <CajaMuestra
              capas={[apliqueUrl(nombresCapas(config).aplique, 600), indices, layerUrl(`caja-${f.id}`), esfera]}
              hex={swatchHex(f.swatch)}
              esfera={config.esfera}
            />
          ),
          ...tileState(optionState(config, "acabado", f.id)),
        }))}
      />
    </>
  );
}
