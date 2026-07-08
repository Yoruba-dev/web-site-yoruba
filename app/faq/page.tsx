import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import FaqAccordion from "@/components/faq/FaqAccordion";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <>
      <Breadcrumb title="FAQ" crumbs={[{ label: "FAQ" }]} />
      {/* Begin Hiraola's Frequently Area */}
      <div className="frequently-area">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="frequently-content">
                <div className="frequently-desc">
                  <h3>Below are frequently asked questions, you may find the answer for yourself</h3>
                  <p>
                    Discover everything you need to know about our handcrafted fine jewellery — from
                    choosing the right ring size and caring for precious metals to our sourcing,
                    shipping and returns policies. If you cannot find the answer you are looking for,
                    our customer care team is always happy to help.
                  </p>
                </div>
              </div>
              <FaqAccordion />
            </div>
          </div>
        </div>
      </div>
      {/* Hiraola's Frequently Area End Here */}
    </>
  );
}
