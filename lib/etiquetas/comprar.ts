// Compra de la etiqueta USPS de un pedido Economy, de principio a fin.
//
// Por qué la compra la hace este código y no Flow: Shopify solo deja bajar el
// PDF de las etiquetas que compró la propia app (probado el 2026-10-03: la
// etiqueta comprada a mano devuelve la url VACÍA). Si la comprara Flow, la PC
// no tendría nada que imprimir sola.
//
// Lo que la API NO deja elegir: el servicio. preferredRateSelection falla en
// la práctica, así que no se manda y Shopify compra la tarifa más barata de
// las transportistas preferidas. FedEx está excluido de la API, de modo que
// en esta tienda (USPS + FedEx preferidas) la más barata es USPS Ground
// Advantage — justo lo que corresponde a "Economy".
//
// Lo que tampoco deja: seguro adicional ni firma. Por eso aquí solo se compran
// pedidos de menos de $1.000, pagados, sin riesgo de fraude y sin piezas por
// encargo. Todo lo demás se aparta y se avisa en la PC para hacerlo a mano.
//
// Las reglas se comprueban AQUÍ, releyendo el pedido en Shopify justo antes de
// pagar, aunque Flow ya filtre: el filtro de Flow puede cambiarse sin querer,
// y si la clave de Flow se filtrara, esta es la última puerta antes del dinero.

import { lineaHechaPorEncargo } from "@/lib/commerce";
import { compraActiva } from "./acceso";
import { adminGraphql, nombreTienda, numeroDeGid, tokenAdmin } from "./admin";
import {
  comprasEnCurso,
  crearTrabajo,
  guardarArchivo,
  leerCompra,
  moverCompra,
  soltarCompra,
  type Compra,
  type EstadoCompra,
} from "./cola";

/** Lo que espera la llamada original a que Shopify termine la compra. */
export const ESPERA_INICIAL_MS = 35_000;
const PAUSA_MS = 2_500;
const MINUTO = 60_000;

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

function urlPedido(orderId: string): string | undefined {
  const n = numeroDeGid(orderId, "Order");
  return n ? `https://admin.shopify.com/store/${nombreTienda()}/orders/${n}` : undefined;
}

/** Un aviso en la PC con el pedido abierto. Idempotente por id. */
async function avisar(id: string, compra: Compra, titulo: string, mensaje: string) {
  await crearTrabajo({
    id,
    tipo: "abrir",
    pedido: compra.pedido,
    titulo,
    mensaje,
    adminUrl: urlPedido(compra.orderId),
  });
}

/**
 * Cierra una compra como fallida y avisa. El texto depende de lo único que le
 * importa a quien lo lee: ¿ya se pagó o no? Decir "cómprala a mano" sobre una
 * etiqueta que ya se cobró es invitar a pagar dos.
 */
async function fallar(
  llave: string,
  de: EstadoCompra,
  motivo: string,
  pago: "no" | "si" | "no-se",
): Promise<void> {
  const c = await moverCompra(llave, de, { estado: "fallida", motivo: motivo.slice(0, 500) });
  if (!c) return; // otro proceso ya la cerró
  const textos = {
    no: [
      `No se compró la etiqueta de ${c.pedido}`,
      `Cómprala a mano (USPS Ground Advantage). Motivo: ${motivo}`,
    ],
    si: [
      `Etiqueta de ${c.pedido} YA PAGADA`,
      `Imprímela desde el pedido con «Imprimir etiqueta». NO compres otra. ${motivo}`,
    ],
    "no-se": [
      `Revisa ${c.pedido} antes de comprar`,
      `No se sabe si la etiqueta llegó a pagarse. Mira en el pedido si ya tiene una; solo si no la tiene, cómprala a mano. ${motivo}`,
    ],
  } as const;
  await avisar(`fallo-${llave}`, c, textos[pago][0], textos[pago][1]);
}

/** No toca comprarla: se cierra la compra y, si hay algo que hacer, se avisa. */
async function omitir(llave: string, motivo: string, aviso?: [titulo: string, mensaje: string]) {
  const c = await moverCompra(llave, "reclamada", { estado: "omitida", motivo });
  if (c && aviso) await avisar(`aviso-${llave}`, c, aviso[0], aviso[1]);
}

interface PedidoParaComprar {
  status: string;
  deliveryMethod: { methodType: string } | null;
  order: {
    id: string;
    name: string;
    cancelledAt: string | null;
    displayFinancialStatus: string | null;
    subtotalPriceSet: { shopMoney: { amount: string } };
    shippingLine: { title: string } | null;
    risk: { recommendation: string };
    lineItems: {
      nodes: { customAttributes: { key: string }[]; product: { tags: string[] } | null }[];
    };
  };
}

/** Paso 1: relee el pedido, comprueba TODAS las reglas y lanza la compra. */
export async function iniciarCompra(llave: string, presupuestoMs: number): Promise<void> {
  const compra = await leerCompra(llave);
  if (!compra || compra.estado !== "reclamada") return;

  // El interruptor manda también aquí, no solo en la ruta de Flow: esta
  // función la llaman además las consultas de la PC, que no pasan por la ruta.
  if (!compraActiva()) {
    return omitir(llave, "Compra automática apagada.", [
      `Compra la etiqueta de ${compra.pedido}`,
      "La compra automática está apagada. Cómprala a mano: USPS Ground Advantage.",
    ]);
  }

  const { fulfillmentOrder: fo } = await adminGraphql<{
    fulfillmentOrder: PedidoParaComprar | null;
  }>(
    `query($id: ID!) { fulfillmentOrder(id: $id) {
       status
       deliveryMethod { methodType }
       order {
         id name cancelledAt displayFinancialStatus
         subtotalPriceSet { shopMoney { amount } }
         shippingLine { title }
         risk { recommendation }
         lineItems(first: 50) { nodes { customAttributes { key } product { tags } } }
       }
     } }`,
    { id: compra.fulfillmentOrderId },
  );

  if (!fo) return fallar(llave, "reclamada", "Shopify no encuentra ese pedido.", "no");
  const o = fo.order;
  const pedido = o.name; // de Shopify, no de lo que mandó quien llamó

  // Retenido o programado: aún no. Se suelta el cerrojo para que el aviso de
  // Flow al liberarlo pueda reclamarlo otra vez.
  if (fo.status === "ON_HOLD" || fo.status === "SCHEDULED") return soltarCompra(llave);
  // Ya preparado, cancelado o recogida: no hay nada que comprar ni que avisar.
  if (fo.status !== "OPEN" || o.cancelledAt) return omitir(llave, `Pedido ${fo.status}.`);
  if (fo.deliveryMethod?.methodType !== "SHIPPING") return omitir(llave, "No es un envío.");

  if (o.displayFinancialStatus !== "PAID") {
    return omitir(llave, `Pago ${o.displayFinancialStatus}.`, [
      `${pedido}: el pago no está completo`,
      `Shopify lo marca como ${o.displayFinancialStatus}. Revísalo antes de enviar; la etiqueta se compra a mano.`,
    ]);
  }
  if (o.risk.recommendation !== "ACCEPT") {
    return omitir(llave, `Riesgo ${o.risk.recommendation}.`, [
      `${pedido}: revisar riesgo de fraude`,
      "Shopify no lo dio por seguro. Mira el análisis de fraude en el pedido antes de enviar oro; la etiqueta se compra a mano.",
    ]);
  }
  // Nunca sin firma una pieza de $1.000 o más: el seguro de Shopify no la
  // cubriría en absoluto. Flow ya las aparta; esto es la segunda red.
  if (Number(o.subtotalPriceSet.shopMoney.amount) >= 1000) {
    return omitir(llave, "Vale $1.000 o más.", [
      `${pedido} vale $1.000 o más`,
      "Cómprale FedEx con FIRMA y seguro por el valor total, a mano.",
    ]);
  }
  if (/express/i.test(o.shippingLine?.title ?? "")) {
    return omitir(llave, "Envío Express.", [
      `${pedido} pagó Express`,
      "Express va por FedEx: no la compra este programa. Revisa el flujo de Flow.",
    ]);
  }
  if (o.lineItems.nodes.some((l) => lineaHechaPorEncargo(l.product?.tags, l.customAttributes))) {
    return omitir(llave, "Lleva una pieza por encargo.", [
      `${pedido} lleva una pieza por encargo`,
      "Se fabrica antes de enviarse. Compra la etiqueta cuando la pieza esté lista.",
    ]);
  }

  // El cerrojo de verdad: solo quien logre pasar "reclamada" → "lanzando"
  // pide la compra. A partir de aquí, si algo se cae, la compra NO se vuelve
  // a intentar sola (ver avanzarCompras): mejor un aviso que pagar dos veces.
  const lanzada = await moverCompra(llave, "reclamada", {
    estado: "lanzando",
    pedido,
    orderId: o.id,
  });
  if (!lanzada) return;

  const { shippingLabelPurchase: r } = await adminGraphql<{
    shippingLabelPurchase: {
      shippingLabelPurchaseResult: { id: string } | null;
      userErrors: { code: string | null; message: string }[];
    };
  }>(
    `mutation($input: ShippingLabelPurchaseInput!) {
       shippingLabelPurchase(shippingLabelPurchase: $input) {
         shippingLabelPurchaseResult { id }
         userErrors { code message }
       } }`,
    {
      input: {
        fulfillmentOrderId: compra.fulfillmentOrderId,
        // No puede ir en el pasado. Diez minutos de margen por si la llamada
        // tarda; la fecha impresa sigue siendo la de hoy.
        shippingDatetime: new Date(Date.now() + 10 * MINUTO).toISOString(),
        // Que Shopify mande a la clienta su correo con el rastreo, como haría
        // al comprar la etiqueta a mano con la casilla marcada.
        notifyCustomer: true,
      },
    },
  );

  if (r.userErrors.length || !r.shippingLabelPurchaseResult) {
    const msg = r.userErrors.map((e) => `${e.code ?? ""} ${e.message}`.trim()).join("; ");
    return fallar(llave, "lanzando", msg || "Shopify no aceptó la compra.", "no");
  }

  await moverCompra(llave, "lanzando", {
    estado: "comprando",
    resultadoId: r.shippingLabelPurchaseResult.id,
  });
  await esperarCompra(llave, presupuestoMs);
}

interface ResultadoCompra {
  status: "PENDING_PURCHASE" | "PURCHASED" | "PURCHASE_FAILED";
  errors: { code: string | null; message: string }[];
  shippingLabels: {
    id: string;
    shippingDocuments: { documentType: string; format: "PDF" | "ZPL"; url: string | null }[];
  }[];
}

/**
 * Paso 2: espera a que Shopify termine y deja el PDF en la cola. Si se acaba
 * el tiempo, la compra queda "comprando" y la retoma la próxima consulta de la
 * PC: así nunca se vuelve a comprar, solo a preguntar.
 */
export async function esperarCompra(llave: string, presupuestoMs: number): Promise<void> {
  const compra = await leerCompra(llave);
  if (!compra || compra.estado !== "comprando" || !compra.resultadoId) return;

  const hasta = Date.now() + presupuestoMs;
  let res: ResultadoCompra | null = null;
  for (;;) {
    const d = await adminGraphql<{ node: ResultadoCompra | null }>(
      `query($id: ID!) { node(id: $id) { ... on ShippingLabelPurchaseResult {
         status
         errors { code message }
         shippingLabels { id shippingDocuments { documentType format url } }
       } } }`,
      { id: compra.resultadoId },
    );
    res = d.node;
    if ((res && res.status !== "PENDING_PURCHASE") || Date.now() + PAUSA_MS > hasta) break;
    await dormir(PAUSA_MS);
  }
  if (!res || res.status === "PENDING_PURCHASE") return; // la retoma la PC

  if (res.status === "PURCHASE_FAILED") {
    const msg = res.errors.map((e) => `${e.code ?? ""} ${e.message}`.trim()).join("; ");
    return fallar(llave, "comprando", msg || "Shopify no pudo comprar la etiqueta.", "no");
  }

  const etiqueta = res.shippingLabels[0];
  const doc = etiqueta?.shippingDocuments.find((d) => d.documentType === "LABEL");
  const bytes = doc?.url ? await bajarDocumento(doc.url) : null;
  if (!etiqueta || !doc || !bytes) {
    return fallar(llave, "comprando", "Shopify no dio el PDF.", "si");
  }

  const num = numeroDeGid(etiqueta.id, "ShippingLabel") ?? llave;
  const archivo = `archivo/${num}`;
  await guardarArchivo(archivo, bytes);
  await crearTrabajo({
    id: `etiqueta-${num}`,
    tipo: "pdf",
    pedido: compra.pedido,
    titulo: `Etiqueta USPS de ${compra.pedido}`,
    archivo,
    formato: doc.format,
    // Si la PC no puede imprimirla, abre el pedido para hacerlo desde ahí.
    adminUrl: urlPedido(compra.orderId),
  });
  await moverCompra(llave, "comprando", { estado: "comprada", etiquetaId: etiqueta.id });
}

/**
 * El enlace del documento no está documentado: puede ser público o pedir el
 * token. Se prueba primero sin él (no mandar el token a un host que no lo
 * necesita) y luego con él, solo si el host es de Shopify.
 */
async function bajarDocumento(url: string): Promise<ArrayBuffer | null> {
  const intentar = async (headers: Record<string, string>) => {
    const r = await fetch(url, { headers, cache: "no-store" });
    return r.ok ? r.arrayBuffer() : null;
  };
  const sin = await intentar({});
  if (sin) return sin;
  const host = new URL(url).hostname;
  if (!/(^|\.)shopify(cdn)?\.com$/.test(host) && !host.endsWith(".myshopify.com")) return null;
  return intentar({ "X-Shopify-Access-Token": await tokenAdmin() });
}

/**
 * Retoma lo que quedó a medias. La llama cada consulta de la PC (cada medio
 * minuto), así que hace de "cron" sin necesitar una función programada.
 *
 *  - "reclamada": nunca se llegó a pedir la compra, así que reintentar es
 *    seguro. Se espera 90 s (Netlify corta a los 60, así que la llamada
 *    original ya murió) y se rinde a los 15 min o 5 intentos, con aviso.
 *  - "lanzando" con más de 3 min: se cayó justo al pedir la compra. No se sabe
 *    si Shopify la cobró → NO se reintenta; se avisa para revisarlo a mano.
 *  - "comprando": solo se pregunta a Shopify cómo va (preguntar no cuesta).
 *    Tras 45 s, para no pisarse con la llamada original; a los 15 min, aviso.
 */
export async function avanzarCompras(presupuestoMs: number): Promise<void> {
  const hasta = Date.now() + presupuestoMs;
  for (const { llave, compra } of await comprasEnCurso()) {
    const resta = hasta - Date.now();
    if (resta < 4_000) return;
    const desdeCreada = Date.now() - Date.parse(compra.creada);
    const desdeCambio = Date.now() - Date.parse(compra.actualizada);
    const presupuesto = Math.min(resta - 2_000, 8_000);
    try {
      if (compra.estado === "reclamada") {
        if (desdeCreada > 15 * MINUTO || (compra.intentos ?? 0) >= 5) {
          await fallar(llave, "reclamada", "Errores repetidos al consultar Shopify.", "no");
        } else if (desdeCambio > 90_000) {
          await iniciarCompra(llave, presupuesto);
        }
      } else if (compra.estado === "lanzando" && desdeCambio > 3 * MINUTO) {
        await fallar(llave, "lanzando", "Se cortó la conexión al pedirla.", "no-se");
      } else if (compra.estado === "comprando") {
        if (desdeCreada > 15 * MINUTO) {
          await fallar(llave, "comprando", "Shopify no terminó la compra en 15 min.", "no-se");
        } else if (desdeCambio > 45_000) {
          await esperarCompra(llave, presupuesto);
        }
      }
    } catch (e) {
      console.error("[etiquetas] avanzar", llave, (e as Error).message);
      await anotarIntento(llave);
    }
  }
}

/** Suma un intento fallido a una compra que aún no se lanzó. */
export async function anotarIntento(llave: string): Promise<void> {
  try {
    const c = await leerCompra(llave);
    if (c?.estado === "reclamada") {
      await moverCompra(llave, "reclamada", { estado: "reclamada", intentos: (c.intentos ?? 0) + 1 });
    }
  } catch {
    /* el contador es solo para rendirse antes; no debe romper nada */
  }
}
