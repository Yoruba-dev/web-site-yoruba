// Compra de la etiqueta USPS de un pedido Economy, de principio a fin, y
// vigilancia de la FedEx que compra Flow en los Express.
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
// Lo que tampoco deja: seguro adicional ni firma. Qué pedidos pueden salir
// solos lo decide reglas.ts, y se vuelve a preguntar AQUÍ, releyendo el pedido
// justo antes de pagar: es la última puerta antes del dinero.

import { adminGraphql, numeroDeGid, tokenAdmin, urlPedidoAdmin } from "./admin";
import { decidir } from "./reglas";
import {
  comprasEnCurso,
  crearTrabajo,
  entregarAviso,
  existeTrabajo,
  guardarArchivo,
  leerCompra,
  moverCompra,
  type Compra,
  type EstadoCompra,
} from "./cola";

/** Lo que espera la llamada original a que Shopify termine la compra. */
export const ESPERA_INICIAL_MS = 35_000;
const PAUSA_MS = 2_500;
const MINUTO = 60_000;

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cierra una compra como fallida y avisa. El texto depende de lo único que le
 * importa a quien lo lee: ¿ya se pagó o no? Decir "cómprala a mano" sobre una
 * etiqueta que ya se cobró es invitar a pagar dos.
 *
 * El aviso se guarda en la misma escritura que cierra la compra (con ETag):
 * solo quien gana ese cambio avisa, así nunca sale un "cómprala a mano"
 * mientras otro proceso la está comprando. Y si la entrega a la cola falla,
 * la próxima consulta de la PC la reintenta (entregarAviso).
 */
async function fallar(
  llave: string,
  de: EstadoCompra,
  motivo: string,
  pago: "no" | "si" | "no-se",
): Promise<void> {
  const c = await leerCompra(llave);
  if (!c || c.estado !== de) return;
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
  const hecha = await moverCompra(llave, de, {
    estado: "fallida",
    motivo: motivo.slice(0, 500),
    aviso: {
      id: `fallo-${llave}`,
      titulo: textos[pago][0],
      mensaje: textos[pago][1],
      adminUrl: urlPedidoAdmin(c.orderId),
    },
  });
  if (hecha) await entregarAviso(llave);
}

/** No toca comprarla: se cierra la compra y, si hay algo más que decir, se avisa. */
async function omitir(llave: string, de: EstadoCompra, motivo: string, aviso?: Compra["aviso"]) {
  const hecha = await moverCompra(llave, de, { estado: "omitida", motivo, ...(aviso ? { aviso } : {}) });
  if (hecha && aviso) await entregarAviso(llave);
}

/** Paso 1: relee el pedido, comprueba TODAS las reglas y lanza la compra. */
export async function iniciarCompra(llave: string, presupuestoMs: number): Promise<void> {
  const compra = await leerCompra(llave);
  if (!compra || compra.estado !== "reclamada") return;

  // Las mismas reglas que al entrar el pedido (reglas.ts), con el pedido de
  // ahora: entre una cosa y otra pudo cambiar. Si dice que no, ya avisó o
  // apartó ella; aquí solo se cierra la compra.
  const v = await decidir(compra.fulfillmentOrderId);
  if (v.accion === "nada") return omitir(llave, "reclamada", v.motivo);
  if (v.accion === "fedex") {
    return omitir(llave, "reclamada", "Ahora es Express.", {
      id: `revisar-${llave}`,
      titulo: `${v.pedido} pasó a Express`,
      mensaje: "Cómprale la etiqueta FedEx 2Day a mano.",
      adminUrl: urlPedidoAdmin(v.orderId),
    });
  }
  const pedido = v.pedido; // de Shopify, no de lo que mandó quien llamó

  // El cerrojo de verdad: solo quien logre pasar "reclamada" → "lanzando"
  // pide la compra. A partir de aquí, si algo se cae, la compra NO se vuelve
  // a intentar sola (ver avanzarCompras): mejor un aviso que pagar dos veces.
  const lanzada = await moverCompra(llave, "reclamada", {
    estado: "lanzando",
    pedido,
    orderId: v.orderId,
    lanzada: new Date().toISOString(),
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
  const num0 = etiqueta ? numeroDeGid(etiqueta.id, "ShippingLabel") : null;
  // Otra consulta ya la dejó en la cola: no volver a bajar ni guardar el PDF
  // (lleva la dirección de la clienta y nadie lo borraría).
  if (num0 && (await existeTrabajo(`etiqueta-${num0}`))) {
    await moverCompra(llave, "comprando", { estado: "comprada", etiquetaId: etiqueta.id });
    return;
  }
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
    adminUrl: urlPedidoAdmin(compra.orderId),
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
 * Express: Flow recibió "fedex" y debía comprarla al momento. Pasados 20 min
 * se mira el pedido. Si sigue abierto, Flow no la compró (sin tarifa, apartado
 * a mano, flujo apagado…) y se avisa. Si ya salió por FedEx pero el aviso de
 * Flow nunca llegó, se avisa para imprimirla.
 */
async function vigilarFedex(llave: string): Promise<void> {
  const c = await leerCompra(llave);
  if (c?.estado !== "flow") return;
  const { fulfillmentOrder: fo } = await adminGraphql<{
    fulfillmentOrder: {
      status: string;
      fulfillments: { nodes: { trackingInfo: { company: string | null }[] }[] };
    } | null;
  }>(
    `query($id: ID!) { fulfillmentOrder(id: $id) {
       status fulfillments(first: 5) { nodes { trackingInfo { company } } }
     } }`,
    { id: c.fulfillmentOrderId },
  );
  const adminUrl = urlPedidoAdmin(c.orderId);
  if (!fo || fo.status === "OPEN") {
    return omitir(llave, "flow", "Flow no compró la FedEx.", {
      id: `fedex-falta-${llave}`,
      titulo: `FedEx de ${c.pedido} sin comprar`,
      mensaje:
        "Flow no la compró en 20 min. Mira si el pedido ya tiene etiqueta; solo si no la tiene, cómprala a mano: FedEx 2Day.",
      adminUrl,
    });
  }
  // Apartado a mano: al liberarlo, Flow vuelve a avisar y se reclama de nuevo.
  if (fo.status === "ON_HOLD" || fo.status === "SCHEDULED") return omitir(llave, "flow", "Apartado.");
  const porFedex = fo.fulfillments.nodes.some((f) =>
    f.trackingInfo.some((t) => /fedex/i.test(t.company ?? "")),
  );
  if (!porFedex) return omitir(llave, "flow", `Preparado sin FedEx (${fo.status}).`);
  const hecha = await moverCompra(llave, "flow", {
    estado: "comprada",
    aviso: {
      id: `fedex-${llave}`, // el mismo id que usa el aviso de Flow: nunca dos
      titulo: `Etiqueta FedEx de ${c.pedido} lista`,
      mensaje: "Se abrió el pedido: pulsa «Imprimir etiqueta».",
      adminUrl,
    },
  });
  if (hecha) await entregarAviso(llave);
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
 *  - "flow": a los 20 min se mira si Flow compró la FedEx (vigilarFedex).
 */
export async function avanzarCompras(presupuestoMs: number): Promise<void> {
  const hasta = Date.now() + presupuestoMs;
  for (const { llave, compra } of await comprasEnCurso()) {
    const resta = hasta - Date.now();
    if (resta < 4_000) return;
    const desdeCreada = Date.now() - Date.parse(compra.creada);
    const desdeCambio = Date.now() - Date.parse(compra.actualizada);
    const desdeLanzada = Date.now() - Date.parse(compra.lanzada ?? compra.actualizada);
    const presupuesto = Math.min(resta - 2_000, 8_000);
    try {
      if (compra.aviso && !compra.avisado) {
        // Cerrada pero su aviso no llegó a la cola: reenviarlo.
        await entregarAviso(llave);
      } else if (compra.estado === "reclamada") {
        if (desdeCreada > 15 * MINUTO || (compra.intentos ?? 0) >= 5) {
          await fallar(llave, "reclamada", "Errores repetidos al consultar Shopify.", "no");
        } else if (desdeCambio > 90_000) {
          await iniciarCompra(llave, presupuesto);
        }
      } else if (compra.estado === "lanzando" && desdeCambio > 3 * MINUTO) {
        await fallar(llave, "lanzando", "Se cortó la conexión al pedirla.", "no-se");
      } else if (compra.estado === "comprando" && desdeCambio > 45_000) {
        // Preguntar no cuesta: SIEMPRE se pregunta antes de rendirse, aunque
        // la PC haya estado apagada horas — la etiqueta pudo terminar hace rato.
        await esperarCompra(llave, presupuesto);
        const ahora = await leerCompra(llave);
        if (ahora?.estado === "comprando" && desdeLanzada > 15 * MINUTO) {
          await fallar(llave, "comprando", "Shopify no terminó la compra en 15 min.", "no-se");
        }
      } else if (compra.estado === "flow" && desdeCambio > 20 * MINUTO) {
        await vigilarFedex(llave);
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
