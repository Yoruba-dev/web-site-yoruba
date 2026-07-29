#!/usr/bin/env node
/**
 * Fails the build when a CSS file has unbalanced braces.
 *
 * Why this exists: a stray edit once deleted the closing `}` of a
 * `@media (max-width: 767px)` block in app/globals.css. Nothing complained —
 * `next build` compiled clean, the site deployed, and the 2000 lines that
 * followed silently became mobile-only. On desktop the category carousel, the
 * cart drawer and the whole ring configurator lost their styling, and it
 * shipped twice before anyone looked at a wide screen.
 *
 * A missing brace is not a style question, it is a broken file. Catch it here.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Walk a directory for .css files. Hand-rolled: fs.globSync needs Node 22 and
 *  the build box is on 20. */
function findCss(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findCss(full));
    else if (entry.name.endsWith(".css")) found.push(full);
  }
  return found;
}

/** Blank out comments and quoted strings so their braces are not counted. */
function stripNoise(css) {
  let out = "";
  let i = 0;
  while (i < css.length) {
    if (css.startsWith("/*", i)) {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      // keep newlines so line numbers stay accurate
      out += css.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (css[i] === '"' || css[i] === "'") {
      const quote = css[i];
      let j = i + 1;
      while (j < css.length && css[j] !== quote) j += css[j] === "\\" ? 2 : 1;
      out += css.slice(i, Math.min(j + 1, css.length)).replace(/[^\n]/g, " ");
      i = j + 1;
    } else {
      out += css[i];
      i += 1;
    }
  }
  return out;
}

function audit(file) {
  const clean = stripNoise(readFileSync(file, "utf8"));
  let depth = 0;
  let lastOpenAtDepthOne = 0;
  const problems = [];

  clean.split("\n").forEach((line, index) => {
    const lineNo = index + 1;
    for (const ch of line) {
      if (ch === "{") {
        if (depth === 0) lastOpenAtDepthOne = lineNo;
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
        if (depth < 0) {
          problems.push(`${file}:${lineNo} — cierre "}" de sobra`);
          depth = 0;
        }
      }
    }
  });

  if (depth > 0) {
    problems.push(
      `${file} — faltan ${depth} cierre(s) "}"; el último bloque de primer nivel ` +
        `empieza en la línea ${lastOpenAtDepthOne} y nunca se cierra, así que todo lo ` +
        `que viene después queda anidado dentro de él`,
    );
  }
  return problems;
}

const files = findCss("app");
if (files.length === 0) {
  console.error("check-css: no encontré ningún .css bajo app/ — ¿cambió la estructura?");
  process.exit(1);
}

const problems = files.flatMap(audit);
if (problems.length > 0) {
  console.error("\ncheck-css: CSS con llaves desequilibradas\n");
  for (const p of problems) console.error("  " + p);
  console.error("");
  process.exit(1);
}
console.log(`check-css: ${files.length} archivo(s) CSS con llaves equilibradas`);
