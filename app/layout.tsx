import type { Metadata } from "next";
import "./globals.css";
import Stylesheets from "@/components/layout/Stylesheets";
import ElekeBar from "@/components/layout/ElekeBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { CartProvider } from "@/lib/cart-context";
import { CompareProvider } from "@/lib/compare-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { AccountProvider } from "@/lib/account-context";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — Handcrafted Fine Jewellery`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.tagline,
  icons: { icon: "/assets/images/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="template-color-1">
        <Stylesheets />
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
