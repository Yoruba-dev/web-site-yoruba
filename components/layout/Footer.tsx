import Link from "next/link";
import { SITE } from "@/lib/site";
import { SERVICE_LINKS } from "@/lib/menu";
import ElekeBar from "./ElekeBar";
import SocialLinks from "./SocialLinks";
import NewsletterInline from "./NewsletterInline";

export default function Footer() {
  return (
    <div className="hiraola-footer_area">
      <ElekeBar />
      <div className="footer-top_area">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="footer-widgets_info">
                <div className="footer-widgets_logo">
                  <Link href="/">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={SITE.logo.footer}
                      alt={`${SITE.name} Footer Logo`}
                    />
                  </Link>
                </div>
                <div className="widget-short_desc">
                  <p>{SITE.tagline}</p>
                </div>
                <SocialLinks />
                <div className="pyj-foot-news">
                  <div className="footer-widgets_title">
                    <h6>Suscríbete</h6>
                  </div>
                  <div className="widget-short_desc">
                    <p>
                      Recibe novedades y ofertas — y el aviso si dejas tu pieza
                      en el carrito.
                    </p>
                  </div>
                  <NewsletterInline />
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="footer-widgets_area">
                <div className="row">
                  <div className="col-lg-4">
                    <div className="footer-widgets_title">
                      <h6>Tienda</h6>
                    </div>
                    <div className="footer-widgets">
                      <ul>
                        <li>
                          <Link href="/shop-left-sidebar">Colección completa</Link>
                        </li>
                        <li><Link href="/collections/idde">Idde de Orula</Link></li>
                        <li>
                          <Link href="/collections/herramientas">
                            Herramientas de santo
                          </Link>
                        </li>
                        <li>
                          <Link href="/collections/monedas">Monedas de Ifá</Link>
                        </li>
                        <li><Link href="/ninos">Niños</Link></li>
                        <li>
                          <Link href="/joyeria-en-miami">Joyería en Miami</Link>
                        </li>
                        <li>
                          <Link href="/mayoreo" className="pyj-nav-mayoreo">
                            Mayorista · Botánicas
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* Los cuatro servicios, visibles y con enlace directo a su
                      sección. Mismos datos que el desplegable de la barra
                      (lib/menu.ts → SERVICE_LINKS), para que no diverjan. */}
                  <div className="col-lg-4">
                    <div className="footer-widgets_title">
                      <h6>Servicios</h6>
                    </div>
                    <div className="footer-widgets">
                      <ul>
                        <li>
                          <Link href="/servicios">Servicios del taller</Link>
                        </li>
                        {SERVICE_LINKS.map((l) => (
                          <li key={l.href}>
                            <Link href={l.href}>{l.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="footer-widgets_info">
                      <div className="footer-widgets_title">
                        <h6>Contacto</h6>
                      </div>
                      <div className="widgets-essential_stuff">
                        <ul>
                          <li className="hiraola-address">
                            <i className="ion-ios-location" />
                            <span>Dirección:</span> {SITE.contact.address}
                          </li>
                          <li className="hiraola-phone">
                            <i className="ion-ios-telephone" />
                            <span>Teléfono:</span>{" "}
                            <a href={`tel:${SITE.contact.phoneTel}`}>{SITE.contact.phone}</a>
                            {" · "}
                            <a href={`tel:${SITE.contact.phoneAltTel}`}>{SITE.contact.phoneAlt}</a>
                          </li>
                          <li className="hiraola-phone">
                            <i className="fab fa-whatsapp" />
                            <span>WhatsApp:</span>{" "}
                            <a href={SITE.contact.whatsapp} target="_blank" rel="noreferrer">
                              {SITE.contact.phone}
                            </a>
                          </li>
                          <li className="hiraola-email">
                            <i className="ion-android-mail" />
                            <span>Correo:</span>{" "}
                            <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom_area">
        <div className="container">
          <div className="footer-bottom_nav">
            <div className="row">
              <div className="col-lg-12">
                <div className="footer-links">
                  {/* Un enlace por destino y todos en español. Antes eran 11
                      etiquetas en inglés que llevaban a solo 7 sitios
                      (/shop-left-sidebar salía tres veces). */}
                  <ul>
                    <li><Link href="/shop-left-sidebar">Tienda</Link></li>
                    <li><Link href="/servicios">Servicios</Link></li>
                    <li><Link href="/ninos">Niños</Link></li>
                    <li><Link href="/mayoreo">Mayorista</Link></li>
                    <li><Link href="/blog">Diario</Link></li>
                    <li><Link href="/about-us">Nosotros</Link></li>
                    <li><Link href="/faq">Preguntas frecuentes</Link></li>
                    <li><Link href="/garantia-y-devoluciones">Garantía y devoluciones</Link></li>
                    <li><Link href="/my-account">Mi cuenta</Link></li>
                    <li><Link href="/contact">Contacto</Link></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="payment">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/images/footer/payment/1.png"
                    alt="Payment Methods"
                  />
                </div>
              </div>
              <div className="col-lg-12">
                <div className="copyright">
                  <span>
                    Copyright &copy; {new Date().getFullYear()}{" "}
                    <Link href="/">{SITE.name}.</Link> All rights reserved.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
