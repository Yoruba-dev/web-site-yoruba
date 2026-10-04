import { esFlow, noAutorizado } from "@/lib/etiquetas/acceso";
import { nombreTienda, numeroDeGid, urlPedidoAdmin } from "@/lib/etiquetas/admin";
import { crearTrabajo, moverCompra } from "@/lib/etiquetas/cola";

// POST /api/etiquetas/aviso — lo llama Shopify Flow para lo que la PC no puede
// imprimir sola:
//
//   tipo "fedex"  Flow acaba de comprar la FedEx 2Day de un Express. La PC
//                 abre el pedido en Chrome y basta un clic en «Imprimir».
//                 { "tipo": "fedex", "fulfillmentOrderId": "gid://…",
//                   "orderId": "gid://shopify/Order/…", "orderName": "#1460#" }
//
//   tipo "fallo"  un flujo falló (disparador "Workflow error occurred"). La
//                 PC abre esa ejecución en Flow para ver qué pasó.
//                 { "tipo": "fallo", "workflowRunId": "…", "workflowName": "…" }

export const dynamic = "force-dynamic";

/** Un número estable a partir de un texto: los ids de trabajo terminan en número. */
function numeroDe(texto: string): string {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return String(h);
}

export async function POST(req: Request) {
  if (!esFlow(req)) return noAutorizado();

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const tipo = String(cuerpo.tipo ?? "");

  if (tipo === "fedex") {
    const llave = numeroDeGid(String(cuerpo.fulfillmentOrderId ?? ""), "FulfillmentOrder");
    const orderId = String(cuerpo.orderId ?? "");
    const pedido = String(cuerpo.orderName ?? "").slice(0, 40) || "(sin número)";
    if (!llave || !numeroDeGid(orderId, "Order")) {
      return Response.json({ ok: false, error: "ids con formato inesperado" }, { status: 400 });
    }
    // Comprada: ya no hay que vigilarla. Si no estaba en "flow" (la vigilancia
    // se adelantó), no pasa nada: el aviso sale igual.
    await moverCompra(llave, "flow", { estado: "comprada" });
    // Por fulfillment order, no por pedido: un pedido puede llevar dos. Y el
    // mismo id que usa la vigilancia: si los dos avisan, sale uno.
    await crearTrabajo({
      id: `fedex-${llave}`,
      tipo: "abrir",
      pedido,
      titulo: `Etiqueta FedEx de ${pedido} lista`,
      mensaje: "Se abrió el pedido: pulsa «Imprimir etiqueta».",
      adminUrl: urlPedidoAdmin(orderId),
    });
    return Response.json({ ok: true });
  }

  if (tipo === "fallo") {
    const run = String(cuerpo.workflowRunId ?? "");
    if (!/^[\w-]{1,100}$/.test(run)) {
      return Response.json({ ok: false, error: "workflowRunId inválido" }, { status: 400 });
    }
    const flujo = String(cuerpo.workflowName ?? "").slice(0, 60) || "un flujo";
    await crearTrabajo({
      id: `fallo-flujo-${numeroDe(run)}`,
      tipo: "abrir",
      pedido: flujo,
      titulo: `Falló ${flujo} en Shopify Flow`,
      mensaje:
        "Puede haber un pedido sin etiqueta. Mira la ejecución que se abrió y, si hace falta, hazla a mano.",
      // La URL se arma aquí con la tienda conocida: nunca se abre una que
      // venga en el cuerpo.
      adminUrl: `https://${nombreTienda()}.myshopify.com/admin/apps/flow/web/overview/activity/${run}`,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "tipo inválido" }, { status: 400 });
}
