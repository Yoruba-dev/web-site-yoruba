import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <Breadcrumb title="Contact" crumbs={[{ label: "Contact" }]} />
      {/* Begin Contact Main Page Area */}
      <div className="contact-main-page">
        <div className="container">
          <div id="google-map">
            <iframe
              title="Hiraola Store Location"
              src="https://www.google.com/maps?q=New+York&output=embed"
              style={{ width: "100%", height: "100%", border: 0 }}
              loading="lazy"
            />
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-5 offset-lg-1 col-md-12 order-1 order-lg-2">
              <div className="contact-page-side-content">
                <h3 className="contact-page-title">Contact Us</h3>
                <p className="contact-page-message">
                  Claritas est etiam processus dynamicus, qui sequitur mutationem consuetudium
                  lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram
                  anteposuerit litterarum formas human.
                </p>
                <div className="single-contact-block">
                  <h4>
                    <i className="fa fa-fax" /> Address
                  </h4>
                  <p>123 Main Street, Anytown, CA 12345 – USA</p>
                </div>
                <div className="single-contact-block">
                  <h4>
                    <i className="fa fa-phone" /> Phone
                  </h4>
                  <p>Mobile: (08) 123 456 789</p>
                  <p>Hotline: 1009 678 456</p>
                </div>
                <div className="single-contact-block last-child">
                  <h4>
                    <i className="fa fa-envelope-o" /> Email
                  </h4>
                  <p>yourmail@domain.com</p>
                  <p>support@hastech.company</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 order-2 order-lg-1">
              <div className="contact-form-content">
                <h3 className="contact-page-title">Tell Us Your Message</h3>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Contact Main Page Area End Here */}
    </>
  );
}
