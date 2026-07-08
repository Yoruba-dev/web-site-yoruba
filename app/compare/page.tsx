import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CompareView from "@/components/product/CompareView";

export const metadata: Metadata = { title: "Comparar" };

export default function ComparePage() {
  return (
    <>
      <Breadcrumb title="Comparar" crumbs={[{ label: "Comparar" }]} />
      <CompareView />
    </>
  );
}
