/**
 * Arnés del compositor realista (components/watch/WatchFront.tsx). NO es parte
 * del prebuild: se corre a mano para revisar el escenario con los ojos.
 *
 *   npx tsx scripts/render-watchfront.tsx            (comprueba + pinta + capturas)
 *   npx tsx scripts/render-watchfront.tsx --solo-check
 *
 * 1. Comprueba las capas: las cifras de lib/watch-capas.ts = plantilla.json;
 *    cada archivo de capaFiles() existe en public/; capasDe() de TODAS las
 *    combinaciones del catálogo (acabado × correa × esfera × aplique, en 600 y
 *    1200) cae dentro de esa lista.
 *    Y el brazalete de cada acabado contra su caja: media L*a*b* de los
 *    eslabones (fuera de la caja) frente al bisel y los flancos. En Negro PVD
 *    tienen que leerse como el MISMO metal: ΔE ≤ 3 (el brazalete salía gris
 *    claro junto a una caja casi negra). Acero y oro rosa solo se informan.
 * 2. Pinta <WatchFront> con renderToStaticMarkup para cada preset y unos casos
 *    límite, en HTML suelto con las URLs a file:///…/public, y lo fotografía
 *    con Chrome sin ventana en design-assets/creador-relojes/review/stage2-front/.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import Module, { register } from "node:module";
import { join, resolve } from "node:path";

// El componente importa su CSS (Next lo empaqueta); aquí basta un módulo vacío.
(Module as unknown as { _extensions: Record<string, (m: { exports: unknown }) => void> })._extensions[".css"] = (m) => {
  m.exports = {};
};
register(
  "data:text/javascript," +
    encodeURIComponent(
      "export async function load(url, ctx, next) { if (url.endsWith('.css')) return { format: 'module', source: 'export default {}', shortCircuit: true }; return next(url, ctx); }",
    ),
);

const ROOT = resolve(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const OUT = join(ROOT, "design-assets/creador-relojes/review/stage2-front");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONTS =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&display=swap";

async function main() {
  const React = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const W = await import("../lib/watch");
  const C = await import("../lib/watch-capas");
  const { default: WatchFront } = await import("../components/watch/WatchFront");
  // Las letras en curvas, como la imprenta y la vista previa (front/curvas.ts).
  await (await import("../components/watch/front/curvas")).loadOutline();

  // ------------------------------------------------------------------------
  // 1 · Comprobaciones de capas
  // ------------------------------------------------------------------------
  const fails: string[] = [];
  const plantilla = JSON.parse(readFileSync(join(PUBLIC, "assets/images/reloj/capas/plantilla.json"), "utf8"));
  for (const k of ["W", "H", "CX", "CY", "R_ABERTURA", "R_ESFERA", "PX_POR_MM"] as const) {
    if (plantilla[k] !== C.PLANTILLA[k]) fails.push(`PLANTILLA.${k} = ${C.PLANTILLA[k]} pero plantilla.json dice ${plantilla[k]}`);
  }
  const files = C.capaFiles();
  const set = new Set(files);
  for (const f of files) if (!existsSync(join(PUBLIC, f))) fails.push(`falta el archivo ${f}`);
  const aprox = new Map<string, string>();
  let combos = 0;
  for (const c of C.catalogCombos()) {
    for (const size of C.CAPA_SIZES) {
      const r = C.capasDe(c, size);
      combos++;
      for (const url of [r.correa, r.esfera, r.caja, r.aplique]) if (!set.has(url)) fails.push(`capasDe(${JSON.stringify(c)}) → ${url} fuera de capaFiles()`);
      for (const a of r.aproximadas) aprox.set(`${a.capa}:${a.pedido}`, a.usada);
    }
  }
  // Las piezas que SÍ tienen foto no deben salir aproximadas.
  for (const [k, usada] of aprox) {
    const [capa, pedido] = k.split(":");
    const conFoto = ["caucho-amarillo", "caucho-vino", "franjas"];
    if (!conFoto.includes(pedido)) fails.push(`${capa} ${pedido} sale aproximada (${usada}) y tiene foto`);
  }
  console.log(`capas: ${files.length} archivos en public/, ${combos} combinaciones del catálogo dentro de la lista`);
  console.log(`  aproximadas (sin foto propia): ${[...aprox].map(([k, v]) => `${k} → ${v}`).join(" · ") || "ninguna"}`);

  // — Brazalete vs caja: el mismo metal (media L*a*b*, píxeles opacos). —
  const sharp = (await import("sharp")).default;
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const fLab = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  async function meanLab(file: string, zona: (x: number, y: number) => boolean): Promise<[number, number, number]> {
    const { data, info } = await sharp(join(PUBLIC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let n = 0;
    const acc = [0, 0, 0];
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x) * 4;
        if (data[i + 3] < 250 || !zona(x, y)) continue;
        const [R, G, B] = [lin(data[i]), lin(data[i + 1]), lin(data[i + 2])];
        const fy = fLab(0.2126 * R + 0.7152 * G + 0.0722 * B);
        const fx = fLab((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
        const fz = fLab((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
        acc[0] += 116 * fy - 16;
        acc[1] += 500 * (fx - fy);
        acc[2] += 200 * (fy - fz);
        n++;
      }
    }
    return [acc[0] / n, acc[1] / n, acc[2] / n];
  }
  // Plantilla 1200 × 1600, centro (600, 800): eslabones arriba y abajo de la
  // caja; de la caja, el anillo del bisel y los flancos (fuera de la ventana).
  const { CX, CY } = C.PLANTILLA;
  const eslabones = (_x: number, y: number) => y < CY - 240 || y > CY + 260;
  const bisel = (x: number, y: number) => {
    const r = Math.hypot(x - CX, y - CY);
    return r > 260 && r < 420;
  };
  for (const fin of ["pvd-negro", "acero", "oro-rosa"]) {
    const br = await meanLab(`assets/images/reloj/capas/brazalete-${fin}-1200.webp`, eslabones);
    const ca = await meanLab(`assets/images/reloj/capas/caja-${fin}-1200.webp`, bisel);
    const dE = Math.hypot(br[0] - ca[0], br[1] - ca[1], br[2] - ca[2]);
    const fmt = (v: number[]) => v.map((x) => x.toFixed(1)).join(" / ");
    console.log(`  brazalete vs caja ${fin}: L*a*b* ${fmt(br)} vs ${fmt(ca)} · ΔE ${dE.toFixed(2)}`);
    if (fin === "pvd-negro" && dE > 3) fails.push(`brazalete-pvd-negro no casa con caja-pvd-negro: ΔE ${dE.toFixed(2)} (> 3)`);
  }
  if (fails.length) {
    console.error("\nrender-watchfront: FALLA\n" + fails.map((f) => "  " + f).join("\n"));
    process.exit(1);
  }
  if (process.argv.includes("--solo-check")) return;

  // ------------------------------------------------------------------------
  // 2 · Casos
  // ------------------------------------------------------------------------
  type Cfg = import("../lib/watch").WatchConfig;
  const P = (id: import("../lib/watch").PresetId) => W.resolvePreset(id);
  const tweak = (c: Cfg, fn: (c: Cfg) => void): Cfg => {
    const x = structuredClone(c);
    fn(x);
    return W.normalize(x);
  };
  interface Caso {
    nombre: string;
    config: Cfg;
    vista?: "frente" | "tapa";
    noche?: boolean;
    ancho?: number;
    /** Congela la secuencia de montaje en este instante (ms). */
    armarT?: number;
  }
  const casos: Caso[] = [];
  for (const id of W.PRESET_ORDER) casos.push({ nombre: `preset-${id}`, config: P(id) });
  casos.push(
    {
      nombre: "pvd-brazalete",
      config: tweak(P("cero"), (c) => {
        c.acabado = "pvd-negro";
        c.correa = "brazalete";
        c.esfera.base = "negro";
        c.aplique = "plata";
        c.segundero = "rojo";
        c.esfera.texto = "OGUN";
      }),
    },
    {
      nombre: "oro-rosa-piel",
      config: tweak(P("chango"), (c) => {
        c.acabado = "oro-rosa";
        c.correa = "piel-rojo";
      }),
    },
    {
      nombre: "blanca-caucho-blanco",
      config: tweak(P("oshun"), (c) => {
        c.correa = "caucho-blanco";
        c.esfera.base = "blanco";
      }),
    },
    {
      nombre: "nombre-largo",
      config: tweak(P("yemaya"), (c) => {
        c.esfera.texto = "ABUELA MARÍA";
      }),
    },
    {
      nombre: "signo-combinacion-9",
      config: tweak(P("eleggua"), (c) => {
        c.esfera.signo = { tipo: "combinacion", derecha: "otura-meji", izquierda: "ika-meji", nombre: "Otura Ika" };
        c.esfera.signoPos = "nueve";
      }),
    },
    {
      nombre: "signo-meyi-6",
      config: tweak(P("orula"), (c) => {
        c.esfera.signo = { tipo: "meyi", oduId: "ogunda-meji" };
        c.esfera.signoPos = "seis";
      }),
    },
    {
      nombre: "ifa-oro-rosa-piel",
      config: tweak(P("ifa"), (c) => {
        c.acabado = "oro-rosa";
        c.correa = "piel-verde";
      }),
    },
    { nombre: "noche-orula", config: P("orula"), noche: true },
    // Degradados (§14): la tinta cambia según el color que queda debajo.
    ...([1, 3, 5] as const).map((n) => ({
      nombre: `degradado-ifa-orula-p${n}`,
      config: tweak(P("ifa"), (c) => {
        c.esfera.base = "degradado-orula";
        c.esfera.degradado = n;
      }),
    })),
    {
      nombre: "degradado-chango-signo-6",
      config: tweak(P("chango"), (c) => {
        c.esfera.base = "degradado-chango";
        c.esfera.degradado = 3;
        c.esfera.signo = { tipo: "meyi", oduId: "ogunda-meji" };
        c.esfera.signoPos = "seis";
      }),
    },
    {
      nombre: "degradado-oshun-p3",
      config: tweak(P("oshun"), (c) => {
        c.esfera.base = "degradado-oshun";
        c.esfera.degradado = 3;
      }),
    },
    {
      nombre: "degradado-babalu-aye-p2-signo-9",
      config: tweak(P("cero"), (c) => {
        c.esfera.base = "degradado-babalu-aye";
        c.esfera.degradado = 2;
        c.esfera.texto = "BABALÚ AYÉ";
        c.esfera.signo = { tipo: "combinacion", derecha: "otura-meji", izquierda: "ika-meji", nombre: "Otura Ika" };
        c.esfera.signoPos = "nueve";
      }),
    },
    {
      nombre: "degradado-obatala-p4",
      config: tweak(P("cero"), (c) => {
        c.esfera.base = "degradado-obatala";
        c.esfera.degradado = 4;
        c.esfera.texto = "OBATALÁ";
      }),
    },
    { nombre: "noche-ifa", config: P("ifa"), noche: true },
    {
      nombre: "tapa-ifa",
      vista: "tapa",
      config: tweak(P("ifa"), (c) => {
        c.tapa.signo = { tipo: "meyi", oduId: "ofun-meji" };
        c.tapa.linea1 = "Omo Orula";
        c.tapa.fecha = "2019-06-14";
      }),
    },
    {
      nombre: "tapa-pvd",
      vista: "tapa",
      config: tweak(P("cero"), (c) => {
        c.acabado = "pvd-negro";
        c.correa = "brazalete";
        c.tapa.linea1 = "Para Carlos";
        c.tapa.linea2 = "de su madrina";
      }),
    },
    {
      nombre: "tapa-oro-rosa",
      vista: "tapa",
      config: tweak(P("oshun"), (c) => {
        c.acabado = "oro-rosa";
        c.correa = "piel-rojo";
        c.tapa.signo = { tipo: "combinacion", derecha: "otura-meji", izquierda: "ika-meji", nombre: "Otura Ika" };
        c.tapa.marcas = "libreta";
        c.tapa.fuente = "fina";
      }),
    },
    {
      nombre: "caucho-amarillo-aprox",
      config: tweak(P("oshun"), (c) => {
        c.correa = "caucho-amarillo";
      }),
    },
    { nombre: "movil-600-ifa", config: P("ifa"), ancho: 390 },
    { nombre: "armar-0300ms", config: P("chango"), armarT: 300 },
    { nombre: "armar-0750ms", config: P("chango"), armarT: 750 },
    { nombre: "armar-1150ms", config: P("chango"), armarT: 1150 },
  );

  // ------------------------------------------------------------------------
  // 3 · HTML + captura
  // ------------------------------------------------------------------------
  mkdirSync(join(OUT, "html"), { recursive: true });
  const css = readFileSync(join(ROOT, "app/creador-de-relojes/watch-front.css"), "utf8");
  const fileUrl = (p: string) => `file://${PUBLIC}${p}`;
  const pngs: string[] = [];
  for (const caso of casos) {
    let markup = renderToStaticMarkup(
      React.createElement(WatchFront, {
        config: caso.config,
        vista: caso.vista ?? "frente",
        noche: caso.noche ?? false,
        armar: caso.armarT !== undefined,
        priority: true,
      }),
    );
    // Las URLs del sitio ("/assets/…") → archivos locales.
    markup = markup.replace(/(href|src|srcSet|srcset)="(\/assets\/[^"]+)"/g, (_m, a, p) => `${a}="${fileUrl(p)}"`);
    let extra = "";
    if (caso.armarT !== undefined) {
      // Un fotograma congelado de la secuencia de montaje.
      markup = markup.replace('data-armar="espera"', 'data-armar="corre"');
      extra = `.wf{--wf-t:${caso.armarT}ms}.wf-part{animation-play-state:paused!important}`;
    }
    const ancho = caso.ancho ?? 900;
    const alto = Math.round((ancho * 4) / 3);
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${FONTS}">
<style>*{box-sizing:border-box;border-radius:0!important}html,body{margin:0;background:${caso.noche ? "#0d0f0e" : "#efebe5"}}.stage{width:${ancho}px}${css}${extra}</style>
</head><body><div class="stage">${markup}</div></body></html>`;
    const htmlPath = join(OUT, "html", `${caso.nombre}.html`);
    writeFileSync(htmlPath, html);
    const png = join(OUT, `${caso.nombre}.png`);
    execFileSync(
      CHROME,
      [
        "--headless=new",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        `--window-size=${ancho},${alto}`,
        "--allow-file-access-from-files",
        "--virtual-time-budget=6000",
        `--screenshot=${png}`,
        `file://${htmlPath}`,
      ],
      { stdio: "ignore" },
    );
    pngs.push(png);
    console.log(`  ${caso.nombre}.png`);
  }
  console.log(`${pngs.length} capturas en ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
