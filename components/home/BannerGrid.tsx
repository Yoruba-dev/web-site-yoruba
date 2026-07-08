import Link from "next/link";

// Promo banner rows used between product sections on Home Two.
export default function BannerGrid({
  images,
  colClass = "col-lg-6",
  fluid = false,
}: {
  images: string[];
  colClass?: string;
  fluid?: boolean;
}) {
  return (
    <div className={fluid ? "hiraola-banner_area-3" : "hiraola-banner_area-2"}>
      <div className="container">
        <div className="row">
          {images.map((img, i) => (
            <div className={colClass} key={`${img}-${i}`}>
              <div className="banner-item img-hover_effect">
                <Link href="/shop">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="img-full" src={`/assets/images/banner/${img}`} alt="Promotion" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
