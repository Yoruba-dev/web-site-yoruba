// Qué etiqueta lleva cada pedido, y qué pasa con el que no puede salir solo.
// UNA sola puerta para todo: Flow avisa de cada pedido listo para preparar
// (app/api/etiquetas/pedido) y lo que se decide aquí es lo único que cuenta:
//
//   - Economy → "usps": este código compra USPS Ground Advantage (comprar.ts).
//   - Express → "fedex": Flow compra FedEx 2Day (la API no puede). Flow solo
//     compra si la respuesta lo dice; ante un error, un "no" o ninguna
//     respuesta, no gasta.
//   - El resto → "nada", y si hay algo que hacer, un aviso en la PC.
//
// Lo que el dueño tiene que resolver (pago, fraude, pieza por encargo) además
// se APARTA en Shopify. Liberarlo es su visto bueno: Flow vuelve a avisar,
// esos motivos ya no cuentan y la etiqueta sale sola. Para hacerla a mano en
// su lugar, el pedido lleva la etiqueta (tag) «etiqueta-manual».
//
// Los de $1.000 o más NUNCA salen solos: ni la API ni Flow pueden poner firma,
// y sin firma el seguro no cubre joyería de ese valor. Esos solo se avisan
// (apartarlos obligaría a liberarlos para poder comprarles la etiqueta).
//
// Se lee el pedido de Shopify en el momento, nunca lo que mandó quien llamó.

import { lineaHechaPorEncargo } from "@/lib/commerce";
import { compraActiva } from "./acceso";
import { adminGraphql, numeroDeGid, urlPedidoAdmin } from "./admin";
import { anotarRevisado, crearTrabajo, leerRevisado } from "./cola";

export const TAG_MANUAL = "etiqueta-manual";
export const LIMITE_VALOR = 1000;

export type Decision =
  | { accion: "usps" | "fedex"; pedido: string; orderId: string }
  | { accion: "nada"; motivo: string };

/** Lo que el dueño puede dar por bueno liberando el pedido. */
type Apartable = "pago" | "riesgo" | "encargo";
type Problema = { tipo: Apartable | "valor"; texto: string };

interface PedidoLeido {
  status: string;
  deliveryMethod: { methodType: string } | null;
  fulfillmentHolds: { heldByRequestingApp: boolean }[];
  order: {
    id: string;
    name: string;
    tags: string[];
    cancelledAt: string | null;
    displayFinancialStatus: string | null;
    subtotalPriceSet: { shopMoney: { amount: string } } | null;
    shippingLine: { title: string; source: string | null } | null;
    risk: { recommendation: string };
    lineItems: {
      nodes: {
        currentQuantity: number;
        originalUnitPriceSet: { shopMoney: { amount: string } };
        customAttributes: { key: string }[];
        product: { tags: string[] } | null;
      }[];
    };
  };
}

async function leerPedido(fulfillmentOrderId: string): Promise<PedidoLeido | null> {
  const { fulfillmentOrder } = await adminGraphql<{ fulfillmentOrder: PedidoLeido | null }>(
    `query($id: ID!) { fulfillmentOrder(id: $id) {
       status
       deliveryMethod { methodType }
       fulfillmentHolds { heldByRequestingApp }
       order {
         id name tags cancelledAt displayFinancialStatus
         subtotalPriceSet { shopMoney { amount } }
         shippingLine { title source }
         risk { recommendation }
         lineItems(first: 50) { nodes {
           currentQuantity
           originalUnitPriceSet { shopMoney { amount } }
           customAttributes { key }
           product { tags }
         } }
       }
     } }`,
    { id: fulfillmentOrderId },
  );
  return fulfillmentOrder;
}

/** Todo lo que impide que salga solo, no solo lo primero que falle. */
function medir(o: PedidoLeido["order"]): Problema[] {
  const out: Problema[] = [];
  if (o.displayFinancialStatus !== "PAID") {
    out.push({ tipo: "pago", texto: `El pago no está completo (${o.displayFinancialStatus}).` });
  }
  // NONE = Shopify no lo analizó (pedidos de Etsy, borradores pagados a mano).
  if (o.risk.recommendation === "INVESTIGATE" || o.risk.recommendation === "CANCEL") {
    out.push({
      tipo: "riesgo",
      texto: "Shopify no lo dio por seguro: mira el análisis de fraude antes de enviar oro.",
    });
  }
  if (o.lineItems.nodes.some((l) => lineaHechaPorEncargo(l.product?.tags, l.customAttributes))) {
    out.push({ tipo: "encargo", texto: "Lleva una pieza por encargo: se fabrica antes de enviarse." });
  }
  // El precio de lista, no el rebajado: un descuento no cambia lo que vale la
  // pieza si se pierde. Se toma el mayor de los dos por si el pedido se editó.
  const lista = o.lineItems.nodes.reduce(
    (s, l) => s + Number(l.originalUnitPriceSet.shopMoney.amount) * l.currentQuantity,
    0,
  );
  const valor = Math.max(lista, Number(o.subtotalPriceSet?.shopMoney.amount ?? 0));
  if (valor >= LIMITE_VALOR) {
    out.push({
      tipo: "valor",
      texto: `Vale $${Math.round(valor)}: cómprale FedEx con FIRMA y seguro por el valor total, a mano.`,
    });
  }
  return out;
}

const esApartable = (p: Problema): p is Problema & { tipo: Apartable } => p.tipo !== "valor";

async function avisar(id: string, o: PedidoLeido["order"], titulo: string, lineas: string[]) {
  await crearTrabajo({
    id,
    tipo: "abrir",
    pedido: o.name,
    titulo,
    mensaje: lineas.join(" "),
    adminUrl: urlPedidoAdmin(o.id),
  });
}

/**
 * Decide la etiqueta de un fulfillment order. Repetible: los avisos no se
 * duplican (van por id) y un pedido ya apartado no se vuelve a apartar.
 * Lanza error si no puede leer o apartar: quien llama responde 500 y Flow
 * reintenta. Ante la duda, no se compra.
 */
export async function decidir(fulfillmentOrderId: string): Promise<Decision> {
  const llave = numeroDeGid(fulfillmentOrderId, "FulfillmentOrder");
  const fo = llave ? await leerPedido(fulfillmentOrderId) : null;
  if (!llave || !fo) throw new Error("Shopify no encuentra ese pedido.");
  const o = fo.order;
  const nada = (motivo: string): Decision => ({ accion: "nada", motivo });

  if (fo.status === "ON_HOLD" || fo.status === "SCHEDULED") {
    // Si lo apartamos nosotros y se cortó antes de anotarlo, se anota ahora:
    // si no, al liberarlo se volvería a apartar por lo mismo.
    if (fo.fulfillmentHolds.some((h) => h.heldByRequestingApp)) {
      await anotarRevisado(llave, medir(o).filter(esApartable).map((p) => p.tipo));
    }
    return nada(`Pedido ${fo.status}: se decide al liberarlo.`);
  }
  // Ya preparado, cancelado o recogida: nada que comprar ni que avisar.
  if (fo.status !== "OPEN" || o.cancelledAt) return nada(`Pedido ${fo.status}.`);
  if (fo.deliveryMethod?.methodType !== "SHIPPING") return nada("No es un envío.");
  // Etsy y otros canales traen su propio envío (y su propia etiqueta).
  if (o.shippingLine?.source !== "shopify") return nada("Envío de otro canal.");
  if (o.tags.some((t) => t.toLowerCase() === TAG_MANUAL)) return nada("Etiqueta a mano.");

  const express = /express/i.test(o.shippingLine.title);
  const servicio = express ? "FedEx 2Day" : "USPS Ground Advantage";
  const problemas = medir(o);
  const alto = problemas.find((p) => p.tipo === "valor");

  if (!compraActiva()) {
    await avisar(`apagado-${llave}`, o, `Compra la etiqueta de ${o.name}`, [
      `La compra automática está apagada: cómprala a mano (${alto ? "FedEx con firma" : servicio}).`,
      ...problemas.filter(esApartable).map((p) => p.texto),
    ]);
    return nada("Compra automática apagada.");
  }

  const vistos = await leerRevisado(llave);
  const nuevos = problemas.filter(esApartable).filter((p) => !vistos.includes(p.tipo));
  if (nuevos.length) {
    const tipos = nuevos.map((p) => p.tipo);
    // Orden a propósito: 1º el aviso, 2º apartar, 3º anotarlo. Si algo se
    // corta, el peor caso es un aviso de más — nunca un pedido apartado sin
    // que nadie lo sepa, ni uno anotado como visto sin estar apartado (eso
    // dejaría comprarlo sin revisar).
    await avisar(`apartado-${tipos.join("-")}-${llave}`, o, `${o.name} APARTADO: revísalo`, [
      ...problemas.map((p) => p.texto),
      alto
        ? "Cuando esté listo, libéralo y compra la etiqueta a mano."
        : `Cuando esté listo, LIBÉRALO en Shopify: la etiqueta ${servicio} se compra e imprime sola. Para hacerla tú, ponle antes la etiqueta «${TAG_MANUAL}».`,
    ]);
    await apartar(
      fulfillmentOrderId,
      tipos.includes("pago") ? "AWAITING_PAYMENT" : tipos.includes("riesgo") ? "HIGH_RISK_OF_FRAUD" : "OTHER",
      `Etiquetas PYJ: ${nuevos.map((p) => p.texto).join(" ")} Al liberarlo, la etiqueta sale sola.`,
    );
    await anotarRevisado(llave, tipos);
    return nada(`Apartado: ${tipos.join(", ")}.`);
  }

  if (alto) {
    await avisar(`valor-${llave}`, o, `${o.name} vale $1.000 o más`, [alto.texto]);
    return nada("Vale $1.000 o más.");
  }
  return { accion: express ? "fedex" : "usps", pedido: o.name, orderId: o.id };
}

/** Un pedido apartado no admite etiqueta: ni Flow ni nadie puede comprarla. */
async function apartar(
  fulfillmentOrderId: string,
  razon: "AWAITING_PAYMENT" | "HIGH_RISK_OF_FRAUD" | "OTHER",
  notas: string,
): Promise<void> {
  const { fulfillmentOrderHold: r } = await adminGraphql<{
    fulfillmentOrderHold: { userErrors: { message: string }[] };
  }>(
    `mutation($id: ID!, $hold: FulfillmentOrderHoldInput!) {
       fulfillmentOrderHold(id: $id, fulfillmentHold: $hold) { userErrors { message } }
     }`,
    {
      id: fulfillmentOrderId,
      // notifyMerchant: además del aviso en la PC, el correo de Shopify. Si la
      // PC está apagada, el dueño se entera igual.
      hold: { reason: razon, reasonNotes: notas.slice(0, 255), notifyMerchant: true },
    },
  );
  if (r.userErrors.length) throw new Error(r.userErrors.map((e) => e.message).join("; "));
}
