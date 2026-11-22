"use client";

import OptionGroup from "../OptionGroup";
import { ClaspPictogram, ColorDot, LayerThumb, swatchHex } from "../Swatches";
import { layerUrl, strapLayerName } from "../creator-state";
import { tileState, type StepProps } from "./types";
import { previewPart } from "./preview";
import {
  CLASPS,
  STRAPS,
  WATCH_COLORS,
  getFinish,
  getStrap,
  isPartId,
  optionState,
  visibleParts,
  withStrapType,
  type ClaspId,
  type StrapId,
  type StrapType,
} from "@/lib/watch";

/** La correa que cada tipo lleva ahora mismo en esta sesión (la memoria de
 *  color por tipo: caucho rojo → piel → caucho vuelve al rojo). */
export type StrapMemory = Partial<Record<StrapType, StrapId>>;

const TIPOS: readonly { id: StrapType; label: string }[] = [
  { id: "caucho", label: "Caucho" },
  { id: "piel", label: "Piel" },
  { id: "brazalete", label: "Brazalete" },
];

/** "9 colores" / "1 color", contado del catálogo que se ofrece (nunca a mano). */
function colores(tipo: StrapType): number {
  return visibleParts(STRAPS).filter((s) => s.tipo === tipo).length;
}

/** Paso 3 · Correa: 1 · Tipo (tres tarjetas con foto), 2 · Color de ese tipo,
 *  3 · Cierre (o el del brazalete). */
export default function StepCorrea({
  config,
  dispatch,
  requestView,
  memoria,
  recordar,
}: StepProps & { memoria: StrapMemory; recordar: (t: StrapType, id: StrapId) => void }) {
  const current = getStrap(config.correa);
  const tipo = current?.tipo ?? "caucho";
  const finish = getFinish(config.acabado);
  const straps = visibleParts(STRAPS).filter((s) => s.tipo === tipo);
  const mem = memoria;

  /** La correa que saldría al tocar la tarjeta de `t` (para su foto). */
  const strapFor = (t: StrapType): StrapId =>
    t === tipo ? config.correa : (withStrapType(config, t, mem[t]).correa as StrapId);

  const detalle = (t: StrapType) => {
    if (t === "brazalete") return `En ${finish?.label.toLowerCase() ?? "tu acabado"}`;
    const n = colores(t);
    return t === "piel" ? `Cocodrilo · ${n} ${n === 1 ? "color" : "colores"}` : `${n} ${n === 1 ? "color" : "colores"}`;
  };

  return (
    <>
      <OptionGroup<StrapType>
        label="1 · Tipo"
        variant="cards"
        columns={3}
        field="correa"
        value={tipo}
        onChange={(t) => {
          if (current) recordar(current.tipo, current.id);
          dispatch({ type: "tipoCorrea", tipo: t, recordado: mem[t] });
          requestView("lado");
        }}
        onPreview={(t) => previewPart(config, "correa", strapFor(t))}
        options={TIPOS.map((t) => {
          const id = strapFor(t.id);
          return {
            id: t.id,
            label: t.label,
            detalle: detalle(t.id),
            visual: (
              <LayerThumb
                crop="tipo"
                layers={[layerUrl(strapLayerName(id, config.acabado))]}
                fallbackHex={swatchHex(getStrap(id)?.swatch ?? "negro")}
              />
            ),
          };
        })}
      />

      {tipo === "brazalete" ? (
        <div className="rl-group rl-group--static">
          <div className="rl-group_head">
            <span className="rl-group_label">
              2 · Color <span className="rl-group_value">— {finish?.label ?? ""}</span>
            </span>
          </div>
          <p className="rl-row-note">
            <ColorDot hex={swatchHex(finish?.swatch ?? "acero")} size={28} />
            <span>Va siempre en el acabado de tu caja.</span>
          </p>
        </div>
      ) : (
        <OptionGroup<StrapId>
          label="2 · Color"
          labelValue={current?.label}
          variant="swatches"
          columns={7}
          value={config.correa}
          onChange={(id) => {
            if (!isPartId("correa", id)) return;
            recordar(tipo, id);
            dispatch({ type: "pieza", cat: "correa", id });
          }}
          onPreview={(id) => previewPart(config, "correa", id)}
          options={straps.map((s) => ({
            id: s.id,
            label: s.label,
            visual: <ColorDot hex={s.color ? WATCH_COLORS[s.color].hex : swatchHex(s.swatch)} size={44} />,
            ...tileState(optionState(config, "correa", s.id)),
          }))}
        />
      )}

      {tipo === "brazalete" ? (
        <div className="rl-group rl-group--static" data-field="cierre">
          <div className="rl-group_head">
            <span className="rl-group_label">3 · Cierre</span>
          </div>
          <p className="rl-row-note">
            <ClaspPictogram kind="desplegable" />
            <span>Cierre plegable del brazalete · incluido</span>
          </p>
        </div>
      ) : (
        <OptionGroup<ClaspId>
          label="3 · Cierre"
          variant="tiles"
          columns={2}
          field="cierre"
          className="rl-group--clasps"
          value={config.cierre}
          onChange={(id) => {
            if (!isPartId("cierre", id)) return;
            dispatch({ type: "pieza", cat: "cierre", id });
            requestView("cierre");
          }}
          options={visibleParts(CLASPS).map((c) => ({
            id: c.id,
            label: c.label,
            visual: <ClaspPictogram kind={c.id} />,
            ...tileState(optionState(config, "cierre", c.id)),
          }))}
        />
      )}

      <p className="rl-note">¿Llevas tu idde en la muñeca izquierda? Puedes llevar el reloj en la derecha.</p>
    </>
  );
}
