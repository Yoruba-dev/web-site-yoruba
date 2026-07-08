import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

// Ported from the template's `.breadcrumb-area` (background comes from style.css).
export default function Breadcrumb({
  title,
  crumbs = [],
}: {
  title: string;
  crumbs?: Crumb[];
}) {
  return (
    <div className="breadcrumb-area">
      <div className="container">
        <div className="breadcrumb-content">
          <h2>{title}</h2>
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
