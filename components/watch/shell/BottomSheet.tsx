"use client";

// ---------------------------------------------------------------------------
// La hoja inferior del móvil (spec V2 §3.4). Tres alturas:
//   peek = 148 + zona segura · half (por defecto) = clamp(320, 47dvh, 440)
//   (tableta: clamp(360, 40dvh, 480)) · full = alto visible − 48 − 168.
// Se arrastra SOLO desde el asa y la cabecera: el dedo la lleva 1:1; un
// lanzamiento de más de 0.5 px/ms va a la siguiente altura. El asa es un
// <button aria-expanded>: Intro / Espacio recorren las alturas.
// La hoja se mueve con transform (nunca cambia de alto mientras se mueve); la
// zona de opciones se ajusta al terminar (o al empezar, si crece). El pie con
// los botones vive FUERA de la hoja, siempre visible (salvo con el teclado
// abierto: entonces la hoja va a "full" y el escenario queda en 168 px).
// El alto visible se informa cada fotograma (insets del visor 3D).
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";

export type Snap = "peek" | "half" | "full";
const ORDER: readonly Snap[] = ["peek", "half", "full"];

const SNAP_MS = 360;
const HEADER = 48;
const MINI_STAGE = 168;

function clamp(min: number, v: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function safeBottom(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  probe.remove();
  return h;
}

function snapHeights(vh: number, tablet: boolean, sb: number): Record<Snap, number> {
  const full = Math.max(260, vh - HEADER - MINI_STAGE);
  const half = tablet ? clamp(360, vh * 0.4, 480) : clamp(320, vh * 0.47, 440);
  return { peek: Math.min(148 + sb, full), half: Math.min(half, full), full };
}

export default function BottomSheet({
  snap,
  onSnap,
  keyboard,
  onVisibleHeight,
  head,
  tabs,
  footer,
  children,
  label,
  optionsRef,
}: {
  snap: Snap;
  onSnap: (s: Snap) => void;
  /** Teclado abierto: hoja a "full", pie oculto. */
  keyboard: boolean;
  /** Alto visible de la hoja + pie (px), cada fotograma mientras se mueve. */
  onVisibleHeight: (px: number) => void;
  head: ReactNode;
  tabs?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  label: string;
  /** La zona de opciones (para la capa del signo y el foco). */
  optionsRef?: (el: HTMLDivElement | null) => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<Record<Snap, number>>({ peek: 148, half: 397, full: 628 });
  const [settled, setSettled] = useState<number>(397);
  const efectivo: Snap = keyboard ? "full" : snap;
  const target = heights[efectivo];

  // — Alturas: con el alto visible (teclado incluido) y la zona segura.
  useLayoutEffect(() => {
    const sb = safeBottom();
    const calc = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const tablet = window.matchMedia("(min-width: 640px)").matches;
      setHeights(snapHeights(vh, tablet, sb));
    };
    calc();
    window.addEventListener("resize", calc);
    window.visualViewport?.addEventListener("resize", calc);
    return () => {
      window.removeEventListener("resize", calc);
      window.visualViewport?.removeEventListener("resize", calc);
    };
  }, []);

  // — Informar el alto visible cada fotograma mientras la hoja se mueve.
  const raf = useRef(0);
  const report = useCallback(() => {
    const el = sheet.current;
    const root = el?.offsetParent as HTMLElement | null;
    if (!el || !root) return;
    const top = el.getBoundingClientRect().top;
    const bottom = root.getBoundingClientRect().bottom;
    onVisibleHeight(Math.max(0, Math.round(bottom - top)));
  }, [onVisibleHeight]);
  const follow = useCallback(
    (ms: number) => {
      cancelAnimationFrame(raf.current);
      const end = performance.now() + ms;
      const tick = () => {
        report();
        if (performance.now() < end) raf.current = requestAnimationFrame(tick);
      };
      tick();
    },
    [report],
  );
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // — El alto REAL del pie: crece cuando aparece la tarjeta "Te abrimos
  //   WhatsApp…" (Listo). La zona de opciones se acorta con él; con el valor
  //   fijo de --rl-foot-h (64 px) el final de las opciones quedaba debajo de la
  //   tarjeta, sin poder desplazarlo a la vista.
  const [footH, setFootH] = useState(0);
  useLayoutEffect(() => {
    const el = foot.current;
    if (!el) return;
    const read = () => setFootH(el.offsetHeight);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // — Ir a la altura pedida: crecer = la zona de opciones crece YA (el
  //   contenido entra con la hoja); encoger = al terminar.
  const settleTimer = useRef(0);
  const settleTo = useCallback((h: number, now: boolean) => {
    window.clearTimeout(settleTimer.current);
    if (now) setSettled(h);
    else settleTimer.current = window.setTimeout(() => setSettled(h), SNAP_MS);
  }, []);
  const settledRef = useRef(settled);
  settledRef.current = settled;
  useLayoutEffect(() => {
    const el = sheet.current;
    if (!el) return;
    el.style.transform = "";
    settleTo(target, target >= settledRef.current);
    follow(SNAP_MS + 40);
  }, [target, follow, settleTo]);
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  // — Arrastre desde el asa / la cabecera.
  const drag = useRef<{ y0: number; t0: number; h0: number; y: number; t: number; v: number; on: boolean; id: number } | null>(null);
  const justDragged = useRef(false);
  const full = heights.full;

  function onPointerDown(e: RPointerEvent<HTMLDivElement>) {
    if (keyboard || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { y0: e.clientY, t0: e.timeStamp, h0: target, y: e.clientY, t: e.timeStamp, v: 0, on: false, id: e.pointerId };
  }
  function onPointerMove(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dy = e.clientY - d.y0;
    if (!d.on) {
      if (Math.abs(dy) < 6) return;
      d.on = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      sheet.current?.classList.add("is-dragging");
      settleTo(full, true);
    }
    const dt = Math.max(1, e.timeStamp - d.t);
    d.v = (e.clientY - d.y) / dt;
    d.y = e.clientY;
    d.t = e.timeStamp;
    const h = clamp(heights.peek - 24, d.h0 - dy, full + 12);
    if (sheet.current) sheet.current.style.transform = `translateY(${full - h}px)`;
    report();
  }
  function onPointerUp(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.on) return;
    justDragged.current = true;
    window.setTimeout(() => (justDragged.current = false), 0);
    sheet.current?.classList.remove("is-dragging");
    const h = clamp(heights.peek, d.h0 - (e.clientY - d.y0), full);
    let next: Snap;
    if (Math.abs(d.v) > 0.5) {
      // Lanzamiento: la siguiente altura en esa dirección.
      const i = ORDER.indexOf(snapOf(heights, d.h0));
      next = ORDER[clamp(0, i + (d.v < 0 ? 1 : -1), ORDER.length - 1)];
    } else {
      next = snapOf(heights, h);
    }
    // La hoja sale desde donde la dejó el dedo hasta la altura elegida (con
    // la transición de CSS); al cambiar `target`, el estilo en línea se quita
    // y el valor de CSS es el mismo: sin salto.
    if (sheet.current) sheet.current.style.transform = `translateY(${full - heights[next]}px)`;
    follow(SNAP_MS + 40);
    if (next === snap || (keyboard && next === "full")) {
      settleTo(heights[next], false);
      window.setTimeout(() => {
        if (sheet.current && !drag.current) sheet.current.style.transform = "";
      }, SNAP_MS);
    } else onSnap(next);
  }

  const optionsH = Math.max(0, settled - 20 - 44 - (tabs ? 36 : 0));

  return (
    <>
      <section
        ref={sheet}
        className={`rl-sheet rl-glass rl-glass--over${keyboard ? " is-keyboard" : ""}`}
        aria-label={label}
        style={
          {
            "--rl-sheet-full": `${full}px`,
            "--rl-sheet-h": `${target}px`,
          } as CSSProperties
        }
        // El alto final, cuando la transición acaba DE VERDAD: con el equipo
        // cargado (el 3D arrancando) los 400 ms de seguimiento terminaban antes
        // que ella y el visor se quedaba con un recuadro viejo (el reloj, bajo
        // la hoja).
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget) report();
        }}
      >
        <div
          className="rl-sheet_drag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={(e) => {
            if (justDragged.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <button
            type="button"
            className="rl-sheet_grab"
            aria-expanded={efectivo !== "peek"}
            aria-label={efectivo === "full" ? "Achicar las opciones" : "Ver más opciones"}
            onClick={() => onSnap(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length])}
          >
            <span aria-hidden="true" />
          </button>
          <div className="rl-sheet_head">{head}</div>
        </div>
        {tabs && <div className="rl-sheet_tabs">{tabs}</div>}
        <div
          ref={optionsRef}
          className="rl-sheet_opts"
          style={{ height: `max(0px, calc(${optionsH}px - ${footH ? `${footH}px` : "var(--rl-foot-h, 64px)"}))` }}
        >
          {children}
        </div>
      </section>
      <div ref={foot} className={`rl-sheetfoot rl-glass rl-glass--over${keyboard ? " is-hidden" : ""}`}>
        {footer}
      </div>
    </>
  );
}

function snapOf(h: Record<Snap, number>, px: number): Snap {
  let best: Snap = "half";
  let d = Infinity;
  for (const s of ORDER) {
    const k = Math.abs(h[s] - px);
    if (k < d) {
      d = k;
      best = s;
    }
  }
  return best;
}
