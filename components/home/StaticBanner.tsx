import Link from "next/link";

// Full-width promotional banner from Home Two (the "static-banner_area" between
// New Arrival and the tabbed sections). Background = banner/static-banner.png,
// applied by the template CSS via the .static-banner-image class.
export default function StaticBanner() {
  return (
    <div className="static-banner_area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="static-banner-image">
              <div className="static-banner-content">
                <p>
                  <span>Destacado</span> Esta Semana
                </p>
                <h2>Anillo de Ifá</h2>
                <h3>Oro 10k & Plata 925</h3>
                <p className="schedule">
                  Desde <span> $1700.00</span>
                </p>
                <div className="hiraola-btn-ps_left">
                  <Link href="/shop-left-sidebar" className="hiraola-btn">
                    Ver Pieza
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
