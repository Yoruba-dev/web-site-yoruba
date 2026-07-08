import Link from "next/link";
import type { BlogPost } from "@/lib/blog-data";

// A single grid post card, ported from the `.blog-item` block in
// blog-left-sidebar.html. Used by BlogList for grid views. The day/month badge
// (`.blog-time_schedule`) and "Read More" link reproduce the template markup.
export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <div className="blog-item">
      <div className="blog-img img-hover_effect">
        <Link href="/blog-details-left-sidebar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt="Hiraola's Blog Image" />
        </Link>
        <div className="blog-meta-2">
          <div className="blog-time_schedule">
            <span className="day">{post.day}</span>
            <span className="month">{post.month}</span>
          </div>
        </div>
      </div>
      <div className="blog-content">
        <div className="blog-heading">
          <h5>
            <Link href="/blog-details-left-sidebar">{post.title}</Link>
          </h5>
        </div>
        <div className="blog-short_desc">
          <p>{post.excerpt}</p>
        </div>
        <div className="hiraola-read-more_area">
          <Link href="/blog-details-left-sidebar" className="hiraola-read_more">
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
}
