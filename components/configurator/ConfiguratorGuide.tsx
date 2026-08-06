// Explanatory guide shown under the configurator: how to design your ring, how the
// Ifá "alphabet" (the Odù) works, and how the combinations are formed. Written to
// respect the tradition — it names the system and how the signs are WRITTEN, but
// never invents meanings (those belong to the babaláwo / the itá). Server component.

// La guia sirve a las dos piezas. Lo que cambia entre ellas va aqui, por pieza,
// no repartido en condicionales por el JSX: el anillo tiene tres caras y metal a
// elegir; la moneda es una sola cara de plata 925 y el anverso viene acunado.
type Pieza = "anillo" | "moneda";

const STEPS: Record<Pieza, { n: number; title: string; body: string }[]> = {
  anillo: [
  {
    n: 1,
    title: "Elige la cara",
    body: "El diseño tiene tres caras: el frente y los dos laterales. El asistente te lleva paso a paso por las tres (Frente → Derecho → Izquierdo).",
  },
  {
    n: 2,
    title: "Coloca tus signos",
    body: "Arrastra un Odù (o un motivo) desde la paleta hasta la cara, o tócalo para agregarlo. Luego muévelo, agrándalo o gíralo con la barra de herramientas.",
  },
  {
    n: 3,
    title: "Elige la torre",
    body: "Cada Odù se escribe con dos torres (columnas). Con el selector Ambas · Izquierda · Derecha decides cuál grabar — las torres se leen de izquierda a derecha.",
  },
  {
    n: 4,
    title: "Págalo en la web",
    body: "Si abriste el diseñador desde un anillo, elige el metal y agrégalo al carrito: la orden llega con el esquema exacto de tu diseño y lo hacemos a mano. Si no, lo pides por WhatsApp.",
  },
  ],
  moneda: [
    {
      n: 1,
      title: "El anverso ya viene acuñado",
      body: "La moneda se acuña con los 16 Odù Meji alrededor del borde. Esa cara no se toca: lo que eliges es el signo que se graba en el reverso, sobre el campo liso.",
    },
    {
      n: 2,
      title: "Coloca tu signo",
      body: "Arrastra un Odù desde la paleta hasta el campo, o tócalo para agregarlo. Luego muévelo, agrándalo o gíralo con la barra de herramientas.",
    },
    {
      n: 3,
      title: "Elige la torre",
      body: "Cada Odù se escribe con dos torres (columnas). Con el selector Ambas · Izquierda · Derecha decides cuál grabar — las torres se leen de izquierda a derecha.",
    },
    {
      n: 4,
      title: "Págala en la web",
      body: "Si abriste el diseñador desde una moneda, agrégala al carrito: la orden llega con el esquema exacto de tu grabado y lo hacemos a mano. Si no, la pides por WhatsApp.",
    },
  ],
};

// A single vs. double mark — the two strokes that build every Odù.
function MarkLegend() {
  return (
    <div className="pyj-guide_marks">
      <div className="pyj-guide_mark">
        <svg viewBox="0 0 40 34" aria-hidden="true" focusable="false">
          <rect x="17.5" y="4" width="5" height="26" rx="2" fill="currentColor" />
        </svg>
        <span>Marca sencilla</span>
      </div>
      <div className="pyj-guide_mark">
        <svg viewBox="0 0 40 34" aria-hidden="true" focusable="false">
          <rect x="8" y="4" width="5" height="26" rx="2" fill="currentColor" />
          <rect x="27" y="4" width="5" height="26" rx="2" fill="currentColor" />
        </svg>
        <span>Marca doble</span>
      </div>
    </div>
  );
}

export default function ConfiguratorGuide({ piece = "anillo" }: { piece?: Pieza }) {
  const esMoneda = piece === "moneda";
  return (
    <section className="pyj-cfg-guide" aria-label="Guía del diseño">
      <div className="container">
        <details className="pyj-cfg-guide_acc">
          <summary className="pyj-cfg-guide_summary">
            <span className="pyj-eyebrow">✦ Guía ✦</span>
            <span className="pyj-cfg-guide_summary-title">
              El alfabeto sagrado de Ifá — cómo funciona
            </span>
            <svg
              className="pyj-cfg-guide_chev"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>

          <p className="pyj-cfg-guide_lead">
            Aquí honras tu signo de Ifá como identidad e historia,{" "}
            {esMoneda ? "grabado en plata 925" : "grabado en oro"}. Así funciona
            el diseño y así se escriben los signos.
          </p>

          <div className="pyj-cfg-guide_grid">
          <article className="pyj-cfg-guide_card">
            <h3 className="pyj-cfg-guide_ctitle">
              Cómo diseñar tu {esMoneda ? "moneda" : "anillo"}
            </h3>
            <ol className="pyj-guide_steps">
              {STEPS[piece].map((s) => (
                <li key={s.n} className="pyj-guide_step">
                  <span className="pyj-guide_num">{s.n}</span>
                  <div>
                    <strong className="pyj-guide_steptitle">{s.title}</strong>
                    <p className="pyj-guide_stepbody">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>

          <article className="pyj-cfg-guide_card">
            <h3 className="pyj-cfg-guide_ctitle">Los 16 Odù Meji</h3>
            <p className="pyj-guide_p">
              Ifá es el sistema de sabiduría y adivinación Yoruba, reconocido por la
              UNESCO como Patrimonio Cultural Inmaterial de la Humanidad. Su
              “alfabeto” son los <strong>Odù</strong>: los signos sagrados. Los 16
              principales se llaman <strong>Odù Meji</strong> — los encuentras en la
              paleta “Torres de Ifá”.
            </p>
            <p className="pyj-guide_p">
              Cada signo se escribe con <strong>dos torres</strong> (columnas), y
              cada torre lleva cuatro posiciones. Cada posición es una marca{" "}
              <strong>sencilla</strong> o <strong>doble</strong>; su combinación es
              lo que distingue a un Odù de otro.
            </p>
            <MarkLegend />
          </article>

          <article className="pyj-cfg-guide_card">
            <h3 className="pyj-cfg-guide_ctitle">256 caminos</h3>
            <p className="pyj-guide_p">
              De la combinación de los 16 Odù Meji entre sí nacen los{" "}
              <strong>256 Odù</strong> del cuerpo de Ifá — un mapa completo de la
              sabiduría. Cada persona recibe su <strong>Odù tutelar</strong> en su
              iniciación (itá), de la mano de un babaláwo.
            </p>
            <p className="pyj-guide_p pyj-guide_note">
              El significado de cada Odù, sus rezos (ese Ifá) y su guía pertenecen a
              la tradición y se revelan en consulta con tu babaláwo. Tu{" "}
              {esMoneda ? "moneda" : "anillo"} es una joya de autor que honra tu
              signo, no un objeto consagrado.
            </p>
          </article>
          </div>
        </details>
      </div>
    </section>
  );
}
