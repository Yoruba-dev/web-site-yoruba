import Link from "next/link";
import { SITE } from "@/lib/site";
import ElekeBar from "./ElekeBar";
import SocialLinks from "./SocialLinks";

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
              </div>
            </div>
            <div className="col-lg-8">
              <div className="footer-widgets_area">
                <div className="row">
                  <div className="col-lg-3">
                    <div className="footer-widgets_title">
                      <h6>Product</h6>
                    </div>
                    <div className="footer-widgets">
                      <ul>
                        <li>
                          <Link href="/mayoreo" className="pyj-nav-mayoreo">
                            Mayoreo / Botánicas
                          </Link>
                        </li>
                        <li><Link href="/shop">New products</Link></li>
                        <li><Link href="/shop">Best sales</Link></li>
                        <li><Link href="/contact">Contact us</Link></li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-5">
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
                  <div className="col-lg-4">
                    <div className="instagram-container footer-widgets_area">
                      <div className="footer-widgets_title">
                        <h6>Sign Up For Newsletter</h6>
                      </div>
                      <div className="widget-short_desc">
                        <p>
                          Subscribe to our newsletters now and stay up-to-date
                          with new collections.
                        </p>
                      </div>
                      <div className="newsletter-form_wrap">
                        <form className="subscribe-form" action="#">
                          <input
                            className="newsletter-input"
                            type="email"
                            autoComplete="off"
                            placeholder="Enter Your Email"
                          />
                          <button className="newsletter-btn" type="submit">
                            <i className="ion-android-mail" />
                          </button>
                        </form>
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
                  <ul>
                    <li><Link href="/shop">Online Shopping</Link></li>
                    <li><Link href="/mayoreo">Mayoreo</Link></li>
                    <li><Link href="/my-account">My Orders</Link></li>
                    <li><Link href="/faq">Help</Link></li>
                    <li><Link href="/contact">Customer Service</Link></li>
                    <li><Link href="/shop">New Arrivals</Link></li>
                    <li><Link href="/shop">Special Products</Link></li>
                    <li><Link href="/contact">Our Stores</Link></li>
                    <li><Link href="/faq">Shipping</Link></li>
                    <li><Link href="/checkout">Payments</Link></li>
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
