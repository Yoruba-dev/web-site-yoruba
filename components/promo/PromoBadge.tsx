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
//
// Con un mínimo de unidades (`promo.minimo` > 1) la insignia lo lleva pegado
// ("−10% · 12+ pzas"): un "−10%" a secas diría que vale para una sola pieza.

export default function PromoBadge({
  pct,
  hasta,
  variante = "tarjeta",
  minimo = 1,
}: {
  pct: number;
  hasta: string | null;
  /** `banda` añade la palabra OFF y pesa más: ahí la insignia ES el mensaje.
   *  En la rejilla se queda corta, que compite con "Nuevo" en la misma esquina. */
  variante?: "tarjeta" | "banda";
  /** Unidades que hay que llevar para el descuento. 1 = sin condición. */
  minimo?: number;
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

  if (minimo > 1) {
    // Sin el OFF de la banda: con la condición no cabría en las fotos de tres
    // en fila de un móvil. En la banda basta "12+", que la frase entera está
    // al lado; en la rejilla la insignia va sola y un "12+" suelto se lee como
    // existencias o edad, así que dice "pzas". `--min` la estrecha y, si en
    // una pantalla muy angosta no cabe, la deja bajar a dos líneas (ver
    // globals.css); el espacio duro mantiene "12+ pzas" junto.
    return (
      <span
        className={`pyj-promo-badge pyj-promo-badge--min${variante === "banda" ? " pyj-promo-badge--banda" : ""}`}
        title={`Llevando ${minimo} o más. El descuento se aplica al pagar`}
      >
        <span aria-hidden="true">
          {variante === "banda"
            ? `−${pct}% · ${minimo}+`
            : `−${pct}% · ${minimo}+ pzas`}
        </span>
        <span className="pyj-sr">
          {`${pct}% de descuento llevando ${minimo} o más, se aplica al pagar`}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`pyj-promo-badge${variante === "banda" ? " pyj-promo-badge--banda" : ""}`}
      title="El descuento se aplica al pagar"
    >
      <span aria-hidden="true">
        −{pct}%{variante === "banda" && " OFF"}
      </span>
      <span className="pyj-sr">
        {pct}% de descuento, se aplica al pagar
      </span>
    </span>
  );
}
