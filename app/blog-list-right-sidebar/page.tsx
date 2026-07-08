import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = { title: "Blog List Right Sidebar" };

export default function BlogListRightSidebarPage() {
  return (
    <>
      <Breadcrumb
        title="Blog List View"
        crumbs={[{ label: "Blog List Right Sidebar" }]}
      />
      <BlogList sidebar="right" view="list" />
    </>
  );
}
