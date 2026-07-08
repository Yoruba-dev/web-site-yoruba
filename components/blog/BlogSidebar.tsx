import Link from "next/link";
import { BLOG_POSTS, RECENT_POST_THUMBS } from "@/lib/blog-data";

// Blog sidebar widgets, ported faithfully from blog-left-sidebar.html
// (`.hiraola-blog-sidebar-wrapper`): search, Categories, Blog Archives,
// Recent Post and Tags. Shared by every blog list/detail page that has a sidebar.
export default function BlogSidebar() {
  const recentPosts = BLOG_POSTS.slice(0, 3);

  return (
    <div className="hiraola-blog-sidebar-wrapper">
      <div className="hiraola-blog-sidebar">
        <div className="hiraola-sidebar-search-form">
          <form action="#">
            <input
              type="text"
              className="hiraola-search-field"
              placeholder="search here"
            />
            <button type="submit" className="hiraola-search-btn">
              <i className="fa fa-search" />
            </button>
          </form>
        </div>
      </div>
      <div className="hiraola-blog-sidebar">
        <h4 className="hiraola-blog-sidebar-title">Categories</h4>
        <ul className="hiraola-blog-archive">
          <li>
            <Link href="#">Necklaces (07)</Link>
          </li>
          <li>
            <Link href="#">Earrings (12)</Link>
          </li>
          <li>
            <Link href="#">Bracelet (05)</Link>
          </li>
          <li>
            <Link href="#">Anklet (18)</Link>
          </li>
          <li>
            <Link href="#">Braid Jewels (13)</Link>
          </li>
          <li>
            <Link href="#">Foot Harness (06)</Link>
          </li>
        </ul>
      </div>
      <div className="hiraola-blog-sidebar">
        <h4 className="hiraola-blog-sidebar-title">Blog Archives</h4>
        <ul className="hiraola-blog-archive">
          <li>
            <Link href="#">April (05)</Link>
          </li>
          <li>
            <Link href="#">May (10)</Link>
          </li>
          <li>
            <Link href="#">June (15)</Link>
          </li>
          <li>
            <Link href="#">July (20)</Link>
          </li>
          <li>
            <Link href="#">August(25)</Link>
          </li>
          <li>
            <Link href="#">September (30)</Link>
          </li>
        </ul>
      </div>
      <div className="hiraola-blog-sidebar">
        <h4 className="hiraola-blog-sidebar-title">Recent Post</h4>
        {recentPosts.map((post, index) => (
          <div className="hiraola-recent-post" key={post.slug}>
            <div className="hiraola-recent-post-thumb">
              <Link href="/blog-details-left-sidebar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="img-full"
                  src={RECENT_POST_THUMBS[index % RECENT_POST_THUMBS.length]}
                  alt="Hiraola's Product Image"
                />
              </Link>
            </div>
            <div className="hiraola-recent-post-des">
              <span>
                <Link href="/blog-details-left-sidebar">{post.title}</Link>
              </span>
              <span className="hiraola-post-date">{post.date}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="hiraola-blog-sidebar">
        <h4 className="hiraola-blog-sidebar-title">Tags</h4>
        <ul className="hiraola-blog-tags">
          <li>
            <Link href="#">Rings</Link>
          </li>
          <li>
            <Link href="#">Necklaces</Link>
          </li>
          <li>
            <Link href="#">Bracelet</Link>
          </li>
          <li>
            <Link href="#">Earrings</Link>
          </li>
          <li>
            <Link href="#">Necklaces</Link>
          </li>
          <li>
            <Link href="#">Braid</Link>
          </li>
          <li>
            <Link href="#">Harness</Link>
          </li>
          <li>
            <Link href="#">Graceful Armlet</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
