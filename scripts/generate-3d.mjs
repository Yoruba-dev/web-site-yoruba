#!/usr/bin/env node
/**
 * Generate 3D models for Shopify products with Meshy (image → 3D) and attach
 * each result to its product as a Shopify 3D model, so the storefront shows it
 * in 3D + AR automatically (see storefront/docs/3D-MODELS.md).
 *
 * Env (.env.local):
 *   MESHY_API_KEY              Meshy.ai → API Keys (plan with API access)
 *   SHOPIFY_ADMIN_API_TOKEN    custom-app Admin API token with `write_products`
 *   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN   (or SHOPIFY_STORE_DOMAIN)
 *
 * Usage:
 *   node scripts/generate-3d.mjs --limit 1     # one product (safe test)
 *   node scripts/generate-3d.mjs --handle anillo-de-santa-barbara
 *   node scripts/generate-3d.mjs               # every product without a 3D model
 */
import fs from "node:fs";
import path from "node:path";

// --- minimal .env.local loader (no deps) ---
(function loadEnv() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
})();

const MESHY_KEY = process.env.MESHY_API_KEY;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-10";

if (!MESHY_KEY) fail("Missing MESHY_API_KEY in .env.local");
if (!ADMIN_TOKEN)
  fail("Missing SHOPIFY_ADMIN_API_TOKEN in .env.local (custom app with write_products scope)");
if (!DOMAIN) fail("Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN in .env.local");

function fail(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

const args = process.argv.slice(2);
const argVal = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const limit = argVal("--limit") ? Number(argVal("--limit")) : Infinity;
const onlyHandle = argVal("--handle");

// --- Shopify Admin GraphQL ---
async function admin(query, variables = {}) {
  const res = await fetch(`https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("Shopify: " + JSON.stringify(json.errors));
  return json.data;
}

// --- Meshy API ---
async function meshy(pathname, init) {
  const res = await fetch(`https://api.meshy.ai/openapi/v1${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${MESHY_KEY}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Meshy ${pathname}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** image → textured .glb URL (polls until the task finishes). */
async function generateGlb(imageUrl) {
  const { result: taskId } = await meshy("/image-to-3d", {
    method: "POST",
    body: JSON.stringify({
      image_url: imageUrl,
      ai_model: "latest", // Meshy 6 — most accurate reconstruction of the piece
      should_texture: true,
      enable_pbr: true, // realistic metal response (gold / silver)
      hd_texture: true, // 4K base-colour texture → crisp engraving/surface detail
      image_enhancement: true, // clean up the input photo for a better model
      remove_lighting: true, // strip baked highlights/shadows so PBR looks right
      target_polycount: 120000, // high geometric detail (still web/AR-loadable)
    }),
  });
  process.stdout.write(`   meshy ${taskId} `);
  for (;;) {
    await sleep(8000);
    const t = await meshy(`/image-to-3d/${taskId}`);
    if (t.status === "SUCCEEDED") {
      process.stdout.write(" ✓\n");
      return t.model_urls.glb;
    }
    if (t.status === "FAILED" || t.status === "CANCELED")
      throw new Error(`meshy ${t.status}: ${t.task_error?.message || ""}`);
    process.stdout.write(`${t.progress}% `);
  }
}

/** Attach a .glb to a product as a Shopify 3D model. Shopify rejects remote URLs
 *  for 3D, so we do a staged upload (download → upload to Shopify's bucket →
 *  attach). Shopify then processes it and auto-generates the iOS AR (.usdz). */
async function attachModel(productId, glbUrl, filename, alt) {
  // 1) download the generated .glb
  const buf = Buffer.from(await (await fetch(glbUrl)).arrayBuffer());
  // 2) create a staged upload target
  const staged = await admin(
    `mutation($input: [StagedUploadInput!]!) {
       stagedUploadsCreate(input: $input) {
         stagedTargets { url resourceUrl parameters { name value } }
         userErrors { field message }
       }
     }`,
    {
      input: [
        {
          filename,
          mimeType: "model/gltf-binary",
          httpMethod: "POST",
          resource: "MODEL_3D",
          fileSize: String(buf.length),
        },
      ],
    },
  );
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  if (!target)
    throw new Error("stagedUploadsCreate: " + JSON.stringify(staged.stagedUploadsCreate.userErrors));
  // 3) POST the file to the staged target
  const form = new FormData();
  for (const param of target.parameters) form.append(param.name, param.value);
  form.append("file", new Blob([buf], { type: "model/gltf-binary" }), filename);
  const up = await fetch(target.url, { method: "POST", body: form });
  if (!up.ok && up.status !== 204) throw new Error(`staged upload: ${up.status}`);
  // 4) attach the uploaded file to the product as a 3D model
  const created = await admin(
    `mutation($id: ID!, $media: [CreateMediaInput!]!) {
       productCreateMedia(productId: $id, media: $media) {
         media { status }
         mediaUserErrors { field message }
       }
     }`,
    { id: productId, media: [{ originalSource: target.resourceUrl, mediaContentType: "MODEL_3D", alt }] },
  );
  const errs = created.productCreateMedia.mediaUserErrors;
  if (errs?.length) throw new Error("productCreateMedia: " + JSON.stringify(errs));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- run ---
const data = await admin(
  `{ products(first: 200) {
       edges { node {
         id title handle
         featuredImage { url }
         media(first: 10) { edges { node { mediaContentType } } }
       } }
   } }`,
);

let products = data.products.edges
  .map((e) => e.node)
  .filter((p) => p.featuredImage?.url)
  // skip products that already have a 3D model
  .filter((p) => !p.media.edges.some((m) => m.node.mediaContentType === "MODEL_3D"));
if (onlyHandle) products = products.filter((p) => p.handle === onlyHandle);
products = products.slice(0, limit);

console.log(`${products.length} product(s) to process.\n`);
let ok = 0;
for (const p of products) {
  console.log(`• ${p.title} (${p.handle})`);
  try {
    const glb = await generateGlb(p.featuredImage.url);
    await attachModel(p.id, glb, `${p.handle}.glb`, p.title);
    console.log(`   attached to Shopify ✓\n`);
    ok++;
  } catch (e) {
    console.error(`   ✗ ${e.message}\n`);
  }
}
console.log(`Done. ${ok}/${products.length} models attached.`);
