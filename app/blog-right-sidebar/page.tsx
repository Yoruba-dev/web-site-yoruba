import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = { title: "Blog Right Sidebar" };

export default function BlogRightSidebarPage() {
  return (
    <>
      <Breadcrumb
        title="Blog Grid View"
        crumbs={[{ label: "Blog Right Sidebar" }]}
      />
      <BlogList sidebar="right" view="grid" columns={3} />
    </>
  );
}
