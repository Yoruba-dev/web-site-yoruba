import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = { title: "Blog Column Three" };

export default function Blog3ColumnPage() {
  return (
    <>
      <Breadcrumb
        title="Blog Grid View"
        crumbs={[{ label: "Blog Column Three" }]}
      />
      <BlogList view="grid" columns={3} />
    </>
  );
}
