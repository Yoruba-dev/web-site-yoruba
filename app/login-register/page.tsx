import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import AuthForms from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Cuenta" };

export default function LoginRegisterPage() {
  return (
    <>
      <Breadcrumb title="Mi cuenta" crumbs={[{ label: "Cuenta" }]} />
      <div className="hiraola-login-register_area">
        <div className="container">
          <div className="row">
            <AuthForms />
          </div>
        </div>
      </div>
    </>
  );
}
