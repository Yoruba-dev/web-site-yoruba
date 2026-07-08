import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BlogDetail from "@/components/blog/BlogDetail";
import { BLOG_POSTS } from "@/lib/blog-data";

export const metadata: Metadata = { title: "Blog Gallery Format" };

export default function BlogGalleryFormatPage() {
  return (
    <>
      <Breadcrumb
        title="Blog Details"
        crumbs={[{ label: "Blog Gallery Format" }]}
      />
      <BlogDetail post={BLOG_POSTS[0]} sidebar="left" format="gallery" />
    </>
  );
}
