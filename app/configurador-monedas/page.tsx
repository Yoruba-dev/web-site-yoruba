import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import PieceConfigurator from "@/components/configurator/PieceConfigurator";
import { COIN_PIECE } from "@/lib/pieces";
import ConfiguratorGuide from "@/components/configurator/ConfiguratorGuide";
import { breadcrumbSchema } from "@/lib/schema";
import { OG_IMAGE } from "@/lib/site";
import { COIN_SPECS } from "@/lib/coin";
import { getProductByHandle } from "@/lib/products";
import type { ConfiguratorProduct } from "@/components/configurator/ConfiguratorOrderPanel";

export const metadata: Metadata = {
  title: "Diseña tu moneda de Ifá — configurador",
  description:
    "Personaliza tu moneda de Ifá en plata 925: el anverso viene acuñado con los 16 Odù Meji y tú eliges el signo que se graba en el reverso. Configurador de Pedro Yoruba Jewelry, joyería Yoruba en Miami.",
  keywords: [
    "moneda de ifa personalizada",
    "moneda de ifa 16 meyis",
    "moneda de plata con signo de ifa",
    "odu meji",
    "moneda yoruba grabada",
    "joyería ifa miami",
  ],
  alternates: { canonical: "/configurador-monedas" },
  openGraph: {
    type: "website",
    images: OG_IMAGE,
    title: "Diseña tu moneda de Ifá — Pedro Yoruba Jewelry",
    description:
      "Elige el signo de Ifá grabado en tu moneda de plata 925, acuñada a mano en Miami con los 16 Odù Meji en el borde.",
    url: "/configurador-monedas",
    locale: "es_US",
  },
};

// Reading ?moneda makes this page dynamic — fine, the editor is interactive.
export default async function ConfiguradorMonedasPage({
  searchParams,
}: {
  searchParams: Promise<{ moneda?: string }>;
}) {
  const { moneda } = await searchParams;
  const p = moneda ? await getProductByHandle(moneda) : null;
  const product: ConfiguratorProduct | undefined = p
    ? {
        handle: p.handle,
        title: p.title,
        image: p.images[0]?.url ?? "",
        optionName: p.optionName,
        variants: p.variants.map((v) => ({
          id: v.id,
          title: v.title,
          amount: v.price.amount,
          currencyCode: v.price.currencyCode,
        })),
      }
    : undefined;

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Diseña tu moneda de Ifá" },
  ]);

  return (
    <>
      <Breadcrumb title="Diseña tu moneda de Ifá" crumbs={[{ label: "Configurador" }]} />

      <section className="pyj-cfg-page">
        <div className="container">
          <div className="pyj-cfg-intro">
            <span className="pyj-eyebrow">✦ Acuñada en el taller ✦</span>
            <p className="pyj-cfg-intro_lead">
              {product ? (
                <>
                  Personaliza tu <strong>{product.title}</strong>: el anverso ya
                  viene acuñado con los <strong>16 Odù Meji</strong>, y tú
                  eliges el <strong>signo grabado en el reverso</strong>. Después
                  agrégala al carrito.
                </>
              ) : (
                <>
                  Diseña tu moneda de Ifá en{" "}
                  <strong>{COIN_SPECS.metal.toLowerCase()}</strong> de{" "}
                  {COIN_SPECS.diameterMm} mm. El anverso viene acuñado con los{" "}
                  <strong>16 Odù Meji</strong>; tú eliges el{" "}
                  <strong>signo que se graba en el reverso</strong>.
                </>
              )}
            </p>
          </div>

          <PieceConfigurator piece={COIN_PIECE} product={product} />
        </div>
      </section>

      <ConfiguratorGuide piece="moneda" />

      <JsonLd data={breadcrumbLd} />
    </>
  );
}
