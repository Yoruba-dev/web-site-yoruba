import { ProductDetailSkeleton } from "@/components/ui/Skeletons";

// Shown while the product, its variants and its reviews are fetched.
export default function Loading() {
  return <ProductDetailSkeleton />;
}
