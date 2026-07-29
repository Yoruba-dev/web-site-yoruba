import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import type { CategoryCollection } from "@/lib/products";

/**
 * "Compra por categoría" — the real Shopify collections, at the top of the shop.
 *
 * Why this exists: the shop's sidebar filters by TAGS, which is a refinement
 * ("Oshún", "oro 10k"), not a way in. The catalogue's actual structure lives in
 * the collections (Idde, Anillos, Herramientas, Monedas…), and those already
 * have their own pages with real copy and schema — but nothing on the shop page
 * pointed at them, so a shopper landing on 160 mixed pieces had to guess.
 * This gives the primary axis first and leaves the tag filters as the secondary
 * refinement they should be.
 *
 * Each tile carries the piece count, because "Collares (2)" and "Idde (61)" ask
 * for very different expectations and it is kinder to say so before the click.
 */
export default function CategoryRail({
  collections,
  counts,
}: {
  collections: CategoryCollection[];
  counts: Record<string, number>;
}) {
  if (collections.length === 0) return null;

  return (
    // `.container` is the template's own width/gutter wrapper — without it the
    // rail runs edge to edge and stops lining up with the product grid below.
    <nav className="pyj-catrail container" aria-label="Compra por categoría">
      <h2 className="pyj-catrail_title">Compra por categoría</h2>
      <ul className="pyj-catrail_list">
        {collections.map((c) => {
          const n = counts[c.handle] ?? 0;
          return (
            <li key={c.handle} className="pyj-catrail_item">
              <Link className="pyj-catrail_link" href={`/collections/${c.handle}`}>
                <span className="pyj-catrail_thumb">
                  {c.image && (
                    <SafeImage src={c.image} width={220} alt="" aria-hidden="true" />
                  )}
                </span>
                <span className="pyj-catrail_name">{c.title}</span>
                {n > 0 && (
                  <span className="pyj-catrail_count">
                    {n} {n === 1 ? "pieza" : "piezas"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
