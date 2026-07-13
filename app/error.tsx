"use client";

// Catches render/data errors in any page (the header + footer stay in place, so
// the customer isn't stranded). Next.js renders this at the nearest boundary;
// as the root app/error.tsx it covers the whole app. Gives a branded message +
// a working "retry" (reset) and a way home.
import { useEffect } from "react";
import Link from "next/link";
import { reportError } from "@/lib/report-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "app-error", digest: error.digest });
  }, [error]);

  return (
    <div className="pyj-error-page">
      <div className="container">
        <span className="pyj-eyebrow">✦</span>
        <h1>Algo salió mal</h1>
        <p>
          Tuvimos un problema al mostrar esta sección. Intenta de nuevo; si el
          problema continúa, escríbenos por WhatsApp y te ayudamos enseguida.
        </p>
        <div className="pyj-error-actions">
          <button type="button" className="pyj-btn-gold" onClick={reset}>
            Reintentar
          </button>
          <Link href="/" className="pyj-error-home">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
