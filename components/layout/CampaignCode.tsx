"use client";

import { useEffect, useState } from "react";
import { capturarCodigoDeLaUrl, avisoMostrado } from "@/lib/discount";

/**
 * Enlaces de campaña con el código ya puesto.
 *
 * Un enlace como pedrojewelryyoruba.com/?codigo=OGUN10 —el que se manda por
 * WhatsApp o se pone en la biografía de Instagram— guarda el código en cuanto
 * la clienta entra, y se aplica solo cuando llegue al carrito. No tiene que
 * escribir nada ni acordarse de nada, que es donde se pierde la mitad de las
 * promociones.
 *
 * Se avisa en pantalla porque un descuento silencioso no vende: si no lo ve,
 * no sabe que lo tiene. El aviso se cierra solo.
 *
 * El parámetro se borra de la barra de direcciones después de leerlo, para que
 * al compartir la página no se arrastre el código y para que no ensucie las
 * estadísticas con mil variantes de la misma URL.
 */
/** Quita el parámetro de la barra de direcciones. Se hace DESPUÉS de enseñar el
 *  aviso, no antes: tocar el historial en mitad del montaje hace que Next
 *  rehaga el árbol y el aviso se pierda sin llegar a verse. */
function limpiarUrl(): void {
  try {
    const u = new URL(window.location.href);
    ["codigo", "descuento", "discount", "code"].forEach((k) =>
      u.searchParams.delete(k),
    );
    window.history.replaceState({}, "", u.toString());
  } catch {
    /* ignorar */
  }
}

export default function CampaignCode() {
  const [code, setCode] = useState<string | null>(null);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const encontrado = capturarCodigoDeLaUrl();
    if (!encontrado) return;
    setCode(encontrado);

    const irse = setTimeout(() => setSaliendo(true), 7000);
    const quitar = setTimeout(() => {
      setCode(null);
      avisoMostrado();
      limpiarUrl();
    }, 7600);
    return () => {
      clearTimeout(irse);
      clearTimeout(quitar);
    };
  }, []);

  if (!code) return null;

  return (
    <div
      className={`pyj-campana${saliendo ? " is-saliendo" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="pyj-campana_code">{code}</span>
      <span>
        Tu descuento está guardado — se aplica solo en el carrito.
      </span>
      <button
        type="button"
        className="pyj-campana_x"
        onClick={() => {
          setCode(null);
          avisoMostrado();
          limpiarUrl();
        }}
        aria-label="Cerrar aviso"
      >
        ✕
      </button>
    </div>
  );
}
