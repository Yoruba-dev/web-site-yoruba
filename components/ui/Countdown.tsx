"use client";

import { useEffect, useState } from "react";

// Cuenta atrás contra un instante ABSOLUTO.
//
// Por qué el servidor manda una fecha y no "quedan 23h 59m": las páginas son
// estáticas o de ISR, así que un texto precalculado se congelaría en el HTML y
// una clienta que entrara tres horas después vería el mismo "23h 59m". Con un
// instante, la cuenta la hace su navegador y siempre es la de verdad.
//
// Y por qué eso también arregla el huso horario: `Date.now()` ya es UTC, así
// que Miami, California y Madrid ven exactamente el mismo plazo. La hora
// "humana" se imprime aparte, en el servidor, con la zona de la tienda.

type Restante = { dias: number; horas: number; minutos: number; segundos: number };

function restanteHasta(objetivo: number): Restante {
  const diff = Math.max(0, objetivo - Date.now());
  const s = Math.floor(diff / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  };
}

export interface CountdownProps {
  /** Instante de fin en ISO absoluto. null = no se pinta reloj. */
  hasta: string | null;
  /** Se pinta cuando el plazo llega a cero. */
  alTerminar?: string;
  /** Frase estática para lectores de pantalla ("Termina el 9 de septiembre…"). */
  descripcion?: string;
  /** `compacto` para la cabecera de la colección. */
  variante?: "normal" | "compacto";
}

export default function Countdown({
  hasta,
  alTerminar = "La oferta terminó",
  descripcion,
  variante = "normal",
}: CountdownProps) {
  const objetivo = hasta ? Date.parse(hasta) : NaN;
  // Arranca en null a propósito: durante el render del servidor no hay reloj
  // del visitante, y pintar un número ahí sería servir un tiempo caducado desde
  // la caché. El primer valor real lo pone el efecto, ya en el navegador.
  const [t, setT] = useState<Restante | null>(null);

  useEffect(() => {
    if (!Number.isFinite(objetivo)) return;
    setT(restanteHasta(objetivo));
    const id = setInterval(() => setT(restanteHasta(objetivo)), 1000);
    return () => clearInterval(id);
  }, [objetivo]);

  if (!hasta || !Number.isFinite(objetivo)) return null;

  const terminado = t !== null && t.dias + t.horas + t.minutos + t.segundos === 0;
  if (terminado) return <p className="pyj-countdown_fin">{alTerminar}</p>;

  const unidades: [string, number | null][] = [
    ["Días", t?.dias ?? null],
    ["Horas", t?.horas ?? null],
    ["Min", t?.minutos ?? null],
    ["Seg", t?.segundos ?? null],
  ];

  return (
    <div
      className={`pyj-countdown${variante === "compacto" ? " pyj-countdown--compacto" : ""}`}
      // `role="timer"` trae aria-live="off" implícito: el lector de pantalla NO
      // canta los dígitos cada segundo. La información va en el texto de abajo.
      role="timer"
      aria-label={descripcion}
    >
      <div className="pyj-countdown_cajas" aria-hidden="true">
        {unidades.map(([etiqueta, valor]) => (
          <div className="pyj-countdown_caja" key={etiqueta}>
            <span className="pyj-countdown_num">
              {valor === null ? "--" : String(valor).padStart(2, "0")}
            </span>
            <span className="pyj-countdown_lbl">{etiqueta}</span>
          </div>
        ))}
      </div>
      {descripcion && <p className="pyj-countdown_pie">{descripcion}</p>}
    </div>
  );
}
