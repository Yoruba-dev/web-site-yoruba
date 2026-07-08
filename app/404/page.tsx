import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";

export const metadata: Metadata = { title: "404 Error" };

export default function Error404Page() {
  return (
    <>
      <Breadcrumb title="404 Error" crumbs={[{ label: "404" }]} />
      {/* Begin Hiraola's Error 404 Page Area */}
      <div className="error404-area">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <div className="search-error-wrapper">
                <h1>404</h1>
                <h2>PAGE NOT BE FOUND</h2>
                <p className="short_desc">
                  Sorry but the page you are looking for does not exist, have been removed, name
                  changed or is temporarily unavailable.
                </p>
                <form action="#" className="error-form">
                  <div className="inner-error_form">
                    <input type="text" placeholder="Search..." className="error-input-text" />
                    <button type="submit" className="error-search_btn">
                      <i className="fa fa-search" />
                    </button>
                  </div>
                </form>
                <div className="hiraola-btn-ps_center" />
                <Link href="/" className="hiraola-error_btn">
                  Back To Home Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Hiraola's Error 404 Page End Here */}
    </>
  );
}
