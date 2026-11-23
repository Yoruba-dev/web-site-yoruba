"use client";

// ---------------------------------------------------------------------------
// Una sola región viva para todo el creador (spec R9.2): pasos, piezas
// colocadas, enlace copiado, guardado. Y el aviso visual breve ("toast",
// 200 ms entrada · 2.4 s · 160 ms salida), que también se anuncia.
// ---------------------------------------------------------------------------
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface Announcer {
  /** Lo dice el lector de pantalla (cortés). */
  announce: (msg: string) => void;
  /** Lo muestra en pantalla un momento y lo anuncia. */
  toast: (msg: string) => void;
}

const Ctx = createContext<Announcer>({ announce: () => undefined, toast: () => undefined });

interface ToastState {
  msg: string;
  seq: number;
  out: boolean;
}

/** El aviso visible va en su propio contexto: así solo <AnnouncerToast/> se
 *  vuelve a pintar al mostrarlo (el editor entero no). */
const ToastCtx = createContext<ToastState | null>(null);

export const useAnnouncer = () => useContext(Ctx);

/** El aviso en pantalla. Va DENTRO de .pyj-reloj-app (lo pinta el editor):
 *  ahí viven los tokens --rl-*, el cristal (.pyj-reloj-app .rl-glass) y su
 *  capa (--rl-z-toast) por encima de la cabecera y la hoja. Fuera del armazón
 *  quedaba sin estilo y debajo de él (z-index 900). */
export function AnnouncerToast() {
  const toast = useContext(ToastCtx);
  if (!toast) return null;
  return (
    <div key={toast.seq} className={`rl-toast rl-glass${toast.out ? " is-out" : ""}`} aria-hidden="true">
      {toast.msg}
    </div>
  );
}

const HOLD_MS = 2400;
const OUT_MS = 160;

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const seq = useRef(0);

  const announce = useCallback((msg: string) => {
    // Vaciar y volver a poner: un mensaje repetido se anuncia otra vez.
    setLive("");
    window.requestAnimationFrame(() => setLive(msg));
  }, []);

  const showToast = useCallback(
    (msg: string) => {
      seq.current += 1;
      setToast({ msg, seq: seq.current, out: false });
      announce(msg);
    },
    [announce],
  );

  useEffect(() => {
    if (!toast || toast.out) return;
    const t = window.setTimeout(() => setToast((x) => (x && x.seq === toast.seq ? { ...x, out: true } : x)), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!toast?.out) return;
    const t = window.setTimeout(() => setToast((x) => (x && x.seq === toast.seq ? null : x)), OUT_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  const value = useMemo(() => ({ announce, toast: showToast }), [announce, showToast]);

  return (
    <Ctx.Provider value={value}>
      <ToastCtx.Provider value={toast}>{children}</ToastCtx.Provider>
      <p className="rl-sr" role="status" aria-live="polite" aria-atomic="true">
        {live}
      </p>
    </Ctx.Provider>
  );
}
