"use client";

import { useState } from "react";
import { FAQS } from "@/lib/faq-data";

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="frequently-accordion">
      <div id="accordion">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.id} className={isOpen ? "card actives" : "card"}>
              <div className="card-header" id={`heading${faq.id}`}>
                <h5 className="mb-0">
                  <a
                    href="#"
                    className={isOpen ? "" : "collapsed"}
                    aria-expanded={isOpen}
                    aria-controls={`collapse${faq.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenIndex(isOpen ? -1 : index);
                    }}
                  >
                    {faq.question}
                  </a>
                </h5>
              </div>
              <div
                id={`collapse${faq.id}`}
                className={isOpen ? "collapse show" : "collapse"}
                aria-labelledby={`heading${faq.id}`}
              >
                <div className="card-body">{faq.answer}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
