import { after } from "next/server";
import { esFlow, noAutorizado } from "@/lib/etiquetas/acceso";
import { numeroDeGid, urlPedidoAdmin } from "@/lib/etiquetas/admin";
import { crearTrabajo, falloPersistente, reclamarCompra } from "@/lib/etiquetas/cola";
import { anotarIntento, ESPERA_INICIAL_MS, iniciarCompra } from "@/lib/etiquetas/comprar";
import { decidir } from "@/lib/etiquetas/reglas";

// POST /api/etiquetas/pedido — la ÚNICA llamada de Shopify Flow al entrar un
// pedido listo para preparar ("Fulfillment order ready to fulfill", que
// también se dispara al liberar un pedido apartado). Cuerpo:
//   { "fulfillmentOrderId": "gid://shopify/FulfillmentOrder/…",
//     "orderId": "gid://shopify/Order/…", "orderName": "#1460#" }
//
// Aquí se decide todo (lib/etiquetas/reglas.ts) y Flow no decide nada:
//   { "fedex": true }   envío de $1.000 o más, apto. Flow compra la FedEx y
//                        luego llama a /api/etiquetas/aviso. Es lo ÚNICO que le
//                        deja comprar: el paso de Flow solo sigue si lee
//                        exactamente esto.
//   { "fedex": false }  todo lo demás. Si era un envío de menos de $1.000 apto,
//                        este código compra la USPS después de responder (202).
//
// Errores → 500 y Flow reintenta. Mientras tanto no se compra nada; si el
// mismo pedido sigue fallando pasados 10 min, se avisa en la PC.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const responder = (fedex: boolean, extra: Record<string, unknown> = {}, status = 200) =>
  Response.json({ ok: true, fedex, ...extra }, { status });

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
  const nombre = String(cuerpo.orderName ?? "").slice(0, 40) || "(sin número)";
  const llave = numeroDeGid(fulfillmentOrderId, "FulfillmentOrder");
  if (!llave || !numeroDeGid(orderId, "Order")) {
    return Response.json({ ok: false, error: "ids con formato inesperado" }, { status: 400 });
  }

  try {
    const d = await decidir(fulfillmentOrderId);
    if (d.accion === "nada") return responder(false, { motivo: d.motivo });
    // Lo que se guarda sale de Shopify, no de lo que mandó quien llamó.
    const datos = { fulfillmentOrderId, orderId: d.orderId, pedido: d.pedido };

    if (d.accion === "fedex") {
      // Se anota ANTES de decir que sí: es lo que luego vigila que Flow la
      // compre de verdad (comprar.ts → vigilarFedex).
      const mia = await reclamarCompra(datos, llave, "flow");
      return mia ? responder(true) : responder(false, { motivo: "Ya tiene una compra." });
    }

    const nueva = await reclamarCompra(datos, llave);
    if (!nueva) return responder(false, { duplicado: true });
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
    return responder(false, { usps: true }, 202);
  } catch (e) {
    console.error("[etiquetas] pedido", llave, (e as Error).message);
    try {
      if (await falloPersistente(llave)) {
        await crearTrabajo({
          id: `revisar-${llave}`,
          tipo: "abrir",
          pedido: nombre,
          titulo: `Revisa ${nombre}`,
          mensaje:
            "Lleva 10 min sin poder decidir su etiqueta (error con Shopify). Si no tiene etiqueta, hazla a mano.",
          adminUrl: urlPedidoAdmin(orderId),
        });
      }
    } catch {
      /* avisar es una ayuda: el error de verdad ya va a Flow y a Sentry */
    }
    return Response.json({ ok: false, error: "no se pudo decidir" }, { status: 500 });
  }
}
