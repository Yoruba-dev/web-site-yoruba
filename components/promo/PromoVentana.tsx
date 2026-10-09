import Countdown from "@/components/ui/Countdown";
import PromoBadge from "@/components/promo/PromoBadge";
import PromoCaduca from "@/components/promo/PromoCaduca";
import { fechaCortaMiami, getPromoVentana } from "@/lib/promo-ventana";

// La banda de la promo por tiempo limitado.
//
// Componente de SERVIDOR: pregunta a Shopify y, si no hay promo viva, devuelve
// null y no deja rastro — ni un hueco, ni un borde. Es el mismo autoapagado que
// usa FeaturedOffer.
//
// Todo lo que se lee aquí (titular, texto, foto, piezas, porcentaje y fecha)
// sale de la colección de Shopify. No hay una sola cifra escrita a mano, así
// que la promo del mes que viene se lanza sin tocar este fichero.
//
// Con un mínimo de unidades (`vm.minimo` > 1) cada precio y cada % llevan la
// condición pegada, y el precio grande pasa a ser POR UNIDAD ("c/u"). Con
// minimo 1 todo sale exactamente como siempre.

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
  /** `portada` = el banner de la campaña, arriba de la página de inicio. Usa
   *  la foto de la colección; si la promo no tiene foto, sale la banda. */
  variante?: "banda" | "compacta" | "portada";
}) {
  const vm = await getPromoVentana();
  if (!vm) return null;

  const cuando = vm.hasta ? horaDeMiami(vm.hasta) : null;
  const conMinimo = vm.minimo > 1;
  const descripcionReloj = cuando
    ? `La oferta termina el ${cuando}, hora de Miami.`
    : undefined;

  if (variante === "portada" && vm.imagen) {
    const fecha = vm.hasta ? fechaCortaMiami(vm.hasta) : null;
    // El precio grande solo cuando la promo es de UNA pieza: con varias, un
    // único precio en un banner tan grande prometería algo que no es para todas.
    const unaPieza = vm.handles.length === 1;
    return (
      <PromoCaduca hasta={vm.hasta}>
        <section className="pyj-promoP" aria-labelledby="pyj-promoP-tit">
          <div className="pyj-promoP_foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vm.imagen}
              alt={vm.imagenAlt || vm.titulo}
              width={1200}
              height={1200}
              fetchPriority="high"
            />
          </div>
          <div className="container">
            <div className="pyj-promoP_texto">
              {/* Los espacios duros pegan la estrella final a la fecha: si no,
                  en un móvil la "✦" se queda sola en la segunda línea. Sin
                  fecha y con mínimo, "por tiempo limitado" sería urgencia
                  inventada: lo que define esa promo es la cantidad. */}
              <span className="pyj-eyebrow">
                ✦{" "}
                {(fecha
                  ? `Solo hasta el ${fecha}`
                  : conMinimo
                    ? "Descuento por cantidad"
                    : "Por tiempo limitado"
                ).replace(
                  / (\S+ \S+ \S+)$/,
                  (_, cola: string) => ` ${cola.replace(/ /g, "\u00a0")}`,
                )}
                {"\u00a0✦"}
              </span>
              <h2 id="pyj-promoP-tit" className="pyj-promoP_tit">
                {vm.titulo}
              </h2>
              {unaPieza && conMinimo ? (
                // Precio por unidad, y la condición y la medida del ejemplo
                // justo al lado: sin ellas "$13.50" valdría para una sola.
                <p className="pyj-promoP_precio">
                  <b>{vm.ejemplo.ahoraCorto}</b>
                  <span className="pyj-sr">Antes </span>
                  <s>{vm.ejemplo.antesCorto}</s>
                  <span className="pyj-promoP_ahorro">
                    {`c/u${vm.ejemplo.variante ? ` (${vm.ejemplo.variante})` : ""}, llevando ${vm.minimo} o más`}
                  </span>
                </p>
              ) : unaPieza ? (
                <p className="pyj-promoP_precio">
                  <b>{vm.ejemplo.ahoraCorto}</b>
                  <span className="pyj-sr">Antes </span>
                  <s>{vm.ejemplo.antesCorto}</s>
                  <span className="pyj-promoP_ahorro">
                    ahorras {vm.ejemplo.ahorroCorto}
                  </span>
                </p>
              ) : conMinimo ? (
                <p className="pyj-promoP_precio">
                  <b>−{vm.pct}%</b>
                  <span className="pyj-promoP_ahorro">
                    {`en ${vm.handles.length} piezas, llevando ${vm.minimo} o más`}
                  </span>
                </p>
              ) : (
                <p className="pyj-promoP_precio">
                  <b>−{vm.pct}%</b>
                  <span className="pyj-promoP_ahorro">
                    en {vm.handles.length} piezas
                  </span>
                </p>
              )}
              {vm.descripcion && <p className="pyj-promoP_desc">{vm.descripcion}</p>}

              <Countdown
                hasta={vm.hasta}
                descripcion={descripcionReloj}
                alTerminar="La oferta terminó"
              />

              {/* La misma frase honesta que la banda: el precio de la tarjeta no
                  baja, el descuento se resta al pagar. La hora de fin ya la dice
                  el reloj justo encima. */}
              <p className="pyj-promoP_letra">
                {conMinimo
                  ? vm.mezcla
                    ? `Puedes mezclar ${vm.mezcla} para llegar a ${vm.minimo}; el ${vm.pct}% se descuenta solo al pagar.`
                    : `El ${vm.pct}% se descuenta solo al pagar.`
                  : "El descuento se aplica solo al pagar."}
              </p>

              <a href={vm.href} className="pyj-btn-gold">
                {unaPieza ? "Comprar ahora" : "Ver las piezas"}
              </a>
            </div>
          </div>
        </section>
      </PromoCaduca>
    );
  }

  return (
    <section
      className={`pyj-promoV${variante === "compacta" ? " pyj-promoV--compacta" : ""}`}
    >
      <div className="container">
        <div className="pyj-promoV_grid">
          <div className="pyj-promoV_texto">
            {/* Igual que en la portada: sin fecha, una promo por cantidad no
                es "por tiempo limitado". */}
            <span className="pyj-eyebrow">
              {conMinimo && !cuando ? "✦ Descuento por cantidad ✦" : "✦ Por tiempo limitado ✦"}
            </span>
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
            {conMinimo ? (
              <p className="pyj-promoV_letra">
                Llevando <strong>{vm.minimo} o más</strong>
                {vm.mezcla && ` (puedes mezclar ${vm.mezcla})`}, ahorras un{" "}
                <strong>{vm.pct}%</strong>: se descuenta automáticamente al
                pagar.{" "}
                {cuando && <>Termina el {cuando} (hora de Miami).</>}
              </p>
            ) : (
              <p className="pyj-promoV_letra">
                El <strong>−{vm.pct}%</strong> se descuenta automáticamente al
                pagar.{" "}
                {cuando && <>Termina el {cuando} (hora de Miami).</>}
              </p>
            )}

            {/* Con mínimo, el ejemplo es por unidad y dice de qué medida; el
                ahorro, el del lote entero, que es lo que la clienta paga. */}
            {conMinimo ? (
              <p className="pyj-promoV_ejemplo">
                {vm.ejemplo.titulo}
                {vm.ejemplo.variante && ` (${vm.ejemplo.variante})`}:{" "}
                <s>{vm.ejemplo.antes}</s> <b>{vm.ejemplo.ahora}</b>{" "}
                <span>{`c/u comprando ${vm.minimo}, ahorras ${vm.lote.ahorro}`}</span>
              </p>
            ) : (
              <p className="pyj-promoV_ejemplo">
                {vm.ejemplo.titulo}: <s>{vm.ejemplo.antes}</s>{" "}
                <b>{vm.ejemplo.ahora}</b>{" "}
                <span>ahorras {vm.ejemplo.ahorro}</span>
              </p>
            )}

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
                      <PromoBadge
                        pct={vm.pct}
                        hasta={vm.hasta}
                        variante="banda"
                        minimo={vm.minimo}
                      />
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
