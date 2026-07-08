import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = { title: "Blog Left Sidebar" };

export default function BlogLeftSidebarPage() {
  return (
    <>
      <Breadcrumb
        title="Blog Grid View"
        crumbs={[{ label: "Blog Left Sidebar" }]}
      />
      <BlogList sidebar="left" view="grid" columns={3} />
    </>
  );
}
