import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = { title: "Blog Column Two" };

export default function Blog2ColumnPage() {
  return (
    <>
      <Breadcrumb title="Blog Grid View" crumbs={[{ label: "Blog Column Two" }]} />
      <BlogList view="grid" columns={2} />
    </>
  );
}
