import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import RingSizer, { type AnilloObjetivo } from "@/components/sizer/RingSizer";
import { getProductByHandle } from "@/lib/products";
import { filasTabla, tallaDeTitulo } from "@/lib/ring-size";
import { breadcrumbSchema, faqPageSchema, howToSchema } from "@/lib/schema";
import { OG_IMAGE, SITE } from "@/lib/site";

// /medidor-de-anillos — mide tu talla con el teléfono.
//
// La herramienta (cliente) va arriba y debajo hay texto de verdad: cómo
// funciona, la tabla de tallas y preguntas frecuentes. Ese texto es lo que
// Google indexa. "Cómo saber mi talla de anillo" es una búsqueda con tráfico
// real, y una página que la responde bien trae gente que aún no conoce la
// tienda — el mejor tipo de visita.
//
// Lee ?anillo=<handle> igual que /configurador, para saber para qué pieza se
// está midiendo y poder mandar de vuelta a la ficha con la talla puesta.

export const metadata: Metadata = {
  title: "Medidor de anillos online: mide tu talla con el teléfono",
  description:
    "Sabe tu talla de anillo en un minuto, con un anillo que ya te quede y tu teléfono. Calibrado con una tarjeta para que la medida sea real. Tabla de tallas US en milímetros.",
  keywords: [
    "medidor de anillos",
    "como saber mi talla de anillo",
    "medir anillo online",
    "talla de anillo",
    "medidas de anillos",
    "tabla de tallas de anillos",
    "numero de anillo",
  ],
  alternates: { canonical: "/medidor-de-anillos" },
  openGraph: {
    type: "website",
    images: OG_IMAGE,
    title: "Medidor de anillos — mide tu talla con el teléfono",
    description:
      "Pon un anillo que ya te quede sobre la pantalla y sabe tu talla en un minuto. Calibrado con tarjeta.",
    url: "/medidor-de-anillos",
    locale: "es_US",
  },
};

const PASOS = [
  {
    name: "Calibra la pantalla con una tarjeta",
    text: "Apoya una tarjeta bancaria de pie sobre la pantalla y ajusta la banda hasta que coincida con su lado corto. Así el teléfono sabe cuánto mide un milímetro. Se hace una sola vez.",
  },
  {
    name: "Pon encima un anillo que ya te quede",
    text: "Usa un anillo que te quede bien en el mismo dedo donde vas a llevar el nuevo. Apóyalo plano sobre el disco.",
  },
  {
    name: "Ajusta el disco al hueco del anillo",
    text: "Mueve el deslizador hasta que el disco llene el hueco por dentro: sin sombra oscura y con la línea fina del borde todavía visible. Mira desde arriba con un ojo cerrado.",
  },
  {
    name: "Lee tu talla",
    text: "El medidor te da el diámetro interior en milímetros y tu talla US. Si estás entre dos, te recomienda la mayor.",
  },
];

const FAQS = [
  {
    q: "¿Por qué hay que calibrar con una tarjeta?",
    a: "Porque cada pantalla dibuja los milímetros de un tamaño distinto: un círculo que en un teléfono mide 17 mm, en otro mide 11. Todas las tarjetas bancarias del mundo miden lo mismo (85.60 por 53.98 milímetros), así que con ella el medidor aprende el tamaño real de tu pantalla. Es lo que hacen todos los medidores serios.",
  },
  {
    q: "¿Qué precisión tiene?",
    a: "Bien calibrado, distingue medias tallas. Cada talla entera son solo 0.8 milímetros de diámetro, así que importa que el teléfono esté plano, sin zoom y sin un protector de pantalla muy grueso. Y si estás entre dos tallas, elige la mayor: un anillo grande se achica fácil; uno pequeño hay que cortarlo.",
  },
  {
    q: "¿Y si no tengo un anillo que me quede?",
    a: "Escríbenos por WhatsApp y te decimos cómo medir el dedo con un hilo o una tira de papel, o pasa por el taller en Miami y te tomamos la talla en un minuto.",
  },
  {
    q: "¿Los anillos anchos tallan igual?",
    a: "No del todo. Un anillo ancho —como los de Ifá— apoya contra el nudillo y roza más piel, así que suele necesitar media talla más que uno fino. Si el anillo que usas para medir es fino y el que vas a comprar es ancho, súbele media talla.",
  },
  {
    q: "Mi talla no aparece en el anillo que quiero",
    a: "Todos los anillos del taller se hacen a tu medida por encargo. Dinos la talla que te dio el medidor y te lo preparamos.",
  },
];

export default async function MedidorPage({
  searchParams,
}: {
  searchParams: Promise<{ anillo?: string }>;
}) {
  const { anillo: handle } = await searchParams;
  const p = handle ? await getProductByHandle(handle) : null;
  const anillo: AnilloObjetivo | null = p
    ? {
        handle: p.handle,
        title: p.title,
        tallas: [...new Set(p.variants.map((v) => tallaDeTitulo(v.title)).filter((t): t is number => t !== null))],
      }
    : null;

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Medidor de anillos" },
  ]);
  const howToLd = howToSchema({
    name: "Cómo saber tu talla de anillo con el teléfono",
    description:
      "Mide el diámetro interior de un anillo que ya te quede, sobre la pantalla del teléfono calibrada con una tarjeta.",
    path: "/medidor-de-anillos",
    totalTime: "PT2M",
    tools: ["Una tarjeta bancaria", "Un anillo que ya te quede bien"],
    steps: PASOS,
  });
  const faqLd = faqPageSchema(FAQS);
  const filas = filasTabla(5, 14);

  return (
    <>
      <Breadcrumb title="Medidor de anillos" crumbs={[{ label: "Medidor de anillos" }]} titleAs="p" />
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={howToLd} />
      <JsonLd data={faqLd} />

      <section className="pyj-cfg-page">
        <div className="container">
          <div className="pyj-cfg-intro">
            <span className="pyj-kicker">Herramienta del taller</span>
            <h1 className="pyj-serv_h1">
              Medidor de anillos: sabe tu talla en un minuto con tu teléfono
            </h1>
            <p>
              Pon un anillo que ya te quede encima de la pantalla, ajusta el
              disco al hueco, y listo. Antes calibramos la pantalla con una
              tarjeta, porque sin eso ningún medidor en línea mide de verdad.
            </p>
          </div>

          <RingSizer anillo={anillo} />

          <div className="pyj-sizer_texto">
            <h2>Cómo funciona</h2>
            <ol className="pyj-guide_steps">
              {PASOS.map((s, i) => (
                <li key={s.name} id={`paso-${i + 1}`}>
                  <strong>{s.name}</strong>
                  {s.text}
                </li>
              ))}
            </ol>

            <h2>Tabla de tallas de anillo (US)</h2>
            <p>
              Es la escala que usamos en la tienda y la misma que se usa en
              Cuba, México, Puerto Rico y República Dominicana. El diámetro es
              el interior del anillo, por donde entra el dedo.
            </p>
            <div className="tabla-env">
              <table className="pyj-sizer_tabla">
                <thead>
                  <tr>
                    <th scope="col">Talla US</th>
                    <th scope="col">Diámetro interior</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.talla}>
                      <td>{f.talla}</td>
                      <td>{f.mm} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2>Preguntas frecuentes</h2>
            {FAQS.map((f) => (
              <div className="pyj-guide_qa" key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}

            <p className="pyj-guide_note">
              ¿Prefieres que te tomemos la talla en persona?{" "}
              <a href={SITE.contact.whatsapp} target="_blank" rel="noreferrer">
                Escríbenos por WhatsApp
              </a>{" "}
              o pasa por el taller.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
