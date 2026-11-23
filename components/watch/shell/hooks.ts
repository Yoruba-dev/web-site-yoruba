"use client";

// ---------------------------------------------------------------------------
// Ganchos del armazón del creador (spec V2 §3): consultas de medios sin romper
// la hidratación, el origen de los enlaces que se comparten y el teclado del
// móvil (visualViewport → --rl-vvh / --rl-vvtop en la raíz).
// ---------------------------------------------------------------------------
import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { SECCION_RELOJES, SITE_URL } from "@/lib/site";

/** true / false según la media query; `ssr` en el servidor y al hidratar. */
export function useMedia(query: string, ssr = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined;
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => ssr,
  );
}

/** El mismo corte que el CSS del armazón: panel a la derecha (escritorio,
 *  tableta apaisada, teléfono apaisado) frente a la hoja inferior (retrato). */
export const MQ_PANEL = "(min-width: 1024px), (min-width: 640px) and (orientation: landscape)";

/** true = panel a la derecha; false = hoja inferior. En el servidor: panel. */
export function usePanelLayout(): boolean {
  return useMedia(MQ_PANEL, true);
}

export function useCoarse(): boolean {
  return useMedia("(pointer: coarse)");
}

const noop = () => () => undefined;

/** De dónde salen los enlaces que se comparten (spec R8 / D13): antes del
 *  lanzamiento, el despliegue en el que se diseña (así el enlace abre aquí);
 *  después, la web canónica. En el servidor, SITE_URL. */
export function useShareOrigin(): string {
  return useSyncExternalStore(
    noop,
    () => (SECCION_RELOJES.lanzado ? SITE_URL : window.location.origin),
    () => SITE_URL,
  );
}

/** Tipos de <input> que NO abren el teclado del móvil. */
const SIN_TECLADO = new Set(["checkbox", "radio", "button", "submit", "reset", "range", "color", "file", "image", "hidden"]);

/** ¿El foco está en un campo que abre el teclado (texto, textarea…)? */
function escribiendo(): boolean {
  const a = document.activeElement;
  if (!(a instanceof HTMLElement)) return false;
  if (a.isContentEditable || a instanceof HTMLTextAreaElement) return true;
  return a instanceof HTMLInputElement && !SIN_TECLADO.has(a.type);
}

/** El teclado del móvil: con visualViewport, la raíz recibe --rl-vvh (alto
 *  visible) y --rl-vvtop (desplazamiento); devuelve true mientras el teclado
 *  tapa más de un cuarto de la pantalla.
 *
 *  Dos casos:
 *  • iOS: el teclado va ENCIMA; innerHeight no cambia y visualViewport sí →
 *    alto visible < 75 % de innerHeight.
 *  • Chrome Android con interactive-widget=resizes-content (page.tsx): el
 *    teclado achica innerHeight Y visualViewport a la vez, así que esa
 *    proporción nunca baja. Se compara con una BASE sin teclado: el alto visto
 *    la última vez que no se escribía CON ESE MISMO ANCHO (una por ancho:
 *    vertical y apaisado tienen la suya). Al girar con el teclado abierto se
 *    usa la base guardada de ese ancho; nunca se mide una con el teclado
 *    abierto. Si ese ancho aún no tiene base, queda solo la prueba de iOS.
 *    Solo cuenta con un campo de texto enfocado, para que encoger la ventana
 *    del escritorio no parezca un teclado. */
export function useKeyboardViewport(root: RefObject<HTMLElement | null>): boolean {
  const [teclado, setTeclado] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    const el = root.current;
    if (!vv || !el) return;
    let raf = 0;
    // Alto sin teclado por ancho de ventana (pocas entradas: al arrastrar la
    // ventana del escritorio se guardan solo las últimas).
    const bases = new Map<number, number>();
    const set = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rl-vvh", `${Math.round(vv.height)}px`);
        el.style.setProperty("--rl-vvtop", `${Math.round(vv.offsetTop)}px`);
        const ancho = window.innerWidth;
        const texto = escribiendo();
        // Sin campo de texto enfocado no hay teclado: el alto actual es la base
        // de este ancho. Con uno enfocado la base no se toca.
        if (!texto) {
          bases.delete(ancho);
          bases.set(ancho, Math.max(window.innerHeight, vv.height));
          if (bases.size > 8) {
            const viejo = bases.keys().next();
            if (!viejo.done) bases.delete(viejo.value);
          }
        }
        const base = bases.get(ancho);
        setTeclado(vv.height < window.innerHeight * 0.75 || (texto && base !== undefined && vv.height < base * 0.75));
      });
    };
    set();
    vv.addEventListener("resize", set);
    vv.addEventListener("scroll", set);
    // Al enfocar o soltar un campo (el teclado puede tardar en mover el
    // visualViewport, y al soltarlo hay que rehacer la base).
    document.addEventListener("focusin", set);
    document.addEventListener("focusout", set);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", set);
      vv.removeEventListener("scroll", set);
      document.removeEventListener("focusin", set);
      document.removeEventListener("focusout", set);
    };
  }, [root]);
  return teclado;
}

/** Lee y escribe en localStorage sin lanzar nunca (modo privado, cuota). */
export const store = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* sin almacenamiento: se sigue sin guardar */
    }
  },
};
