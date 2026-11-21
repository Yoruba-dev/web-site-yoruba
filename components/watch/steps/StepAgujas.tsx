"use client";

import OptionGroup from "../OptionGroup";
import { HandSwatch } from "../Swatches";
import { tileState, type StepProps } from "./types";
import {
  SECONDS,
  WATCH_COLORS,
  dialBaseHex,
  getFinish,
  isPartId,
  optionState,
  visibleParts,
  type SecondsId,
} from "@/lib/watch";

/** Paso 3 · Agujas: el color del segundero. Hora y minuto siguen el acabado. */
export default function StepAgujas({ config, dispatch }: StepProps) {
  const finish = getFinish(config.acabado);
  const metal = finish?.metalAgujas === "oro-rosa" ? "oro rosa" : "acero pulido";
  const dialHex = dialBaseHex(config.esfera.base);
  return (
    <>
      <p className="pyj-reloj_lead">
        Las agujas de hora y minuto van en {metal} con lume y siguen el acabado de tu caja: se ajustan solas. Tú
        eliges el color del segundero.
      </p>
      <OptionGroup<SecondsId>
        label="Color del segundero"
        hint="Incluido. Lo ves sobre tu esfera."
        value={config.segundero}
        onChange={(id) => isPartId("segundero", id) && dispatch({ type: "pieza", cat: "segundero", id })}
        options={visibleParts(SECONDS).map((s) => ({
          id: s.id,
          label: s.label,
          visual: <HandSwatch hex={WATCH_COLORS[s.color].hex} dialHex={dialHex} />,
          ...tileState(optionState(config, "segundero", s.id)),
        }))}
      />
    </>
  );
}
