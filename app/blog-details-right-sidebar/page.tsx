import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogDetail from "@/components/blog/BlogDetail";
import { BLOG_POSTS } from "@/lib/blog-data";

export const metadata: Metadata = { title: "Blog Details Right Sidebar" };

export default function BlogDetailsRightSidebarPage() {
  return (
    <>
      <Breadcrumb
        title="Blog Details"
        crumbs={[{ label: "Blog Details Right Sidebar" }]}
      />
      <BlogDetail post={BLOG_POSTS[0]} sidebar="right" />
    </>
  );
}
