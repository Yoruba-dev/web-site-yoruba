import Script from "next/script";
import { SITE } from "@/lib/site";

// Google Analytics 4 (gtag.js) via next/script — the Next.js-recommended way to
// load third-party scripts (loaded after the page is interactive, so it never
// blocks rendering). The measurement ID lives in the site config.
export default function Analytics() {
  const id = SITE.analytics.gaId;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
