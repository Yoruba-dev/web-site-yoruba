import {
  WATCH_CUSTOM_POLICY,
  WATCH_ODU_NOTE,
  WATCH_ORIGIN,
  WATCH_PRICE_TBD,
  WATCH_PROOF_NOTE,
  WATCH_SPECS,
  watchLeadTimeLabel,
} from "@/lib/watch";

// "Cómo funciona" del creador de relojes (id="como-funciona": la portada y el
// creador enlazan a /creador-de-relojes#como-funciona). Componente de
// servidor: solo texto, ningún JavaScript.
const PASOS: readonly { t: string; d: string }[] = [
  {
    t: "Empieza con tu Orisha",
    d: "Elige Ifá, Elegguá, Changó, Yemayá, Oshún, Orula u Oyá — o empieza desde cero. Los colores de su collar dan la pista de cuentas de la esfera.",
  },
  {
    t: "Ármalo pieza a pieza",
    d: "Acabado de la caja, esfera, segundero y correa. El reloj se va armando de frente con cada elección.",
  },
  {
    t: "Tu signo, al dorso",
    d: "Uno de los 16 Meyis o tu combinación, con el nombre tal como está en tu libreta, tus dos líneas y una fecha. Grabado láser en la tapa.",
  },
  {
    t: "Solicítalo y aprueba la prueba",
    d: "Nos llega tu diseño completo por WhatsApp. Te confirmamos precio y plazo, y antes de producir te enviamos una prueba para tu OK.",
  },
];

export default function WatchGuide() {
  return (
    <section id="como-funciona" className="pyj-reloj_guide" aria-labelledby="pyj-reloj-guide-title">
      <div className="container">
        <header className="pyj-reloj_entryhead">
          <span className="pyj-eyebrow">✦ Paso a paso ✦</span>
          <h2 id="pyj-reloj-guide-title" className="pyj-reloj_h2">
            Cómo funciona
          </h2>
        </header>

        <ol className="pyj-reloj_guidesteps">
          {PASOS.map((p, i) => (
            <li key={p.t}>
              <span className="pyj-reloj_guidenum" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </li>
          ))}
        </ol>

        <dl className="pyj-reloj_facts">
          <div>
            <dt>La pieza</dt>
            <dd>
              Caja octogonal de {WATCH_SPECS.caseMm} mm en acero 316L, movimiento automático. {WATCH_ORIGIN}.
            </dd>
          </div>
          <div>
            <dt>Precio</dt>
            <dd>{WATCH_PRICE_TBD}: te lo confirmamos con tu diseño.</dd>
          </div>
          <div>
            <dt>Plazo de taller</dt>
            <dd>{watchLeadTimeLabel()[0].toUpperCase() + watchLeadTimeLabel().slice(1)}, desde que apruebas la prueba.</dd>
          </div>
          <div>
            <dt>La prueba</dt>
            <dd>{WATCH_PROOF_NOTE} Nada se imprime ni se graba sin tu aprobación.</dd>
          </div>
          <div>
            <dt>Tu signo</dt>
            <dd>{WATCH_ODU_NOTE}</dd>
          </div>
          <div>
            <dt>Política</dt>
            <dd>{WATCH_CUSTOM_POLICY}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
