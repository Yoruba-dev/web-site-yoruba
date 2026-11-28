"use client";

import ClaspArt from "../ClaspArt";
import OptionGroup from "../OptionGroup";
import { VitrinaPiece, strapHex } from "../Swatches";
import { vitrinaCorrea, type SubId } from "../creator-state";
import { tileState, type StepProps } from "./types";
import { previewPart, useEspera } from "./preview";
import {
  CLASPS,
  STRAPS,
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
function colores(tipo: StrapType): string {
  const n = visibleParts(STRAPS).filter((s) => s.tipo === tipo).length;
  return `${n} ${n === 1 ? "color" : "colores"}`;
}

/** "Caucho azul marino" → "Azul marino": en la balda el tipo ya está dicho. */
function nombreCorto(label: string): string {
  const s = label.replace(/^(Caucho|Piel)\s+/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Negro PVD" → "negro PVD": solo baja la primera letra (las siglas, no). */
const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "1 · Tipo": el número, solo donde se ven los dos (en el móvil la cabecera de
 *  Tipo se oculta y "2 · Color" quedaba sin su 1). */
const paso = (n: number, t: string) => (
  <>
    <span className="rl-group_num">{n} · </span>
    {t}
  </>
);

type Props = StepProps & { memoria: StrapMemory; recordar: (t: StrapType, id: StrapId) => void };

/** Paso 3 · Correa, en 2 sub-pestañas (la correa y su cierre son piezas
 *  distintas): Correa (tipo y color) · Cierre. */
export default function StepCorrea(props: Props & { sub: SubId }) {
  return props.sub === "cierre" ? <CorreaCierre {...props} /> : <CorreaColor {...props} />;
}

// — Correa: tipo (tres tarjetas con su pieza) y color (vitrina) ————————————
function CorreaColor({ config, dispatch, requestView, memoria: mem, recordar }: Props) {
  const [espera, avisar] = useEspera<StrapId>();
  const current = getStrap(config.correa);
  const tipo = current?.tipo ?? "caucho";
  const finish = getFinish(config.acabado);
  const straps = visibleParts(STRAPS).filter((s) => s.tipo === tipo);

  /** La correa que saldría al tocar la tarjeta de `t` (para su foto). */
  const strapFor = (t: StrapType): StrapId =>
    t === tipo ? config.correa : (withStrapType(config, t, mem[t]).correa as StrapId);

  return (
    <>
      <OptionGroup<StrapType>
        label={paso(1, "Tipo")}
        variant="cards"
        columns={3}
        field="correa"
        className="rl-group--tipo"
        value={tipo}
        onChange={(t) => {
          if (current) recordar(current.tipo, current.id);
          dispatch({ type: "tipoCorrea", tipo: t, recordado: mem[t] });
          requestView("correa");
        }}
        onPreview={(t) => void previewPart(config, "correa", strapFor(t))}
        options={TIPOS.map((t) => {
          const id = strapFor(t.id);
          return {
            id: t.id,
            label: t.label,
            detalle: t.id === "brazalete" ? `En ${finish ? minuscula(finish.label) : "tu acabado"}` : colores(t.id),
            // La misma pieza que en la vitrina: el macro del material (una costura,
            // una placa) no se reconocía a este tamaño.
            visual: (
              <span className="rl-tipo">
                <VitrinaPiece
                  src={vitrinaCorrea(id, config.acabado)}
                  hex={strapHex(id, (t.id === "brazalete" ? finish?.swatch : getStrap(id)?.swatch) ?? "negro")}
                  tipo={t.id}
                />
              </span>
            ),
          };
        })}
      />

      {tipo === "brazalete" ? (
        <div className="rl-group rl-group--static rl-group--brazalete">
          <div className="rl-group_head">
            <span className="rl-group_label">
              {paso(2, "Color")} <span className="rl-group_value">— {finish?.label ?? ""}</span>
            </span>
          </div>
          <div className="rl-vitsola">
            <VitrinaPiece
              src={vitrinaCorrea("brazalete", config.acabado)}
              hex={strapHex("brazalete", finish?.swatch ?? "acero")}
              tipo="brazalete"
            />
          </div>
          <p className="rl-note">Eslabón en H. Va siempre en el acabado de tu caja.</p>
        </div>
      ) : (
        <OptionGroup<StrapId>
          label={paso(2, "Color")}
          labelValue={current ? `${current.label}${tipo === "piel" ? " · cocodrilo" : ""}` : undefined}
          variant="vitrina"
          columns={tipo === "piel" ? 3 : 5}
          className={`rl-vit--${tipo}`}
          value={config.correa}
          espera={espera}
          onChange={(id) => {
            if (!isPartId("correa", id)) return;
            recordar(tipo, id);
            avisar(id, previewPart(config, "correa", id));
            dispatch({ type: "pieza", cat: "correa", id });
            requestView("correa");
          }}
          onPreview={(id) => void previewPart(config, "correa", id)}
          options={straps.map((s) => ({
            id: s.id,
            label: s.label,
            nombre: nombreCorto(s.label),
            visual: <VitrinaPiece src={vitrinaCorrea(s.id, config.acabado)} hex={strapHex(s.id, s.swatch)} tipo={tipo} />,
            ...tileState(optionState(config, "correa", s.id)),
          }))}
        />
      )}
    </>
  );
}

const NOTA_CIERRE: Readonly<Record<ClaspId, string>> = {
  puas: "Se ajusta en los agujeros",
  desplegable: "Se abre con dos botones",
};

// — Cierre: dos ilustraciones en el metal de la caja (o el del brazalete) ———————
function CorreaCierre({ config, dispatch, requestView }: Props) {
  const strap = getStrap(config.correa);
  const finish = getFinish(config.acabado);
  const arte = {
    acabado: config.acabado,
    piel: strap?.tipo === "piel",
    color: strapHex(config.correa, strap?.swatch ?? "negro"),
  };
  return (
    <>
      {strap?.tipo === "brazalete" ? (
        <div className="rl-group rl-group--static" data-field="cierre">
          <div className="rl-group_head">
            <span className="rl-group_label">
              Cierre <span className="rl-group_value">— el del brazalete</span>
            </span>
          </div>
          <div className="rl-claspcard">
            <ClaspArt kind="plegable" {...arte} />
            <span className="rl-claspcard_txt">
              <span className="rl-opt_label">Plegable</span>
              <span className="rl-opt_det">Escondido entre los eslabones · incluido</span>
            </span>
          </div>
        </div>
      ) : (
        <OptionGroup<ClaspId>
          label="Cierre"
          labelValue={CLASPS.find((c) => c.id === config.cierre)?.label}
          hint={`En ${finish ? minuscula(finish.label) : "tu acabado"} · incluido`}
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
            detalle: NOTA_CIERRE[c.id],
            visual: <ClaspArt kind={c.id} {...arte} />,
            ...tileState(optionState(config, "cierre", c.id)),
          }))}
        />
      )}
      <p className="rl-note">¿Llevas tu idde en la muñeca izquierda? Puedes llevar el reloj en la derecha.</p>
    </>
  );
}
