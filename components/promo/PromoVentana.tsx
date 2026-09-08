import Countdown from "@/components/ui/Countdown";
import PromoBadge from "@/components/promo/PromoBadge";
import { getPromoVentana } from "@/lib/promo-ventana";

// La banda de la promo por tiempo limitado.
//
// Componente de SERVIDOR: pregunta a Shopify y, si no hay promo viva, devuelve
// null y no deja rastro — ni un hueco, ni un borde. Es el mismo autoapagado que
// usa FeaturedOffer.
//
// Todo lo que se lee aquí (titular, texto, foto, piezas, porcentaje y fecha)
// sale de la colección de Shopify. No hay una sola cifra escrita a mano, así
// que la promo del mes que viene se lanza sin tocar este fichero.

/** La hora de fin en cristiano, siempre en hora de Miami — que es donde está el
 *  taller y la referencia que entiende la clienta. Se formatea en el servidor
 *  para que no dependa del reloj del visitante. */
function horaDeMiami(iso: string): string {
  return new Intl.DateTimeFormat("es-US", {
    timeZone: "America/New_York",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function PromoVentana({
  variante = "banda",
}: {
  variante?: "banda" | "compacta";
}) {
  const vm = await getPromoVentana();
  if (!vm) return null;

  const cuando = vm.hasta ? horaDeMiami(vm.hasta) : null;
  const descripcionReloj = cuando
    ? `La oferta termina el ${cuando}, hora de Miami.`
    : undefined;

  return (
    <section
      className={`pyj-promoV${variante === "compacta" ? " pyj-promoV--compacta" : ""}`}
    >
      <div className="container">
        <div className="pyj-promoV_grid">
          <div className="pyj-promoV_texto">
            <span className="pyj-eyebrow">✦ Por tiempo limitado ✦</span>
            <h2>{vm.titulo}</h2>
            {vm.descripcion && <p>{vm.descripcion}</p>}

            <Countdown
              hasta={vm.hasta}
              descripcion={descripcionReloj}
              variante={variante === "compacta" ? "compacto" : "normal"}
              alTerminar="La oferta terminó"
            />

            {/* La frase honesta. El descuento de Shopify es automático: no baja
                el precio de la tarjeta, se resta al pagar. Decirlo aquí evita
                la decepción de ver el precio entero en el carrito. */}
            <p className="pyj-promoV_letra">
              El <strong>−{vm.pct}%</strong> se descuenta automáticamente al
              pagar.{" "}
              {cuando && <>Termina el {cuando} (hora de Miami).</>}
            </p>

            <p className="pyj-promoV_ejemplo">
              {vm.ejemplo.titulo}: <s>{vm.ejemplo.antes}</s>{" "}
              <b>{vm.ejemplo.ahora}</b>{" "}
              <span>ahorras {vm.ejemplo.ahorro}</span>
            </p>

            <a href={vm.href} className="pyj-btn-gold">
              Ver las piezas
            </a>
          </div>

          {vm.piezas.length > 0 && (
            <ul className="pyj-promoV_piezas">
              {vm.piezas.map((p) => (
                <li key={p.handle}>
                  <a href={`/products/${encodeURIComponent(p.handle)}`}>
                    <span className="pyj-promoV_foto">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt={p.title} loading="lazy" />
                      ) : (
                        <span className="pyj-promoV_sinfoto" aria-hidden="true">
                          ✦
                        </span>
                      )}
                      {/* Sin esto, las fotos de la banda eran las únicas piezas
                          rebajadas de toda la web sin decirlo. Y se quita sola
                          al pasar la hora, como las de la rejilla. */}
                      <PromoBadge pct={vm.pct} hasta={vm.hasta} variante="banda" />
                    </span>
                    <span className="pyj-promoV_nombre">{p.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
