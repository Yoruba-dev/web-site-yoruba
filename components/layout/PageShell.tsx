import Breadcrumb, { type Crumb } from "./Breadcrumb";

// Lightweight placeholder for pages not yet ported. Keeps navigation working and
// on-brand while each page is built out.
export default function PageShell({
  title,
  crumbs,
  children,
}: {
  title: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumb title={title} crumbs={crumbs ?? [{ label: title }]} />
      <div className="hiraola-product_area" style={{ minHeight: 280 }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              {children ?? (
                <>
                  <h3 style={{ marginBottom: 12 }}>{title}</h3>
                  <p style={{ color: "#888" }}>
                    This page is being built. The layout, styles and components
                    are ready — content is coming next.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
