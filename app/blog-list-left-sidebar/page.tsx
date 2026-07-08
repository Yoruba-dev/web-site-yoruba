import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = { title: "Blog List Left Sidebar" };

export default function BlogListLeftSidebarPage() {
  return (
    <>
      <Breadcrumb
        title="Blog List View"
        crumbs={[{ label: "Blog List Left Sidebar" }]}
      />
      <BlogList sidebar="left" view="list" />
    </>
  );
}
