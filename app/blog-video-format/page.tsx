import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogDetail from "@/components/blog/BlogDetail";
import { BLOG_POSTS } from "@/lib/blog-data";

export const metadata: Metadata = { title: "Blog Video Format" };

export default function BlogVideoFormatPage() {
  return (
    <>
      <Breadcrumb
        title="Blog Details"
        crumbs={[{ label: "Blog Video Format" }]}
      />
      <BlogDetail post={BLOG_POSTS[0]} sidebar="left" format="video" />
    </>
  );
}
