import Link from "next/link";
import { getKidsProducts } from "@/lib/products";
import { sizedImageUrl } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Banda de portada que anuncia la sección de niños.
//
// Enseña PIEZAS DE VERDAD, no solo un texto: se leen en vivo de Shopify (las
// etiquetadas `ninos`), así que la banda se actualiza sola cuando el taller
// añade una pieza y desaparece si algún día no queda ninguna. Ni una foto ni un
// nombre escritos aquí.
//
// Sigue el molde de WholesaleBanner —el otro anuncio de portada— para que las
// dos bandas se lean como de la misma casa.
// ---------------------------------------------------------------------------
export default async function KidsBanner() {
  const piezas = await getKidsProducts();
  if (piezas.length === 0) return null;

  // Las que tengan foto, hasta cuatro. Sin foto no ilustran nada.
  const muestra = piezas.filter((p) => p.images[0]?.url).slice(0, 4);

  return (
    <section className="pyj-kids" aria-labelledby="pyj-kids-tit">
      <div className="container">
        <div className="pyj-kids_card">
          <div className="pyj-kids_texto">
            <span className="pyj-eyebrow">✦ Nuevo · Para los más pequeños ✦</span>
            <h2 id="pyj-kids-tit">Joyería para niños</h2>
            <p>
              Ya está abierta nuestra sección de <strong>azabaches</strong> y
              piezas de protección para bebés y niños — la piedra de siempre
              contra el <strong>mal de ojo</strong>, montada en oro y plata y
              hecha a mano en Miami.
            </p>
            <div className="pyj-kids_cta">
              <Link className="pyj-btn-gold" href="/ninos">
                Ver la sección de niños
              </Link>
              <span className="pyj-kids_dato">
                {piezas.length} {piezas.length === 1 ? "pieza" : "piezas"} ·
                ajustamos el largo al niño
              </span>
            </div>
          </div>

          {muestra.length > 0 && (
            <ul className="pyj-kids_piezas">
              {muestra.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.handle}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sizedImageUrl(p.images[0].url, 320)}
                      alt={p.title}
                      loading="lazy"
                    />
                    <span>{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
