# Hiraola Storefront (Next.js + Shopify)

A Next.js 16 (App Router, TypeScript) rebuild of the **Hiraola** jewellery template.
The original design is preserved **pixel-for-pixel** by reusing the template's own
CSS; the markup was re-built as reusable React components driven by data, and the
commerce layer is **Shopify-ready** (with a demo catalogue so it runs with zero config).

The original HTML template lives in `../hiraola/` and is kept only as a design reference.

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
  page.tsx               # homepage (hero, categories, banners, product sliders, shipping)
  shop/                  # product grid
  products/[handle]/     # product detail
  cart, checkout, ...    # scaffolded pages (see roadmap)
components/
  layout/                # Header, Footer, Stylesheets, Breadcrumb, popups
  product/               # ProductCard, ProductSlider, ProductPurchase
  home/                  # HeroSlider, CategoryMenu
  ui/                    # SectionTitle, RatingStars
lib/
  site.ts                # 👉 brand name, contact, social, logo paths (EDIT HERE)
  menu.ts                # navigation model
  products.ts            # data access (Shopify ⇄ mock)
  shopify.ts             # Storefront API client
  mock-data.ts           # demo catalogue
  types.ts / utils.ts
public/assets/           # original template CSS, fonts, images
```

## Where to put the real brand info

Everything reads from **`lib/site.ts`** — edit the name, contact details, social links
and logo paths there once and it updates the whole header/footer. Drop real logo files
into `public/assets/images/` (or update the paths).

## Build roadmap

- [x] Foundation: layout, global CSS, data layer, Shopify client + mock fallback
- [x] Header (mega menu, mobile offcanvas, minicart, sticky), Footer, popups
- [x] Homepage (hero slider, category menu, banners, product sliders, shipping)
- [x] Shop grid + Product detail (basic)
- [x] All routes scaffolded (no 404s)
- [ ] Real cart + checkout via Shopify cart API
- [ ] Product detail gallery + zoom + variants
- [ ] Shop filtering/sorting + sidebar
- [ ] Blog, About, Contact, FAQ, account/login content
- [ ] Replace placeholder hero/banner/product images with real photos
- [ ] SEO metadata, sitemap, structured data
```
