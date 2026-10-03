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

/**
 * Interruptor general. Sin ETIQUETAS_MODO=activo no se compra NADA: la ruta
 * solo deja un aviso para comprar a mano. Es el estado por defecto, para que
 * un despliegue sin configurar nunca gaste dinero.
 */
export function compraActiva(): boolean {
  return process.env.ETIQUETAS_MODO === "activo";
}

export const noAutorizado = () =>
  Response.json({ ok: false, error: "no autorizado" }, { status: 401 });
