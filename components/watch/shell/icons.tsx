// Iconos del creador: trazos de 1.6 px en una caja de 20 × 20, color =
// currentColor. Todos decorativos (aria-hidden): el nombre lo lleva el botón.
import type { ReactNode } from "react";

export type IconName =
  | "share"
  | "info"
  | "close"
  | "eye"
  | "moon"
  | "photo"
  | "cube"
  | "back"
  | "next"
  | "check"
  | "whatsapp"
  | "pencil"
  | "copy"
  | "download"
  | "more"
  | "tres4"
  | "lado"
  | "esfera"
  | "tapa"
  | "frente"
  | "alert"
  | "bag";

const P: Record<IconName, ReactNode> = {
  share: (
    <>
      <path d="M10 2.8v10" />
      <path d="M6.4 6.2 10 2.6l3.6 3.6" />
      <path d="M6 9H4.6v8.4h10.8V9H14" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7.6" />
      <path d="M10 9v5" />
      <path d="M10 6.2v.1" strokeWidth="2.2" />
    </>
  ),
  close: (
    <>
      <path d="m5 5 10 10" />
      <path d="M15 5 5 15" />
    </>
  ),
  eye: (
    <>
      <path d="M1.8 10S4.8 4.6 10 4.6 18.2 10 18.2 10 15.2 15.4 10 15.4 1.8 10 1.8 10Z" />
      <circle cx="10" cy="10" r="2.6" />
    </>
  ),
  moon: <path d="M15.6 12.4A6.6 6.6 0 0 1 7.6 4.4a6.6 6.6 0 1 0 8 8Z" />,
  photo: (
    <>
      <rect x="2.4" y="4.4" width="15.2" height="11.2" />
      <circle cx="7" cy="8.6" r="1.4" />
      <path d="m3 14.6 4.4-4 3.2 2.8 2.6-2.2 4 3.4" />
    </>
  ),
  cube: (
    <>
      <path d="M10 2.4 16.6 6v8L10 17.6 3.4 14V6Z" />
      <path d="M3.6 6.1 10 9.6l6.4-3.5" />
      <path d="M10 9.6v7.8" />
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
  more: (
    <>
      <circle cx="4.6" cy="10" r=".9" fill="currentColor" />
      <circle cx="10" cy="10" r=".9" fill="currentColor" />
      <circle cx="15.4" cy="10" r=".9" fill="currentColor" />
    </>
  ),
  // — Vistas del reloj (pictogramas del encuadre) —
  tres4: (
    <>
      <path d="M7 2.6h6l.6 3.2" />
      <path d="M7 17.4h6l.6-3.2" />
      <path d="M5 6.6h9.4l1.6 1.6v3.6l-1.6 1.6H5L3.6 12V8Z" />
    </>
  ),
  lado: (
    <>
      <ellipse cx="10" cy="11.4" rx="5.4" ry="6" />
      <rect x="8" y="2.4" width="4" height="5" />
    </>
  ),
  esfera: (
    <>
      <circle cx="10" cy="10" r="7.4" />
      <path d="M10 10V5.6" />
      <path d="m10 10 3 1.8" />
    </>
  ),
  tapa: (
    <>
      <circle cx="10" cy="10" r="7.4" />
      <circle cx="10" cy="10" r="4.4" />
      <path d="M8.6 9h2.8M8.6 11h2.8" strokeWidth="1.2" />
    </>
  ),
  frente: (
    <>
      <path d="M6.6 3.2h6.8l2.4 2.4v8.8l-2.4 2.4H6.6l-2.4-2.4V5.6Z" />
      <circle cx="10" cy="10" r="3.6" />
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

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`rl-icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}
