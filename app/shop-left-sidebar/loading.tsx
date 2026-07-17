import Breadcrumb from "@/components/layout/Breadcrumb";
import { ProductGridSkeleton } from "@/components/ui/Skeletons";

// Shown while the catalogue is fetched from Shopify.
export default function Loading() {
  return (
    <>
      <Breadcrumb title="Shop" crumbs={[{ label: "Shop Left Sidebar" }]} titleAs="p" />
      <div className="hiraola-content_wrapper">
        <div className="container">
          <div style={{ padding: "20px 0 60px" }}>
            <ProductGridSkeleton count={9} />
          </div>
        </div>
      </div>
    </>
  );
}
