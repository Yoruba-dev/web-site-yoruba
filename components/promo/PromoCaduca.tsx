"use client";

import { useEffect, useState, type ReactNode } from "react";

// Enseña su contenido hasta la hora de fin de la promo y después lo quita.
//
// Mismo motivo que PromoBadge: el HTML de la portada puede venir de la caché un
// buen rato después de que la promo muera. El servidor ya no la anunciaría,
// pero una copia guardada sí — y un banner gigante de una oferta muerta es lo
// primero que vería la clienta. Aquí decide su reloj, así que se apaga puntual.
//
// Sin `hasta` (falta la fecha en Shopify) no se quita nunca: entonces manda
// solo la otra llave, que Shopify siga descontando (ver lib/promo-ventana.ts).

export default function PromoCaduca({
  hasta,
  children,
}: {
  hasta: string | null;
  children: ReactNode;
}) {
  const objetivo = hasta ? Date.parse(hasta) : NaN;
  const [muerta, setMuerta] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(objetivo)) return;
    const revisar = () => setMuerta(Date.now() > objetivo);
    revisar();
    const id = setInterval(revisar, 30_000);
    return () => clearInterval(id);
  }, [objetivo]);

  return muerta ? null : <>{children}</>;
}
