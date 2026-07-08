"use client";

import { useState } from "react";
import Link from "next/link";

type TabKey = "dashboard" | "orders" | "address" | "details";

export default function AccountTabs() {
  const [active, setActive] = useState<TabKey>("dashboard");

  const navLink = (key: TabKey, id: string, label: string) => (
    <li className="nav-item">
      <a
        className={active === key ? "nav-link active" : "nav-link"}
        id={id}
        href="#"
        role="tab"
        aria-selected={active === key}
        onClick={(e) => {
          e.preventDefault();
          setActive(key);
        }}
      >
        {label}
      </a>
    </li>
  );

  const paneClass = (key: TabKey) =>
    active === key ? "tab-pane fade show active" : "tab-pane fade";

  return (
    <div className="account-page-area">
      <div className="container">
        <div className="row">
          <div className="col-lg-3">
            <ul className="nav myaccount-tab-trigger" id="account-page-tab" role="tablist">
              {navLink("dashboard", "account-dashboard-tab", "Dashboard")}
              {navLink("orders", "account-orders-tab", "Orders")}
              {navLink("address", "account-address-tab", "Addresses")}
              {navLink("details", "account-details-tab", "Account Details")}
              <li className="nav-item">
                <Link className="nav-link" id="account-logout-tab" href="/login-register" role="tab">
                  Logout
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-lg-9">
            <div className="tab-content myaccount-tab-content" id="account-page-tab-content">
              <div
                className={paneClass("dashboard")}
                id="account-dashboard"
                role="tabpanel"
                aria-labelledby="account-dashboard-tab"
              >
                <div className="myaccount-dashboard">
                  <p>
                    Hello <b>Edwin Adams</b> (not Edwin Adams?{" "}
                    <Link href="/login-register">Sign out</Link>)
                  </p>
                  <p>
                    From your account dashboard you can view your recent orders, manage your shipping
                    and billing addresses and <a href="#">edit your password and account details</a>.
                  </p>
                </div>
              </div>
              <div
                className={paneClass("orders")}
                id="account-orders"
                role="tabpanel"
                aria-labelledby="account-orders-tab"
              >
                <div className="myaccount-orders">
                  <h4 className="small-title">MY ORDERS</h4>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <tbody>
                        <tr>
                          <th>ORDER</th>
                          <th>DATE</th>
                          <th>STATUS</th>
                          <th>TOTAL</th>
                          <th />
                        </tr>
                        <tr>
                          <td>
                            <a className="account-order-id" href="#">
                              #5364
                            </a>
                          </td>
                          <td>Mar 27, 2022</td>
                          <td>On Hold</td>
                          <td>£162.00 for 2 items</td>
                          <td>
                            <a href="#" className="hiraola-btn hiraola-btn_dark hiraola-btn_sm">
                              <span>View</span>
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <a className="account-order-id" href="#">
                              #5356
                            </a>
                          </td>
                          <td>Mar 27, 2022</td>
                          <td>On Hold</td>
                          <td>£162.00 for 2 items</td>
                          <td>
                            <a href="#" className="hiraola-btn hiraola-btn_dark hiraola-btn_sm">
                              <span>View</span>
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div
                className={paneClass("address")}
                id="account-address"
                role="tabpanel"
                aria-labelledby="account-address-tab"
              >
                <div className="myaccount-address">
                  <p>The following addresses will be used on the checkout page by default.</p>
                  <div className="row">
                    <div className="col">
                      <h4 className="small-title">BILLING ADDRESS</h4>
                      <address>
                        1234 Heaven Stress, Beverly Hill OldYork UnitedState of Lorem
                      </address>
                    </div>
                    <div className="col">
                      <h4 className="small-title">SHIPPING ADDRESS</h4>
                      <address>
                        1234 Heaven Stress, Beverly Hill OldYork UnitedState of Lorem
                      </address>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={paneClass("details")}
                id="account-details"
                role="tabpanel"
                aria-labelledby="account-details-tab"
              >
                <div className="myaccount-details">
                  <form action="#" className="hiraola-form">
                    <div className="hiraola-form-inner">
                      <div className="single-input single-input-half">
                        <label htmlFor="account-details-firstname">First Name*</label>
                        <input type="text" id="account-details-firstname" />
                      </div>
                      <div className="single-input single-input-half">
                        <label htmlFor="account-details-lastname">Last Name*</label>
                        <input type="text" id="account-details-lastname" />
                      </div>
                      <div className="single-input">
                        <label htmlFor="account-details-email">Email*</label>
                        <input type="email" id="account-details-email" />
                      </div>
                      <div className="single-input">
                        <label htmlFor="account-details-oldpass">
                          Current Password(leave blank to leave unchanged)
                        </label>
                        <input type="password" id="account-details-oldpass" />
                      </div>
                      <div className="single-input">
                        <label htmlFor="account-details-newpass">
                          New Password (leave blank to leave unchanged)
                        </label>
                        <input type="password" id="account-details-newpass" />
                      </div>
                      <div className="single-input">
                        <label htmlFor="account-details-confpass">Confirm New Password</label>
                        <input type="password" id="account-details-confpass" />
                      </div>
                      <div className="single-input">
                        <button className="hiraola-btn hiraola-btn_dark" type="submit">
                          <span>SAVE CHANGES</span>
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
