import * as Sentry from "@sentry/nextjs";

// Server-runtime Sentry. Gated on the DSN so it's a no-op until the key is set.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// Las rutas de etiquetas reciben la clave de Flow (X-PYJ-Clave) y el token
// de la PC (Authorization). Si algo falla, Sentry no debe guardarlas.
function limpiarClaves<E extends { request?: { headers?: Record<string, string> } }>(evento: E): E {
  const h = evento.request?.headers;
  if (h) {
    for (const k of Object.keys(h)) {
      if (/^(x-pyj-clave|authorization|cookie)$/i.test(k)) h[k] = "[filtrado]";
    }
  }
  return evento;
}

if (dsn) {
  Sentry.init({
    dsn,
    // Las rutas de etiquetas no se trazan: llevan claves en los encabezados y
    // los encabezados viajan en las transacciones, no solo en los errores.
    tracesSampler: (ctx) =>
      /\/api\/etiquetas\//.test(`${ctx.name} ${ctx.normalizedRequest?.url ?? ""}`) ? 0 : 0.1,
    enabled: process.env.NODE_ENV === "production",
    beforeSend: limpiarClaves,
    beforeSendTransaction: limpiarClaves,
  });
}
