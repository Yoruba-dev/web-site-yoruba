"use client";

// ---------------------------------------------------------------------------
// EL ESCENARIO 3D — envoltorio LIGERO (sin three). Contrato con el editor:
// ./stage3d-contract.ts (spec SPEC-EDITOR-V2 §5).
//
// • Llena su caja (position:absolute; inset:0). Pinta YA el `poster` (el
//   compositor de fotos con la misma máscara) y, cuando el navegador está
//   libre (requestIdleCallback, 1200 ms como mucho) o alguien llama a
//   preload3D(), baja la escena (components/watch/three/WatchScene.tsx, con
//   three + fiber + drei) con next/dynamic sin SSR. Ningún trozo de primera
//   carga lleva three.
// • El lienzo aparece encima del poster (400 ms) tras el primer fotograma
//   completo. Un solo lienzo por página: con active=false ("Foto real") se
//   esconde, no pinta y conserva el contexto WebGL.
// • Sus avisos (cargando, error, contexto perdido, la pista de cómo girarlo)
//   van dentro del rectángulo que la interfaz deja libre (insets) y usan
//   app/creador-de-relojes/watch-3d.css (prefijo pyj-r3d).
// • Teclado con el visor enfocado: flechas giran, + / − acercan y alejan,
//   1–4 piden Perspectiva, Correa entera, Esfera y Tapa (onViewRequest).
// • Un error cae al poster con "Reintentar" (si lo que falló fue BAJAR el
//   trozo, recarga la página: el cargador guarda el fallo); un contexto WebGL
//   perdido muestra "Recargar vista 3D". Ambos se reportan (lib/report-error).
// ---------------------------------------------------------------------------
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import "@/app/creador-de-relojes/watch-3d.css";
import { reportError } from "@/lib/report-error";
import { summary } from "@/lib/watch";
import {
  ALL_SOLID,
  NO_INSETS,
  type Stage3DStatus,
  type Support3D,
  type View3D,
  type ViewInsets,
  type WatchStage3DProps,
} from "./stage3d-contract";
import type { InsetsSource, Nudge, SceneApi } from "./three/types";

const WatchScene = dynamic(() => import("./three/WatchScene"), { ssr: false, loading: () => null });

// ===========================================================================
// Precarga (idempotente): baja el trozo y pide a los visores montados que
// monten ya la escena, sin esperar al hueco del navegador.
// ===========================================================================
let preloadWanted = false;
const preloadListeners = new Set<() => void>();

export function preload3D(): void {
  if (typeof window === "undefined" || preloadWanted) return;
  preloadWanted = true;
  // El mismo especificador que la escena diferida: el mismo trozo.
  import("./three/WatchScene").catch(() => {
    // El fallo se verá (y se reporta) al montar la escena: aquí no se repite.
  });
  preloadListeners.forEach((fn) => fn());
}

function subscribePreload(fn: () => void): () => void {
  preloadListeners.add(fn);
  return () => preloadListeners.delete(fn);
}

// ===========================================================================
// ¿Qué puede pintar este equipo?
// ===========================================================================
let webglCache: boolean | null = null;

/** three r187 SOLO pide "webgl2": WebGL 1 a secas no cuenta. */
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

/** Banderas de prueba (solo fuera de producción): ?sin3d fuerza la vista de
 *  fotos, ?ligero el modo de equipo modesto. */
function devFlag(name: string): boolean {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).has(name);
  } catch {
    return false;
  }
}

let supportCache: Support3D | null = null;

function probeSupport(): Support3D {
  if (supportCache) return supportCache;
  if (devFlag("sin3d") || !hasWebGL()) return (supportCache = "no");
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const c = nav.connection;
  const lento = c?.effectiveType === "2g" || c?.effectiveType === "slow-2g";
  const modesto = (nav.deviceMemory ?? 8) <= 2 && (nav.hardwareConcurrency ?? 8) <= 4;
  supportCache = devFlag("ligero") || c?.saveData || lento || modesto ? "ligero" : "completo";
  return supportCache;
}

/** Corre `fn` cuando el navegador está libre (como mucho `timeout` ms). */
function onIdle(fn: () => void, timeout: number): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const t = window.setTimeout(fn, Math.min(timeout, 600));
  return () => window.clearTimeout(t);
}

/** null mientras no se sabe (servidor, primer render y hasta que el navegador
 *  esté libre, ≤ 1500 ms: la prueba crea un contexto WebGL y no debe competir
 *  con la primera pintada), luego "completo" / "ligero" / "no". */
export function use3DSupport(): Support3D | null {
  const [s, setS] = useState<Support3D | null>(supportCache);
  useEffect(() => {
    if (supportCache) {
      setS(supportCache);
      return;
    }
    return onIdle(() => setS(probeSupport()), 1500);
  }, []);
  return s;
}

/** (Compatibilidad) null mientras no se sabe, luego si hay WebGL 2. */
export function useWebGL(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(webglCache);
  useEffect(() => {
    if (webglCache !== null) {
      setOk(webglCache);
      return;
    }
    return onIdle(() => setOk(hasWebGL()), 1500);
  }, []);
  return ok;
}

// ===========================================================================
// Errores
// ===========================================================================
/** ¿El error es un trozo de JS que no bajó (red, despliegue nuevo)? */
function esTrozo(e: unknown): boolean {
  return e instanceof Error && (e.name === "ChunkLoadError" || /Failed to load chunk|Loading chunk/i.test(e.message));
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

// ===========================================================================
// Teclado
// ===========================================================================
const VIEW_KEYS: Readonly<Record<string, View3D>> = { "1": "tres4", "2": "lado", "3": "esfera", "4": "tapa" };
/** Paso de giro con las flechas (radianes). */
const PASO_AZ = 0.35;
const PASO_POL = 0.15;

function pistaTexto(): string {
  if (typeof window === "undefined") return "";
  return window.matchMedia("(pointer: coarse)").matches
    ? "Desliza para girarlo · pellizca para acercar"
    : "Arrastra para girarlo · rueda para acercar";
}

const sameInsets = (a: ViewInsets, b: ViewInsets) =>
  a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;

export default function WatchStage3D(props: WatchStage3DProps) {
  const { config, poster, className, ref, onStatus, onPartPick, onViewRequest, onInteract } = props;
  // Defensivo en tiempo de ejecución (el tipo los exige): un llamador antiguo
  // sin máscara ve el reloj entero en perspectiva, sin recuadros y activo.
  const confirmed = props.confirmed ?? ALL_SOLID;
  const insets = props.insets ?? NO_INSETS;
  const active = props.active ?? true;
  const view = props.view ?? "tres4";
  const viewSeq = props.viewSeq ?? 0;
  const noche = props.noche ?? false;
  const mode = props.mode ?? "editor";

  const webgl = useWebGL();
  const wanted = useSyncExternalStore(subscribePreload, () => preloadWanted, () => false);
  const [idle, setIdle] = useState(false);
  useEffect(() => onIdle(() => setIdle(true), 1200), []);
  const load = webgl === true && (idle || wanted);

  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [gen, setGen] = useState(0);
  const [tocado, setTocado] = useState(false);
  const [pista, setPista] = useState("");
  const [nudge, setNudge] = useState<Nudge>({ seq: 0, az: 0, pol: 0, zoom: 1 });

  // — Estado hacia el editor ————————————————————————————————————————————
  const status: Stage3DStatus =
    webgl === false ? "sin-3d" : fallo ? "error" : lost ? "pausado" : ready ? "listo" : "cargando";
  const statusCb = useRef(onStatus);
  useLayoutEffect(() => {
    statusCb.current = onStatus;
  });
  useEffect(() => {
    statusCb.current?.(status);
  }, [status]);

  // — Recuadros tapados: una fuente estable que la escena lee sin re-render ——
  const insetsRef = useRef(insets);
  const [insetsSrc] = useState<InsetsSource & { listeners: Set<() => void> }>(() => {
    const listeners = new Set<() => void>();
    return {
      listeners,
      get: () => insetsRef.current,
      subscribe: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
    };
  });
  useLayoutEffect(() => {
    if (sameInsets(insetsRef.current, insets)) return;
    insetsRef.current = { ...insets };
    insetsSrc.listeners.forEach((fn) => fn());
  }, [insets, insetsSrc]);

  // — API de la escena (la foto de estudio) ————————————————————————————————
  const api = useRef<SceneApi | null>(null);
  const handleApi = useCallback((a: SceneApi | null) => {
    api.current = a;
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      async capture(opts) {
        const a = api.current;
        if (!a) return null;
        try {
          return await a.capture(opts);
        } catch (err) {
          reportError(err, { area: "reloj-3d", fase: "foto" });
          return null;
        }
      },
    }),
    [],
  );

  // — Gestos y pista ————————————————————————————————————————————————————
  const interactCb = useRef(onInteract);
  useLayoutEffect(() => {
    interactCb.current = onInteract;
  });
  // El primer gesto avisa al editor UNA vez. Con una ref y fuera del
  // actualizador de estado: los actualizadores corren durante el pintado, y
  // llamar desde ahí al onInteract del editor (que cambia SU estado) daba
  // "Cannot update a component while rendering a different component".
  const tocadoRef = useRef(false);
  const handleInteract = useCallback(() => {
    if (tocadoRef.current) return;
    tocadoRef.current = true;
    setTocado(true);
    interactCb.current?.();
  }, []);
  useEffect(() => {
    if (!ready || tocado) {
      setPista("");
      return;
    }
    setPista(pistaTexto());
    const t = window.setTimeout(() => setPista(""), 6000);
    return () => window.clearTimeout(t);
  }, [ready, tocado]);

  const handleReady = useCallback(() => setReady(true), []);
  const handleLost = useCallback(() => {
    reportError(new Error("WebGL: contexto perdido"), { area: "reloj-3d", fase: "contexto" });
    setLost(true);
    setReady(false);
  }, []);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!ready || e.altKey || e.ctrlKey || e.metaKey) return;
    const v = VIEW_KEYS[e.key];
    if (v) {
      e.preventDefault();
      handleInteract();
      onViewRequest?.(v);
      return;
    }
    const d: Omit<Nudge, "seq"> | null =
      e.key === "ArrowLeft"
        ? { az: -PASO_AZ, pol: 0, zoom: 1 }
        : e.key === "ArrowRight"
          ? { az: PASO_AZ, pol: 0, zoom: 1 }
          : e.key === "ArrowUp"
            ? { az: 0, pol: -PASO_POL, zoom: 1 }
            : e.key === "ArrowDown"
              ? { az: 0, pol: PASO_POL, zoom: 1 }
              : e.key === "+" || e.key === "="
                ? { az: 0, pol: 0, zoom: 0.85 }
                : e.key === "-" || e.key === "_"
                  ? { az: 0, pol: 0, zoom: 1.18 }
                  : null;
    if (!d) return;
    e.preventDefault();
    handleInteract();
    setNudge((n) => ({ seq: n.seq + 1, ...d }));
  };

  const safe = {
    top: insets.top,
    right: insets.right,
    bottom: insets.bottom,
    left: insets.left,
  };
  const cls = `pyj-r3d${className ? ` ${className}` : ""}`;
  const showCanvas = ready && active && !lost && !fallo;

  const fallback = (retry: () => void) => (
    <div className="pyj-r3d_safe" style={safe}>
      <div className="pyj-r3d_msg" role="note">
        <p>No pudimos abrir la vista 3D en este equipo. Te mostramos la foto de tu reloj.</p>
        <button
          type="button"
          className="pyj-r3d_btn"
          onClick={() => {
            setReady(false);
            setGen((g) => g + 1);
            retry();
          }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={cls}
      data-listo={showCanvas ? "" : undefined}
      data-inactivo={active ? undefined : ""}
      data-noche={noche ? "" : undefined}
    >
      <div className="pyj-r3d_poster" style={safe} aria-hidden={showCanvas || undefined}>
        {poster}
      </div>
      {webgl && (
        <Boundary fallback={fallback} onError={setFallo}>
          {load && !lost && (
            <div
              className="pyj-r3d_stage"
              role="application"
              aria-roledescription="visor 3D"
              aria-label={`Tu reloj en 3D: ${summary(config)}. Flechas para girarlo, + y − para acercarlo, 1 a 4 para cambiar de vista.`}
              tabIndex={active ? 0 : -1}
              onKeyDown={onKey}
            >
              <WatchScene
                key={gen}
                config={config}
                confirmed={confirmed}
                view={view}
                viewSeq={viewSeq}
                noche={noche}
                mode={mode}
                active={active}
                insets={insetsSrc}
                nudge={nudge}
                onReady={handleReady}
                onContextLost={handleLost}
                onInteract={handleInteract}
                onPartPick={onPartPick}
                onApi={handleApi}
              />
            </div>
          )}
          <div className="pyj-r3d_safe" style={safe}>
            {load && !ready && !lost && active && (
              <p className="pyj-r3d_pill" role="status">
                <span className="pyj-r3d_spin" aria-hidden="true" />
                Preparando tu reloj en 3D…
              </p>
            )}
            {lost && (
              <div className="pyj-r3d_msg" role="note">
                <p>La vista 3D se pausó para ahorrar memoria.</p>
                <button
                  type="button"
                  className="pyj-r3d_btn"
                  onClick={() => {
                    setLost(false);
                    setGen((g) => g + 1);
                  }}
                >
                  Recargar vista 3D
                </button>
              </div>
            )}
            {pista && active && (
              <p className="pyj-r3d_pill pyj-r3d_pill--hint" aria-hidden="true">
                {pista}
              </p>
            )}
          </div>
        </Boundary>
      )}
    </div>
  );
}
