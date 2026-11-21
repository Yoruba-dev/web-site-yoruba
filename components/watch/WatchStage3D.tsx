"use client";

// ---------------------------------------------------------------------------
// EL RELOJ EN 3D — envoltorio LIGERO (sin three).
//
// • Comprueba WebGL 2 (lo único que pide three r187) una vez, cuando el
//   navegador está libre; sin WebGL 2 se queda en la vista de frente
//   (WatchFront), que es la de siempre.
// • La escena (components/watch/three/WatchScene.tsx, con three + fiber +
//   drei) se importa con next/dynamic y ssr:false SOLO cuando este componente
//   se monta: ni la portada, ni las fichas, ni la primera carga del creador la
//   descargan.
// • Mientras llega y pinta, se ve el compositor de frente debajo con
//   "Preparando tu reloj en 3D…"; luego el lienzo aparece encima.
// • Un error cae a la vista de frente con una nota y "Reintentar" (sin la
//   barra de botones), y se reporta (lib/report-error.ts → Sentry), igual que
//   un contexto WebGL perdido o una foto fallida. Si lo que falló fue BAJAR
//   el trozo, "Reintentar" recarga la página: el cargador de Turbopack guarda
//   el fallo de cada trozo y no lo vuelve a pedir (el diseño está en ?d= y en
//   el borrador). Si el navegador pierde el contexto, "Recargar vista 3D".
// • Botones: Perspectiva, Frente, Perfil, Tapa, Modo noche y Descargar foto
//   (la foto de estudio: perspectiva + tapa en un JPEG). Con el visor
//   enfocado, las flechas giran el reloj.
// ---------------------------------------------------------------------------
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import WatchFront from "./WatchFront";
import { reportError } from "@/lib/report-error";
import { designCode, summary, type WatchConfig } from "@/lib/watch";
import type { Vista3D } from "./three/types";

const WatchScene = dynamic(() => import("./three/WatchScene"), { ssr: false, loading: () => null });

/** ¿El error es un trozo de JS que no bajó (red, despliegue nuevo)? */
function esTrozo(e: unknown): boolean {
  return e instanceof Error && (e.name === "ChunkLoadError" || /Failed to load chunk|Loading chunk/i.test(e.message));
}

let webglCache: boolean | null = null;

/** ¿Este navegador puede pintar la escena? three r187 SOLO pide "webgl2":
 *  un navegador con WebGL 1 a secas caería en el error, así que no cuenta. */
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    if (typeof WebGL2RenderingContext === "undefined") {
      webglCache = false;
      return false;
    }
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2");
    webglCache = !!ctx;
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/** null mientras no se sabe (servidor, primer render y hasta que el navegador
 *  esté libre: la prueba crea un contexto WebGL y no debe competir con la
 *  primera pintada del creador), luego true / false. */
export function useWebGL(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(webglCache);
  useEffect(() => {
    if (webglCache !== null) {
      setOk(webglCache);
      return;
    }
    const run = () => setOk(hasWebGL());
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 600);
    return () => window.clearTimeout(t);
  }, []);
  return ok;
}

class Boundary extends Component<
  { fallback: (retry: () => void) => ReactNode; onError: (on: boolean) => void; children: ReactNode },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error ?? new Error("Error desconocido") };
  }
  componentDidCatch(error: unknown) {
    reportError(error, { area: "reloj-3d", fase: esTrozo(error) ? "trozo" : "render" });
    this.props.onError(true);
  }
  retry = () => {
    if (esTrozo(this.state.error)) {
      window.location.reload();
      return;
    }
    this.props.onError(false);
    this.setState({ error: null });
  };
  render() {
    return this.state.error ? this.props.fallback(this.retry) : this.props.children;
  }
}

/** Etiqueta según el ancho del visor (CSS de contenedor): completa, media y
 *  corta (la de un móvil). */
type Rotulo = readonly [larga: string, media: string, corta: string];

function Etiqueta({ r }: { r: Rotulo }) {
  return (
    <>
      <span className="pyj-reloj3d_l--larga">{r[0]}</span>
      <span className="pyj-reloj3d_l--media">{r[1]}</span>
      <span className="pyj-reloj3d_l--corta">{r[2]}</span>
    </>
  );
}

const VISTAS: readonly { id: Vista3D; r: Rotulo; aria: string }[] = [
  { id: "tres4", r: ["Perspectiva", "Perspectiva", "3/4"], aria: "Vista en perspectiva (tres cuartos)" },
  { id: "frente", r: ["Frente", "Frente", "Frente"], aria: "Vista de frente" },
  { id: "perfil", r: ["Perfil", "Perfil", "Lado"], aria: "Vista de perfil, el lado de la corona" },
  { id: "tapa", r: ["Tapa", "Tapa", "Tapa"], aria: "Vista de la tapa" },
];

/** Paso de giro con las flechas (radianes). */
const PASO_AZ = 0.35;
const PASO_POL = 0.15;

export interface WatchStage3DProps {
  config: WatchConfig;
  className?: string;
  /** Encuadre de la cabeza (el escenario pequeño del móvil). */
  compacto?: boolean;
  /** El modelo ya está pintado (la primera vez). */
  onReady?: () => void;
}

function pistaTexto(): string {
  if (typeof window === "undefined") return "Arrastra para girarlo";
  return window.matchMedia("(pointer: coarse)").matches
    ? "Desliza de lado para girarlo · pellizca para acercar"
    : "Arrastra para girarlo · Ctrl + rueda para acercar";
}

export default function WatchStage3D({ config, className, compacto = false, onReady }: WatchStage3DProps) {
  const webgl = useWebGL();
  const [ready, setReady] = useState(false);
  const [vista, setVista] = useState<{ id: Vista3D; seq: number }>({ id: "tres4", seq: 0 });
  const [nudge, setNudge] = useState({ seq: 0, az: 0, pol: 0 });
  const [noche, setNoche] = useState(false);
  const [foto, setFoto] = useState(0);
  const [aviso, setAviso] = useState("");
  const [lost, setLost] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [gen, setGen] = useState(0);
  const [tocado, setTocado] = useState(false);
  const [pista, setPista] = useState("");

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);
  const handleLost = useCallback(() => {
    reportError(new Error("WebGL: contexto perdido"), { area: "reloj-3d", fase: "contexto" });
    setLost(true);
    setReady(false);
  }, []);
  const handleInteract = useCallback(() => setTocado(true), []);
  const code = designCode(config);
  const handleFoto = useCallback(
    (img: Blob | null) => {
      if (!img) {
        reportError(new Error("Foto 3D: sin imagen"), { area: "reloj-3d", fase: "foto" });
        setAviso("No pudimos preparar la foto en este dispositivo.");
        return;
      }
      const url = URL.createObjectURL(img);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reloj-${code}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setAviso("Foto lista (frente y tapa): revisa tus descargas.");
    },
    [code],
  );
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(""), 4000);
    return () => window.clearTimeout(t);
  }, [aviso]);
  // La pista de cómo girarlo: al quedar listo, unos segundos (o hasta tocarlo).
  useEffect(() => {
    if (!ready || tocado) {
      setPista("");
      return;
    }
    setPista(pistaTexto());
    const t = window.setTimeout(() => setPista(""), 6000);
    return () => window.clearTimeout(t);
  }, [ready, tocado]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d =
      e.key === "ArrowLeft"
        ? { az: -PASO_AZ, pol: 0 }
        : e.key === "ArrowRight"
          ? { az: PASO_AZ, pol: 0 }
          : e.key === "ArrowUp"
            ? { az: 0, pol: -PASO_POL }
            : e.key === "ArrowDown"
              ? { az: 0, pol: PASO_POL }
              : null;
    if (!d || !ready) return;
    e.preventDefault();
    setNudge((n) => ({ seq: n.seq + 1, ...d }));
  };

  const front = <WatchFront config={config} priority className="pyj-reloj3d_front" />;
  const cls = `pyj-reloj3d${className ? ` ${className}` : ""}`;

  if (webgl === false) {
    return (
      <div className={cls} data-sin3d="">
        <div className="pyj-reloj3d_box">{front}</div>
      </div>
    );
  }

  const fallback = (retry: () => void) => (
    <>
      {front}
      <div className="pyj-reloj3d_msg" role="note">
        <p>No pudimos abrir la vista 3D en este dispositivo. Te mostramos tu reloj de frente.</p>
        <button
          type="button"
          className="pyj-reloj_ghost"
          onClick={() => {
            setReady(false);
            setGen((g) => g + 1);
            retry();
          }}
        >
          Reintentar
        </button>
      </div>
    </>
  );

  return (
    <div className={cls} data-listo={ready ? "" : undefined} data-noche={noche ? "" : undefined}>
      {!fallo && (
        <div className="pyj-reloj3d_bar" role="group" aria-label="Controles de la vista 3D">
          <div className="pyj-reloj3d_group" role="group" aria-label="Encuadre">
            {VISTAS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`pyj-reloj3d_btn${vista.id === v.id ? " is-on" : ""}`}
                aria-pressed={vista.id === v.id}
                aria-label={v.aria}
                disabled={!ready}
                onClick={() => setVista((s) => ({ id: v.id, seq: s.seq + 1 }))}
              >
                <Etiqueta r={v.r} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`pyj-reloj3d_btn${noche ? " is-on" : ""}`}
            aria-pressed={noche}
            aria-label="Modo noche"
            disabled={!ready}
            onClick={() => setNoche((x) => !x)}
          >
            <Etiqueta r={["Modo noche", "Noche", "Noche"]} />
          </button>
          <button
            type="button"
            className="pyj-reloj3d_btn"
            aria-label="Descargar foto de estudio: frente y tapa"
            disabled={!ready}
            onClick={() => setFoto((x) => x + 1)}
          >
            <Etiqueta r={["Descargar foto", "Foto", "Foto"]} />
          </button>
        </div>
      )}
      <div className="pyj-reloj3d_box">
        <Boundary fallback={fallback} onError={setFallo}>
          {/* Debajo, el reloj de frente mientras llega la 3D. */}
          {!ready && front}
          {webgl && !lost && (
            <div
              className="pyj-reloj3d_stage"
              role="application"
              aria-roledescription="visor 3D"
              aria-label={`Tu reloj en 3D: ${summary(config)}. Usa las flechas para girarlo.`}
              tabIndex={0}
              onKeyDown={onKey}
            >
              <WatchScene
                key={gen}
                config={config}
                vista={vista.id}
                vistaSeq={vista.seq}
                nudge={nudge}
                noche={noche}
                fotoSeq={foto}
                compacto={compacto}
                onReady={handleReady}
                onFoto={handleFoto}
                onContextLost={handleLost}
                onInteract={handleInteract}
              />
            </div>
          )}
          {!ready && !lost && (
            <p className="pyj-reloj3d_loading" role="status">
              <span className="pyj-reloj3d_spin" aria-hidden="true" />
              Preparando tu reloj en 3D…
            </p>
          )}
          {lost && (
            <div className="pyj-reloj3d_msg" role="note">
              <p>La vista 3D se pausó para ahorrar memoria.</p>
              <button
                type="button"
                className="pyj-reloj_ghost"
                onClick={() => {
                  setLost(false);
                  setGen((g) => g + 1);
                }}
              >
                Recargar vista 3D
              </button>
            </div>
          )}
          {pista && (
            <p className="pyj-reloj3d_hint" aria-hidden="true">
              {pista}
            </p>
          )}
        </Boundary>
      </div>

      <p className="pyj-reloj3d_aviso" role="status" aria-live="polite">
        {aviso}
      </p>
    </div>
  );
}
