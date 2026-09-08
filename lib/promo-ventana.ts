import { cache } from "react";
import { shopifyFetch, shopifyGetPromoVentana } from "./shopify";
import { formatMoney, sizedImageUrl } from "./utils";
import type { Product } from "./types";

// ---------------------------------------------------------------------------
// La promoción por tiempo limitado: "un % de descuento en un grupo de piezas,
// hasta tal hora".
//
// DÓNDE VIVE LA VERDAD
// --------------------
// En Shopify, entera. El código no sabe qué piezas entran, ni cuánto es el
// descuento, ni cuándo acaba: lo pregunta. Lo único escrito aquí son los dos
// interruptores —el handle de la colección y la etiqueta—, igual que
// `promo-activa` en lib/promo.ts o `ninos` en lib/kids.ts.
//
//   · qué piezas   -> la colección inteligente `oferta-24-horas`, alimentada
//                     por la etiqueta `promo-24h`
//   · el anuncio   -> título, texto e imagen de esa misma colección
//   · cuándo acaba -> su metafield `promo.termina`
//   · cuánto es    -> se MIDE en un carrito de prueba, no se escribe
//
// Así, la promo del mes que viene se lanza sin tocar código: otras piezas, otra
// fecha, y hasta otro porcentaje.
//
// LAS DOS LLAVES
// --------------
// Hacen falta las dos para anunciar algo, y cada una tapa el fallo de la otra:
//
//   1. Que Shopify esté descontando de verdad (carrito de prueba). Si el
//      descuento caducó o se pausó, aquí sale null y desaparece todo — aunque
//      el dueño se haya olvidado de la fecha.
//   2. Que la fecha sea futura. Si el descuento sigue vivo pero la fecha ya
//      pasó, no se anuncia: la clienta se lleva su descuento igual al pagar,
//      que es una sorpresa buena. Al revés —prometer y no cumplir— sería una
//      mentira, y encima de las que multa la FTC.
//
// Si el descuento está vivo pero falta la fecha, se enseña la banda SIN reloj:
// el dinero es real, y esconder una oferta viva por un campo vacío es peor.
// ---------------------------------------------------------------------------

/** Etiqueta que mete una pieza en la promo (la pone el dueño en Shopify). */
export const TAG_PROMO = "promo-24h";

/**
 * Handle de la colección. Es PERMANENTE y a propósito genérico: el dueño cambia
 * el TÍTULO en cada campaña ("Vírgenes de la Caridad — 24 horas"), nunca el
 * handle. Si lo cambiara, `collection(handle:)` devolvería null y la promo
 * desaparecería en silencio — y además la web no tiene capa de redirecciones,
 * así que la URL quedaría rota para siempre.
 */
export const COLECCION_PROMO = "oferta-24-horas";

export interface PromoVentanaVM {
  /** Título de la colección — es el titular del anuncio. */
  titulo: string;
  /** Texto de la colección — es el cuerpo del anuncio. */
  descripcion: string;
  imagen?: string;
  href: string;
  /** Porcentaje MEDIDO en el carrito de prueba. Nunca escrito en el código. */
  pct: number;
  /** Instante de fin en ISO absoluto (con Z), o null si falta el metafield. */
  hasta: string | null;
  /** Handles de las piezas participantes, para marcarlas en las rejillas. */
  handles: string[];
  piezas: { handle: string; title: string; image?: string }[];
  /** Un ejemplo con números reales, para ilustrar el ahorro. */
  ejemplo: { titulo: string; antes: string; ahora: string; ahorro: string };
}

const CON_HUSO = /(Z|[+-]\d{2}:\d{2})$/;

/**
 * Convierte el `date_time` de Shopify en milisegundos.
 *
 * Shopify guarda ese tipo SIN huso y lo interpreta en GMT. Si aquí se dejara
 * que `Date.parse` lo leyera como hora local, el servidor de Netlify (UTC) y el
 * navegador de una clienta en California darían plazos distintos para la misma
 * promo. Por eso se le pega una `Z` explícita cuando no trae huso.
 */
export function instanteShopify(raw?: string | null): number | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  const ms = Date.parse(CON_HUSO.test(v) ? v : `${v}Z`);
  return Number.isFinite(ms) ? ms : null;
}

interface CarritoPrueba {
  cartCreate: {
    cart: {
      lines: {
        nodes: {
          merchandise: { id: string };
          cost: { totalAmount: { amount: string; currencyCode: string } };
          discountAllocations: { discountedAmount: { amount: string } }[];
        }[];
      };
    } | null;
  };
}

const PROBAR = /* GraphQL */ `
  mutation ProbarVentana($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        lines(first: 10) {
          nodes {
            merchandise { ... on ProductVariant { id } }
            cost { totalAmount { amount currencyCode } }
            discountAllocations { discountedAmount { amount } }
          }
        }
      }
    }
  }
`;

/** Una variante de una pieza que NO está en la promo, para usarla de control. */
const CONTROL = /* GraphQL */ `
  query PromoControl($query: String!) {
    products(first: 1, query: $query) {
      nodes { variants(first: 1) { nodes { id } } }
    }
  }
`;

// Memoria en el proceso, con caducidad.
//
// `cache()` de React solo agrupa las llamadas de UN render, pero esto se usa en
// la portada y en las rejillas, o sea en casi todas las páginas. Sin memoria,
// cada render montaría un carrito de prueba contra Shopify.
//
// Son 60 segundos y no los 10 minutos de lib/promo.ts: una promo de 24 horas
// tiene que encenderse y apagarse rápido. Diez minutos de retraso en una promo
// de un mes no se notan; en una de un día, sí.
const VIGENCIA_MS = 60 * 1000;
// Un fallo puntual de Shopify se recuerda menos tiempo: no queremos que un
// error de red apague la promo durante un minuto entero.
const VIGENCIA_FALLO_MS = 15 * 1000;

let memoria: { valor: PromoVentanaVM | null; hasta: number } | null = null;

function recordar(valor: PromoVentanaVM | null, ms = VIGENCIA_MS) {
  memoria = { valor, hasta: Date.now() + ms };
  return valor;
}

/** Purga la memoria. La llama el webhook de Shopify (app/api/revalidate). */
export function olvidarPromoVentana(): void {
  memoria = null;
}

export const getPromoVentana = cache(
  async (): Promise<PromoVentanaVM | null> => {
    if (memoria && memoria.hasta > Date.now()) return memoria.valor;
    try {
      const col = await shopifyGetPromoVentana(COLECCION_PROMO);
      if (!col) {
        // Ni error ni promo: la colección no existe o no está publicada en el
        // canal que lee la web. Se avisa en los registros de Netlify porque es
        // el fallo más probable al montarla, y es invisible desde fuera.
        console.warn(
          `[promo] la colección "${COLECCION_PROMO}" no responde — ` +
            `¿existe y está publicada en el canal "Jewel Linker"?`,
        );
        return recordar(null);
      }
      if (col.products.length === 0) return recordar(null);

      const pieza = col.products.find((p) => p.variants?.[0]);
      if (!pieza) return recordar(null);
      const vPromo = pieza.variants[0];

      // Línea de control: una pieza FUERA de la promo. Si a ella le cae el
      // mismo descuento, lo que hay es una rebaja general de la tienda y no
      // esta promo — anunciarla como "24 horas en las Vírgenes" sería mentir.
      const ctrl = await shopifyFetch<{
        products: { nodes: { variants: { nodes: { id: string }[] } }[] };
      }>(CONTROL, { query: `-tag:${TAG_PROMO}` });
      const vControl = ctrl.products.nodes[0]?.variants.nodes[0]?.id;

      const lines = [{ merchandiseId: vPromo.id, quantity: 1 }];
      if (vControl) lines.push({ merchandiseId: vControl, quantity: 1 });

      const data = await shopifyFetch<CarritoPrueba>(PROBAR, { lines });
      const lineas = data.cartCreate.cart?.lines.nodes ?? [];

      const pctDe = (id?: string) => {
        const l = lineas.find((x) => x.merchandise.id === id);
        if (!l) return 0;
        const desc = l.discountAllocations.reduce(
          (s, d) => s + Number(d.discountedAmount.amount),
          0,
        );
        if (desc <= 0) return 0;
        const ahora = Number(l.cost.totalAmount.amount);
        return Math.round((desc / (ahora + desc)) * 100);
      };

      const pct = pctDe(vPromo.id);
      if (pct <= 0) return recordar(null);
      if (vControl && pctDe(vControl) === pct) return recordar(null);

      // La fecha. Si falta, la banda sale sin reloj; si ya pasó, no sale nada.
      const hastaMs = instanteShopify(col.termina);
      if (hastaMs !== null && hastaMs <= Date.now()) return recordar(null);

      const linea = lineas.find((l) => l.merchandise.id === vPromo.id)!;
      const moneda = linea.cost.totalAmount.currencyCode;
      const ahora = Number(linea.cost.totalAmount.amount);
      const desc = linea.discountAllocations.reduce(
        (s, d) => s + Number(d.discountedAmount.amount),
        0,
      );

      return recordar({
        titulo: col.title,
        descripcion: col.description,
        imagen: col.image ? sizedImageUrl(col.image, 1200) : undefined,
        href: `/collections/${COLECCION_PROMO}`,
        pct,
        hasta: hastaMs !== null ? new Date(hastaMs).toISOString() : null,
        handles: col.products.map((p) => p.handle),
        piezas: col.products.slice(0, 6).map((p) => ({
          handle: p.handle,
          title: p.title,
          image: p.images[0]?.url ? sizedImageUrl(p.images[0].url, 600) : undefined,
        })),
        ejemplo: {
          titulo: pieza.title,
          antes: formatMoney({ amount: String(ahora + desc), currencyCode: moneda }),
          ahora: formatMoney({ amount: String(ahora), currencyCode: moneda }),
          ahorro: formatMoney({ amount: String(desc), currencyCode: moneda }),
        },
      });
    } catch {
      // Nunca romper una página por culpa del aviso de una oferta.
      return recordar(null, VIGENCIA_FALLO_MS);
    }
  },
);

/**
 * Pega la marca de la promo a las piezas que participan.
 *
 * Se hace en el embudo (lib/products.ts) y no en cada componente: así la señal
 * llega sola a la portada, la tienda, las colecciones, /ninos, los carruseles y
 * la ficha, sin pasar props por seis páginas.
 *
 * La etiqueta por sí sola NO basta: si el dueño la deja puesta después de que
 * caduque el descuento, `vm` viene null y aquí no se marca nada.
 */
export function marcarPromo(
  products: Product[],
  vm: PromoVentanaVM | null,
): Product[] {
  if (!vm) return products;
  const dentro = new Set(vm.handles);
  return products.map((p) =>
    dentro.has(p.handle) ? { ...p, promo: { pct: vm.pct, hasta: vm.hasta } } : p,
  );
}
