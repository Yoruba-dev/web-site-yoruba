"use client";

import { useEffect, useState } from "react";

// El aviso de la promo en la ficha del producto.
//
// Es de cliente por lo mismo que PromoBadge: las fichas se sirven cacheadas, y
// el reloj del visitante es lo único que sabe de verdad si la oferta sigue viva.
//
// Dice el precio final CALCULADO, no el de Shopify. Es una excepción consciente
// a la regla de "el precio lo dice Shopify", y se sostiene porque el número sale
// del mismo porcentaje que Shopify acaba de aplicar en el carrito de prueba. Sin
// esta línea, la clienta ve el precio entero y no se entera de la oferta.

export default function PromoLineaFicha({
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
    const id = setInterval(revisar, 30_000);
    return () => clearInterval(id);
  }, [objetivo]);

  if (muerta) return null;

  return (
    <p className="pyj-promo_ficha">
      <span className="pyj-promo_ficha_pct">−{pct}%</span>
      <span>
        por tiempo limitado — <strong>se descuenta al pagar</strong>
      </span>
    </p>
  );
}
