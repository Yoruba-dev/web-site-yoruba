import Link from "next/link";
import BlogCard from "@/components/blog/BlogCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { BLOG_POSTS, type BlogPost } from "@/lib/blog-data";

// Faithful port of the template's blog listing area
// (`.hiraola-blog_area.blog-grid-view_area` in blog-left-sidebar.html).
// One component drives all 7 blog list routes via props:
//  - sidebar: render the search/categories/recent/tags widgets on left or right
//  - view: "grid" uses BlogCard; "list" uses the image-left / content-right markup
//  - columns: number of grid columns when there is no sidebar (2 or 3)

type BlogView = "grid" | "list";

export interface BlogListProps {
  sidebar?: "left" | "right";
  view?: BlogView;
  columns?: 2 | 3;
}

// Sidebar column wrapper. Order utilities mirror the template so the sidebar
// sits left/right on desktop while stacking after the posts on mobile.
function SidebarColumn({ sidebar }: { sidebar: "left" | "right" }) {
  const orderClass =
    sidebar === "left" ? "order-2 order-lg-1" : "order-2 order-lg-2";
  return (
    <div className={`col-lg-3 ${orderClass}`}>
      <BlogSidebar />
    </div>
  );
}

// Pagination + per-page select, ported from `.hiraola-paginatoin-area`.
function BlogPagination() {
  return (
    <div className="row">
      <div className="col-lg-12">
        <div className="hiraola-paginatoin-area">
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-6">
              <ul className="hiraola-pagination-box">
                <li className="active">
                  <Link href="#">1</Link>
                </li>
                <li>
                  <Link href="#">2</Link>
                </li>
                <li>
                  <Link href="#">3</Link>
                </li>
                <li>
                  <Link className="Next" href="#">
                    <i className="ion-ios-arrow-right" />
                  </Link>
                </li>
                <li>
                  <Link className="Next" href="#">
                    &gt;|
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-6">
              <div className="product-select-box">
                <div className="product-short">
                  <p>Show</p>
                  <select className="myniceselect nice-select" defaultValue="5">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="25">25</option>
                  </select>
                  <span>Per Page</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// List-view post item: image on the left, content on the right. Built from the
// same `.blog-item` classes the template uses, wrapped in Bootstrap columns.
function BlogListItem({ post }: { post: BlogPost }) {
  return (
    <div className="blog-item">
      <div className="row align-items-center">
        <div className="col-lg-5">
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
        </div>
        <div className="col-lg-7">
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
              <Link
                href="/blog-details-left-sidebar"
                className="hiraola-read_more"
              >
                Read More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogList({
  sidebar,
  view = "grid",
  columns = 3,
}: BlogListProps) {
  // Width of the post area: full width with no sidebar, narrower otherwise.
  const postAreaClass = sidebar
    ? `col-lg-9 ${sidebar === "left" ? "order-1 order-lg-2" : "order-1 order-lg-1"}`
    : "col-lg-12";

  // Grid column class. With a sidebar the template keeps a 2-up grid (col-lg-6)
  // inside the narrower col-lg-9 area; without a sidebar use the requested count.
  const gridColClass = sidebar
    ? "col-lg-6"
    : columns === 2
      ? "col-lg-6"
      : "col-lg-4";

  return (
    <div className="hiraola-blog_area hiraola-blog_area-2 blog-grid-view_area">
      <div className="container">
        <div className="row">
          {sidebar === "left" && <SidebarColumn sidebar="left" />}
          <div className={postAreaClass}>
            {view === "list" ? (
              <div className="blog-item_wrap">
                {BLOG_POSTS.map((post) => (
                  <BlogListItem key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <div className="row blog-item_wrap">
                {BLOG_POSTS.map((post) => (
                  <div className={gridColClass} key={post.slug}>
                    <BlogCard post={post} />
                  </div>
                ))}
              </div>
            )}
            <BlogPagination />
          </div>
          {sidebar === "right" && <SidebarColumn sidebar="right" />}
        </div>
      </div>
    </div>
  );
}
