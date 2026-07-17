import Link from "next/link";
import { sizedImageUrl } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

// Ported from the template's `.breadcrumb-area`. When `bgImage` is given (e.g. the
// category being browsed, or the product's own photo), it replaces the default
// banner image — stacked under a dark gradient so the title stays legible.
export default function Breadcrumb({
  title,
  crumbs = [],
  bgImage,
  titleAs: TitleTag = "h1",
}: {
  title: string;
  crumbs?: Crumb[];
  bgImage?: string;
  /** Heading level for the page title. Defaults to the page's <h1> (the
   *  breadcrumb title is the main heading on most pages). Pass "p" on pages
   *  that already have their own content <h1>, to avoid two h1s. Styling is
   *  identical either way (see `.breadcrumb-title` in globals.css). */
  titleAs?: "h1" | "p";
}) {
  return (
    <div
      className={`breadcrumb-area${bgImage ? " has-bg" : ""}`}
      style={
        bgImage
          ? {
              // The banner never renders wider than the viewport, so a 1200px
              // CDN variant (vs. the multi-MB original) is plenty at any size.
              backgroundImage: `linear-gradient(rgba(15,11,7,0.52), rgba(15,11,7,0.74)), url(${sizedImageUrl(bgImage, 1200)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="container">
        <div className="breadcrumb-content">
          <TitleTag className="breadcrumb-title">{title}</TitleTag>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            {crumbs.map((c) =>
              c.href ? (
                <li key={c.label}>
                  <Link href={c.href}>{c.label}</Link>
                </li>
              ) : (
                <li key={c.label} className="active">
                  {c.label}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
