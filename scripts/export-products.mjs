// Build a manifest of every product (handle, title, primary photo URL) so the photos
// can be sent to an image→3D service. The photo is the Shopify CDN URL with width=1024
// (which also converts .heic → jpeg, the format the AI tools accept).
//
//   node scripts/export-products.mjs
//
// Output: scripts/products-manifest.json

import { writeFileSync } from "node:fs";

const STORE = "https://pedroyorubajewelry.myshopify.com";

const res = await fetch(`${STORE}/products.json?limit=250`);
const { products } = await res.json();

const manifest = products
  .map((p) => {
    const src = p.images?.[0]?.src;
    if (!src) return null;
    const image = src + (src.includes("?") ? "&" : "?") + "width=1024";
    return { handle: p.handle, title: p.title, image };
  })
  .filter(Boolean);

writeFileSync(
  new URL("./products-manifest.json", import.meta.url),
  JSON.stringify(manifest, null, 2),
);

console.log(`Wrote ${manifest.length} products → scripts/products-manifest.json`);
