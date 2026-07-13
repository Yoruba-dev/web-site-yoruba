// Loading skeletons shown by the route-level loading.tsx files while server
// data (Shopify catalogue, product, reviews) is fetched — so the customer sees
// the shape of the page immediately instead of a blank screen. Pure markup +
// the .pyj-skel shimmer in globals.css; no state, safe to render anywhere.

function Bar({ w, h = 14, r = 6 }: { w: string; h?: number; r?: number }) {
  return (
    <span
      className="pyj-skel"
      style={{ display: "block", width: w, height: h, borderRadius: r }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="single_product" aria-hidden="true">
      <span className="pyj-skel" style={{ display: "block", aspectRatio: "1 / 1", width: "100%" }} />
      <div className="hiraola-product_content" style={{ padding: "16px 4px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Bar w="80%" />
          <Bar w="40%" h={18} />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="shop-product-wrap grid gridview-3 row" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="col-6 col-lg-4" key={i}>
          <div className="slide-item">
            <ProductCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="sp-area" aria-busy="true">
      <div className="container">
        <div className="sp-nav">
          <div className="row">
            <div className="col-lg-5 col-md-5">
              <span className="pyj-skel" style={{ display: "block", aspectRatio: "1 / 1", width: "100%", borderRadius: 10 }} />
              <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} className="pyj-skel" style={{ width: 84, height: 84, borderRadius: 4 }} />
                ))}
              </div>
            </div>
            <div className="col-lg-7 col-md-7">
              <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
                <Bar w="70%" h={26} />
                <Bar w="35%" />
                <Bar w="30%" h={30} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  <Bar w="60%" />
                  <Bar w="55%" />
                  <Bar w="50%" />
                </div>
                <span className="pyj-skel" style={{ display: "block", width: "100%", height: 52, borderRadius: 6, marginTop: 10 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="pyj-blog-grid" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="pyj-blog-card" key={i}>
          <span className="pyj-skel" style={{ display: "block", aspectRatio: "16 / 10", width: "100%" }} />
          <div className="pyj-blog-body">
            <Bar w="45%" h={11} />
            <Bar w="90%" h={18} />
            <Bar w="100%" />
            <Bar w="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}
