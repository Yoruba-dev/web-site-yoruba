// ---------------------------------------------------------------------------
// La sección de Niños (/ninos).
//
// CÓMO SE DECIDE QUÉ ES DE NIÑOS: una etiqueta en Shopify. El dueño escribe
// `ninos` en un producto y ese producto entra en la sección. Nada más. No hay
// listas de handles en el código ni colecciones duplicadas que mantener en dos
// sitios.
//
// LAS SUBCATEGORÍAS SALEN SOLAS del `productType` de cada pieza (Azabache,
// Pulsos y Pulseras, Dijes y Medallas…), que es el mismo eje con el que ya está
// ordenado todo el catálogo. Si mañana entra un dije de niño, aparece una
// subcategoría "Dijes y Medallas" sin tocar una línea: por eso no se crean
// colecciones `ninos-*` en Shopify — serían un duplicado de las que ya existen
// y partirían el SEO entre dos URLs con los mismos productos.
// ---------------------------------------------------------------------------
import type { Product } from "./types";

/** La etiqueta que mete un producto en la sección. */
export const KIDS_TAG = "ninos";

export interface KidsGroup {
  /** El productType tal cual viene de Shopify — es también el filtro de la URL. */
  type: string;
  products: Product[];
  /** Primera foto disponible del grupo, para la portada del azulejo. */
  image: string | null;
}

/** Comparación laxa: las etiquetas del catálogo mezclan mayúsculas y acentos. */
export function isKidsProduct(p: Product): boolean {
  return p.tags.some((t) => t.toLowerCase().trim() === KIDS_TAG);
}

/**
 * Agrupa las piezas de niños por tipo, de más surtido a menos — la subcategoría
 * con más piezas es la que el visitante quiere ver primero. Las piezas sin tipo
 * caen en un grupo "Otros" en vez de desaparecer.
 */
export function groupKidsByType(products: Product[]): KidsGroup[] {
  const mapa = new Map<string, Product[]>();
  for (const p of products) {
    const tipo = p.productType?.trim() || "Otros";
    const lista = mapa.get(tipo);
    if (lista) lista.push(p);
    else mapa.set(tipo, [p]);
  }
  return [...mapa.entries()]
    .map(([type, ps]) => ({
      type,
      products: ps,
      image: ps.find((p) => p.images[0]?.url)?.images[0]?.url ?? null,
    }))
    .sort((a, b) => b.products.length - a.products.length);
}

/** Slug del tipo, para el parámetro ?tipo= de la URL. */
export function typeSlug(type: string): string {
  return type
    .toLowerCase()
    .normalize("NFD")
    // Marcas diacríticas por escape explícito: escritas como caracteres
    // combinantes literales son invisibles en el editor y se rompen al copiar.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
