// Quién puede hablar con las rutas de etiquetas.
//
// Dos llaves distintas a propósito:
//   ETIQUETAS_FLOW_CLAVE    la manda Shopify Flow en el encabezado X-PYJ-Clave.
//                           Con ella se puede pedir que se compre una etiqueta.
//   ETIQUETAS_AGENTE_TOKEN  la usa el programa de la PC (Authorization: Bearer).
//                           Con ella se leen los PDFs, que llevan direcciones.
// Si una se filtra, la otra sigue protegiendo su parte.

import crypto from "node:crypto";

function iguales(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function esFlow(req: Request): boolean {
  const esperada = process.env.ETIQUETAS_FLOW_CLAVE;
  const dada = req.headers.get("x-pyj-clave");
  return Boolean(esperada && dada && iguales(dada, esperada));
}

export function esAgente(req: Request): boolean {
  const esperada = process.env.ETIQUETAS_AGENTE_TOKEN;
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "");
  return Boolean(esperada && m && iguales(m[1].trim(), esperada));
}

/** La etiqueta (tag) de pedido que marca una prueba del sistema. */
export const TAG_PRUEBA = "prueba-etiqueta";

/**
 * Interruptor general, ETIQUETAS_MODO:
 *   "activo"   se compran etiquetas de todos los pedidos que toque.
 *   "prueba"   solo de los pedidos con la etiqueta «prueba-etiqueta»; los
 *              reales siguen esperando como si estuviera apagado.
 *   otro valor o sin definir = apagado: no se compra NADA, solo se avisa
 *              para comprar a mano. Es el estado por defecto, para que un
 *              despliegue sin configurar nunca gaste dinero.
 */
export function modoEtiquetas(): "activo" | "prueba" | "apagado" {
  const m = process.env.ETIQUETAS_MODO;
  return m === "activo" || m === "prueba" ? m : "apagado";
}

export function compraActiva(tagsDelPedido: readonly string[]): boolean {
  const modo = modoEtiquetas();
  if (modo === "activo") return true;
  return modo === "prueba" && tagsDelPedido.some((t) => t.toLowerCase() === TAG_PRUEBA);
}

export const noAutorizado = () =>
  Response.json({ ok: false, error: "no autorizado" }, { status: 401 });
