import { esAgente, noAutorizado } from "@/lib/etiquetas/acceso";
import { cerrarTrabajo, crearTrabajo, ID_TRABAJO } from "@/lib/etiquetas/cola";

// POST /api/etiquetas/trabajos/<id>/hecho — la PC confirma.
// Cuerpo: { "estado": "hecho" | "fallido", "error": "…" }
//
// Cerrado el trabajo, el PDF se borra en ambos casos (lleva la dirección de la
// clienta). Si lo que falló fue imprimir una etiqueta, esa etiqueta YA ESTÁ
// PAGADA: se deja un aviso que no se va solo, con el pedido abierto, para
// imprimirla desde Shopify. Sin él, el pedido figura enviado y nadie lo manda.

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!esAgente(req)) return noAutorizado();
  const { id } = await ctx.params;
  if (!ID_TRABAJO.test(id)) return Response.json({ ok: false, error: "id inválido" }, { status: 400 });

  let cuerpo: Record<string, unknown> = {};
  try {
    cuerpo = await req.json();
  } catch {
    /* cuerpo vacío = hecho */
  }
  const estado = cuerpo.estado === "fallido" ? "fallido" : "hecho";
  const error = typeof cuerpo.error === "string" ? cuerpo.error : undefined;
  const t = await cerrarTrabajo(id, estado, error);
  if (!t) return Response.json({ ok: false, error: "no existe" }, { status: 404 });

  if (estado === "fallido" && t.tipo === "pdf") {
    await crearTrabajo({
      id: `reimprimir-${id}`,
      tipo: "abrir",
      pedido: t.pedido,
      titulo: `Etiqueta de ${t.pedido} YA PAGADA sin imprimir`,
      mensaje: "Imprímela desde el pedido con «Imprimir etiqueta». NO compres otra.",
      adminUrl: t.adminUrl,
    });
  }
  return Response.json({ ok: true });
}
