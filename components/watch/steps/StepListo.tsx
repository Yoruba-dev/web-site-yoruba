"use client";

import { useId, useState, type ReactNode } from "react";
import { layerUrl, stepOfField, strapLayerName, type StepId, type SubId } from "../creator-state";
import type { OrderInfo } from "../order";
import { GradientDial, LayerThumb, SolSwatch, swatchHex } from "../Swatches";
import ShareButtons from "../shell/ShareButtons";
import { Icon } from "../shell/icons";
import {
  DIAL_MODELS,
  WATCH_CUSTOM_POLICY,
  WATCH_ORIGIN,
  WATCH_PROOF_NOTE,
  WATCH_RENDER_NOTE,
  dialBaseHex,
  dialBaseLabel,
  describeTrack,
  getAppliquePart,
  getClasp,
  getDialBase,
  getFinish,
  getSecondsPart,
  getStrap,
  signName,
  watchLeadTimeLabel,
  type Descontinuado,
  type WatchConfig,
} from "@/lib/watch";
import { formatFecha } from "@/lib/watch-art";
import { nombresCapas } from "@/lib/watch-capas";
import { lucumiLeg } from "@/lib/odu";

/** "Listo" (spec V2 §3.6): lo que falta (si algo), el reloj en 4 filas con
 *  "Editar", la tarjeta de compartir (lo que más llama la vista después del
 *  botón de pedir) y las notas. El botón "Solicitar por WhatsApp" va en el pie. */
export default function StepListo({
  config,
  goTo,
  order,
  descontinuado,
  snapshot,
  onDownload,
  policy,
  onPolicy,
  detalle,
  onDetalle,
}: {
  config: WatchConfig;
  /** Ir a un paso; con `field` ("Corregir"), además se enfoca ESE campo. */
  goTo: (s: StepId, sub?: SubId | null, field?: string) => void;
  order: OrderInfo;
  descontinuado: readonly Descontinuado[];
  /** La foto de estudio pequeña (3D) para la tarjeta; null sin 3D. */
  snapshot: { url: string; file: File } | null;
  /** "Descargar foto de estudio" (solo con 3D). */
  onDownload?: () => void;
  policy: boolean;
  onPolicy: (v: boolean) => void;
  /** "Ver detalle" abierto (el botón vive en la cabeza del panel; en la hoja
   *  del móvil, aquí mismo). */
  detalle: boolean;
  /** Pinta aquí el botón "Ver detalle" (móvil). */
  onDetalle?: () => void;
}) {
  const uid = useId();
  const [nota, setNota] = useState(false);
  const bloqueos = order.validation.issues.filter((i) => i.nivel === "bloqueo");
  const avisos = order.validation.issues.filter((i) => i.nivel === "aviso");
  const filas = summaryRows(config);

  return (
    <>
      {(bloqueos.length > 0 || avisos.length > 0) && (
        <ul className="rl-issues" aria-label="Revisa antes de pedir">
          {[...bloqueos, ...avisos].map((i) => {
            const to = stepOfField(i.campo);
            return (
              <li key={`${i.regla}-${i.campo}`} className={`rl-issue rl-issue--${i.nivel}`}>
                <span className="rl-issue_dot" aria-hidden="true" />
                <span className="rl-issue_txt">{i.motivo}</span>
                <button type="button" className="rl-link" onClick={() => goTo(to.step, to.sub, i.campo)} data-corregir={i.campo}>
                  Corregir
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {descontinuado.length > 0 && (
        <p className="rl-callout" role="note">
          Tu enlace traía piezas que ya no ofrecemos: las cambiamos por las más cercanas.
        </p>
      )}

      <ul className="rl-sum" aria-label="Tu reloj">
        {filas.map((r) => (
          <li key={r.k} className="rl-sum_row">
            <span className="rl-sum_thumb" aria-hidden="true">
              {r.thumb}
            </span>
            <span className="rl-sum_txt">
              <span className="rl-sum_k">{r.k}</span>
              <span className="rl-sum_v" title={r.v}>
                {r.v}
              </span>
            </span>
            <button type="button" className="rl-iconbtn rl-sum_edit" onClick={() => goTo(r.step, r.sub)} aria-label={`Editar ${r.k}`}>
              <Icon name="pencil" />
            </button>
          </li>
        ))}
      </ul>
      {onDetalle && (
        <button type="button" className="rl-detail_toggle" aria-expanded={detalle} aria-controls={`${uid}-detalle`} onClick={onDetalle}>
          {detalle ? "Ocultar detalle" : "Ver detalle"}
        </button>
      )}
      {detalle && (
        <dl id={`${uid}-detalle`} className="rl-detail_list">
          {detailRows(config).map((r) => (
            <div key={r.k}>
              <dt>{r.k}</dt>
              <dd>{r.v}</dd>
            </div>
          ))}
        </dl>
      )}

      <section className={`rl-sharecard rl-glass${snapshot ? " rl-sharecard--img" : ""}`} aria-labelledby={`${uid}-share`}>
        {snapshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rl-sharecard_img" src={snapshot.url} alt="" width={88} height={88} />
        )}
        <div className="rl-sharecard_body">
          <div className="rl-sharecard_head">
            <h3 id={`${uid}-share`} className="rl-sharecard_title">
              Pide la opinión de tu padrino o madrina
            </h3>
            {onDownload && (
              <button
                type="button"
                className="rl-iconbtn rl-sharecard_dl"
                onClick={onDownload}
                aria-label="Descargar foto de estudio"
                title="Descargar foto de estudio"
              >
                <Icon name="download" size={18} />
              </button>
            )}
          </div>
          <ShareButtons order={order} file={snapshot?.file ?? null} />
        </div>
      </section>

      {order.canBuy ? (
        // Pagar en la web: la venta final se acepta aquí, con la casilla.
        <label className="rl-policy" htmlFor={`${uid}-pol`}>
          <input id={`${uid}-pol`} type="checkbox" required checked={policy} onChange={(e) => onPolicy(e.target.checked)} />
          <span>{WATCH_CUSTOM_POLICY}</span>
        </label>
      ) : null}

      <div className="rl-notes">
        <p title={`${order.priceLabel} con tu diseño. ${WATCH_PROOF_NOTE}`}>
          {order.priceLabel} · ✦ Prueba para tu OK antes de producir
        </p>
        <div className="rl-notes_row">
          {/* El origen va A LA VISTA (spec §3.6.5); en el ⓘ solo la nota de la
              vista previa, como un botón que la despliega en la línea (un
              `title` no se ve en el móvil). */}
          Plazo de taller: {watchLeadTimeLabel()} · {WATCH_ORIGIN}{" "}
          <button
            type="button"
            className="rl-tip"
            aria-expanded={nota}
            aria-controls={`${uid}-nota`}
            aria-label="Sobre la vista previa"
            title={WATCH_RENDER_NOTE}
            onClick={() => setNota((x) => !x)}
          >
            <Icon name="info" size={14} />
          </button>
          <span id={`${uid}-nota`} hidden={!nota}>
            {" "}
            {WATCH_RENDER_NOTE}
          </span>
          {!order.canBuy && (
            <>
              {" · "}
              <details className="rl-policy-note">
                <summary>Venta final · Leer política</summary>
                <p>{WATCH_CUSTOM_POLICY}</p>
              </details>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// El reloj en 4 filas (cada una lleva a su paso) y el detalle completo.
// ---------------------------------------------------------------------------
interface SumRow {
  k: string;
  v: string;
  step: StepId;
  sub: SubId | null;
  thumb: ReactNode;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function summaryRows(c: WatchConfig): SumRow[] {
  const fin = getFinish(c.acabado)?.label ?? c.acabado;
  const strap = getStrap(c.correa);
  const base = getDialBase(c.esfera.base);
  const esfera = [
    `${dialBaseLabel({ base: c.esfera.base })}${c.esfera.modelo === "ifa" ? ` · ${DIAL_MODELS.ifa.label}` : ""}`,
    describeTrack(c),
    c.esfera.texto ? `«${c.esfera.texto}»` : "sin texto",
    `segundero ${lower(getSecondsPart(c.segundero)?.label ?? c.segundero)}`,
  ].join(" · ");
  const correa = [
    strap ? (strap.tipo === "brazalete" ? `${strap.label} · ${fin}` : strap.label) : c.correa,
    strap?.tipo === "brazalete" ? "cierre plegable" : lower(getClasp(c.cierre)?.label ?? c.cierre),
  ].join(" · ");
  const tapa = [
    c.tapa.signo ? signLabel(c.tapa.signo) : "",
    c.tapa.linea1 ? `«${c.tapa.linea1}»` : "",
    c.tapa.linea2 ? `«${c.tapa.linea2}»` : "",
    c.tapa.fecha ? formatFecha(c.tapa.fecha) : "",
  ].filter(Boolean);
  const n = nombresCapas(c);
  return [
    {
      k: "Caja",
      v: `Octogonal 40 mm · ${fin}`,
      step: "caja",
      sub: null,
      thumb: <LayerThumb crop="caja" layers={[layerUrl(`caja-${c.acabado}`), layerUrl(n.esfera)]} />,
    },
    {
      k: "Esfera",
      v: capital(esfera),
      step: "esfera",
      sub: "color",
      thumb: base?.degradado ? (
        <GradientDial esfera={c.esfera} size={32} />
      ) : (
        <SolSwatch hex={dialBaseHex(c.esfera.base)} size={32} />
      ),
    },
    {
      k: "Correa",
      v: correa,
      step: "correa",
      sub: null,
      thumb: (
        <LayerThumb
          crop="correa"
          layers={[layerUrl(strapLayerName(c.correa, c.acabado))]}
          fallbackHex={swatchHex(strap?.swatch ?? "negro")}
        />
      ),
    },
    {
      k: "Tapa",
      v: tapa.length ? `${tapa.join(" · ")} · letra ${c.tapa.fuente === "fina" ? "fina" : "clásica"}` : "Lisa, sin grabado",
      step: "tapa",
      sub: "signo",
      thumb: <Icon name="tapa" size={24} />,
    },
  ];
}

function detailRows(c: WatchConfig): { k: string; v: string }[] {
  const fin = getFinish(c.acabado)?.label ?? c.acabado;
  const strap = getStrap(c.correa);
  const rows = [
    { k: "Caja", v: `Octogonal 40 mm · ${fin}` },
    { k: "Esfera", v: `${dialBaseLabel(c.esfera)}${c.esfera.modelo === "ifa" ? ` · ${DIAL_MODELS.ifa.label}` : ""}` },
    { k: "Pista", v: capital(describeTrack(c)) },
    { k: "Texto a las 6", v: c.esfera.texto ? `«${c.esfera.texto}»` : "Sin texto" },
  ];
  if (c.esfera.modelo !== "ifa") {
    rows.push({
      k: "Signo en la esfera",
      v: c.esfera.signo ? `${signLabel(c.esfera.signo)} · ${c.esfera.signoPos === "nueve" ? "a las 9" : "a las 6"}` : "Sin signo",
    });
  }
  rows.push(
    { k: "Aplique", v: getAppliquePart(c.aplique)?.label ?? c.aplique },
    { k: "Segundero", v: getSecondsPart(c.segundero)?.label ?? c.segundero },
    { k: "Correa", v: strap ? (strap.tipo === "brazalete" ? `${strap.label} · ${fin}` : strap.label) : c.correa },
    { k: "Cierre", v: strap?.tipo === "brazalete" ? "El del brazalete" : (getClasp(c.cierre)?.label ?? c.cierre) },
    { k: "Tapa · signo", v: c.tapa.signo ? signLabel(c.tapa.signo) : "Sin signo" },
  );
  const lineas = [c.tapa.linea1, c.tapa.linea2].filter(Boolean).map((l) => `«${l}»`);
  rows.push({ k: "Tapa · texto", v: lineas.length ? lineas.join(" · ") : "Sin texto" });
  if (c.tapa.fecha) rows.push({ k: "Tapa · fecha", v: formatFecha(c.tapa.fecha) });
  rows.push({ k: "Tapa · letra", v: c.tapa.fuente === "fina" ? "Fina · cursiva" : "Clásica · romana" });
  return rows;
}

/** El nombre del signo; una combinación aún sin nombre se describe por sus
 *  piernas (y validate() ya pide el nombre antes de poder pedir). */
function signLabel(s: NonNullable<WatchConfig["tapa"]["signo"]>): string {
  const n = signName(s);
  if (n || s.tipo === "meyi") return n;
  return `Combinación: derecha ${lucumiLeg(s.derecha) ?? s.derecha} · izquierda ${lucumiLeg(s.izquierda) ?? s.izquierda} (falta el nombre)`;
}
