import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";

/**
 * Fila de categorías con foto redonda: la forma de ENTRAR al catálogo.
 *
 * Por qué existe: los filtros de la tienda son un refinamiento ("Oshún",
 * "oro 10k"), no una puerta de entrada. La estructura real del catálogo son las
 * categorías, y cada una tiene ya su página con texto propio — pero nada
 * apuntaba a ellas, así que quien caía en 171 piezas mezcladas tenía que
 * adivinar. Esto pone el eje principal primero.
 *
 * Cada azulejo lleva su cuenta, porque "Collares (2)" e "Idde (70)" prometen
 * cosas muy distintas y es más honesto decirlo antes del clic.
 *
 * Recibe `items` ya construidos en vez de colecciones de Shopify: así lo usan
 * tanto la tienda (colecciones) como /ninos (subcategorías por tipo), que antes
 * tenía este mismo markup copiado a mano — y con el estado activo roto, porque
 * la copia ponía la clase `is-on` que nadie había definido en el CSS.
 */
export interface RailItem {
  href: string;
  label: string;
  image?: string | null;
  count?: number;
  /** Marca el azulejo de la categoría que se está viendo. */
  active?: boolean;
}

export default function CategoryRail({
  items,
  title,
  ariaLabel,
  countStyle = "long",
}: {
  items: RailItem[];
  title: string;
  ariaLabel?: string;
  /** "long" → "12 piezas" · "short" → "12" (para filas con muchos azulejos). */
  countStyle?: "long" | "short";
}) {
  if (items.length === 0) return null;

  return (
    // `.container` es el envoltorio de ancho de la plantilla — sin él la fila se
    // va de lado a lado y deja de alinearse con la rejilla de productos.
    <nav className="pyj-catrail container" aria-label={ariaLabel ?? title}>
      <h2 className="pyj-catrail_title">{title}</h2>
      <ul className="pyj-catrail_list">
        {items.map((item) => (
          <li key={item.href} className="pyj-catrail_item">
            <Link
              className={`pyj-catrail_link${item.active ? " is-on" : ""}`}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
            >
              <span className="pyj-catrail_thumb">
                {item.image && (
                  <SafeImage src={item.image} width={220} alt="" aria-hidden="true" />
                )}
              </span>
              <span className="pyj-catrail_name">{item.label}</span>
              {item.count != null && item.count > 0 && (
                <span className="pyj-catrail_count">
                  {countStyle === "short"
                    ? item.count
                    : `${item.count} ${item.count === 1 ? "pieza" : "piezas"}`}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
