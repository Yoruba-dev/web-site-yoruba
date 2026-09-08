"use client";

import { useEffect, useState } from "react";

// La insignia de la promo en la tarjeta de producto.
//
// Es de CLIENTE por una razón concreta: las páginas se cachean (la tienda una
// hora, el blog seis). Si la insignia fuera de servidor, una página guardada
// seguiría anunciando "−10 %" un buen rato después de que la promo muriera.
// Aquí manda el reloj del visitante, así que se apaga puntual aunque el HTML
// venga de la caché.
//
// El precio de la tarjeta NO baja: el descuento de Shopify es automático y se
// aplica al pagar. Por eso el `title` lo dice, y hay texto equivalente para
// lectores de pantalla — prometer un precio que no se ve sería el camino corto
// a una clienta decepcionada en el checkout.

export default function PromoBadge({
  pct,
  hasta,
}: {
  pct: number;
  hasta: string | null;
}) {
  const objetivo = hasta ? Date.parse(hasta) : NaN;
  const [muerta, setMuerta] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(objetivo)) return;
    const revisar = () => setMuerta(Date.now() > objetivo);
    revisar();
    // Cada 30 s basta: es una insignia, no un reloj. Menos trabajo en móviles
    // con veinte tarjetas en pantalla.
    const id = setInterval(revisar, 30_000);
    return () => clearInterval(id);
  }, [objetivo]);

  if (muerta) return null;

  return (
    <span className="pyj-promo-badge" title="El descuento se aplica al pagar">
      <span aria-hidden="true">−{pct}%</span>
      <span className="pyj-sr">
        {pct}% de descuento, se aplica al pagar
      </span>
    </span>
  );
}
