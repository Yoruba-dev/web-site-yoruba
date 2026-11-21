"use client";

import { useId, useState } from "react";
import { stepOfField, type StepId } from "../creator-state";
import type { OrderInfo } from "../order";
import {
  DIAL_MODELS,
  WATCH_CUSTOM_POLICY,
  WATCH_ORIGIN,
  WATCH_PROOF_NOTE,
  WATCH_RENDER_NOTE,
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
import { lucumiLeg } from "@/lib/odu";
import WatchStage3D, { useWebGL } from "../WatchStage3D";

/** Paso 6 · Resumen: cada elección con "Editar", el código, compartir y pedir. */
export default function StepResumen({
  config,
  goTo,
  order,
  policy,
  onPolicy,
  onAddToCart,
  added,
  descontinuado,
  escritorio,
}: {
  config: WatchConfig;
  goTo: (s: StepId) => void;
  order: OrderInfo;
  policy: boolean;
  onPolicy: (v: boolean) => void;
  onAddToCart: () => void;
  added: boolean;
  descontinuado: readonly Descontinuado[];
  /** null mientras no se sabe (no se monta ninguna 3D hasta saberlo). */
  escritorio: boolean | null;
}) {
  const uid = useId();
  const webgl = useWebGL();
  const [copiado, setCopiado] = useState<"" | "ok" | "manual">("");
  const rows = resumenRows(config);
  const bloqueos = order.validation.issues.filter((i) => i.nivel === "bloqueo");
  const avisos = order.validation.issues.filter((i) => i.nivel === "aviso");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(order.creatorUrl);
      setCopiado("ok");
    } catch {
      setCopiado("manual");
    }
    window.setTimeout(() => setCopiado(""), 4000);
  }

  return (
    <>
      {/* — "Terminar diseño": el reloj exacto del cliente en 3D. En el móvil
          va aquí (el escenario fijo se oculta en el resumen); en el escritorio
          lo muestra el escenario grande de la izquierda (una sola 3D por
          página). Sin WebGL, la vista de frente. */}
      {escritorio === false && (
        <section className="pyj-reloj_3d" aria-labelledby={`${uid}-3d`}>
          <h3 id={`${uid}-3d`} className="pyj-reloj_3dtitle">
            {webgl === false ? "Así quedará tu reloj" : "Tu reloj en 3D"}
          </h3>
          <WatchStage3D config={config} className="pyj-reloj3d--resumen" />
          <p className="pyj-reloj_rendernote">{WATCH_RENDER_NOTE}</p>
        </section>
      )}
      {escritorio === true && webgl === true && (
        <p className="pyj-reloj_3dnota">
          A la izquierda, tu reloj en 3D: gíralo para verlo por todos lados. Con «Foto» te llevas una foto de
          estudio del frente y de la tapa.
        </p>
      )}

      <dl className="pyj-reloj_sum">
        {rows.map((r) => (
          <div className="pyj-reloj_sumrow" key={r.k}>
            <dt>{r.k}</dt>
            <dd>{r.v}</dd>
            <dd className="pyj-reloj_sumedit">
              <button type="button" className="pyj-reloj_link" onClick={() => goTo(r.step)} aria-label={`Editar ${r.k}`}>
                Editar
              </button>
            </dd>
          </div>
        ))}
      </dl>

      {descontinuado.length > 0 && (
        <div className="pyj-reloj_callout" role="note">
          <p>
            Tu enlace traía piezas que ya no ofrecemos; las cambiamos por las más cercanas. Revísalas antes de
            pedir.
          </p>
        </div>
      )}

      {avisos.length > 0 && (
        <ul className="pyj-reloj_warns">
          {avisos.map((i) => (
            <li key={`${i.regla}-${i.campo}`}>
              {i.motivo}{" "}
              <button type="button" className="pyj-reloj_link" onClick={() => goTo(stepOfField(i.campo))}>
                Corregir
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* — Código y compartir ——————————————————————————————————— */}
      <div className="pyj-reloj_share">
        <div className="pyj-reloj_sharecode">
          <span className="pyj-reloj_grouplabel">Código de tu diseño</span>
          <strong className="pyj-reloj_bigcode">{order.code}</strong>
          <span className="pyj-reloj_note">Guárdalo: con el enlace se abre tu reloj tal cual.</span>
        </div>
        <div className="pyj-reloj_sharebtns">
          <button type="button" className="pyj-reloj_ghost" onClick={copiar}>
            Copiar enlace
          </button>
          <a className="pyj-reloj_ghost" href={order.shareHref} target="_blank" rel="noopener noreferrer">
            Enviar por WhatsApp
          </a>
        </div>
        <p className="pyj-reloj_note" role="status" aria-live="polite">
          {copiado === "ok"
            ? "Enlace copiado. Compártelo con tu padrino o tu madrina."
            : copiado === "manual"
              ? "No pudimos copiarlo solo: selecciona el enlace de abajo."
              : "Compártelo con tu padrino o tu madrina antes de pedirlo."}
        </p>
        {copiado === "manual" && (
          <input className="pyj-reloj_input" readOnly value={order.creatorUrl} onFocus={(e) => e.currentTarget.select()} />
        )}
      </div>

      {/* — Pedir ————————————————————————————————————————————— */}
      <div className="pyj-reloj_order">
        <p className="pyj-reloj_price">
          <span>{order.priceLabel}</span>
          {!order.canBuy && <small>Te confirmamos el precio con tu diseño.</small>}
        </p>
        <p className="pyj-reloj_note">
          Plazo de taller: {watchLeadTimeLabel()}. {WATCH_ORIGIN}.
        </p>

        {bloqueos.length > 0 && (
          <ul className="pyj-reloj_blocks" aria-label="Falta resolver">
            {bloqueos.map((i) => (
              <li key={`${i.regla}-${i.campo}`}>
                {i.motivo}{" "}
                <button type="button" className="pyj-reloj_link" onClick={() => goTo(stepOfField(i.campo))}>
                  Corregir
                </button>
              </li>
            ))}
          </ul>
        )}

        {order.canBuy ? (
          // Pagar en la web: la venta final se acepta aquí, con la casilla.
          <label className="pyj-reloj_policy" htmlFor={`${uid}-pol`}>
            <input
              id={`${uid}-pol`}
              type="checkbox"
              required
              checked={policy}
              onChange={(e) => onPolicy(e.target.checked)}
            />
            <span>{WATCH_CUSTOM_POLICY}</span>
          </label>
        ) : (
          // Solicitar por WhatsApp es pedir precio, no comprar: la política se
          // muestra para que se lea, y se acepta en el chat y con la prueba.
          <p className="pyj-reloj_policy pyj-reloj_policy--nota" role="note">
            <span className="pyj-reloj_policymark" aria-hidden="true">
              ✦
            </span>
            <span>{WATCH_CUSTOM_POLICY}</span>
          </p>
        )}

        <OrderCta order={order} policy={policy} onAddToCart={onAddToCart} added={added} big />
        <p className="pyj-reloj_proof">✦ {WATCH_PROOF_NOTE}</p>
      </div>
    </>
  );
}

/** El botón principal: "Solicitar mi reloj" (WhatsApp con el enlace del diseño)
 *  o, cuando exista un producto con precio real, "Añadir al carrito". Lo usan el
 *  resumen y el pie fijo del móvil. */
export function OrderCta({
  order,
  policy,
  onAddToCart,
  added,
  big = false,
  onBlocked,
}: {
  order: OrderInfo;
  policy: boolean;
  onAddToCart: () => void;
  added: boolean;
  big?: boolean;
  /** Qué hacer si se pulsa sin poder pedir (ej. llevar al resumen). */
  onBlocked?: () => void;
}) {
  // La casilla de la política solo cuenta al pagar en la web (carrito). Pedir
  // por WhatsApp es solicitar el precio: basta con que el diseño esté completo.
  const needsPolicy = order.canBuy;
  const ready = order.validation.ok && (!needsPolicy || policy);
  const why = !order.validation.ok
    ? "Revisa lo que falta en tu diseño."
    : needsPolicy && !policy
      ? "Marca la casilla de la política para continuar."
      : "";
  const cls = `pyj-btn-gold pyj-reloj_cta${big ? " pyj-reloj_cta--big" : ""}${ready ? "" : " is-disabled"}`;

  if (order.canBuy) {
    return (
      <button
        type="button"
        className={cls}
        aria-disabled={!ready || undefined}
        title={why || undefined}
        onClick={() => (ready ? onAddToCart() : onBlocked?.())}
      >
        {added ? "Añadido ✓ — ver carrito" : `Añadir al carrito · ${order.priceLabel}`}
      </button>
    );
  }
  return (
    <a
      className={cls}
      href={ready ? order.whatsappHref : undefined}
      target="_blank"
      rel="noopener noreferrer"
      role={ready ? undefined : "link"}
      aria-disabled={!ready || undefined}
      title={why || undefined}
      tabIndex={0}
      onClick={(e) => {
        if (!ready) {
          e.preventDefault();
          onBlocked?.();
        }
      }}
      onKeyDown={(e) => {
        if (!ready && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onBlocked?.();
        }
      }}
    >
      {order.ctaLabel}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Las filas del resumen: cada elección en palabras del cliente, con su paso.
// ---------------------------------------------------------------------------
interface Row {
  k: string;
  v: string;
  step: StepId;
}

function resumenRows(c: WatchConfig): Row[] {
  const fin = getFinish(c.acabado)?.label ?? c.acabado;
  const strap = getStrap(c.correa);
  const rows: Row[] = [
    { k: "Caja", v: `Octogonal 40 mm · ${fin}`, step: "caja" },
    {
      k: "Esfera",
      v: `${getDialBase(c.esfera.base)?.label ?? c.esfera.base}${c.esfera.modelo === "ifa" ? ` · ${DIAL_MODELS.ifa.label}` : ""}`,
      step: "esfera",
    },
    { k: "Pista", v: capital(describeTrack(c)), step: "esfera" },
    { k: "Texto a las 6", v: c.esfera.texto ? `«${c.esfera.texto}»` : "Sin texto", step: "esfera" },
  ];
  if (c.esfera.modelo !== "ifa") {
    rows.push({
      k: "Signo en la esfera",
      v: c.esfera.signo
        ? `${signLabel(c.esfera.signo)} · ${c.esfera.signoPos === "nueve" ? "a las 9" : "a las 6"}`
        : "Sin signo",
      step: "esfera",
    });
  }
  rows.push(
    { k: "Aplique", v: getAppliquePart(c.aplique)?.label ?? c.aplique, step: "esfera" },
    { k: "Segundero", v: getSecondsPart(c.segundero)?.label ?? c.segundero, step: "agujas" },
    {
      k: "Correa",
      v: strap ? (strap.tipo === "brazalete" ? `${strap.label} · ${fin}` : strap.label) : c.correa,
      step: "correa",
    },
    {
      k: "Cierre",
      v: strap?.tipo === "brazalete" ? "El del brazalete" : (getClasp(c.cierre)?.label ?? c.cierre),
      step: "correa",
    },
    { k: "Tapa · signo", v: c.tapa.signo ? signLabel(c.tapa.signo) : "Sin signo", step: "tapa" },
  );
  const lineas = [c.tapa.linea1, c.tapa.linea2].filter(Boolean).map((l) => `«${l}»`);
  rows.push({ k: "Tapa · texto", v: lineas.length ? lineas.join(" · ") : "Sin texto", step: "tapa" });
  if (c.tapa.fecha) rows.push({ k: "Tapa · fecha", v: formatFecha(c.tapa.fecha), step: "tapa" });
  return rows;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** El nombre del signo; una combinación aún sin nombre se describe por sus
 *  piernas (y validate() ya pide el nombre antes de poder pedir). */
function signLabel(s: NonNullable<WatchConfig["tapa"]["signo"]>): string {
  const n = signName(s);
  if (n || s.tipo === "meyi") return n;
  return `Combinación: derecha ${lucumiLeg(s.derecha) ?? s.derecha} · izquierda ${lucumiLeg(s.izquierda) ?? s.izquierda} (falta el nombre)`;
}
