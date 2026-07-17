import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Countdown from "@/components/coming-soon/Countdown";

export const metadata: Metadata = {
  title: "Coming Soon",
  robots: { index: false, follow: true },
};

export default function ComingSoonPage() {
  return (
    <>
      <Breadcrumb title="Coming Soon" crumbs={[{ label: "Coming Soon" }]} />
      {/* Begin Hiraola's Coming Soon Area */}
      <div
        className="comming-soon-area bg-img overlay rel-area"
        style={{ backgroundImage: "url(/assets/images/coming-soon/bg-1.jpg)" }}
      >
        <span className="effect-body ice_effect" />
        <div className="container">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="comming-soon-wrap text-center">
                <div className="comming-soon-top">
                  <div className="logo">
                    <Link href="/">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/images/menu/logo/3.png" alt="Hiraola's Logo" />
                    </Link>
                  </div>
                  <h3>We are coming very soon...</h3>
                  <p>
                    Our new handcrafted fine jewellery collection is almost ready. Subscribe below
                    and be the first to know the moment we launch.
                  </p>
                </div>
                <Countdown />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-6 col-lg-8 col-md-10 mx-auto">
              <div className="subscribe-area mt-110 text-center">
                <h4>Subscribe for our next update</h4>
                <div id="mc_embed_signup" className="subscribe-form">
                  <form action="#" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form">
                    <div id="mc_embed_signup_scroll" className="mc-form">
                      <input
                        type="email"
                        defaultValue=""
                        name="EMAIL"
                        className="email"
                        placeholder="Enter your e-mial"
                        required
                      />
                      <div className="clear">
                        <input
                          type="submit"
                          value="Subscribe"
                          name="subscribe"
                          id="mc-embedded-subscribe"
                          className="button"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Hiraola's Coming Soon Area End Here */}
    </>
  );
}
