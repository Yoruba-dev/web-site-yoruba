import { ORISHA_NAMES } from "./orishas";
import type { Product } from "./types";

/**
 * El eje de organización del catálogo.
 *
 * Durante mucho tiempo Shopify no traía ni tipo ni etiquetas, así que la web
 * DEDUCÍA el tipo de pieza del título (ver lib/categorize.ts). Eso ya no hace
 * falta: hoy todas las piezas activas traen `productType` puesto, con una
 * decena de valores limpios y sin un solo hueco.
 *
 * El daño lo hizo mezclarlo todo. Las etiquetas que el taller fue añadiendo en
 * Shopify para su gestión (`oro-10k`, `unisex`, `por-orden`, `precio-alta-
 * joyeria`…) acabaron en la misma bolsa que los tipos deducidos, y tanto la
 * tienda como la portada cogían "las etiquetas más frecuentes" como si fueran
 * categorías. Resultado: un filtro de "Tipo de pieza" con medio centenar de
 * fichas de cinco conceptos distintos, y secciones de portada tituladas
 * "unisex" y "por-orden".
 *
 * Aquí se arregla de raíz:
 *
 *   - El TIPO sale de `productType`, y de nada más.
 *   - Cada etiqueta va a la faceta que le corresponde (material, para quién,
 *     disponibilidad, Orisha).
 *   - Lo que no se reconoce NO se enseña como filtro. Es justo el fallo que
 *     dejó "por-orden" de cara al público: ante la duda, no inventar una
 *     categoría. La pieza sigue encontrándose por el buscador.
 *
 * No hay ninguna lista de productos: solo se declara qué SIGNIFICA cada
 * etiqueta, que es conocimiento del negocio y no cambia al añadir piezas.
 */

export type Faceta = "material" | "publico" | "estado" | "orisha";

export interface ValorFaceta {
  /** Cómo se le enseña a la clienta; es también la clave de selección. */
  label: string;
  count: number;
}

export interface GrupoFacetas {
  faceta: Faceta;
  titulo: string;
  valores: ValorFaceta[];
}

export interface Departamento {
  /** El `productType` de Shopify. Es la clave de agrupación. */
  tipo: string;
  slug: string;
  products: Product[];
  /** Primera foto disponible del grupo, para el azulejo. */
  image?: string;
}

/** minúsculas y sin acentos: "Yemayá" -> "yemaya". */
function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function typeSlug(tipo: string): string {
  return norm(tipo)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Diccionario de etiquetas -------------------------------------------
// Se reconoce POR PATRÓN, no enumerando cada etiqueta una a una, para que una
// etiqueta nueva del mismo estilo (`oro-22k`) caiga sola en su sitio.

const REGLAS: { test: RegExp; faceta: Faceta; label: (t: string) => string }[] = [
  {
    test: /^(oro-\d+k|plata(-925)?|acero-inoxidable|ba[nñ]ado-oro)$/i,
    faceta: "material",
    label: (t) => {
      const n = norm(t);
      const oro = /^oro-(\d+)k$/.exec(n);
      if (oro) return `Oro ${oro[1]}k`;
      if (n === "plata-925") return "Plata 925";
      if (n === "plata") return "Plata";
      if (n === "acero-inoxidable") return "Acero inoxidable";
      return "Bañado en oro";
    },
  },
  {
    test: /^(mujer|hombre|unisex|ni[nñ]os)$/i,
    faceta: "publico",
    label: (t) => {
      const n = norm(t);
      if (n === "ninos") return "Niños";
      return n.charAt(0).toUpperCase() + n.slice(1);
    },
  },
  {
    test: /^(en-stock|por-orden)$/i,
    faceta: "estado",
    label: (t) => (norm(t) === "en-stock" ? "Disponible ahora" : "Por encargo"),
  },
];

/** La faceta de una etiqueta, o null si no se reconoce (y entonces no se enseña). */
export function facetaDe(tag: string): { faceta: Faceta; label: string } | null {
  // Los Orishas ya vienen con su nombre bueno desde lib/categorize.ts; las
  // etiquetas `oricha-*` que el dueño escribe a mano son lo mismo con otra
  // forma, así que se normalizan al mismo valor en vez de duplicar la ficha.
  if (ORISHA_NAMES.includes(tag)) return { faceta: "orisha", label: tag };
  const oricha = /^oricha-(.+)$/i.exec(tag);
  const suelto = oricha ? oricha[1] : tag;
  const canonico = ORISHA_NAMES.find((o) => norm(o) === norm(suelto));
  if (canonico) return { faceta: "orisha", label: canonico };

  for (const r of REGLAS) {
    if (r.test.test(tag)) return { faceta: r.faceta, label: r.label(tag) };
  }
  return null;
}

const TITULOS: Record<Faceta, string> = {
  orisha: "Por Orisha",
  material: "Material",
  publico: "Para quién",
  estado: "Disponibilidad",
};

const ORDEN: Faceta[] = ["orisha", "material", "publico", "estado"];

/**
 * Agrupa el catálogo por tipo de pieza, de mayor a menor: el tipo dominante
 * manda, y los tipos de dos o tres piezas quedan al final en vez de ocupar el
 * mismo sitio visual que uno de setenta.
 */
export function buildDepartamentos(products: Product[]): Departamento[] {
  const porTipo = new Map<string, Product[]>();
  for (const p of products) {
    const tipo = p.productType?.trim();
    if (!tipo) continue; // sin tipo no se inventa uno: la pieza sale por búsqueda
    const lista = porTipo.get(tipo);
    if (lista) lista.push(p);
    else porTipo.set(tipo, [p]);
  }
  return [...porTipo.entries()]
    .map(([tipo, lista]) => ({
      tipo,
      slug: typeSlug(tipo),
      products: lista,
      image: lista.find((p) => p.images[0]?.url)?.images[0]?.url,
    }))
    .sort(
      (a, b) => b.products.length - a.products.length || a.tipo.localeCompare(b.tipo),
    );
}

/**
 * Los grupos de filtros, a partir de las etiquetas REALES de lo que se está
 * enseñando. Una faceta con un solo valor no se pinta: un filtro que no divide
 * nada solo estorba.
 */
export function buildFacetas(products: Product[]): GrupoFacetas[] {
  const cuentas = new Map<string, { faceta: Faceta; label: string; count: number }>();
  for (const p of products) {
    // Set: una misma pieza no cuenta dos veces si trae "Oshún" deducida y
    // "oricha-oshun" escrita a mano — ambas caen en el mismo valor.
    const vistos = new Set<string>();
    for (const tag of p.tags) {
      const f = facetaDe(tag);
      if (!f) continue;
      const clave = `${f.faceta}|${f.label}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      const prev = cuentas.get(clave);
      if (prev) prev.count += 1;
      else cuentas.set(clave, { faceta: f.faceta, label: f.label, count: 1 });
    }
  }

  return ORDEN.map((faceta) => ({
    faceta,
    titulo: TITULOS[faceta],
    valores: [...cuentas.values()]
      .filter((v) => v.faceta === faceta)
      .map((v) => ({ label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  })).filter((g) => g.valores.length > 1);
}

/**
 * ¿Encaja la pieza con el valor de faceta elegido? Compara por ETIQUETA
 * NORMALIZADA, no por igualdad literal, para que "Oshún" y "oricha-oshun"
 * seleccionen lo mismo.
 */
export function coincideFaceta(p: Product, label: string): boolean {
  return p.tags.some((t) => facetaDe(t)?.label === label);
}
