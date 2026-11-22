"use client";

// ---------------------------------------------------------------------------
// LAS LETRAS DE LA VISTA PREVIA = LAS DEL ARCHIVO DE IMPRENTA.
//
// El texto de la esfera y el grabado de la tapa se imprimen / graban con los
// contornos de lib/watch-glyphs.ts (Cinzel Regular y Cormorant Garamond
// cursiva 500, en curvas). La web solo carga Cinzel 500–700, así que un <text> nunca saldría
// con el grosor de imprenta (decisión del dueño 2026-11-22: "igualar a la de
// imprenta"). Por eso la vista previa pinta EXACTAMENTE esos contornos.
//
// Las tablas de contornos pesan ~46 KB gzip: se carga aparte (import dinámico),
// la primera vez que hace falta, y se comparte con la vista 3D. Hasta que
// llega (un instante), se ve el <text> con la fuente de la web.
// ---------------------------------------------------------------------------
import { useSyncExternalStore } from "react";
import type { Primitive } from "@/lib/watch-art";

type Outline = (prims: readonly Primitive[]) => Primitive[];

let listo: Outline | null = null;
let cargando: Promise<Outline> | null = null;
const avisar = new Set<() => void>();

/** Carga (una sola vez) la conversión de texto a contornos. */
export function loadOutline(): Promise<Outline> {
  cargando ??= import("@/lib/watch-curvas").then((m) => {
    listo = m.outlinePrimitives;
    avisar.forEach((f) => f());
    return listo;
  });
  // Si falla (sin red), se reintenta la próxima vez; mientras, queda el <text>.
  cargando.catch(() => {
    cargando = null;
  });
  return cargando;
}

/** La conversión si ya está cargada (para usos fuera de React, p. ej. la
 *  miniatura del carrito); null si todavía no. */
export function outlineIfReady(): Outline | null {
  return listo;
}

function suscribir(f: () => void): () => void {
  avisar.add(f);
  loadOutline().catch(() => {});
  return () => {
    avisar.delete(f);
  };
}

/** Hook: la conversión a contornos, o null hasta que llega.
 *  • Hidratando, el cliente parte de lo mismo que el servidor (null → <text>)
 *    y cambia a curvas en cuanto puede: sin desajuste de hidratación.
 *  • Un montaje posterior (la tapa, otra ficha) ya sale en curvas si cargaron.
 *  • Sin `window` (el arnés scripts/render-watchfront.tsx, que antes llama a
 *    loadOutline()), sale en curvas: así sus capturas son las de imprenta. */
export function useOutline(): Outline | null {
  return useSyncExternalStore(
    suscribir,
    () => listo,
    () => (typeof window === "undefined" ? listo : null),
  );
}
