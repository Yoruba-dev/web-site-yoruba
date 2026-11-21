"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import WatchStage, { type StageView } from "./WatchStage";
import WatchEntry from "./WatchEntry";
import StepCaja from "./steps/StepCaja";
import StepEsfera from "./steps/StepEsfera";
import StepAgujas from "./steps/StepAgujas";
import StepCorrea from "./steps/StepCorrea";
import StepTapa from "./steps/StepTapa";
import StepResumen, { OrderCta } from "./steps/StepResumen";
import {
  DRAFT_KEY,
  STEPS,
  creatorReducer,
  parseDraft,
  stepIndex,
  type CreatorAction,
  type Draft,
  type StepId,
} from "./creator-state";
import { buildOrderInfo, type WatchProductVM } from "./order";
import { useCart } from "@/lib/cart-context";
import { frontSvgDataUrl } from "@/lib/watch-svg";
import {
  decodeWatchDesign,
  designCode,
  isPresetId,
  lineProperties,
  normalize,
  resolvePreset,
  summary,
  type Descontinuado,
  type PresetId,
  type WatchConfig,
} from "@/lib/watch";

// ---------------------------------------------------------------------------
// CREADOR DE RELOJES — el editor.
//
// • Un useReducer sobre WatchConfig (creator-state.ts → lib/watch.ts): cada
//   gesto es una acción pura; las reglas, el catálogo y los textos salen de
//   lib/watch.ts.
// • El escenario (WatchFront) recibe la config en CADA cambio: el reloj "se va
//   armando en frente" al instante (requisito n.º 1 del dueño). La animación de
//   montaje (armar) solo corre en la primera entrada.
// • Autoguardado en localStorage (try/catch) y en la URL ?d= (replaceState,
//   400 ms después del último cambio), así recargar o compartir no pierde nada.
// • Historial: pasar de la entrada al editor AÑADE una entrada (pushState), así
//   el gesto "atrás" del teléfono vuelve a "Empieza con tu Orisha" (con el
//   diseño guardado como "Continuar mi diseño") en vez de salir del creador;
//   "adelante" vuelve a abrirlo. Las ediciones siguen con replaceState.
// • Escritorio ≥ 1024 px: escenario fijo a la izquierda (~58 %) + pasos a la
//   derecha. Móvil: escenario fijo arriba, barra de pasos, carriles de opciones
//   y un pie fijo con el botón (sustituye a la barra de pestañas: ruta de
//   enfoque, lib/focus-routes.ts).
// ---------------------------------------------------------------------------

export interface CreatorInitial {
  config: WatchConfig;
  /** De dónde salió: 'd' (enlace), 'preset' (?preset=) o null (entrada). */
  source: "d" | "preset" | null;
  descontinuado: Descontinuado[];
}

const todayIso = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function WatchCreator({
  initial,
  product = null,
}: {
  initial: CreatorInitial;
  product?: WatchProductVM | null;
}) {
  const [config, rawDispatch] = useReducer(creatorReducer, initial.config);
  const [screen, setScreen] = useState<"entrada" | "editor">(initial.source ? "editor" : "entrada");
  const [step, setStep] = useState<StepId>("caja");
  const [view, setView] = useState<StageView>("frente");
  const [armar, setArmar] = useState(true);
  const [policy, setPolicy] = useState(false);
  const [added, setAdded] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [descontinuado, setDescontinuado] = useState<Descontinuado[]>(initial.descontinuado);
  const [announce, setAnnounce] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLElement>(null);
  const moved = useRef(false);
  /** La entrada actual del historial la añadió el creador (entrada → editor). */
  const pushed = useRef(false);
  const { addLine, setCartOpen } = useCart();

  // El reloj tal como se pide y se comparte: normalizado (sin espacios sueltos,
  // y exactamente lo que se reconstruye desde el enlace).
  const final = useMemo(() => normalize(config), [config]);
  const order = useMemo(() => buildOrderInfo(final, product), [final, product]);

  /** Toda edición pasa por aquí: el primer cambio apaga la animación de montaje
   *  (las siguientes actualizaciones son instantáneas). */
  const dispatch = useCallback((a: CreatorAction) => {
    setArmar(false);
    setAdded(false);
    rawDispatch(a);
  }, []);

  // — Borrador guardado: se ofrece en la entrada ("Continuar mi diseño").
  useEffect(() => {
    if (initial.source) return;
    try {
      setDraft(parseDraft(localStorage.getItem(DRAFT_KEY)));
    } catch {
      /* almacenamiento bloqueado: no hay borrador */
    }
  }, [initial.source]);

  // Lo último de cada estado, para el oyente de popstate (se monta una vez).
  const live = useRef({ screen, final, step });
  live.current = { screen, final, step };

  // — Atrás / adelante del navegador dentro del creador.
  useEffect(() => {
    const onPop = () => {
      const sp = new URL(window.location.href).searchParams;
      const d = sp.get("d");
      const preset = sp.get("preset");
      const { screen: now, final: cfg, step: st } = live.current;
      if (!d && !preset) {
        // Atrás desde el editor: a la entrada, sin perder el diseño.
        if (now !== "editor") return;
        pushed.current = false;
        setDraft({ v: 1, config: cfg, step: st, at: Date.now() });
        setScreen("entrada");
        return;
      }
      if (now !== "entrada") return;
      // Adelante desde la entrada: el diseño de esa entrada del historial.
      const r = d ? decodeWatchDesign(d) : null;
      if (r) {
        rawDispatch({ type: "cargar", config: r.config });
        setDescontinuado(r.descontinuado);
      } else if (isPresetId(preset)) {
        rawDispatch({ type: "preset", id: preset });
        setDescontinuado([]);
      } else return;
      pushed.current = true;
      setArmar(false);
      setScreen("editor");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // — Si se llega con ?preset= o ?d=, el editor entra en pantalla al cargar
  //   (al instante: un desplazamiento suave durante la carga se interrumpe y
  //   el html de la web lleva scroll-behavior: smooth, de ahí "instant"). Solo
  //   si la página sigue arriba: si el visitante ya se movió, no se le mueve.
  useEffect(() => {
    if (!initial.source) return;
    const raf = requestAnimationFrame(() => {
      if (window.scrollY > 40) return;
      rootRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(raf);
    // Solo al montar (initial no cambia mientras el creador vive).
  }, []);

  // — Altura del header fijo → el escenario fijo se pega justo debajo. (La raíz
  //   cambia entre la entrada y el editor: se vuelve a medir con `screen`.)
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".header-main_area-2");
    const root = rootRef.current;
    if (!header || !root) return;
    const set = () => root.style.setProperty("--pyj-reloj-top", `${Math.round(header.getBoundingClientRect().height)}px`);
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    ro?.observe(header);
    return () => ro?.disconnect();
  }, [screen]);

  // — Autoguardado: URL ?d= + localStorage, 400 ms después del último cambio.
  useEffect(() => {
    if (screen !== "editor") return;
    const t = window.setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("preset");
        url.searchParams.set("d", order.d);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      } catch {
        /* URL demasiado larga o historial bloqueado: el borrador local basta */
      }
      try {
        const d: Draft = { v: 1, config: final, step, at: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      } catch {
        /* cuota llena o modo privado: se sigue sin guardar */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [screen, final, step, order.d]);

  // — El escenario sigue al paso: la tapa se ve en "Tu tapa"; el resto, de frente.
  useEffect(() => {
    setView((v) => (step === "tapa" ? "tapa" : v === "tapa" ? "frente" : v));
  }, [step]);

  // — Al cambiar de paso: anunciarlo y llevar el foco al título (sin robarlo
  //   en la primera carga). En el móvil se desplaza para que las PRIMERAS
  //   OPCIONES (no el título) queden justo bajo el escenario fijo: el pie fijo
  //   ya dice en qué paso se está.
  useEffect(() => {
    if (screen !== "editor") return;
    const i = stepIndex(step);
    setAnnounce(`Paso ${i + 1} de ${STEPS.length}: ${STEPS[i].label}`);
    if (!moved.current) return;
    const h = headingRef.current;
    if (!h) return;
    h.focus({ preventScroll: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const first = bodyRef.current?.querySelector<HTMLElement>(
        ":scope > .pyj-reloj_group, :scope > .pyj-reloj_field, :scope > fieldset, :scope > .pyj-reloj_tabs, :scope > .pyj-reloj_sum, :scope > .pyj-reloj_callout",
      );
      (first ?? h).scrollIntoView({ block: "start", behavior });
      return;
    }
    const top = h.getBoundingClientRect().top;
    const margin = parseFloat(getComputedStyle(h).scrollMarginTop) || 0;
    if (top < margin - 4 || top > window.innerHeight * 0.7) {
      h.scrollIntoView({ block: "start", behavior });
    }
  }, [step, screen]);

  const goTo = useCallback((s: StepId) => {
    moved.current = true;
    setStep(s);
  }, []);

  const i = stepIndex(step);
  const prev = i > 0 ? STEPS[i - 1] : null;
  const next = i < STEPS.length - 1 ? STEPS[i + 1] : null;

  /** Entrada → editor: una entrada nueva en el historial (con el diseño en
   *  ?d=), para que "atrás" vuelva a la entrada. */
  function pushEditorEntry(cfg: WatchConfig) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("preset");
      url.searchParams.set("d", buildOrderInfo(normalize(cfg), product).d);
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      pushed.current = true;
    } catch {
      /* historial bloqueado: el autoguardado sigue funcionando */
    }
  }

  function pickPreset(id: PresetId) {
    pushEditorEntry(resolvePreset(id));
    rawDispatch({ type: "preset", id });
    setDescontinuado([]);
    setArmar(true);
    setPolicy(false);
    setAdded(false);
    setStep("caja");
    setView("frente");
    setScreen("editor");
    moved.current = false;
    rootRef.current?.scrollIntoView({ block: "start" });
  }

  /** Volver a la entrada sin perder nada: el diseño actual queda como
   *  "Continuar mi diseño". */
  function backToEntry() {
    setDraft({ v: 1, config: final, step, at: Date.now() });
    if (pushed.current) {
      // Se llegó desde la entrada: volver es deshacer esa entrada del
      // historial (popstate hace el resto), así "adelante" vuelve al editor.
      window.history.back();
    } else {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("d");
        url.searchParams.delete("preset");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      } catch {
        /* sin historial: solo cambia la pantalla */
      }
      setScreen("entrada");
    }
    rootRef.current?.scrollIntoView({ block: "start" });
  }

  /** Pulsar "Solicitar" sin poder: llevar a la casilla de la política (o a lo
   *  que falta resolver). */
  function showBlocker() {
    const el =
      document.querySelector<HTMLElement>(".pyj-reloj_blocks button") ??
      document.querySelector<HTMLElement>(".pyj-reloj_policy input");
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.focus({ preventScroll: true });
  }

  function continueDraft() {
    if (!draft) return;
    pushEditorEntry(draft.config);
    rawDispatch({ type: "cargar", config: draft.config });
    setDescontinuado([]);
    setArmar(true);
    setStep(draft.step);
    setScreen("editor");
    moved.current = false;
  }

  function addToCart() {
    const v = order.variant;
    if (!product || !v || !order.canBuy || !order.validation.ok || !policy) return;
    const uid =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${order.code}`;
    const preview = frontSvgDataUrl(final);
    addLine(
      {
        id: `${v.id}-reloj-${uid}`,
        merchandiseId: v.id,
        productHandle: product.handle,
        title: `${product.title} — ${order.code}`,
        image: product.image || preview,
        price: Number(v.price.amount),
        currencyCode: v.price.currencyCode,
        properties: lineProperties(final, order.code, order.sheetUrl, { politicaAceptada: todayIso() }),
        customization: { label: "Diseño", text: summary(final), font: "", preview, previewAlt: "Tu reloj" },
      },
      1,
    );
    setAdded(true);
    setCartOpen(true);
  }

  if (screen === "entrada") {
    return (
      <div ref={rootRef} className="pyj-reloj pyj-reloj--entrada">
        <WatchEntry
          onPick={pickPreset}
          onContinue={draft ? continueDraft : undefined}
          draftCode={draft ? designCode(draft.config) : undefined}
        />
      </div>
    );
  }

  const stepProps = { config, dispatch, goTo };

  return (
    <div ref={rootRef} className="pyj-reloj pyj-reloj--editor">
      <p className="pyj-reloj_sr" aria-live="polite" role="status">
        {announce}
      </p>

      <div className="pyj-reloj_layout">
        <div className="pyj-reloj_stagecol">
          <WatchStage config={final} view={view} onView={setView} armar={armar} code={order.code} />
        </div>

        <div className="pyj-reloj_panel">
          <nav className="pyj-reloj_steps" aria-label="Pasos del diseño">
            <ol>
              {STEPS.map((s, k) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`pyj-reloj_stepbtn${s.id === step ? " is-on" : ""}${k < i ? " is-done" : ""}`}
                    aria-current={s.id === step ? "step" : undefined}
                    onClick={() => goTo(s.id)}
                  >
                    <span className="pyj-reloj_stepnum" aria-hidden="true">
                      {k + 1}
                    </span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {descontinuado.length > 0 && step !== "resumen" && (
            <div className="pyj-reloj_callout" role="note">
              <p>
                Tu enlace traía {descontinuado.length === 1 ? "una pieza" : "piezas"} que ya no ofrecemos; las
                cambiamos por {descontinuado.length === 1 ? "la más cercana" : "las más cercanas"}.
              </p>
              <button type="button" className="pyj-reloj_link" onClick={() => setDescontinuado([])}>
                Entendido
              </button>
            </div>
          )}

          <section ref={bodyRef} className="pyj-reloj_stepbody" aria-labelledby="pyj-reloj-step-title">
            <div className="pyj-reloj_stephead">
              <span className="pyj-reloj_stepcount">
                Paso {i + 1} de {STEPS.length}
              </span>
              <h2 id="pyj-reloj-step-title" ref={headingRef} tabIndex={-1} className="pyj-reloj_h2">
                {STEPS[i].titulo}
              </h2>
            </div>

            {step === "caja" && <StepCaja {...stepProps} />}
            {step === "esfera" && <StepEsfera {...stepProps} />}
            {step === "agujas" && <StepAgujas {...stepProps} />}
            {step === "correa" && <StepCorrea {...stepProps} />}
            {step === "tapa" && <StepTapa {...stepProps} />}
            {step === "resumen" && (
              <StepResumen
                config={final}
                goTo={goTo}
                order={order}
                policy={policy}
                onPolicy={setPolicy}
                onAddToCart={addToCart}
                added={added}
                descontinuado={descontinuado}
              />
            )}
          </section>

          <div className="pyj-reloj_nav">
            {prev ? (
              <button type="button" className="pyj-reloj_ghost" onClick={() => goTo(prev.id)}>
                ‹ {prev.label}
              </button>
            ) : (
              <button type="button" className="pyj-reloj_ghost" onClick={backToEntry}>
                ‹ Cambiar de Orisha
              </button>
            )}
            <span className="pyj-reloj_navprice">{order.priceLabel}</span>
            {next && (
              <button type="button" className="pyj-btn-gold pyj-reloj_next" onClick={() => goTo(next.id)}>
                {next.id === "resumen" ? "Ver resumen" : `Siguiente: ${next.label}`} ›
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pie fijo del móvil: paso actual + avanzar, o el botón de pedir. */}
      <div className="pyj-reloj_mbar">
        <button
          type="button"
          className="pyj-reloj_mbtn"
          aria-label={prev ? `Paso anterior: ${prev.label}` : "Cambiar de Orisha"}
          onClick={() => (prev ? goTo(prev.id) : backToEntry())}
        >
          ‹
        </button>
        <span className="pyj-reloj_mstep">
          <strong>
            {STEPS[i].label} · {i + 1}/{STEPS.length}
          </strong>
          <small>{order.priceLabel}</small>
        </span>
        {next ? (
          <button type="button" className="pyj-btn-gold pyj-reloj_mnext" onClick={() => goTo(next.id)}>
            {next.id === "resumen" ? "Resumen" : next.label} ›
          </button>
        ) : (
          <OrderCta
            order={order}
            policy={policy}
            onAddToCart={addToCart}
            added={added}
            onBlocked={showBlocker}
          />
        )}
      </div>
    </div>
  );
}
