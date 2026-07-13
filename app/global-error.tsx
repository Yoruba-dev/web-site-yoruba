"use client";

// Last line of defence: catches errors thrown by the root layout itself. Since
// it REPLACES the whole document (layout included), it renders its own <html>
// and <body> and uses only inline styles — the site CSS may not be available
// when this fires. Branded to match Pedro Yoruba Jewelry (black + gold).
import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "global-error", digest: error.digest });
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0a07",
          color: "#cdc1a8",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <div
            style={{
              fontSize: 13,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#cda557",
              marginBottom: 18,
            }}
          >
            Pedro Yoruba Jewelry
          </div>
          <h1 style={{ fontSize: 26, color: "#ece2cd", margin: "0 0 12px", fontWeight: "normal" }}>
            Algo salió mal
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#a99d83", margin: "0 0 26px" }}>
            Tuvimos un problema al mostrar esta página. Puedes intentarlo de
            nuevo; si sigue ocurriendo, escríbenos por WhatsApp y lo resolvemos.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "13px 34px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #e4c89d, #cda557 55%, #98662e)",
              color: "#0d0a07",
              fontSize: 13,
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
