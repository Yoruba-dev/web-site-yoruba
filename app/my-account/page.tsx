import type { Metadata } from "next";
import Breadcrumb from "@/components/layout/Breadcrumb";
import AccountTabs from "@/components/account/AccountTabs";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function MyAccountPage() {
  return (
    <>
      <Breadcrumb title="Mi cuenta" crumbs={[{ label: "Mi cuenta" }]} />
      {/* Begin Hiraola's Page Content Area */}
      <main className="page-content">
        {/* Begin Hiraola's Account Page Area */}
        <AccountTabs />
        {/* Hiraola's Account Page Area End Here */}
      </main>
      {/* Hiraola's Page Content Area End Here */}
    </>
  );
}
