import { esAgente, noAutorizado } from "@/lib/etiquetas/acceso";
import { leerArchivo, leerTrabajo } from "@/lib/etiquetas/cola";

// GET /api/etiquetas/trabajos/<id>/archivo — el PDF (o ZPL) de una etiqueta.
// Solo para el programa de la PC: lleva nombre y dirección de la clienta.

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!esAgente(req)) return noAutorizado();
  const { id } = await ctx.params;
  const t = await leerTrabajo(id);
  if (!t?.archivo || t.estado !== "pendiente") {
    return Response.json({ ok: false, error: "sin archivo" }, { status: 404 });
  }
  const datos = await leerArchivo(t.archivo);
  if (!datos) return Response.json({ ok: false, error: "archivo ya borrado" }, { status: 410 });
  return new Response(datos, {
    headers: {
      "Content-Type": t.formato === "ZPL" ? "text/plain; charset=utf-8" : "application/pdf",
      "Cache-Control": "no-store",
    },
  });
}
