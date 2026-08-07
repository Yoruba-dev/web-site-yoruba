import Link from "next/link";
import { sizedImageUrl } from "@/lib/utils";
import type { WorkPhoto } from "@/lib/services";

// Tira de fotos de trabajos REALES del taller, usada en cada servicio de
// /servicios y en la galería del final.
//
// Todas las fotos son piezas que existen en el catálogo, no ilustraciones ni
// bancos de imágenes: la página respalda el registro de marca, así que lo que
// se enseña tiene que ser trabajo propio y verificable. Por eso cada foto lleva
// pie con el nombre de la pieza y, cuando existe, enlace a su ficha — quien
// revise puede comprobar que la pieza es real.
//
// El tipo WorkPhoto vive en lib/services.ts, junto a los datos.

export default function WorkGallery({
  photos,
  columns = 3,
  /** `eager` solo para la primera tira visible; el resto entra al hacer scroll. */
  priority = false,
}: {
  photos: WorkPhoto[];
  columns?: 2 | 3 | 4;
  priority?: boolean;
}) {
  if (!photos.length) return null;
  // Se pide al CDN el ancho que realmente se pinta (no los 3000px originales).
  const w = columns >= 4 ? 420 : columns === 3 ? 520 : 700;

  return (
    <ul className={`pyj-work pyj-work--${columns}`}>
      {photos.map((p) => {
        const img = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sizedImageUrl(p.src, w)}
            alt={p.alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        );
        return (
          <li key={p.src} className="pyj-work_item">
            <figure className="pyj-work_fig">
              {p.handle ? (
                <Link href={`/products/${p.handle}`} className="pyj-work_link">
                  {img}
                </Link>
              ) : (
                img
              )}
              <figcaption className="pyj-work_cap">{p.caption}</figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
