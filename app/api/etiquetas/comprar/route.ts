import { after } from "next/server";
import { esFlow, compraActiva, noAutorizado } from "@/lib/etiquetas/acceso";
import { nombreTienda, numeroDeGid } from "@/lib/etiquetas/admin";
import { crearTrabajo, leerCompra, reclamarCompra } from "@/lib/etiquetas/cola";
import { anotarIntento, ESPERA_INICIAL_MS, iniciarCompra } from "@/lib/etiquetas/comprar";

// POST /api/etiquetas/comprar — lo llama Shopify Flow cuando entra un pedido
// Economy de menos de $1.000 listo para preparar ("Fulfillment order ready to
// fulfill"). Cuerpo:
//   { "fulfillmentOrderId": "gid://shopify/FulfillmentOrder/…",
//     "orderId": "gid://shopify/Order/…", "orderName": "#1460#" }
//
// Responde enseguida (Flow espera como mucho 30 s y reintenta si no) y hace
// la compra después, con `after`. Cualquier respuesta 2xx le dice a Flow que
// no reintente; por eso un duplicado o el sistema apagado también son 2xx.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!esFlow(req)) return noAutorizado();

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const fulfillmentOrderId = String(cuerpo.fulfillmentOrderId ?? "");
  const orderId = String(cuerpo.orderId ?? "");
  const pedido = String(cuerpo.orderName ?? "").slice(0, 40) || "(sin número)";
  const llave = numeroDeGid(fulfillmentOrderId, "FulfillmentOrder");
  const orderNum = numeroDeGid(orderId, "Order");
  if (!llave || !orderNum) {
    return Response.json({ ok: false, error: "ids con formato inesperado" }, { status: 400 });
  }

  if (!compraActiva()) {
    // Apagado: no se compra, pero el pedido no se pierde — la PC lo abre para
    // que se compre a mano. Salvo que este pedido ya pasara por aquí (un
    // reintento de Flow): entonces decir "cómprala a mano" invitaría a pagar
    // una segunda etiqueta.
    if (await leerCompra(llave)) return Response.json({ ok: true, duplicado: true });
    await crearTrabajo({
      id: `apagado-${llave}`,
      tipo: "abrir",
      pedido,
      titulo: `Compra la etiqueta de ${pedido}`,
      mensaje: "La compra automática está apagada. Cómprala a mano: USPS Ground Advantage.",
      adminUrl: `https://admin.shopify.com/store/${nombreTienda()}/orders/${orderNum}`,
    });
    return Response.json({ ok: true, apagado: true });
  }

  const nueva = await reclamarCompra({ fulfillmentOrderId, orderId, pedido }, llave);
  if (!nueva) return Response.json({ ok: true, duplicado: true });

  after(async () => {
    try {
      await iniciarCompra(llave, ESPERA_INICIAL_MS);
    } catch (e) {
      // Sin datos de la clienta en el registro: solo la llave y el error.
      // Si falló antes de pedir la compra, avanzarCompras la retoma en 90 s.
      console.error("[etiquetas] compra", llave, (e as Error).message);
      await anotarIntento(llave);
    }
  });
  return Response.json({ ok: true }, { status: 202 });
}
