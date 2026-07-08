"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

type TabKey = "description" | "specification" | "reviews";

// Description / Specification / Reviews tabs for the single-product page.
// Ported from the template's `.sp-product-tab_area`; tab switching is handled
// in React instead of Bootstrap's data-bs-toggle.
export default function ProductTabsDetail({ product }: { product: Product }) {
  const [active, setActive] = useState<TabKey>("description");

  const tabLink = (key: TabKey) => (active === key ? "active" : undefined);
  const tabPane = (key: TabKey) =>
    active === key ? "tab-pane active show" : "tab-pane";

  return (
    <div className="hiraola-product-tab_area-2 sp-product-tab_area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="sp-product-tab_nav ">
              <div className="product-tab">
                <ul className="nav product-menu">
                  <li>
                    <a
                      className={tabLink("description")}
                      href="#description"
                      onClick={(e) => {
                        e.preventDefault();
                        setActive("description");
                      }}
                    >
                      <span>Description</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className={tabLink("specification")}
                      href="#specification"
                      onClick={(e) => {
                        e.preventDefault();
                        setActive("specification");
                      }}
                    >
                      <span>Specification</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className={tabLink("reviews")}
                      href="#reviews"
                      onClick={(e) => {
                        e.preventDefault();
                        setActive("reviews");
                      }}
                    >
                      <span>Reviews (1)</span>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="tab-content hiraola-tab_content">
                <div id="description" className={tabPane("description")} role="tabpanel">
                  <div className="product-description">
                    <ul>
                      <li>
                        <strong>Karat Gold</strong>
                        <span>
                          24K gold is called pure gold or fine gold. (99.99% pure)
                          The color of fine gold is a bright yellow with a bit of
                          orange. Some say it is too soft for jewelry application,
                          but high karat gold is commonly worn in some parts of the
                          world, and it is growing in popularity in designer
                          jewelry. Most will prefer karat golds for their engagement
                          rings, because of the needed hardness to hold a gemstone.
                        </span>
                      </li>
                      <li>
                        <strong>Gold Colors</strong>
                        <span>
                          The most popular color is yellow which is made by adding
                          silver and some copper. The metals are melted together to
                          form an alloy of the desired color and karat. It is very
                          important that all the ingredients are pure and that the
                          amounts of each are weighed very accurately to prevent
                          porosity, which weakens the alloy.
                        </span>
                      </li>
                      <li>
                        <strong>White alloys</strong>
                        <span>
                          There are two kinds of White Gold: Nickel based and
                          Palladium based. Some people are allergic to Nickel, so
                          Palladium white gold is a good alternative. Palladium white
                          gold is the only legal alloy in Europe. It also self
                          burnishes and keeps a polish.
                        </span>
                      </li>
                      <li>
                        <strong>The Most Expensive Diamond Color</strong>
                        <span>
                          D colored diamonds are the rarest and most expensive of
                          diamonds within the D-Z scale. Certain fancy colored
                          diamonds will command the highest prices overall, and these
                          will be discussed in separate tutorial. Many people enjoy
                          diamonds in the near colorless range G-J, as they find a
                          balance of size, clarity, and price to meet their needs.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div id="specification" className={tabPane("specification")} role="tabpanel">
                  <table className="table table-bordered specification-inner_stuff">
                    <tbody>
                      <tr>
                        <td colSpan={2}>
                          <strong>Memory</strong>
                        </td>
                      </tr>
                    </tbody>
                    <tbody>
                      <tr>
                        <td>test 1</td>
                        <td>8gb</td>
                      </tr>
                    </tbody>
                    <tbody>
                      <tr>
                        <td colSpan={2}>
                          <strong>Processor</strong>
                        </td>
                      </tr>
                    </tbody>
                    <tbody>
                      <tr>
                        <td>No. of Cores</td>
                        <td>1</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div id="reviews" className={tabPane("reviews")} role="tabpanel">
                  <div className="tab-pane active" id="tab-review">
                    <form className="form-horizontal" id="form-review">
                      <div id="review">
                        <table className="table table-striped table-bordered">
                          <tbody>
                            <tr>
                              <td style={{ width: "50%" }}>
                                <strong>Customer</strong>
                              </td>
                              <td className="text-right">25/04/2022</td>
                            </tr>
                            <tr>
                              <td colSpan={2}>
                                <p>Good product! Thank you very much</p>
                                <div className="rating-box">
                                  <ul>
                                    <li>
                                      <i className="fa fa-star-of-david" />
                                    </li>
                                    <li>
                                      <i className="fa fa-star-of-david" />
                                    </li>
                                    <li>
                                      <i className="fa fa-star-of-david" />
                                    </li>
                                    <li>
                                      <i className="fa fa-star-of-david" />
                                    </li>
                                    <li>
                                      <i className="fa fa-star-of-david" />
                                    </li>
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <h2>Write a review</h2>
                      <div className="form-group required">
                        <div className="col-sm-12 p-0">
                          <label>
                            Your Email <span className="required">*</span>
                          </label>
                          <input
                            className="review-input"
                            type="email"
                            name="con_email"
                            id="con_email"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group required second-child">
                        <div className="col-sm-12 p-0">
                          <label className="control-label">Share your opinion</label>
                          <textarea
                            className="review-textarea"
                            name="con_message"
                            id="con_message"
                          />
                          <div className="help-block">
                            <span className="text-danger">Note:</span> HTML is not
                            translated!
                          </div>
                        </div>
                      </div>
                      <div className="form-group last-child required">
                        <div className="col-sm-12 p-0">
                          <div className="your-opinion">
                            <label>Your Rating</label>
                            <span>
                              <select className="star-rating">
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                              </select>
                            </span>
                          </div>
                        </div>
                        <div className="hiraola-btn-ps_right">
                          <a href="#" className="hiraola-btn hiraola-btn_dark">
                            Continue
                          </a>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
