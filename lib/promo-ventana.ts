import { cache } from "react";
import { shopifyFetch, shopifyGetPromoVentana } from "./shopify";
import { formatMoney, sizedImageUrl } from "./utils";
import type { Product, PromoMezcla } from "./types";
import type { FeaturedOfferVM } from "./featured-offer";

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
//   · cuántas      -> su metafield `promo.minimo` (entero). Si falta, 1: la
//                     promo de siempre, sin condición
//   · cuánto es    -> se MIDE en un carrito de prueba, no se escribe
//
// Así, la promo del mes que viene se lanza sin tocar código: otras piezas, otra
// fecha, y hasta otro porcentaje.
//
// EL MÍNIMO
// ---------
// Para descuentos de Shopify del tipo "10% llevando 12 o más". El metafield
// tiene que decir lo MISMO que el requisito del descuento: el carrito de
// prueba compra esas unidades, y con menos Shopify no descuenta y la promo no
// sale. Con un mínimo mayor que 1, cada sitio que enseña el % o un precio
// rebajado dice la condición al lado ("−10% · 12+", "$13.50 c/u llevando 12
// o más"): un "10% OFF" a secas haría creer que vale para una sola pieza.
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
  /** La imagen de la colección: es el banner de la campaña en la portada. */
  imagen?: string;
  imagenAlt: string | null;
  /** La ficha de la pieza si la promo es de UNA sola; si no, la colección. */
  href: string;
  /** Porcentaje MEDIDO en el carrito de prueba. Nunca escrito en el código. */
  pct: number;
  /** Instante de fin en ISO absoluto (con Z), o null si falta el metafield. */
  hasta: string | null;
  /** Unidades que hay que llevar para que caiga el descuento (`promo.minimo`).
   *  1 = la promo de siempre. Con más, toda superficie dice la condición. */
  minimo: number;
  /** Qué se puede mezclar para llegar al mínimo, si la promo es de UNA pieza
   *  con varias variantes. null con varias piezas o con una sola variante. */
  mezcla: PromoMezcla;
  /** Handles de las piezas participantes, para marcarlas en las rejillas. */
  handles: string[];
  piezas: { handle: string; title: string; image?: string }[];
  /** Un ejemplo con números reales, para ilustrar el ahorro. Siempre POR
   *  UNIDAD, aunque el carrito de prueba compre `minimo`: "$15 → $13.50 c/u".
   *  `variante` es la medida del ejemplo ("3 mm") si la pieza tiene varias,
   *  porque con un mínimo el precio por unidad cambia de una a otra. */
  ejemplo: Precios & { titulo: string; variante: string | null };
  /** Los mismos números para el lote entero de `minimo` unidades ("ahorras
   *  $18 comprando 12"). Con minimo 1 coinciden con `ejemplo`. */
  lote: Precios;
}

/** Un antes/ahora/ahorro ya formateado. Los `…Corto` quitan los centavos
 *  cuando no los hay ("$100" y no "$100.00"), que es como se dice un precio en
 *  un anuncio. */
interface Precios {
  antes: string;
  ahora: string;
  ahorro: string;
  antesCorto: string;
  ahoraCorto: string;
  ahorroCorto: string;
}

/** "$100" si el importe es redondo; "$99.50" si no. */
function precioCorto(amount: number, currencyCode: string): string {
  const completo = formatMoney({ amount: amount.toFixed(2), currencyCode });
  return Number.isInteger(Math.round(amount * 100) / 100) ? completo.replace(/\.00$/, "") : completo;
}

function precios(ahora: number, desc: number, currencyCode: string): Precios {
  const largo = (n: number) => formatMoney({ amount: String(n), currencyCode });
  return {
    antes: largo(ahora + desc),
    ahora: largo(ahora),
    ahorro: largo(desc),
    antesCorto: precioCorto(ahora + desc, currencyCode),
    ahoraCorto: precioCorto(ahora, currencyCode),
    ahorroCorto: precioCorto(desc, currencyCode),
  };
}

/** El metafield `promo.minimo` hecho número. Vacío, roto o menor que 1 -> 1
 *  (sin condición). Tope de 100: es lo que compra el carrito de prueba, y un
 *  número absurdo puesto por error no debe acabar en un carrito de mil. */
function minimoShopify(raw?: string | null): number {
  const n = Number(raw ?? "");
  if (!Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, 100);
}

/**
 * Qué puede mezclar la clienta para llegar al mínimo. El mínimo de un
 * descuento de Shopify cuenta todas las unidades que entran en él, así que si
 * la pieza entera está en la promo (que es lo que marca la etiqueta) sus
 * variantes se suman. Casi siempre son medidas o tallas; si la opción es otra
 * (quilataje, material…) se dice "opciones", que tampoco miente.
 *
 * Cuentan solo las variantes que se pueden comprar: si de cuatro medidas solo
 * hay existencias de una, "puedes mezclar medidas" prometería algo imposible.
 */
function queMezclar(p: Product): PromoMezcla {
  if (p.variants.filter((v) => v.availableForSale).length < 2) return null;
  return /medida|tama|talla|largo/i.test(p.optionName ?? "") ? "medidas" : "opciones";
}

/** "miércoles 7 de octubre", en hora de Miami: la fecha de fin dicha como la
 *  diría alguien del taller. Se calcula en el servidor para que no dependa del
 *  reloj ni del huso del visitante. */
export function fechaCortaMiami(iso: string): string {
  const partes = new Intl.DateTimeFormat("es-US", {
    timeZone: "America/New_York",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(new Date(iso));
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return `${v("weekday")} ${v("day")} de ${v("month")}`;
}

/**
 * La promo vestida como "oferta destacada", para el popup de bienvenida. Así
 * el popup no necesita saber de dónde sale la oferta: le llega la misma forma
 * que con una pieza rebajada, más la hora de fin para apagarse a tiempo.
 */
export function comoOfertaDestacada(vm: PromoVentanaVM): FeaturedOfferVM {
  return {
    title: vm.titulo,
    href: vm.href,
    image: vm.imagen ?? vm.piezas[0]?.image,
    pct: vm.pct,
    was: vm.ejemplo.antes,
    now: vm.ejemplo.ahora,
    saved: vm.ejemplo.ahorro,
    hasta: vm.hasta,
    minimo: vm.minimo,
    variante: vm.ejemplo.variante,
  };
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
          quantity: number;
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
            quantity
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

      // La línea de la promo lleva `minimo` unidades: con un descuento de
      // "llevando 12 o más", una sola no ve nada y la promo no saldría nunca.
      // El control sigue en 1. Subirlo pediría existencias a una pieza
      // cualquiera, y no hace falta: una rebaja general de "lleva N" le cae
      // igual, porque el carrito ya suma N unidades.
      const minimo = minimoShopify(col.minimo);
      const lines = [{ merchandiseId: vPromo.id, quantity: minimo }];
      if (vControl) lines.push({ merchandiseId: vControl, quantity: 1 });

      const data = await shopifyFetch<CarritoPrueba>(PROBAR, { lines });
      const lineas = data.cartCreate.cart?.lines.nodes ?? [];

      // Shopify recorta la cantidad a las existencias. Si no hay `minimo`
      // unidades de la primera variante, el descuento no cae y la promo no
      // sale — y desde fuera solo se ve que "no sale". Se avisa en los
      // registros de Netlify.
      const enCarrito = lineas.find((l) => l.merchandise.id === vPromo.id)?.quantity;
      if (enCarrito !== undefined && enCarrito < minimo) {
        console.warn(
          `[promo] el carrito de prueba solo admitió ${enCarrito} de ${minimo} ` +
            `unidades de "${pieza.title}" (${vPromo.title}) — ¿hay existencias?`,
        );
      }

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
      // El ejemplo va por unidad: se reparte el total de la línea entre las
      // unidades que de verdad entraron. Con 1, es el número tal cual.
      //
      // Se redondea a centavos UNA vez y el ahorro sale de la resta: si no,
      // $164.70 / 12 = 13.725 lo redondea cada formateador a su manera ($13.73
      // en el popup, $13.72 en la portada) y antes − ahora no daría el ahorro.
      // El lote tiene que ser de `minimo` unidades, que es lo que dice la
      // etiqueta ("comprando 12"): si el carrito entró entero, los totales
      // reales de Shopify; si entró recortado, el precio por unidad × `minimo`.
      // Con minimo 1 nada de esto cambia un número: Shopify ya da centavos.
      const uds = linea.quantity > 0 ? linea.quantity : 1;
      const centavos = (n: number) => Math.round(n * 100) / 100;
      const antesU = centavos((ahora + desc) / uds);
      const ahoraU = centavos(ahora / uds);
      const ahorroU = centavos(antesU - ahoraU);

      return recordar({
        titulo: col.title,
        descripcion: col.description,
        imagen: col.image ? sizedImageUrl(col.image, 1200) : undefined,
        imagenAlt: col.imageAlt,
        // Con una sola pieza, la colección sería un paso de más antes de
        // poder comprarla.
        href:
          col.products.length === 1
            ? `/products/${encodeURIComponent(col.products[0].handle)}`
            : `/collections/${COLECCION_PROMO}`,
        pct,
        hasta: hastaMs !== null ? new Date(hastaMs).toISOString() : null,
        minimo,
        mezcla: col.products.length === 1 ? queMezclar(pieza) : null,
        handles: col.products.map((p) => p.handle),
        piezas: col.products.slice(0, 6).map((p) => ({
          handle: p.handle,
          title: p.title,
          image: p.images[0]?.url ? sizedImageUrl(p.images[0].url, 600) : undefined,
        })),
        ejemplo: {
          titulo: pieza.title,
          // Con espacios duros: "3 mm" partido en dos líneas no se lee.
          variante:
            pieza.variants.length > 1 ? vPromo.title.replace(/ /g, "\u00a0") : null,
          ...precios(ahoraU, ahorroU, moneda),
        },
        lote:
          uds === minimo
            ? precios(ahora, desc, moneda)
            : precios(centavos(ahoraU * minimo), centavos(ahorroU * minimo), moneda),
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
    dentro.has(p.handle)
      ? {
          ...p,
          promo: {
            pct: vm.pct,
            hasta: vm.hasta,
            minimo: vm.minimo,
            mezcla: queMezclar(p),
          },
        }
      : p,
  );
}
