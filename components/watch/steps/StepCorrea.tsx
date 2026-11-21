"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import OptionGroup from "../OptionGroup";
import { LayerThumb, swatchHex } from "../Swatches";
import { layerUrl, strapLayerName } from "../creator-state";
import { tileState, type StepProps } from "./types";
import { previewPart } from "./preview";
import {
  CLASPS,
  STRAPS,
  getFinish,
  getStrap,
  isPartId,
  optionState,
  visibleParts,
  type ClaspId,
  type StrapId,
  type StrapType,
} from "@/lib/watch";

const TABS: readonly { id: StrapType; label: string }[] = [
  { id: "caucho", label: "Caucho" },
  { id: "piel", label: "Piel" },
  { id: "brazalete", label: "Brazalete" },
];

/** Paso 4 · Correa: pestañas Caucho / Piel / Brazalete, el color y el cierre. */
export default function StepCorrea({ config, dispatch }: StepProps) {
  const uid = useId();
  const current = getStrap(config.correa);
  const [tab, setTab] = useState<StrapType>(current?.tipo ?? "caucho");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const finish = getFinish(config.acabado);
  const straps = visibleParts(STRAPS).filter((s) => s.tipo === tab);

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <>
      <div className="pyj-reloj_tabs" role="tablist" aria-label="Tipo de correa">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${uid}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            className={`pyj-reloj_tab${tab === t.id ? " is-on" : ""}`}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {t.label}
            {current?.tipo === t.id && <span className="pyj-reloj_tabdot" aria-label="(la que llevas)" />}
          </button>
        ))}
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className="pyj-reloj_tabpanel">
        <OptionGroup<StrapId>
          label={tab === "brazalete" ? "Brazalete" : `Color de la correa de ${tab}`}
          hint={
            tab === "brazalete"
              ? `Va siempre en el acabado de tu caja (${finish?.label ?? ""}) y trae su propio cierre.`
              : tab === "piel"
                ? "Piel con grabado de cocodrilo; los terminales van en el acabado de tu caja."
                : "Caucho suave con terminales integrados."
          }
          value={config.correa}
          onChange={(id) => isPartId("correa", id) && dispatch({ type: "pieza", cat: "correa", id })}
          onPreview={(id) => previewPart(config, "correa", id)}
          options={straps.map((s) => ({
            id: s.id,
            label: s.tipo === "brazalete" ? `${s.label} · ${finish?.label ?? ""}` : s.label,
            visual: (
              <LayerThumb
                crop="correa"
                layers={[layerUrl(strapLayerName(s.id, config.acabado))]}
                fallbackHex={swatchHex(s.color ?? finish?.swatch ?? "acero")}
              />
            ),
            ...tileState(optionState(config, "correa", s.id)),
          }))}
        />
      </div>

      {current?.tipo !== "brazalete" && (
        <OptionGroup<ClaspId>
          label="Cierre"
          variant="chips"
          value={config.cierre}
          onChange={(id) => isPartId("cierre", id) && dispatch({ type: "pieza", cat: "cierre", id })}
          options={visibleParts(CLASPS).map((c) => ({
            id: c.id,
            label: c.label,
            ...tileState(optionState(config, "cierre", c.id)),
          }))}
        />
      )}

      <p className="pyj-reloj_note">
        ¿Llevas tu idde en la muñeca izquierda? Puedes llevar el reloj en la derecha.
      </p>
    </>
  );
}
