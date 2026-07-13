import Breadcrumb from "@/components/layout/Breadcrumb";
import { BlogGridSkeleton } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <>
      <Breadcrumb title="Diario" crumbs={[{ label: "Diario" }]} />
      <div className="pyj-blog">
        <div className="container">
          <BlogGridSkeleton count={4} />
        </div>
      </div>
    </>
  );
}
