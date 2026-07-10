import type { Metadata } from "next";
import "./globals.css";
import Stylesheets from "@/components/layout/Stylesheets";
import ElekeBar from "@/components/layout/ElekeBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import ScrollToTop from "@/components/layout/ScrollToTop";
import StructuredData from "@/components/layout/StructuredData";
import Analytics from "@/components/layout/Analytics";
import { CartProvider } from "@/lib/cart-context";
import { CompareProvider } from "@/lib/compare-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { AccountProvider } from "@/lib/account-context";
import { SITE } from "@/lib/site";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedrojewelryyoruba.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} — Joyería Yoruba en Oro · Miami`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.tagline,
  keywords: [
    "joyería yoruba",
    "santería",
    "orishas",
    "idde de orula",
    "elekes",
    "herramientas de santo",
    "oro 10k 14k 18k",
    "joyería miami",
    "joyas por encargo",
    "pedro yoruba jewelry",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_US",
    url: siteUrl,
    siteName: SITE.name,
    title: `${SITE.name} — Joyería Yoruba en Oro`,
    description: SITE.tagline,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.tagline,
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="template-color-1">
        <Stylesheets />
        <StructuredData />
        <Analytics />
        <AccountProvider>
        <CartProvider>
          <WishlistProvider>
          <CompareProvider>
            <ElekeBar />
            <div className="main-wrapper">
              <NewsletterPopup />
              <Header />
              {children}
              <Footer />
            </div>
            <ScrollToTop />
          </CompareProvider>
          </WishlistProvider>
        </CartProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
