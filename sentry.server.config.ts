import * as Sentry from "@sentry/nextjs";

// Server-runtime Sentry. Gated on the DSN so it's a no-op until the key is set.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
    // Las rutas de etiquetas reciben la clave de Flow (X-PYJ-Clave) y el token
    // de la PC (Authorization). Si una falla, Sentry no debe guardarlas.
    beforeSend(evento) {
      const h = evento.request?.headers;
      if (h) {
        for (const k of Object.keys(h)) {
          if (/^(x-pyj-clave|authorization|cookie)$/i.test(k)) h[k] = "[filtrado]";
        }
      }
      return evento;
    },
  });
}
