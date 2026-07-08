// Generate a 3D model (.glb) for every product from its photo using the Meshy
// image→3D API, and save each as public/models/products/<handle>.glb. The customizer
// auto-loads that file when you open /personalizar?handle=<handle>.
//
//   1) node scripts/export-products.mjs            # build the manifest
//   2) MESHY_API_KEY=msy_xxx node scripts/generate-models-meshy.mjs
//
// Re-runnable: it skips products whose .glb already exists, so you can stop/resume.
// Each model costs Meshy credits — start with a few handles via LIMIT=5 to test.
// Docs: https://docs.meshy.ai/en/api/image-to-3d

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = process.env.MESHY_API_KEY;
if (!KEY) {
  console.error("Set MESHY_API_KEY (get one at https://www.meshy.ai → API).");
  process.exit(1);
}
const LIMIT = Number(process.env.LIMIT || 0); // 0 = all
const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "..", "public", "models", "products");
mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(
  readFileSync(join(__dir, "products-manifest.json"), "utf8"),
);
const jobs = LIMIT ? manifest.slice(0, LIMIT) : manifest;

const BASE = "https://api.meshy.ai/openapi/v1/image-to-3d";
const auth = { Authorization: `Bearer ${KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0;
for (const p of jobs) {
  const out = join(OUT, `${p.handle}.glb`);
  if (existsSync(out)) {
    console.log(`• skip ${p.handle} (already generated)`);
    ok++;
    continue;
  }
  try {
    // 1) create the task
    const created = await fetch(BASE, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: p.image,
        enable_pbr: true,
        should_texture: true,
        target_formats: ["glb"],
      }),
    }).then((r) => r.json());
    const id = created.result || created.id;
    if (!id) {
      console.error(`✗ ${p.handle}: create failed`, created);
      continue;
    }
    // 2) poll until done (Meshy usually takes 1-3 min)
    let task;
    let tries = 0;
    do {
      await sleep(5000);
      task = await fetch(`${BASE}/${id}`, { headers: auth }).then((r) => r.json());
      process.stdout.write(`\r  ${p.handle}: ${task.status} ${task.progress ?? 0}%   `);
    } while (
      task.status !== "SUCCEEDED" &&
      task.status !== "FAILED" &&
      ++tries < 120
    );
    process.stdout.write("\n");
    if (task.status !== "SUCCEEDED") {
      console.error(`✗ ${p.handle}: ${task.status}`);
      continue;
    }
    // 3) download the .glb
    const glbUrl = task.model_urls?.glb;
    const buf = Buffer.from(await fetch(glbUrl).then((r) => r.arrayBuffer()));
    writeFileSync(out, buf);
    console.log(`✓ ${p.handle}.glb (${(buf.length / 1048576).toFixed(1)} MB)`);
    ok++;
  } catch (e) {
    console.error(`✗ ${p.handle}: ${e.message}`);
  }
}

console.log(`\nDone: ${ok}/${jobs.length}. Models in public/models/products/`);
console.log("Open /personalizar?handle=<handle> — the model loads automatically.");
