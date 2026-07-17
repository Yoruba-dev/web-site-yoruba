# Pedro Yoruba Jewelry — Storefront (Next.js + Shopify)

A Next.js 16 (App Router, TypeScript) headless storefront, originally rebuilt from
the **Hiraola** jewellery template and now the live site for **Pedro Yoruba Jewelry**
(pedrojewelryyoruba.com), deployed on Netlify with auto-deploy from `main`. The
original design is preserved **pixel-for-pixel** by reusing the template's own CSS;
the markup is reusable React components driven by data, and the commerce layer runs
on Shopify's Storefront API (with a demo catalogue as an offline fallback so it runs
with zero config).

The original HTML template lives in `../hiraola/` and is kept only as a design reference.

**For day-to-day work — local setup, deploy steps, where things live, git rules —
see [`CONTINUAR.md`](./CONTINUAR.md).** This README covers the project's shape and
architecture; CONTINUAR.md is the living "how to keep working on this" guide.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Runs immediately on a built-in demo catalogue — no Shopify account needed yet.

## Connect Shopify (when ready)

1. Copy `.env.example` → `.env.local`.
2. In Shopify admin: **Settings → Apps and sales channels → Develop apps → create an
   app → Storefront API → install → copy the access token.**
3. Fill in:
   ```
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxxxxx
   ```
4. Restart `npm run dev`. The data layer (`lib/products.ts`) automatically switches
   from the demo catalogue to live Shopify products — **no component changes needed.**

## How the design is kept identical

- The original stylesheets (Bootstrap, slick, animate, font-awesome, ionicons,
  `style.css`, …) are copied verbatim into `public/assets/` and loaded in the exact
  original order via `components/layout/Stylesheets.tsx`. We do **not** rewrite them in
  Tailwind, so nothing drifts.
- jQuery + its plugins are **not** used. Each interaction was re-implemented in React:
  | Original (jQuery)        | Replacement (React)                         |
  | ------------------------ | ------------------------------------------- |
  | slick carousel           | `react-slick` (same slick CSS & class names)|
  | offcanvas menu / minicart| `Header.tsx` state toggling `.open`         |
  | sticky header on scroll  | `Header.tsx` scroll listener                |
  | newsletter popup         | `NewsletterPopup.tsx` (+ localStorage)      |
  | scroll-to-top            | `ScrollToTop.tsx`                           |
  | nice-select / counterup  | native / pending                            |

## Project structure

```
app/                     # routes (App Router)
  page.tsx               # homepage (hero, categories, banners, product sliders)
  shop-left-sidebar/     # main catalogue browser (filters, sort, pagination)
  collections/[handle]/  # per-collection landing pages (live Shopify collections)
  products/[handle]/     # product detail (gallery, 3D/AR, reviews, purchase)
  cart, checkout/        # real Shopify cart + checkout flow
  mayoreo/                # B2B wholesale (botánicas) landing page
  joyeria-en-miami/       # local-SEO pillar page
  garantia-y-devoluciones/# returns/warranty/repair policy page
  blog/[slug]/            # "Diario" editorial articles (SEO/GEO content)
  faq/, about-us/, contact/, my-account/, wishlist/, compare/
components/
  layout/                # Header (mega menu), Footer, MobileTabBar, offcanvas drawers
  product/               # ProductCard, ProductSlider, ProductDetail, ReviewStars
  shop/                  # ShopBrowser (filters/sort/pagination), ShopContent
  home/                  # HeroSlider, CategoryMenu, category carousel
  seo/                   # JsonLd (schema.org structured data)
  ui/                    # SafeImage, shared UI primitives
lib/
  site.ts                # 👉 brand name, contact, social, logo paths (EDIT HERE)
  commerce.ts             # direct-checkout vs. made-to-order (WhatsApp) policy
  menu.ts                # navigation model (collections fed live from Shopify)
  products.ts             # data access (Shopify ⇄ mock fallback)
  shopify.ts              # Storefront API client
  mock-data.ts             # offline demo catalogue (used only if Shopify isn't configured)
  schema.ts                # shared JSON-LD builders (breadcrumb, FAQPage, …)
  judgeme.ts               # real product review ratings (Judge.me)
  faq-data.ts, blog-data.ts, collection-content.ts  # SEO/GEO content, single source of truth
public/assets/           # original template CSS, fonts, images
```

## Where to put the real brand info

Everything reads from **`lib/site.ts`** — edit the name, contact details, social links
and logo paths there once and it updates the whole header/footer. Drop real logo files
into `public/assets/images/` (or update the paths).

## Current state

This is a **live production storefront**, not a scaffold — the checklist below
tracks the shape of what's built, not a to-do list.

- [x] Foundation: layout, global CSS, data layer, Shopify client + mock fallback
- [x] Header (mega menu w/ live Shopify collections, mobile offcanvas, minicart —
      both drawers share a "liquid glass" material with the floating tab bar),
      Footer, popups
- [x] Homepage (hero slider from real Shopify banners, category carousel, product
      sliders, entity/SEO block)
- [x] Shop grid with filters/sort/pagination, per-collection landing pages, product
      detail (gallery, 3D model/AR viewer, real reviews, purchase flow)
- [x] Real cart + checkout via Shopify (direct checkout or WhatsApp made-to-order
      consult, decided per-product by `lib/commerce.ts`)
- [x] Blog ("Diario"), About, Contact, FAQ, wholesale (mayoreo), warranty/returns
      policy, local-SEO pillar page
- [x] Real product photos throughout (no placeholders)
- [x] SEO/GEO: per-page metadata, sitemap, JSON-LD structured data (Product,
      FAQPage, BreadcrumbList, CollectionPage, …), llms.txt, robots.ts tuned for
      AI crawlers (GPTBot, ClaudeBot, PerplexityBot, …)
- [x] Real review ratings via Judge.me (`attachRatings`), read AND write (review
      submission form posts to Judge.me)
- [ ] Grid/list view toggle on the shop page (removed a broken template-era
      version; ShopBrowser already supports both render modes — just needs a
      working toggle, see the flagged follow-up task)
```
