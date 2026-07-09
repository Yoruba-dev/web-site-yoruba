import Link from "next/link";
import BlogSidebar from "@/components/blog/BlogSidebar";
import SocialLinks from "@/components/layout/SocialLinks";
import type { BlogPost } from "@/lib/blog-data";

// Faithful port of the single-post markup from blog-details-left-sidebar.html
// (`.hiraola-blog-details`). Drives all blog-detail + blog-format routes via props:
//  - sidebar: render the blog widgets on the left or right (omit for none)
//  - format: swaps the top media block — "standard" image, "gallery" image row,
//    "audio"/"video" embedded iframe (SoundCloud / YouTube, as in the template)

type BlogFormat = "standard" | "gallery" | "audio" | "video";

export interface BlogDetailProps {
  post: BlogPost;
  sidebar?: "left" | "right";
  format?: BlogFormat;
}

// Top media block, switched on the post format.
function BlogMedia({ post, format }: { post: BlogPost; format: BlogFormat }) {
  if (format === "audio") {
    return (
      <div className="ratio ratio-16x9">
        <iframe
          src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/342419243&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
          title="Blog Audio Post"
        />
      </div>
    );
  }

  if (format === "video") {
    return (
      <div className="ratio ratio-16x9">
        <iframe
          src="https://www.youtube.com/embed/gvPetTPFsZM"
          title="Blog Video Post"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (format === "gallery") {
    const galleryImages = [
      "/assets/images/blog/medium-size/1.jpg",
      "/assets/images/blog/medium-size/2.jpg",
      "/assets/images/blog/medium-size/3.jpg",
    ];
    return (
      <div className="blog-img img-hover_effect">
        <div className="row">
          {galleryImages.map((src, index) => (
            <div className="col-lg-4 col-md-4 col-sm-4" key={index}>
              <Link href="#">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Hiraola's Blog Image" />
              </Link>
            </div>
          ))}
        </div>
        <div className="blog-meta-2">
          <div className="blog-time_schedule">
            <span className="day">{post.day}</span>
            <span className="month">{post.month}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-img img-hover_effect">
      <Link href="#">
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
  );
}

export default function BlogDetail({
  post,
  sidebar,
  format = "standard",
}: BlogDetailProps) {
  // Width of the article area: full width with no sidebar, narrower otherwise.
  const articleAreaClass = sidebar
    ? `col-lg-9 ${sidebar === "left" ? "order-1 order-lg-2" : "order-1 order-lg-1"}`
    : "col-lg-12";

  // Order utilities mirror the template so the sidebar sits left/right on
  // desktop while stacking after the article on mobile.
  const sidebarOrderClass =
    sidebar === "left" ? "order-2 order-lg-1" : "order-2 order-lg-2";

  return (
    <div className="hiraola-blog_area hiraola-blog_area-2 hiraola-blog-details hiraola-banner_area">
      <div className="container">
        <div className="row">
          {sidebar === "left" && (
            <div className={`col-lg-3 ${sidebarOrderClass}`}>
              <BlogSidebar />
            </div>
          )}
          <div className={articleAreaClass}>
            <div className="blog-item">
              <BlogMedia post={post} format={format} />
              <div className="blog-content">
                <div className="blog-heading">
                  <h5>
                    <Link href="#">{post.title}</Link>
                  </h5>
                </div>
                <div className="blog-short_desc">
                  <p>{post.body[0]}</p>
                </div>
              </div>
              <div className="hiraola-blog-blockquote">
                <blockquote>
                  <p>
                    The weight of evidence strongly supports a theme of healthful
                    eating while allowing for variations on that theme. A diet of
                    minimally processed foods close to nature, predominantly plants,
                    is decisively associated with health promotion and disease
                    prevention and is consistent with the salient components of
                    seemingly distinct dietary approaches. Efforts to improve public
                    health through diet are forestalled not for want of knowledge
                    about the optimal feeding of Homo sapiens but for distractions
                    associated with exaggerated claims, and our failure to convert
                    what we reliably know into what we routinely do.
                  </p>
                </blockquote>
              </div>
              {post.body.slice(1).map((paragraph, index) => (
                <div className="blog-additional_information" key={index}>
                  <p>{paragraph}</p>
                </div>
              ))}
              <div className="hiraola-tag-line">
                <h4>Tag:</h4>
                <Link href="#">Rings</Link>,&nbsp;
                <Link href="#">Necklaces</Link>,&nbsp;
                <Link href="#">Diamond</Link>
              </div>
              <SocialLinks />
              <div className="hiraola-comment-section">
                <h3>03 comment</h3>
                <ul>
                  <li>
                    <div className="author-avatar">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/images/blog/user.png" alt="User" />
                    </div>
                    <div className="comment-body">
                      <span className="reply-btn">
                        <Link href="#">reply</Link>
                      </span>
                      <h5 className="comment-author">Edwin Adams</h5>
                      <div className="comment-post-date">
                        25 April, 2022 at 10:30am
                      </div>
                      <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Enim maiores adipisci optio ex, laboriosam facilis non
                        pariatur itaque illo sunt?
                      </p>
                    </div>
                  </li>
                  <li className="comment-children">
                    <div className="author-avatar">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/images/blog/admin.png" alt="Admin" />
                    </div>
                    <div className="comment-body">
                      <span className="reply-btn">
                        <Link href="#">reply</Link>
                      </span>
                      <h5 className="comment-author">Anny Adams</h5>
                      <div className="comment-post-date">
                        25 April, 2022 at 11:00am
                      </div>
                      <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Enim maiores adipisci optio ex, laboriosam facilis non
                        pariatur itaque illo sunt?
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="author-avatar">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/images/blog/user.png" alt="User" />
                    </div>
                    <div className="comment-body">
                      <span className="reply-btn">
                        <Link href="#">reply</Link>
                      </span>
                      <h5 className="comment-author">Edwin Adams</h5>
                      <div className="comment-post-date">
                        25 April, 2022 at 06:50pm
                      </div>
                      <p>Thank You :)</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="hiraola-blog-comment-wrapper">
                <h3>leave a reply</h3>
                <p>
                  Your email address will not be published. Required fields are
                  marked *
                </p>
                <form action="#">
                  <div className="comment-post-box">
                    <div className="row">
                      <div className="col-lg-12">
                        <label>comment</label>
                        <textarea
                          name="commnet"
                          placeholder="Write a comment"
                        />
                      </div>
                      <div className="col-lg-4 col-md-4">
                        <label>Name</label>
                        <input
                          type="text"
                          className="coment-field"
                          placeholder="Name"
                        />
                      </div>
                      <div className="col-lg-4 col-md-4">
                        <label>Email</label>
                        <input
                          type="text"
                          className="coment-field"
                          placeholder="Email"
                        />
                      </div>
                      <div className="col-lg-4 col-md-4">
                        <label>Website</label>
                        <input
                          type="text"
                          className="coment-field"
                          placeholder="Website"
                        />
                      </div>
                      <div className="col-lg-12">
                        <div className="comment-btn_wrap f-left">
                          <div className="hiraola-post-btn_area">
                            <Link className="hiraola-post_btn" href="#">
                              Post comment
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          {sidebar === "right" && (
            <div className={`col-lg-3 ${sidebarOrderClass}`}>
              <BlogSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
