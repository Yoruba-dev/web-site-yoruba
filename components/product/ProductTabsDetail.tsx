"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { SITE } from "@/lib/site";
import Product3DViewer from "@/components/product/Product3DViewer";

type TabKey = "description" | "view3d" | "details" | "reviews";

// Description / Details / Reviews tabs for the single-product page. All content is
// real: the description comes straight from Shopify, details are the product's own
// fields. (No template placeholder text, no fake reviews.)
export default function ProductTabsDetail({ product }: { product: Product }) {
  const [active, setActive] = useState<TabKey>("description");

  const tabLink = (key: TabKey) => (active === key ? "active" : undefined);
  const tabPane = (key: TabKey) =>
    active === key ? "tab-pane active show" : "tab-pane";

  const category = product.tags[0];
  const has3d = Boolean(product.model3d?.glb);

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
                      <span>Descripción</span>
                    </a>
                  </li>
                  {has3d && (
                    <li>
                      <a
                        className={tabLink("view3d")}
                        href="#view3d"
                        onClick={(e) => {
                          e.preventDefault();
                          setActive("view3d");
                        }}
                      >
                        <span>✦ Ver en 3D / AR</span>
                      </a>
                    </li>
                  )}
                  <li>
                    <a
                      className={tabLink("details")}
                      href="#details"
                      onClick={(e) => {
                        e.preventDefault();
                        setActive("details");
                      }}
                    >
                      <span>Detalles</span>
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
                      <span>Reseñas</span>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="tab-content hiraola-tab_content">
                {/* Descripción — real Shopify description */}
                <div id="description" className={tabPane("description")} role="tabpanel">
                  <div className="product-description">
                    {product.description?.trim() ? (
                      <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>
                    ) : (
                      <p>
                        Pieza artesanal de {SITE.name}. Escríbenos para conocer las
                        medidas, el material y las opciones de esta pieza.
                      </p>
                    )}
                  </div>
                </div>

                {/* Ver en 3D / AR — modelo 3D real desde Shopify con realidad aumentada */}
                {has3d && product.model3d && (
                  <div id="view3d" className={tabPane("view3d")} role="tabpanel">
                    {active === "view3d" && (
                      <Product3DViewer
                        model={product.model3d}
                        poster={product.images[0]?.url}
                        alt={product.title}
                      />
                    )}
                  </div>
                )}

                {/* Detalles — real product fields */}
                <div id="details" className={tabPane("details")} role="tabpanel">
                  <table className="table table-bordered specification-inner_stuff">
                    <tbody>
                      <tr>
                        <td>
                          <strong>Marca</strong>
                        </td>
                        <td>{SITE.name}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Garantía</strong>
                        </td>
                        <td>De por vida en todas nuestras piezas</td>
                      </tr>
                      {category && (
                        <tr>
                          <td>
                            <strong>Categoría</strong>
                          </td>
                          <td>{category}</td>
                        </tr>
                      )}
                      <tr>
                        <td>
                          <strong>Referencia</strong>
                        </td>
                        <td>{product.handle}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Disponibilidad</strong>
                        </td>
                        <td>{product.availableForSale ? "En stock" : "Agotado"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Reseñas — no fake reviews; simple form placeholder */}
                <div id="reviews" className={tabPane("reviews")} role="tabpanel">
                  <p style={{ marginBottom: 20 }}>
                    Aún no hay reseñas para esta pieza. ¡Sé el primero en compartir tu
                    experiencia!
                  </p>
                  <form
                    className="form-horizontal"
                    id="form-review"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="form-group required">
                      <div className="col-sm-12 p-0">
                        <label>
                          Tu correo <span className="required">*</span>
                        </label>
                        <input className="review-input" type="email" required />
                      </div>
                    </div>
                    <div className="form-group required second-child">
                      <div className="col-sm-12 p-0">
                        <label className="control-label">Comparte tu opinión</label>
                        <textarea className="review-textarea" />
                      </div>
                    </div>
                    <div className="form-group last-child required">
                      <div className="col-sm-12 p-0">
                        <div className="your-opinion">
                          <label>Tu valoración</label>
                          <span>
                            <select className="star-rating">
                              <option value="5">5</option>
                              <option value="4">4</option>
                              <option value="3">3</option>
                              <option value="2">2</option>
                              <option value="1">1</option>
                            </select>
                          </span>
                        </div>
                      </div>
                      <div className="hiraola-btn-ps_right">
                        <button type="submit" className="hiraola-btn hiraola-btn_dark">
                          Enviar reseña
                        </button>
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
  );
}
