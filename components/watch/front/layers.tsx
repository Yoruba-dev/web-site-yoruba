"use client";

// ---------------------------------------------------------------------------
// FUNDIDOS DEL ESCENARIO — cuando el cliente cambia UNA opción, solo esa capa
// cambia, fundiéndose: la capa nueva entra ENCIMA de la que se ve, y la vieja
// no se quita hasta que la nueva está entera (una foto, además, hasta que ha
// cargado y decodificado). Así nunca se ve un hueco blanco.
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useState, useSyncExternalStore, type AnimationEvent, type CSSProperties, type ReactNode } from "react";
import { CAPA_MEDIA_600, capaUrl } from "@/lib/watch-capas";

type Estado = "listo" | "cargando" | "entra";

interface Capa<T> {
  key: string;
  value: T;
  estado: Estado;
}

/** Cuánto puede tardar una foto antes de mostrarla igual (red lenta, un
 *  evento `load` perdido): mejor la foto a medias que la vieja para siempre. */
const CARGA_MAX_MS = 5000;

/** prefers-reduced-motion, sin romper la hidratación (en el servidor, false). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** La pila de una capa con fundido. `carga` = espera a que la nueva diga
 *  listo(key) (una foto); sin carga entra en el acto (un SVG). */
export function useFundido<T>(key: string, value: T, opts: { carga: boolean; reducido: boolean }) {
  const [pila, setPila] = useState<Capa<T>[]>(() => [{ key, value, estado: "listo" }]);
  const top = pila[pila.length - 1];

  // Estado derivado durante el render (patrón de React para "cambió la prop"):
  // la capa nueva aparece en el mismo render que el cambio, sin un fotograma viejo.
  if (top.key !== key) {
    // Lo que se ve ahora: la capa más alta que no está esperando su foto.
    const visible = [...pila].reverse().find((c) => c.estado !== "cargando") ?? top;
    let next: Capa<T>[];
    if (visible.key === key) next = [{ ...visible, value, estado: "listo" }];
    else if (opts.carga) next = [{ ...visible, estado: "listo" }, { key, value, estado: "cargando" }];
    else if (opts.reducido) next = [{ key, value, estado: "listo" }];
    else next = [{ ...visible, estado: "listo" }, { key, value, estado: "entra" }];
    setPila(next);
  }

  const reducido = opts.reducido;
  /** La foto `k` ya está cargada y decodificada. */
  const listo = useCallback(
    (k: string) =>
      setPila((p) => {
        const t = p[p.length - 1];
        if (t.key !== k || t.estado !== "cargando") return p;
        return reducido ? [{ ...t, estado: "listo" }] : [...p.slice(0, -1), { ...t, estado: "entra" }];
      }),
    [reducido],
  );
  /** Terminó de entrar `k`: se quitan las de debajo. */
  const fin = useCallback(
    (k: string) =>
      setPila((p) => {
        const t = p[p.length - 1];
        if (t.key !== k || t.estado !== "entra") return p;
        return [{ ...t, estado: "listo" }];
      }),
    [],
  );

  // Red de seguridad: una foto que no avisa en CARGA_MAX_MS entra igual.
  const pendiente = top.estado === "cargando" ? top.key : null;
  useEffect(() => {
    if (!pendiente) return;
    const t = window.setTimeout(() => listo(pendiente), CARGA_MAX_MS);
    return () => window.clearTimeout(t);
  }, [pendiente, listo]);

  return { pila, listo, fin };
}

/** Clase de cada capa de la pila: la nueva espera (oculta) o entra; la de
 *  debajo sale mientras tanto (con retraso, para no dejar ver el fondo). */
function claseDe<T>(pila: Capa<T>[], i: number): string {
  const c = pila[i];
  const top = pila[pila.length - 1];
  if (c.estado === "cargando") return "wf-cargando";
  if (c.estado === "entra") return "wf-entra";
  if (i < pila.length - 1 && top.estado === "entra") return "wf-sale";
  return "";
}

function alTerminar(k: string, fin: (k: string) => void) {
  return (e: AnimationEvent<Element>) => {
    if (e.target === e.currentTarget && e.animationName === "wf-entra") fin(k);
  };
}

/** Una capa fotográfica de la plantilla (correa, esfera o caja), con fundido.
 *  `name` = nombre base sin tamaño ("correa-caucho-verde"); el <picture> elige
 *  la de 600 en pantallas pequeñas y la de 1200 en el resto. */
export function PhotoLayer({
  name,
  className,
  priority,
  reducido,
  style,
  fantasma,
  revela,
}: {
  name: string;
  className?: string;
  priority?: boolean;
  reducido: boolean;
  style?: CSSProperties;
  /** La pieza aún no se eligió: se pinta "en cristal" (spec V2 §4.8). */
  fantasma?: boolean;
  /** Acaba de pasar de cristal a real (la correa se descubre desde las asas). */
  revela?: boolean;
}) {
  const { pila, listo, fin } = useFundido(name, name, { carga: true, reducido });
  return (
    <div
      className={`wf-capa ${className ?? ""}`}
      style={style}
      aria-hidden="true"
      data-fantasma={fantasma ? "" : undefined}
      data-revela={revela ? "" : undefined}
    >
      {pila.map((c, i) => {
        const espera = c.estado === "cargando";
        const decodificada = (img: HTMLImageElement) => {
          (typeof img.decode === "function" ? img.decode() : Promise.resolve()).catch(() => undefined).then(() => listo(c.key));
        };
        return (
          <picture key={c.key} className={`wf-foto ${claseDe(pila, i)}`} onAnimationEnd={alTerminar(c.key, fin)}>
            <source media={CAPA_MEDIA_600} srcSet={capaUrl(c.key, 600)} />
            <img
              src={capaUrl(c.key, 1200)}
              alt=""
              width={1200}
              height={1600}
              decoding="async"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              draggable={false}
              onLoad={espera ? (e) => decodificada(e.currentTarget) : undefined}
              onError={espera ? () => listo(c.key) : undefined}
              ref={
                espera
                  ? (img) => {
                      // Ya en caché: el evento load pudo pasar antes de conectar el manejador.
                      if (img?.complete && img.naturalWidth > 0) decodificada(img);
                    }
                  : undefined
              }
            />
          </picture>
        );
      })}
    </div>
  );
}

/** Una capa SVG con fundido: `k` identifica lo que se ve (si no cambia, no
 *  hay fundido); `render` la pinta con su valor y un prefijo de ids propio. */
export function SvgFundido<T>({
  k,
  value,
  ns,
  reducido,
  className,
  render,
  fantasma,
}: {
  k: string;
  value: T;
  /** Prefijo de ids de la instancia y la capa (sin espacios). */
  ns: string;
  reducido: boolean;
  className?: string;
  render: (value: T, q: string) => ReactNode;
  /** La pieza aún no se eligió: "en cristal". */
  fantasma?: boolean;
}) {
  const { pila, fin } = useFundido(k, value, { carga: false, reducido });
  return (
    <g className={className} data-fantasma={fantasma ? "" : undefined}>
      {pila.map((c, i) => {
        const top = i === pila.length - 1;
        return (
          <g key={c.key} className={claseDe(pila, i)} onAnimationEnd={alTerminar(c.key, fin)}>
            {/* La de arriba se pinta siempre con el valor de hoy (por si cambió algo
                que no altera la clave); las de debajo, con el suyo. */}
            {render(top ? value : c.value, `${ns}-${hash(c.key)}`)}
          </g>
        );
      })}
    </g>
  );
}

/** Hash corto y estable (FNV-1a) para prefijos de ids. */
export function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}
