import { esFlow, noAutorizado } from "@/lib/etiquetas/acceso";
import { nombreTienda, numeroDeGid } from "@/lib/etiquetas/admin";
import { crearTrabajo } from "@/lib/etiquetas/cola";

// POST /api/etiquetas/aviso — lo llama Shopify Flow para todo lo que NO compra
// este código y que, por tanto, la PC no puede imprimir sola:
//
//   tipo "fedex"     Flow compró la etiqueta FedEx 2Day (pedido Express). La PC
//                    abre el pedido en Chrome y basta un clic en «Imprimir».
//   tipo "apartado"  pedido de $1.000 o más que Flow retuvo. La PC avisa y abre
//                    el pedido para comprar FedEx con firma y seguro.
//
// Cuerpo: { "tipo": "fedex" | "apartado", "orderId": "gid://shopify/Order/…",
//           "orderName": "#1460#" }

export const dynamic = "force-dynamic";

const TEXTOS = {
  fedex: {
    titulo: (p: string) => `Etiqueta FedEx de ${p} lista`,
    mensaje: "Se abrió el pedido: pulsa «Imprimir etiqueta».",
  },
  apartado: {
    titulo: (p: string) => `${p} vale $1.000 o más`,
    mensaje:
      "Está apartado. Compra FedEx con FIRMA y seguro por el valor total, y luego imprime.",
  },
} as const;

export async function POST(req: Request) {
  if (!esFlow(req)) return noAutorizado();

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const tipo = String(cuerpo.tipo ?? "") as keyof typeof TEXTOS;
  const pedido = String(cuerpo.orderName ?? "").slice(0, 40) || "(sin número)";
  const orderNum = numeroDeGid(String(cuerpo.orderId ?? ""), "Order");
  if (!(tipo in TEXTOS) || !orderNum) {
    return Response.json({ ok: false, error: "tipo u orderId inválido" }, { status: 400 });
  }

  // Un aviso por pedido y tipo: si Flow reintenta, no se abre dos veces.
  await crearTrabajo({
    id: `${tipo}-${orderNum}`,
    tipo: "abrir",
    pedido,
    titulo: TEXTOS[tipo].titulo(pedido),
    mensaje: TEXTOS[tipo].mensaje,
    adminUrl: `https://admin.shopify.com/store/${nombreTienda()}/orders/${orderNum}`,
  });
  return Response.json({ ok: true });
}
