import { cache } from "react";
import { shopifyFetch } from "./shopify";
import { getProducts } from "./products";
import { formatMoney, sizedImageUrl } from "./utils";
import type { Product } from "./types";

// ---------------------------------------------------------------------------
// La promoción cruzada: "compra el anillo y llévate la moneda más barata".
//
// CÓMO SABE LA WEB QUE LA PROMO ESTÁ VIVA
// ---------------------------------------
// No lo sabe: se lo PREGUNTA A SHOPIFY. Monta un carrito de prueba con una pieza
// de cada lado y lee lo que Shopify responde. Si hay descuento, la promo está
// activa; si caducó, Shopify deja de darlo y aquí sale null, con lo que el aviso
// desaparece solo de toda la web.
//
// Por qué así y no leyendo la promoción del panel: las fechas, el importe y las
// reglas viven en el descuento de Shopify. Copiarlos aquí sería tener dos
// verdades que se desincronizan el día que el dueño cambia una fecha. Además
// leer descuentos por la API de administración exige el permiso `read_discounts`,
// que la app de la tienda no tiene — y esto no necesita ninguno.
//
// QUÉ PAREJA MIRAR
// ----------------
// Sale de etiquetas de Shopify, no de una lista en el código:
//   · el que dispara la oferta   -> etiqueta `promo-activa`
//   · el que se lleva el descuento -> etiqueta `promo-regalo`
// El dueño enciende otra promoción moviendo esas dos etiquetas, sin tocar nada.
//
// Los carritos de prueba no ensucian nada: un carrito SIN correo no cuenta como
// abandonado (ver registerAbandonedCart en lib/shopify-cart.ts, que sí manda el
// correo a propósito).
// ---------------------------------------------------------------------------

export const TAG_GATILLO = "promo-activa";
export const TAG_REGALO = "promo-regalo";

export interface PromoVM {
  /** Piezas que activan la oferta (para saber si enseñarla en una ficha). */
  gatilloHandles: string[];
  /** La pieza que dispara la oferta, para ilustrarla. */
  gatillo: { handle: string; title: string; image?: string };
  /** El que se lleva el descuento. */
  regalo: {
    handle: string;
    title: string;
    image?: string;
    variantId: string;
    /** Nombre de la variante concreta a la que aplica ("Grabado en láser"). */
    variantTitle: string;
    /** Precio normal en número + moneda, para poder añadirlo al carrito. */
    precio: number;
    currency: string;
  };
  /** Precio normal, ya formateado. */
  antes: string;
  /** Precio con la promo, ya formateado. */
  ahora: string;
  /** Lo que se ahorra, ya formateado. */
  ahorro: string;
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

const CONSULTA = `
  mutation Probar($lines: [CartLineInput!]!) {
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

/** Primera variante comprable de una pieza; null si no hay ninguna. */
function primeraVariante(p: Product) {
  return p.variants?.[0] ?? null;
}

// Memoria en el propio proceso, con caducidad.
//
// POR QUÉ HACE FALTA: `cache()` de React solo agrupa las llamadas de UN render.
// Pero getPromo se usa en el layout —o sea, en TODAS las páginas—, y cada
// render lanza un carrito de prueba contra Shopify. Con ~40 páginas estáticas
// revalidando cada minuto, eso serían decenas de miles de carritos al día:
// se comería el límite de peticiones de Shopify y llenaría la tienda de basura.
//
// Con esto, la pregunta se hace UNA vez cada 10 minutos por proceso. La oferta
// tarda como mucho ese rato en encenderse o apagarse en la web, que para una
// promoción de un mes es de sobra.
//
// No se usa la directiva `use cache` de Next porque exige activar
// `cacheComponents` en next.config, y eso cambia el cacheado de todo el sitio.
const VIGENCIA_MS = 10 * 60 * 1000;
let memoria: { valor: PromoVM | null; hasta: number } | null = null;

/** Guarda el resultado (incluido "no hay promo") y lo devuelve. */
function recordar(valor: PromoVM | null): PromoVM | null {
  memoria = { valor, hasta: Date.now() + VIGENCIA_MS };
  return valor;
}

export const getPromo = cache(async (): Promise<PromoVM | null> => {
  if (memoria && memoria.hasta > Date.now()) return memoria.valor;
  try {
    const catalogo = await getProducts(250);
    const gatillos = catalogo.filter((p) => p.tags.includes(TAG_GATILLO));
    const regalo = catalogo.find((p) => p.tags.includes(TAG_REGALO));
    if (gatillos.length === 0 || !regalo) return recordar(null);

    const vGatillo = primeraVariante(gatillos[0]);
    const vRegalo = primeraVariante(regalo);
    if (!vGatillo || !vRegalo) return recordar(null);

    const data = await shopifyFetch<CarritoPrueba>(CONSULTA, {
      lines: [
        { merchandiseId: vGatillo.id, quantity: 1 },
        { merchandiseId: vRegalo.id, quantity: 1 },
      ],
    });

    const lineas = data.cartCreate.cart?.lines.nodes ?? [];
    const linea = lineas.find((l) => l.merchandise.id === vRegalo.id);
    if (!linea) return recordar(null);

    const descontado = linea.discountAllocations.reduce(
      (s, d) => s + Number(d.discountedAmount.amount),
      0,
    );
    // Sin descuento no hay promo que anunciar: o caducó, o no llega al mínimo.
    if (descontado <= 0) return recordar(null);

    const moneda = linea.cost.totalAmount.currencyCode;
    const ahora = Number(linea.cost.totalAmount.amount);
    const antes = ahora + descontado;

    const vm: PromoVM = {
      gatilloHandles: gatillos.map((p) => p.handle),
      gatillo: {
        handle: gatillos[0].handle,
        title: gatillos[0].title,
        image: gatillos[0].images[0]?.url
          ? sizedImageUrl(gatillos[0].images[0].url, 800)
          : undefined,
      },
      regalo: {
        handle: regalo.handle,
        title: regalo.title,
        image: regalo.images[0]?.url
          ? sizedImageUrl(regalo.images[0].url, 400)
          : undefined,
        variantId: vRegalo.id,
        variantTitle: vRegalo.title,
        precio: antes,
        currency: moneda,
      },
      antes: formatMoney({ amount: String(antes), currencyCode: moneda }),
      ahora: formatMoney({ amount: String(ahora), currencyCode: moneda }),
      ahorro: formatMoney({ amount: String(descontado), currencyCode: moneda }),
    };
    memoria = { valor: vm, hasta: Date.now() + VIGENCIA_MS };
    return vm;
  } catch {
    // Nunca romper una página por culpa del aviso de una oferta.
    return null;
  }
});
