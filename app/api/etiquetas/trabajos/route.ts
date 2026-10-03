import { esAgente, noAutorizado } from "@/lib/etiquetas/acceso";
import { registrarLatido, trabajosPendientes } from "@/lib/etiquetas/cola";
import { avanzarCompras } from "@/lib/etiquetas/comprar";

// GET /api/etiquetas/trabajos — lo consulta el programa de la PC cada ~30 s.
// Devuelve lo que hay que imprimir o abrir. De paso:
//  - retoma compras que quedaron a medias (hace de cron sin tener uno), y
//  - deja constancia de que la PC está viva (para el estado).

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!esAgente(req)) return noAutorizado();

  const info = {
    impresora: (req.headers.get("x-agente-impresora") ?? "").slice(0, 80),
    version: (req.headers.get("x-agente-version") ?? "").slice(0, 20),
  };
  await registrarLatido(info);
  await avanzarCompras(15_000);

  const trabajos = (await trabajosPendientes()).map((t) => ({
    id: t.id,
    tipo: t.tipo,
    pedido: t.pedido,
    titulo: t.titulo,
    mensaje: t.mensaje ?? "",
    formato: t.formato ?? "",
    adminUrl: t.adminUrl ?? "",
    archivo: t.archivo ? `/api/etiquetas/trabajos/${encodeURIComponent(t.id)}/archivo` : "",
  }));
  // charset explícito: sin él, Windows PowerShell 5.1 lee la respuesta como
  // Latin-1 y los avisos salen con "Ã³" en vez de "ó".
  return new Response(JSON.stringify({ ok: true, trabajos }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
