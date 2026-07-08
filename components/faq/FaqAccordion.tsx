"use client";

import { useState } from "react";

const faqs = [
  {
    id: "One",
    question: "How do I know which ring size to order?",
    answer:
      "Every ring listing includes a detailed size guide. If you are unsure, we recommend visiting a local jeweller to have your finger professionally measured, or you can request a complimentary ring sizer from our customer care team before placing your order.",
  },
  {
    id: "Two",
    question: "Is your jewellery made from genuine precious metals?",
    answer:
      "Yes. All of our pieces are crafted from solid gold, sterling silver or platinum as stated in each product description. Every item is hallmarked and arrives with a certificate of authenticity.",
  },
  {
    id: "Three",
    question: "Are the diamonds and gemstones ethically sourced?",
    answer:
      "We are committed to responsible sourcing. Our diamonds are conflict-free and conform to the Kimberley Process, and our coloured gemstones are obtained from suppliers who follow fair and sustainable mining practices.",
  },
  {
    id: "Four",
    question: "Do you offer engraving or custom design services?",
    answer:
      "Absolutely. Most rings, pendants and bracelets can be personalised with engraving. For bespoke commissions, our in-house designers will work with you from initial sketch to the finished piece.",
  },
  {
    id: "Five",
    question: "What is your return and exchange policy?",
    answer:
      "Unworn items in their original packaging may be returned within 30 days for a full refund or exchange. Personalised and engraved pieces are made to order and are therefore non-returnable unless faulty.",
  },
  {
    id: "Six",
    question: "How should I care for and clean my jewellery?",
    answer:
      "Store each piece separately to avoid scratches, keep it away from perfume and chlorine, and clean it gently with a soft cloth. We include detailed care instructions with every order and offer a complimentary annual cleaning service in store.",
  },
  {
    id: "Seven",
    question: "Is my order insured during shipping?",
    answer:
      "Yes. Every order is fully insured and dispatched using a tracked, signature-required courier service, so your jewellery is protected from the moment it leaves us until it reaches your door.",
  },
  {
    id: "Eight",
    question: "Do you provide a warranty on your jewellery?",
    answer:
      "All of our jewellery comes with a warranty covering manufacturing defects. We also offer repair and resizing services to keep your treasured pieces looking their best for years to come.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="frequently-accordion">
      <div id="accordion">
        {faqs.map((faq, index) => {
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
