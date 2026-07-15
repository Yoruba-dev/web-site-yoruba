import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { isPlaceholderPriced, CONSULT_PRICE_LABEL } from "@/lib/commerce";
import SafeImage from "@/components/ui/SafeImage";
import PurchaseButton from "./PurchaseButton";
import CompareButton from "./CompareButton";
import WishlistButton from "./WishlistButton";
import ReviewStars from "./ReviewStars";
import CardActions from "./CardActions";
import ShareButton from "./ShareButton";

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
            width={500}
            alt={primary?.altText ?? product.title}
          />
          <SafeImage
            className="secondary-img"
            src={secondary?.url ?? primary?.url}
            width={500}
            alt={secondary?.altText ?? product.title}
          />
        </Link>
        {product.badge && <span className="sticker">{product.badge}</span>}
        {/* Card actions (behind the ⋯ menu on touch). No quick-view here — it
            just links to the product, which tapping the card already does; the
            fewer controls keep the ⋯ stack fitting inside small cards. */}
        <CardActions>
          <li>
            <PurchaseButton className="hiraola-add_cart" product={product} iconOnly>
              <i className="ion-bag" />
            </PurchaseButton>
          </li>
          <li>
            <CompareButton className="hiraola-add_compare" product={product} />
          </li>
          <li>
            <ShareButton
              className="hiraola-add_compare"
              handle={product.handle}
              title={product.title}
            />
          </li>
        </CardActions>
      </div>
      <div className="hiraola-product_content">
        <div className="product-desc_info">
          <h6>
            <Link className="product-name" href={href}>
              {product.title}
            </Link>
          </h6>
          <ReviewStars rating={product.reviewRating ?? null} compact />
          <div className="price-box">
            {isPlaceholderPriced(product.price) ? (
              // $0/$1 placeholder → never show a fake price; invite a consult.
              <span className="new-price pyj-price-consult">
                {CONSULT_PRICE_LABEL}
              </span>
            ) : (
              <>
                <span className="new-price">{formatMoney(product.price)}</span>
                {product.compareAtPrice && (
                  <span className="old-price">
                    {formatMoney(product.compareAtPrice)}
                  </span>
                )}
              </>
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
