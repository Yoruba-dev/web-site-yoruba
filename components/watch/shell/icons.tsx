// Iconos del creador. Cada uno dibuja SU pieza (decisión 19 del dueño): el mismo
// dibujo en el paso, en la vista y en la ficha. Dos rejillas: 24 × 24 para las
// piezas y las herramientas del reloj, 20 × 20 para los de uso general (cerrar,
// volver, lápiz…). Color = currentColor. Todos decorativos (aria-hidden): el
// nombre lo lleva el botón. Los que usan máscara llevan ids propios (useId).
import { useId, type ReactNode } from "react";

export type IconName =
  // — uso general (20) —
  | "close"
  | "back"
  | "next"
  | "check"
  | "whatsapp"
  | "pencil"
  | "copy"
  | "download"
  | "alert"
  | "bag"
  // — piezas y pasos (24) —
  | "caja"
  | "esfera"
  | "correa"
  | "tapa"
  | "listo"
  // — cierres (24) —
  | "hebilla"
  | "desplegable"
  | "plegable"
  // — vistas (24) —
  | "tres4"
  | "lado"
  | "frente"
  // — herramientas (24) —
  | "moon"
  | "photo"
  | "cube"
  | "eye"
  | "zoom"
  | "undo"
  | "share"
  | "info"
  | "help"
  | "more";

/** Iconos de uso general, rejilla 20. */
const P20: Partial<Record<IconName, ReactNode>> = {
  close: (
    <>
      <path d="m5 5 10 10" />
      <path d="M15 5 5 15" />
    </>
  ),
  back: <path d="M12.4 4.4 6.8 10l5.6 5.6" />,
  next: <path d="M7.6 4.4 13.2 10l-5.6 5.6" />,
  check: <path d="m4.4 10.4 3.6 3.6 7.6-8" />,
  whatsapp: (
    <>
      <path d="M3.6 16.6 4.6 13A7 7 0 1 1 7.4 15.8Z" />
      <path d="M7.6 7.4c0 2.8 2.2 5 5 5l.9-1.3-1.7-.9-.8.8a3.6 3.6 0 0 1-2-2l.8-.8-.9-1.7Z" strokeWidth="1.1" />
    </>
  ),
  pencil: (
    <>
      <path d="M3.6 16.4 4.2 13 13.4 3.8l2.8 2.8L7 15.8Z" />
      <path d="m11.6 5.6 2.8 2.8" />
    </>
  ),
  copy: (
    <>
      <rect x="6.6" y="6.6" width="10" height="10" />
      <path d="M13.4 6.6V3.4h-10v10h3.2" />
    </>
  ),
  download: (
    <>
      <path d="M10 3v9.6" />
      <path d="m6.4 9.2 3.6 3.6 3.6-3.6" />
      <path d="M3.6 16.4h12.8" />
    </>
  ),
  bag: (
    <>
      <path d="M4.4 6.8h11.2l-.9 10.4H5.3Z" />
      <path d="M7.4 8.6V5.4a2.6 2.6 0 0 1 5.2 0v3.2" />
    </>
  ),
  alert: (
    <>
      <path d="M10 2.6 18 16.8H2Z" />
      <path d="M10 7.8v4.4" />
      <path d="M10 14.4v.1" strokeWidth="2" />
    </>
  ),
};

/** Iconos de las piezas, rejilla 24. `m` = id único de máscara. */
const P24: Partial<Record<IconName, (m: string) => ReactNode>> = {
  // La caja octogonal de frente: bisel, cristal y la corona a la derecha.
  caja: () => (
    <g transform="translate(-.6 0)">
      <path d="M7.6 3.4h8.8l4.2 4.2v8.8l-4.2 4.2H7.6l-4.2-4.2V7.6Z" />
      <circle cx="12" cy="12" r="5.1" />
      <path d="M20.6 10.5h1.1a.6.6 0 0 1 .6.6v1.8a.6.6 0 0 1-.6.6h-1.1" />
    </g>
  ),
  // La esfera: triángulo a las 12, fecha a las 3, puntos de lume y agujas.
  esfera: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.6 5.1h2.8L12 7.4Z" fill="currentColor" strokeWidth="1.1" />
      <circle cx="6.1" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.9" r="1" fill="currentColor" stroke="none" />
      <rect x="15.8" y="11" width="2.5" height="2" strokeWidth="1.1" />
      <path d="M12 12 9.2 10.3M12 12l3.9-3.2" />
    </>
  ),
  // Una correa de caucho suelta: extremo con muesca (dos puntas), ranuras a lo
  // ancho y punta en ojiva.
  correa: () => (
    <>
      <path d="M6.2 2.6h2.9v2.5h5.8V2.6h2.9l-1.4 9.2v3.4c0 2.9-2.2 4.7-4.4 6.2-2.2-1.5-4.4-3.3-4.4-6.2v-3.4Z" />
      <path d="M10.6 9.2h2.8M10.6 12.6h2.8M10.6 16h2.8" strokeWidth="2" strokeLinecap="butt" />
    </>
  ),
  // La tapa por detrás: octógono, tapa con sus seis entalles y la corona a la
  // IZQUIERDA (se mira por el dorso).
  tapa: () => (
    <g transform="translate(.6 0)">
      <path d="M7.6 3.4h8.8l4.2 4.2v8.8l-4.2 4.2H7.6l-4.2-4.2V7.6Z" />
      <path d="M3.4 10.5H2.3a.6.6 0 0 0-.6.6v1.8c0 .33.27.6.6.6h1.1" />
      <circle cx="12" cy="12" r="5.9" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d="M12 6.4v1.9" strokeWidth="2.1" strokeLinecap="butt" transform={`rotate(${a} 12 12)`} />
      ))}
    </g>
  ),
  // El reloj terminado con su sello de "hecho".
  listo: (m) => (
    <>
      <mask id={`${m}a`}>
        <rect width="24" height="24" fill="#fff" />
        <circle cx="17.7" cy="17.5" r="5.7" fill="#000" />
      </mask>
      <mask id={`${m}b`}>
        <circle cx="17.7" cy="17.5" r="4.4" fill="#fff" />
        <path d="m15.7 17.6 1.4 1.4 2.6-2.8" stroke="#000" strokeWidth="1.6" fill="none" />
      </mask>
      <g mask={`url(#${m}a)`}>
        <path d="M8.5 5.6 9.1 2.6h4.8l.6 3M8.5 18.4l.6 3h4.8l.6-3" />
        <path d="M8.7 5.6h5.6l3 3v6.8l-3 3H8.7l-3-3V8.6Z" />
        <circle cx="11.5" cy="12" r="3" />
      </g>
      <circle cx="17.7" cy="17.5" r="4.4" fill="currentColor" stroke="none" mask={`url(#${m}b)`} />
    </>
  ),
  // La hebilla: U abierta con cabeza de pentágono, la púa y la trabilla.
  hebilla: () => (
    <>
      <path d="M14.6 5.4H7.4L3.2 12l4.2 6.6h7.2" />
      <path d="M4.4 12h9" />
      <path d="M12.4 8.3h9.2M12.4 15.7h9.2M12.4 8.3v7.4" />
      <path d="M17.6 6.6v10.8" strokeWidth="2.2" />
    </>
  ),
  // El desplegable de puente: el marco que abraza la correa, sus dos pulsadores
  // y los agujeros de la cola.
  desplegable: () => (
    <>
      <path d="M2.4 7.8h3.2M2.4 16.2h3.2M15.4 7.8h6.2M15.4 16.2h6.2" />
      <path d="M15.4 8.6V5.2H6.6a1 1 0 0 0-1 1v11.6a1 1 0 0 0 1 1h8.8v-3.4" />
      <path d="M10 5.2v13.6" />
      <path d="M13.6 5.2V3.2M13.6 18.8v2" strokeWidth="2.8" strokeLinecap="butt" />
      <path d="M14.2 12h.1M18.6 12h.1" strokeWidth="2.2" />
    </>
  ),
  // El plegable del brazalete: una barra lisa entre los eslabones H, con su
  // media luna en cada flanco.
  plegable: () => (
    <>
      <path d="M2.4 7.2h19.2M2.4 16.8h19.2M8.8 7.2v9.6M15.2 7.2v9.6" />
      <rect x="3.6" y="9.8" width="3.2" height="4.4" strokeWidth="1.3" />
      <rect x="17.2" y="9.8" width="3.2" height="4.4" strokeWidth="1.3" />
      <path d="M9.8 7.2c.5-2.3 3.9-2.3 4.4 0ZM9.8 16.8c.5 2.3 3.9 2.3 4.4 0Z" fill="currentColor" strokeWidth="1" />
    </>
  ),
  // El reloj girado 3/4: cara, canto con su corona y las correas en fuga.
  tres4: () => (
    <>
      <path d="M7.6 4.6 8.4 1.9h5.2l1 3.6M7.6 19.4l.8 2.7h5.2l1-3.6" />
      <path d="M7.2 4.6h4.6l2.6 3.4v8l-2.6 3.4H7.2L4.6 16V8Z" />
      <path d="M11.8 4.6l2.8.9L17.2 9v6l-2.6 3.5-2.8.9" />
      <ellipse cx="9.5" cy="12" rx="2.5" ry="3.9" />
      <path d="M17.2 10.9h.9a.5.5 0 0 1 .5.5v1.2a.5.5 0 0 1-.5.5h-.9" />
    </>
  ),
  // El reloj de perfil: lazo más ancho que alto, la caja arriba con la corona al
  // centro y el cierre abajo.
  lado: () => (
    <>
      <rect x="6.2" y="3.8" width="11.6" height="4.6" rx="1.4" />
      <circle cx="12" cy="6.1" r="1.15" fill="currentColor" stroke="none" />
      <path d="M6.4 7.6C3.6 8.6 1.9 10.6 1.9 13.1c0 3.6 2.9 5.9 6.7 6.6" />
      <path d="M17.6 7.6c2.8 1 4.5 3 4.5 5.5 0 3.6-2.9 5.9-6.7 6.6" />
      <rect x="8.6" y="18.1" width="6.8" height="3.1" rx="1" />
    </>
  ),
  frente: () => (
    <>
      <path d="M8.8 5.6 9.4 2.4h5.2l.6 3.2M8.8 18.4l.6 3.2h5.2l.6-3.2" />
      <path d="M8.8 5.6h6.4l3.2 3.2v6.4l-3.2 3.2H8.8l-3.2-3.2V8.8Z" />
      <circle cx="12" cy="12" r="3.3" />
      <path d="M18.4 11h.9a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-.9" />
    </>
  ),
  // La esfera a oscuras: los puntos de lume encendidos y la luna.
  moon: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="5.8" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="18.2" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.2" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="5.8" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <path d="M11.53 8.43A3.6 3.6 0 1 0 15.48 12.91 3 3 0 0 1 11.53 8.43Z" fill="currentColor" strokeWidth="1" />
    </>
  ),
  photo: () => (
    <>
      <path d="M8.6 6.6 9.8 4.4h4.4l1.2 2.2" />
      <rect x="2.8" y="6.6" width="18.4" height="13" rx="2.6" />
      <circle cx="12" cy="13.1" r="3.6" />
      <circle cx="17.7" cy="9.6" r=".85" fill="currentColor" stroke="none" />
    </>
  ),
  // El reloj con su órbita: el modelo que se gira.
  cube: () => (
    <>
      <path d="M10.4 5.8l.3-2.4h2.6l.3 2.4" />
      <path d="M10.2 5.8h3.6L16 8v3.6l-2.2 2.2h-3.6L8 11.6V8Z" />
      <path d="M5.6 12.4c-2 .6-3.2 1.5-3.2 2.5 0 2.3 4.3 4.2 9.6 4.2s9.6-1.9 9.6-4.2c0-1-1-1.8-2.9-2.4" />
      <path d="m16.8 11.1 2.1 1.4-1.3 2" />
    </>
  ),
  // El reloj entero dentro de un encuadre: todas las piezas.
  eye: () => (
    <>
      <path d="M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4" />
      <path d="M9.7 7.2l.4-2.6h3.8l.4 2.6M9.7 16.8l.4 2.6h3.8l.4-2.6" />
      <path d="M10 7.2h4l2.8 2.8v4L14 16.8h-4L7.2 14v-4Z" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  zoom: () => (
    <>
      <circle cx="10.6" cy="10.6" r="6.8" />
      <path d="m15.6 15.6 5.4 5.4M10.6 7.8v5.6M7.8 10.6h5.6" />
    </>
  ),
  undo: () => (
    <>
      <path d="M8.6 4.8 4.2 9.2l4.4 4.4" />
      <path d="M4.6 9.2h9.2a5.5 5.5 0 0 1 0 11h-4" />
    </>
  ),
  share: () => (
    <>
      <path d="M12 3.2v10.6" />
      <path d="M8.4 6.8 12 3.2l3.6 3.6" />
      <path d="M8.6 10H6.6A1.6 1.6 0 0 0 5 11.6v7.8A1.6 1.6 0 0 0 6.6 21h10.8a1.6 1.6 0 0 0 1.6-1.6v-7.8A1.6 1.6 0 0 0 17.4 10h-2" />
    </>
  ),
  info: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.4" />
      <path d="M12 7.7v.1" strokeWidth="2.3" />
    </>
  ),
  help: () => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.6a2.6 2.6 0 1 1 3.9 2.3c-.9.5-1.3 1-1.3 2" />
      <path d="M12 16.9v.1" strokeWidth="2.3" />
    </>
  ),
  more: () => (
    <>
      <circle cx="5.4" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="18.6" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
};

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  const m = `pyjic${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pieza = P24[name];
  return (
    <svg
      className={`rl-icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox={pieza ? "0 0 24 24" : "0 0 20 20"}
      fill="none"
      stroke="currentColor"
      // Trazo 1.6; en la rejilla de 24 y a 20 px o menos, un punto más grueso
      // para que no se adelgace al reducirse.
      strokeWidth={pieza && size <= 20 ? 1.75 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {pieza ? pieza(m) : P20[name]}
    </svg>
  );
}

/** El icono del cierre que lleva el reloj (dock, resumen). */
export function claspIcon(tipoCorrea: string | undefined, cierre: string): IconName {
  if (tipoCorrea === "brazalete") return "plegable";
  return cierre === "desplegable" ? "desplegable" : "hebilla";
}
