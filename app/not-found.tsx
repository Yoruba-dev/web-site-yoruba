import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default function NotFound() {
  return (
    <>
      <Breadcrumb title="404 Error" crumbs={[{ label: "404" }]} />
      <div className="error-area" style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="container">
          <h1 style={{ fontSize: 90, lineHeight: 1, color: "#cda557" }}>404</h1>
          <h2 style={{ marginTop: 10 }}>Oops! Page not found</h2>
          <p style={{ color: "#888", margin: "16px 0 28px" }}>
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/" className="hiraola-btn">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
