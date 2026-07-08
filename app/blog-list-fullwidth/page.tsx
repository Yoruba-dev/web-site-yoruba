import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = { title: "Blog List Fullwidth" };

export default function BlogListFullwidthPage() {
  return (
    <>
      <Breadcrumb
        title="Blog List View"
        crumbs={[{ label: "Blog List Fullwidth" }]}
      />
      <BlogList view="list" />
    </>
  );
}
