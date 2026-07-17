import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";

// Shown for any unknown URL (and any notFound() call). Branded + in Spanish,
// with clear ways back into the store instead of a dead end.
export default function NotFound() {
  return (
    <>
      <Breadcrumb title="Página no encontrada" crumbs={[{ label: "404" }]} titleAs="p" />
      <div className="pyj-error-page pyj-404">
        <div className="container">
          <div className="pyj-404-code">404</div>
          <h1>No encontramos esta página</h1>
          <p>
            El enlace puede estar roto o la página se movió. Pero tenemos muchas
            piezas esperándote.
          </p>
          <div className="pyj-error-actions">
            <Link href="/" className="pyj-btn-gold">
              Volver al inicio
            </Link>
            <Link href="/shop-left-sidebar" className="pyj-error-home">
              Ver la colección
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
