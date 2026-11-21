"use client";

// ---------------------------------------------------------------------------
// El reloj de frente y de espaldas en la hoja del taller, MÁS el CSS de toda
// la hoja (reloj.css). Este módulo solo se carga a demanda desde
// WatchSheetViews (next/dynamic en un componente de cliente: así sí se parte
// el paquete), de modo que /diseno con un anillo o una moneda no descarga ni
// el compositor del reloj ni su CSS. En el servidor, next/dynamic pinta el
// <link rel="stylesheet"> de este módulo con la página: la hoja sale con su
// estilo desde el primer pintado (y al imprimir).
// ---------------------------------------------------------------------------
import "@/app/creador-de-relojes/reloj.css";
import WatchFront from "@/components/watch/WatchFront";
import type { WatchConfig } from "@/lib/watch";

export default function WatchSheetArt({ config }: { config: WatchConfig }) {
  return (
    <div className="pyj-reloj_sheetviews">
      <figure>
        <WatchFront config={config} vista="frente" className="pyj-reloj_sheetwatch" />
        <figcaption>Frente</figcaption>
      </figure>
      <figure>
        <WatchFront config={config} vista="tapa" className="pyj-reloj_sheetwatch" />
        <figcaption>Tapa (vista trasera)</figcaption>
      </figure>
    </div>
  );
}
