import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import RingConfigurator from "@/components/configurator/RingConfigurator";
import { breadcrumbSchema } from "@/lib/schema";
import { OG_IMAGE } from "@/lib/site";
import { getProductByHandle } from "@/lib/products";
import type { ConfiguratorProduct } from "@/components/configurator/ConfiguratorOrderPanel";

export const metadata: Metadata = {
  title: "Diseña tu anillo de Ifá — configurador",
  description:
    "Personaliza tu anillo en oro con los signos de Ifá: coloca los Odù Meji en el frente y en los dos laterales, y pídelo hecho a mano por encargo. Configurador de Pedro Yoruba Jewelry, joyería Yoruba en Miami.",
  keywords: [
    "anillo de ifa personalizado",
    "anillo con signos de ifa",
    "odu meji",
    "configurador de anillos",
    "anillo yoruba personalizado",
    "joyería ifa miami",
  ],
  alternates: { canonical: "/configurador" },
  openGraph: {
    type: "website",
    images: OG_IMAGE,
    title: "Diseña tu anillo de Ifá — Pedro Yoruba Jewelry",
    description:
      "Coloca los signos de Ifá (Odù Meji) en el frente y los laterales de tu anillo en oro, y pídelo por encargo. Hecho a mano en Miami.",
    url: "/configurador",
    locale: "es_US",
  },
};

// Reading ?anillo makes this page dynamic — fine, the editor is interactive.
export default async function ConfiguradorPage({
  searchParams,
}: {
  searchParams: Promise<{ anillo?: string }>;
}) {
  const { anillo } = await searchParams;
  const p = anillo ? await getProductByHandle(anillo) : null;
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
    { name: "Diseña tu anillo de Ifá" },
  ]);

  return (
    <>
      <Breadcrumb title="Diseña tu anillo de Ifá" crumbs={[{ label: "Configurador" }]} />

      <section className="pyj-cfg-page">
        <div className="container">
          <div className="pyj-cfg-intro">
            <span className="pyj-eyebrow">✦ Hecho a tu medida ✦</span>
            <p className="pyj-cfg-intro_lead">
              {product ? (
                <>
                  Personaliza tu <strong>{product.title}</strong> con los{" "}
                  <strong>signos de Ifá</strong>: colócalos en el{" "}
                  <strong>frente</strong> y en los <strong>dos laterales</strong>,
                  y agrégalo al carrito.
                </>
              ) : (
                <>
                  Diseña tu anillo en oro con los <strong>signos de Ifá</strong>.
                  Coloca los Odù Meji en el <strong>frente</strong> y en los{" "}
                  <strong>dos laterales</strong>, y te lo hacemos a mano por
                  encargo.
                </>
              )}
            </p>
          </div>

          <RingConfigurator product={product} />
        </div>
      </section>

      <JsonLd data={breadcrumbLd} />
    </>
  );
}
