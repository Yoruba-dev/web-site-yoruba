"use client";

// ---------------------------------------------------------------------------
// EL ESCENARIO DEL CREADOR — un reloj "fotografiado" que se arma solo.
//
// Capas alineadas a la plantilla de 1200 × 1600 (lib/watch-capas.ts), de
// abajo arriba:
//   sombra → correa / brazalete (foto) → disco de la esfera (foto) →
//   impresión (SVG de dialPrimitives) → fecha + índices aplicados →
//   aplique PY (foto) → agujas con su sombra → cristal → caja (foto, con la
//   ventana abierta) → [modo noche: oscuridad + lume].
// La vista 'tapa' gira el reloj (la corona pasa a la izquierda): foto real de
// una tapa lisa en el acabado de la caja, con el grabado láser encima.
//
// • armar: la primera vez, las piezas llegan en orden (correa, caja, esfera,
//   impresión, índices, aplique, agujas) en ~1.6 s, cuando sus fotos ya están
//   Y el reloj se ve (≥ 60 % en pantalla): el montaje nunca se gasta fuera de
//   la vista. Si el cliente edita antes, se muestra entero sin animación.
// • Al cambiar una opción solo se funde la capa que cambió; la vieja se queda
//   debajo hasta que la nueva ha cargado (front/layers.tsx).
// • prefers-reduced-motion: todo instantáneo.
// • preloadWatchLayers(config) precarga las capas de una opción (hover).
// ---------------------------------------------------------------------------
import "@/app/creador-de-relojes/watch-front.css";
import { useEffect, useId, useRef, useState } from "react";
import { summary, type WatchConfig } from "@/lib/watch";
import { dialHasDate, handMetalHex, handPose, rimMetalHex } from "@/lib/watch-art";
import { apliqueUrl, nombresCapas, tapaUrl } from "@/lib/watch-capas";
import { AppliedArt, AppliqueArt, CasebackArt, FrontDefs, GlassArt, HandsArt, NightArt, PrintArt, ShadowArt } from "./front/art";
import { PhotoLayer, SvgFundido, useReducedMotion } from "./front/layers";
import { preloadImage, preloadWatchLayers } from "./front/preload";

export { preloadWatchLayers, preferredCapaSize, watchLayerUrls } from "./front/preload";

export type WatchVista = "frente" | "tapa";

export interface WatchFrontProps {
  config: WatchConfig;
  /** Cara que se muestra. */
  vista?: WatchVista;
  /** Modo noche: solo brilla el lume. */
  noche?: boolean;
  /** Animación de montaje pieza a pieza al aparecer (solo al montar). */
  armar?: boolean;
  className?: string;
  /** Prioridad de carga (true en el escenario principal). */
  priority?: boolean;
}

/** Lo que dura la secuencia de montaje en CSS (último retraso + duración). */
const ARMAR_MS = 1600;
/** Cuánto se espera a las fotos antes de empezar a armar igualmente. */
const ESPERA_MAX_MS = 1800;

const VIEWBOX = "0 0 1200 1600";

type Fase = "espera" | "corre" | "hecho";

export default function WatchFront({
  config,
  vista = "frente",
  noche = false,
  armar = false,
  className,
  priority = false,
}: WatchFrontProps) {
  const uid = `wf${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const reducido = useReducedMotion();
  const n = nombresCapas(config);
  const e = config.esfera;

  // — Montaje: espera a las fotos (con tope) y a que el reloj se vea, corre
  //   la secuencia, termina. —
  const [fase, setFase] = useState<Fase>(armar ? "espera" : "hecho");
  const primera = useRef(config);
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fase !== "espera") return;
    let vivo = true;
    const timers: number[] = [];
    let io: IntersectionObserver | null = null;
    const tope = new Promise<void>((r) => timers.push(window.setTimeout(r, ESPERA_MAX_MS)));
    const fotos = Promise.race([preloadWatchLayers(primera.current), tope]);
    // Visible = ≥ 60 % del reloj en pantalla (o, si el reloj es más alto que la
    // ventana, que ocupe ≥ 60 % de ella). Sin IntersectionObserver: ya.
    const visible = new Promise<void>((r) => {
      const el = raiz.current;
      if (!el || typeof IntersectionObserver === "undefined") return r();
      io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            const vh = en.rootBounds?.height ?? window.innerHeight;
            if (en.intersectionRatio >= 0.6 || (vh > 0 && en.intersectionRect.height >= vh * 0.6)) {
              io?.disconnect();
              r();
              return;
            }
          }
        },
        { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      );
      io.observe(el);
    });
    Promise.all([fotos, visible]).then(() => {
      if (!vivo) return;
      // Solo si sigue esperando (una edición temprana ya lo dio por hecho).
      setFase((f) => (f === "espera" ? "corre" : f));
      timers.push(window.setTimeout(() => vivo && setFase("hecho"), ARMAR_MS + 120));
    });
    return () => {
      vivo = false;
      io?.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
    // Solo al montar: "armar" es la primera entrada (la config de ese momento
    // va en `primera`).
  }, []);

  // Si el cliente cambia algo mientras el montaje aún espera (armar pasa a
  // false), el reloj se muestra entero al momento: nunca piezas invisibles.
  if (!armar && fase === "espera") setFase("hecho");

  // — La tapa se monta la primera vez que se pide (y su foto se precarga). —
  const [conTapa, setConTapa] = useState(vista === "tapa");
  if (vista === "tapa" && !conTapa) setConTapa(true);
  useEffect(() => {
    const t = window.setTimeout(() => void preloadImage(tapaUrl(1024)), ARMAR_MS + 900);
    return () => window.clearTimeout(t);
  }, []);

  // Claves de fundido: cada capa SVG cambia solo si cambia lo que pinta.
  const kImpresion = JSON.stringify([e.modelo, e.base, e.degradado, e.pista, e.texto, e.signo, e.signoPos]);
  const kIndices = JSON.stringify([e.modelo, e.base, dialHasDate(config), rimMetalHex(config)]);
  const kAgujas = JSON.stringify([config.segundero, e.base, handMetalHex(config), handPose(config)]);
  // El aplique mide ~87 px en la plantilla: la versión de 256 px sobra siempre.
  const aplique = apliqueUrl(n.aplique, 600);

  const resumen = summary(config);
  const label = vista === "tapa" ? `Tapa de tu reloj, con el grabado: ${resumen}` : `Vista previa de tu reloj: ${resumen}`;

  return (
    <div
      ref={raiz}
      className={`wf${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={label}
      data-vista={vista}
      data-noche={noche ? "" : undefined}
      data-armar={fase === "hecho" ? undefined : fase}
    >
      <div className="wf-flip">
        <div className="wf-cara wf-frente" aria-hidden="true">
          <svg className="wf-capa wf-part wf-p-sombra wf-correa-mask" viewBox={VIEWBOX} focusable="false">
            <ShadowArt p={`${uid}s`} />
          </svg>
          <PhotoLayer className="wf-part wf-p-correa wf-correa-mask" name={n.correa} priority={priority} reducido={reducido} />
          <PhotoLayer className="wf-part wf-p-esfera" name={n.esfera} priority={priority} reducido={reducido} />
          <svg className="wf-capa" viewBox={VIEWBOX} focusable="false">
            <FrontDefs p={uid} />
            <SvgFundido
              className="wf-part wf-p-impresion"
              ns={`${uid}i`}
              k={kImpresion}
              value={config}
              reducido={reducido}
              render={(v, q) => <PrintArt c={v} p={uid} q={q} />}
            />
            <SvgFundido
              className="wf-part wf-p-indices"
              ns={`${uid}x`}
              k={kIndices}
              value={config}
              reducido={reducido}
              render={(v, q) => <AppliedArt c={v} p={uid} q={q} />}
            />
            <SvgFundido
              className="wf-part wf-p-aplique"
              ns={`${uid}a`}
              k={aplique}
              value={config}
              reducido={reducido}
              render={(v) => <AppliqueArt c={v} p={uid} href={apliqueUrl(nombresCapas(v).aplique, 600)} />}
            />
            <SvgFundido
              className="wf-part wf-p-agujas"
              ns={`${uid}h`}
              k={kAgujas}
              value={config}
              reducido={reducido}
              render={(v, q) => <HandsArt c={v} p={uid} q={q} />}
            />
            <g className="wf-part wf-p-cristal">
              <GlassArt p={uid} />
            </g>
          </svg>
          <PhotoLayer className="wf-part wf-p-caja" name={n.caja} priority={priority} reducido={reducido} />
          <svg className="wf-capa wf-noche" viewBox={VIEWBOX} focusable="false">
            <NightArt c={config} p={`${uid}n`} />
          </svg>
        </div>

        {conTapa && (
          <div className="wf-cara wf-tapa" aria-hidden="true">
            <div className="wf-tapa-zoom">
              <svg className="wf-capa wf-correa-mask" viewBox={VIEWBOX} focusable="false">
                <ShadowArt p={`${uid}ts`} />
              </svg>
              <PhotoLayer className="wf-espejo wf-correa-mask" name={n.correa} reducido={reducido} />
              <svg className="wf-capa" viewBox={VIEWBOX} focusable="false">
                <CasebackArt c={config} p={`${uid}t`} />
              </svg>
              <PhotoLayer className="wf-espejo" name={n.caja} reducido={reducido} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
