import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import SafeImage from "@/components/ui/SafeImage";
import PurchaseButton from "./PurchaseButton";
import CompareButton from "./CompareButton";
import WishlistButton from "./WishlistButton";

// Faithful port of the template's `.single_product` markup, driven by data.
export default function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.handle}`;
  const [primary, secondary] = product.images;

  return (
    <div className="single_product">
      <div className="product-img">
        <Link href={href}>
          <SafeImage
            className="primary-img"
            src={primary?.url}
            alt={primary?.altText ?? product.title}
          />
          <SafeImage
            className="secondary-img"
            src={secondary?.url ?? primary?.url}
            alt={secondary?.altText ?? product.title}
          />
        </Link>
        {product.badge && <span className="sticker">{product.badge}</span>}
        <div className="add-actions">
          <ul>
            <li>
              <PurchaseButton className="hiraola-add_cart" product={product} iconOnly>
                <i className="ion-bag" />
              </PurchaseButton>
            </li>
            <li>
              <CompareButton className="hiraola-add_compare" product={product} />
            </li>
            <li className="quick-view-btn">
              <Link href={href} title="Quick View">
                <i className="ion-eye" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="hiraola-product_content">
        <div className="product-desc_info">
          <h6>
            <Link className="product-name" href={href}>
              {product.title}
            </Link>
          </h6>
          <div className="price-box">
            <span className="new-price">{formatMoney(product.price)}</span>
            {product.compareAtPrice && (
              <span className="old-price">
                {formatMoney(product.compareAtPrice)}
              </span>
            )}
          </div>
          <div className="additional-add_action">
            <ul>
              <li>
                <WishlistButton className="hiraola-add_compare" product={product} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
