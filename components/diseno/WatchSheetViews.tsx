"use client";

import dynamic from "next/dynamic";
import type { WatchConfig } from "@/lib/watch";

// La hoja del taller (componente de servidor) pinta el reloj con esto: un
// envoltorio mínimo que carga WatchSheetArt (compositor + reloj.css) en su
// propio paquete. next/dynamic en un componente de SERVIDOR no parte el
// paquete de cliente (docs de Next: lazy-loading); aquí, en uno de cliente, sí.
const WatchSheetArt = dynamic(() => import("./WatchSheetArt"));

export default function WatchSheetViews({ config }: { config: WatchConfig }) {
  return <WatchSheetArt config={config} />;
}
