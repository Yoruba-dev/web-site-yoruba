import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CustomizerLoader from "@/components/customizer/CustomizerLoader";
import { getProductByHandle } from "@/lib/products";

export const metadata: Metadata = { title: "Personaliza tu pieza" };

export default async function PersonalizarPage({
  searchParams,
}: {
  searchParams: Promise<{ handle?: string }>;
}) {
  const { handle } = await searchParams;
  const product = handle ? await getProductByHandle(handle) : null;

  // If a generated model exists for this product (public/models/products/<handle>.glb),
  // load it as the default "Tu pieza". Otherwise the procedural pieces are used.
  let modelUrl: string | undefined;
  if (handle) {
    const rel = `/models/products/${handle}.glb`;
    if (existsSync(join(process.cwd(), "public", rel))) modelUrl = rel;
  }

  const props = product
    ? {
        pieceName: product.title,
        price: Number(product.price.amount),
        productHandle: product.handle,
        image: product.images[0]?.url ?? "",
        modelUrl,
      }
    : { pieceName: "Medalla de Oshún" };

  return (
    <>
      <Breadcrumb
        title="Personaliza tu pieza"
        crumbs={[{ label: "Personalizar" }]}
      />
      <CustomizerLoader {...props} />
    </>
  );
}
