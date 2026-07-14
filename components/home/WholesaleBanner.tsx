import Link from "next/link";
import { whatsappWholesaleUrl } from "@/lib/commerce";

// Home banner announcing the wholesale (mayoreo) channel for botánicas and shops.
// Sits between the product rows; links to the full /mayoreo landing and to a
// pre-filled wholesale WhatsApp message.
export default function WholesaleBanner() {
  return (
    <section className="pyj-wholesale">
      <div className="container">
        <div className="pyj-wholesale_card">
          <span className="pyj-eyebrow">✦ Mayoristas y botánicas ✦</span>
          <h2>¿Tienes una botánica o tienda?</h2>
          <p>
            Surtimos tu vitrina <strong>al por mayor</strong> con las{" "}
            <strong>herramientas</strong> de cada Oricha — en acero inoxidable con
            garantía de por vida y en oro por encargo, hechas a mano en Miami y a
            precio de mayorista.
          </p>
          <div className="pyj-wholesale_cta">
            <a
              className="pyj-btn-gold"
              href={whatsappWholesaleUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Escríbenos por WhatsApp
            </a>
            <Link className="pyj-wholesale_link" href="/mayoreo">
              Ver programa mayorista →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
