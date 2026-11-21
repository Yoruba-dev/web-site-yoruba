#!/usr/bin/env tsx
/**
 * Prebuild check for the creador de relojes (lib/watch*.ts). Fails the build
 * when the watch data or its renderers break a promise the shop makes:
 *
 *   • every Orisha preset resolves ONLY to parts the workshop really has;
 *   • the catalogue hides exactly what the owner said (§7) and every FLAGS
 *     gate really shows/hides its part;
 *   • every rule in RULES actually fires on a blocked example (no dead rules);
 *   • a design survives the trip through the order link (?d=), malformed watch
 *     links decode to a safe config, and the ring / coin links already sent to
 *     customers still decode exactly as before;
 *   • the Odù signs: flipping a column top↔bottom swaps exactly the 6 known
 *     pairs and leaves the 4 symmetric Meyi alone — and every pipeline (dial at
 *     both positions, caseback in both notations, and the SVG text itself,
 *     through every transform) draws the sign upright and unmirrored;
 *   • the text allow-lists accept and reject what they should;
 *   • every SVG builder returns well-formed XML for every preset, no element is
 *     mirrored, and the dial print file is exactly 30.5 mm;
 *   • the seconds hand and the sign stay clear of the name, the PY applique
 *     and the date window.
 *
 * Run: npx tsx scripts/check-watch-data.ts   (wired into `npm run prebuild`)
 */
import {
  CASEBACK_MAX,
  CATALOG,
  DIAL_BASES,
  DIAL_NAMES,
  DIAL_TEXT_MAX,
  FLAGS,
  PRESET_ORDER,
  RULES,
  WATCH_CUSTOM_POLICY,
  WATCH_ODU_NOTE,
  WATCH_ORIGIN,
  WATCH_PROOF_NOTE,
  WATCH_RENDER_NOTE,
  availability,
  cleanDialText,
  decodeWatchDesign,
  designCode,
  dialInk,
  getPart,
  isPartId,
  isValidCasebackLine,
  isValidDialText,
  isValidFecha,
  isValidSignName,
  lineProperties,
  normalize,
  normalizeWithReport,
  optionState,
  partState,
  priceDelta,
  resolvePreset,
  signColumns,
  summary,
  validate,
  variantFor,
  visibleParts,
  withPart,
  type DialSignPos,
  type OduSign,
  type PartCategory,
  type PresetId,
  type StrapId,
  type WatchConfig,
  type WatchFlags,
} from "../lib/watch";
import { ODU_GLYPH, ODU_LUCUMI, ODU_MEJI, flipVertical, oduByColumn, type Mark } from "../lib/odu";
import {
  DIAL_LAYOUT,
  HANDS,
  casebackPrimitives,
  dialPrimitives,
  estimateTextWidth,
  handAngles,
  polar,
  signPrimitives,
  type Primitive,
  type RectPrim,
  type TextRun,
} from "../lib/watch-art";
import { casebackSvg, dialPrintSvg, frontSvg, frontSvgDataUrl, laserSvg } from "../lib/watch-svg";
import { decodeDesign, encodeDesign, encodeWatchDesign, isWatchPayload } from "../lib/design-code";

let failures = 0;
let checks = 0;
function ok(cond: unknown, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✗ ${msg}`);
  }
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function section(name: string, fn: () => void): void {
  const before = failures;
  fn();
  console.log(`${failures === before ? "✓" : "✗"} ${name}`);
}

const disp = availability();
const presets = PRESET_ORDER.map((id): [PresetId, WatchConfig] => [id, resolvePreset(id, disp)]);

// A combination sign used in several checks: Otura on the right, Ika on the left.
const COMBO: OduSign = { tipo: "combinacion", derecha: "otura-meji", izquierda: "ika-meji", nombre: "Otura Ika" };
const withPatch = (c: WatchConfig, patch: Partial<WatchConfig>): WatchConfig => ({ ...c, ...patch });
const SAMPLES: [string, WatchConfig][] = [
  ...presets,
  [
    "combinacion",
    (() => {
      const c = resolvePreset("chango", disp);
      return {
        ...c,
        esfera: { ...c.esfera, texto: "FAMILIA RUIZ", signo: COMBO, signoPos: "seis" },
        tapa: { signo: COMBO, marcas: "libreta", linea1: "Ñañá & Tomás", linea2: "O'Neil · Miami", fecha: "2024-12-04", fuente: "fina" },
      } satisfies WatchConfig;
    })(),
  ],
  [
    "meyi-brazalete",
    (() => {
      const c = resolvePreset("orula", disp);
      return {
        ...c,
        acabado: "pvd-negro",
        correa: "brazalete",
        esfera: { ...c.esfera, signo: { tipo: "meyi", oduId: "ofun-meji" } },
        tapa: { ...c.tapa, signo: { tipo: "meyi", oduId: "ofun-meji" }, linea1: "Juan & Ana O'Neil", fecha: "2019-10-04" },
      } satisfies WatchConfig;
    })(),
  ],
];

// --- Odù sign helpers (used by the orientation and SVG sections) -------------
const ALL_SIGNS: OduSign[] = [...ODU_MEJI.map((o): OduSign => ({ tipo: "meyi", oduId: o.id })), COMBO];
const expectCols = (s: OduSign) => {
  const c = signColumns(s)!;
  return { left: [...c.left], right: [...c.right] };
};

/** Read a sign back from drawn marks: split them into the left/right column by
 *  x, rows by y (top → bottom), and count bars per row. Rings ("0") = 2. A
 *  rotated mark means the sign was turned: null. */
function readBack(prims: readonly Primitive[]): { left: Mark[]; right: Mark[] } | null {
  const marks = prims.filter((p) => p.kind === "rect" || p.kind === "path");
  if (!marks.length || marks.some((p) => p.kind === "rect" && p.rotate)) return null;
  const firstM = (p: Primitive) => /^M(-?[\d.]+) (-?[\d.]+)/.exec((p as { d: string }).d)!;
  const cx = (p: Primitive) => (p.kind === "rect" ? p.x + p.w / 2 : Number(firstM(p)[1]) + 0.001);
  const cy = (p: Primitive) => (p.kind === "rect" ? p.y + p.h / 2 : Number(firstM(p)[2]));
  const xs = marks.map(cx);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const col = (side: "left" | "right"): Mark[] => {
    const mine = marks.filter((p) => (side === "left" ? cx(p) < mid : cx(p) > mid));
    const ys = [...new Set(mine.map((p) => cy(p).toFixed(2)))].map(Number).sort((a, b) => a - b);
    return ys.map((y) => {
      const row = mine.filter((p) => Math.abs(cy(p) - y) < 0.01);
      return (row.length === 2 || row[0].kind === "path" ? 2 : 1) as Mark;
    });
  };
  return { left: col("left"), right: col("right") };
}

/** The sign marks dialPrimitives() must contain for `c` (same layout numbers). */
function dialSignMarks(c: WatchConfig): Primitive[] {
  if (!c.esfera.signo) return [];
  const s = DIAL_LAYOUT.sign[c.esfera.signoPos];
  return signPrimitives(c.esfera.signo, s.cx, s.cy, s.inkH, dialInk(c.esfera.base).hex, "impresion");
}

/** The sign marks of the caseback: engraved rects/paths (the ring is arcText,
 *  the fillets are circles). */
function casebackSignMarks(c: WatchConfig, ink?: string): Primitive[] {
  return casebackPrimitives(c, { ink }).filter((p) => p.capa === "grabado" && (p.kind === "rect" || p.kind === "path"));
}

// ---------------------------------------------------------------------------
section("presets resolve only to visible, available parts", () => {
  const fields: [PartCategory, (c: WatchConfig) => string][] = [
    ["caja", (c) => c.caja],
    ["acabado", (c) => c.acabado],
    ["esfera", (c) => c.esfera.base],
    ["pista", (c) => c.esfera.pista.estilo],
    ["aplique", (c) => c.aplique],
    ["segundero", (c) => c.segundero],
    ["correa", (c) => c.correa],
    ["cierre", (c) => c.cierre],
  ];
  // Also with the first choices sold out: the preference lists must fall back.
  const sold = availability(["correa:caucho-negro", "correa:caucho-azul-marino", "segundero:amarillo", "aplique:oro", "esfera:rojo"]);
  for (const d of [disp, sold]) {
    for (const id of PRESET_ORDER) {
      const c = resolvePreset(id, d);
      for (const [cat, get] of fields) {
        const p = getPart(cat, get(c));
        ok(p && p.status === "verificado", `preset ${id}: ${cat} "${get(c)}" is not a verified part`);
        ok(!d.agotados.has(`${cat}:${get(c)}`), `preset ${id}: ${cat} "${get(c)}" is sold out`);
      }
      const v = validate(c, d);
      ok(v.ok, `preset ${id} does not validate: ${v.issues.map((i) => i.regla).join(", ")}`);
    }
  }
  // The owner's lineup (spec option_matrix "Presets").
  const p = Object.fromEntries(presets);
  ok(p.eleggua.esfera.base === "rojo" && p.eleggua.correa === "caucho-negro" && p.eleggua.segundero === "negro", "Elegguá preset");
  ok(p.chango.esfera.base === "blanco" && p.chango.correa === "caucho-rojo" && p.chango.segundero === "rojo", "Changó preset");
  ok(p.yemaya.correa === "caucho-azul-marino" && p.yemaya.segundero === "azul", "Yemayá preset");
  ok(p.oshun.correa === "caucho-blanco" && p.oshun.segundero === "amarillo", "Oshún preset (amarillo strap pendiente → blanco)");
  ok(p.orula.esfera.base === "verde" && p.orula.correa === "caucho-verde" && p.orula.segundero === "amarillo", "Orula preset");
  ok(p.oya.correa === "caucho-tan" && p.oya.segundero === "negro", "Oyá preset (vino/marrón pendiente → tan/negro)");
  ok(
    p.cero.esfera.pista.estilo === "rayas" && !p.cero.esfera.pista.orisha && p.cero.aplique === "plata" && p.cero.esfera.texto === "",
    "Desde cero preset",
  );
  for (const [id, c] of presets) {
    if (id === "cero") continue;
    ok(c.aplique === "oro" && c.esfera.pista.estilo === "cuentas" && c.esfera.texto === DIAL_NAMES[id], `preset ${id}: gold, beads, canonical name`);
  }
});

// ---------------------------------------------------------------------------
section("catalogue status follows the owner's §7; flags really gate their parts", () => {
  // §7: everything in the owner's photos/renders is 'verificado' for the
  // prototype. The ONLY exceptions are the ones he named, plus parts that
  // appear in no photo at all. Anything else hidden is a bug (e.g. the
  // deployant of image 10 hidden as 'pendiente').
  const NOT_VERIFIED: Record<string, string> = {
    "correa:caucho-amarillo": "§7: Oshún yellow strap",
    "correa:caucho-vino": "§7: Oyá vino strap",
    "segundero:verde": "§7: green seconds hand",
    "segundero:marron": "§7: brown seconds hand",
    "esfera:azul": "no owner photo shows a blue dial",
  };
  const hidden: string[] = [];
  for (const [cat, parts] of Object.entries(CATALOG)) {
    for (const p of parts) {
      if (p.status === "verificado") continue;
      hidden.push(`${cat}:${p.id}`);
      ok(p.status === "pendiente", `${cat}:${p.id} is '${p.status}' — use 'pendiente', or a FLAGS gate for an owner decision`);
    }
  }
  ok(same(hidden.sort(), Object.keys(NOT_VERIFIED).sort()), `non-verified parts must be exactly the owner's list, got: ${hidden.join(", ")}`);
  ok(partState("cierre", "desplegable", disp) === "disponible", "the deployant clasp (image 10) must be offered");
  ok(variantFor(withPart(resolvePreset("cero"), "cierre", "desplegable"), [
    { id: "v", price: { amount: "1", currencyCode: "USD" }, selectedOptions: [{ name: "Acabado", value: "Acero" }, { name: "Correa", value: "Caucho" }] },
  ])?.id === "v", "the clasp does not take part in the price (owner §1: Acabado × Correa only)");

  // Every flag-gated part follows its flag — turning the flag on is ONE line.
  for (const [cat, parts] of Object.entries(CATALOG) as [PartCategory, (typeof CATALOG)[PartCategory]][]) {
    for (const p of parts) {
      if (!p.flag) continue;
      const on: WatchFlags = { ...FLAGS, [p.flag]: true };
      const off: WatchFlags = { ...FLAGS, [p.flag]: false };
      ok(partState(cat, p.id, disp, off) === "oculto" && !visibleParts(parts, off).includes(p), `${cat}:${p.id} must be hidden with ${p.flag} off`);
      ok(partState(cat, p.id, disp, on) === "disponible" && visibleParts(parts, on).includes(p), `${cat}:${p.id} must be offered with ${p.flag} on`);
    }
  }
  const cero = resolvePreset("cero", disp);
  const stripes: WatchFlags = { ...FLAGS, STRIPE_DIALS: true };
  const striped = withPart(cero, "esfera", "franjas");
  ok(optionState(cero, "esfera", "franjas", disp, stripes).estado === "disponible", "STRIPE_DIALS on → the stripe dial tile is selectable");
  ok(optionState(cero, "esfera", "franjas", disp).estado === "oculto", "STRIPE_DIALS off (launch) → the stripe dial tile is hidden");
  ok(validate(striped, disp, stripes).ok && !validate(striped, disp).ok, "the stripe dial validates only with STRIPE_DIALS on");
  const bands = dialPrimitives(striped).filter((p): p is RectPrim => p.capa === "base" && p.kind === "rect");
  ok(bands.length > 10 && dialPrimitives(cero).filter((p) => p.capa === "base").length === 1, "the stripe dial draws its stripes (and a sunray dial does not)");
  ok(
    bands.every((b) => [b.x, b.x + b.w].every((x) => [b.y, b.y + b.h].every((y) => Math.hypot(x, y) <= DIAL_LAYOUT.r + 1e-9))),
    "every stripe stays inside the Ø30.5 disc",
  );

  // withPart: typed per category; an id outside the catalogue is a no-op.
  ok(withPart(cero, "correa", "no-existe" as StrapId) === cero, "withPart must ignore an id that is not in the catalogue");
  ok(withPart(cero, "correa", "brazalete").correa === "brazalete" && cero.correa === "caucho-negro", "withPart changes one part, immutably");
  ok(isPartId("correa", "brazalete") && !isPartId("correa", "no-existe") && !isPartId("segundero", "caucho-negro"), "isPartId narrows per category");
});

// ---------------------------------------------------------------------------
section("every RULE fires on a blocked example", () => {
  const base = resolvePreset("eleggua", disp);
  const off: WatchFlags = { ...FLAGS, DIAL_FREE_TEXT: false, ODU_ON_DIAL: false };
  const esf = (patch: Partial<WatchConfig["esfera"]>) => withPatch(base, { esfera: { ...base.esfera, ...patch } });
  const tapa = (patch: Partial<WatchConfig["tapa"]>) => withPatch(base, { tapa: { ...base.tapa, ...patch } });
  const examples: Record<string, { c: WatchConfig; d?: typeof disp; flags?: WatchFlags }> = {
    "pieza-desconocida": { c: withPatch(base, { correa: "caucho-morado" as WatchConfig["correa"] }) },
    "franjas-octogonal": { c: esf({ base: "franjas" }) },
    "pieza-no-verificada": { c: withPatch(base, { segundero: "verde" }) },
    "pieza-agotada": { c: base, d: availability(["correa:caucho-negro"]) },
    "cuentas-sin-orisha": { c: esf({ pista: { estilo: "cuentas" } }) },
    "texto-esfera": { c: esf({ texto: "eleggua" }) },
    "texto-esfera-fijo": { c: esf({ texto: "MI CAMINO" }), flags: off },
    "signo-esfera-apagado": { c: esf({ signo: { tipo: "meyi", oduId: "ofun-meji" } }), flags: off },
    "signo-desconocido": { c: tapa({ signo: { tipo: "meyi", oduId: "no-existe" } }) },
    "combinacion-sin-nombre": { c: tapa({ signo: { ...COMBO, nombre: "  " } }) },
    "nombre-combinacion": { c: tapa({ signo: { ...COMBO, nombre: "x".repeat(25) } }) },
    "texto-tapa": { c: tapa({ linea1: "<script>" }) },
    "fecha-tapa": { c: tapa({ fecha: "2025-02-30" }) },
    "contraste-segundero": { c: withPatch(esf({ base: "blanco" }), { segundero: "blanco" }) },
  };
  for (const rule of RULES) {
    const ex = examples[rule.id];
    ok(ex, `rule ${rule.id} has no blocked example in this check — add one`);
    if (!ex) continue;
    const v = validate(ex.c, ex.d ?? disp, ex.flags ?? FLAGS);
    const hit = v.issues.find((i) => i.regla === rule.id);
    ok(hit, `rule ${rule.id} did not fire on its example`);
    ok(hit && hit.motivo.length > 10, `rule ${rule.id} has no Spanish motivo`);
    if (rule.nivel === "bloqueo") ok(!v.ok, `rule ${rule.id} fired but validate() still says ok`);
    // And it stays silent on the clean preset.
    ok(!validate(base, disp, ex.flags ?? FLAGS).issues.some((i) => i.regla === rule.id), `rule ${rule.id} fires on the clean preset`);
  }
  for (const id of Object.keys(examples)) ok(RULES.some((r) => r.id === id), `example for unknown rule ${id}`);
  // The flags are ON at launch (owner decision §3): free dial text + sign validate.
  ok(validate(esf({ texto: "MI CAMINO", signo: COMBO })).ok, "free dial text + combination sign must validate with launch FLAGS");
  // Contrast is a catalogue invariant: every visible dial gets ≥ 3:1 ink.
  for (const b of DIAL_BASES) if (b.status === "verificado") ok(dialInk(b.id).contraste >= 3, `dial ${b.id}: text contrast < 3:1`);
});

// ---------------------------------------------------------------------------
section("design links: watch round-trip + old ring/coin links unchanged", () => {
  for (const [name, c] of SAMPLES) {
    const code = encodeWatchDesign(c, { handle: "reloj-personalizado-orisha", title: "Reloj", variant: "Acero / Caucho" });
    const p = decodeDesign(code);
    ok(p && isWatchPayload(p), `${name}: decodeDesign did not return a watch payload`);
    if (!p || !isWatchPayload(p)) continue;
    ok(same(p.design, {}), `${name}: watch payload must carry design: {}`);
    const back = normalizeWithReport(p.watch);
    ok(same(back.config, normalize(c)), `${name}: config changed in the round-trip`);
    ok(back.descontinuado.length === 0, `${name}: round-trip flagged ${JSON.stringify(back.descontinuado)}`);
    ok(designCode(back.config) === designCode(c), `${name}: design code changed in the round-trip`);
    const viaDecoder = decodeWatchDesign(code);
    ok(viaDecoder && same(viaDecoder.config, back.config), `${name}: decodeWatchDesign differs from decode + normalize`);
  }
  // A malformed watch link never reaches a renderer un-normalized.
  for (const watch of [{}, { esfera: null, tapa: 7 }, { esfera: { pista: "x", texto: 5 } }]) {
    const r = decodeWatchDesign(encodeDesign({ design: {}, piece: "reloj", watch }));
    let rendered = false;
    try {
      rendered = !!r && frontSvg(r.config).length > 0 && lineProperties(r.config, designCode(r.config), "u").length > 0;
    } catch {
      rendered = false;
    }
    ok(rendered && r!.config.esfera.texto === "", `malformed watch ${JSON.stringify(watch)} must decode to a safe default config`);
  }
  for (const watch of [null, "x", [], 3]) {
    ok(decodeWatchDesign(encodeDesign({ design: {}, piece: "reloj", watch })) === null, `watch ${JSON.stringify(watch)} is not a watch payload`);
  }
  ok(/^PY-R-[0-9A-HJKMNP-TV-Z]{4}$/.test(designCode(presets[0][1])), "designCode format PY-R-XXXX (Crockford)");
  ok(designCode({ ...presets[0][1], preset: "cero" }) === designCode(presets[0][1]), "designCode ignores `preset`");
  // Links encoded by the ring/coin configurators BEFORE the watch existed.
  const OLD_RING =
    "eyJkZXNpZ24iOnsiZnJvbnQiOlt7InVpZCI6ImsxIiwicmVmIjoidG93ZXI6b2Z1bi1tZWppIiwieCI6MC41LCJ5IjowLjQ2LCJzY2FsZSI6MS4yLCJyb3RhdGlvbiI6MCwidG93ZXIiOiJib3RoIn1dLCJsZWZ0IjpbeyJ1aWQiOiJrMiIsInJlZiI6Im1vdGlmOnNvbCIsIngiOjAuNSwieSI6MC41LCJzY2FsZSI6MC44LCJyb3RhdGlvbiI6MTV9XSwicmlnaHQiOltdfSwicmluZyI6eyJoYW5kbGUiOiJhbmlsbG8tbWFzb24iLCJ0aXRsZSI6IkFuaWxsbyBNYXPDs24iLCJ2YXJpYW50IjoiUGxhdGEgOTI1Iiwic2FudG8iOiJPc2jDum4ifX0";
  const OLD_COIN =
    "eyJkZXNpZ24iOnsicmV2ZXJzbyI6W3sidWlkIjoiYzEiLCJyZWYiOiJ0b3dlcjplamktb2diZSIsIngiOjAuNSwieSI6MC41LCJzY2FsZSI6MSwicm90YXRpb24iOjAsInRvd2VyIjoicmlnaHQifV19LCJwaWVjZSI6Im1vbmVkYSIsInJpbmciOnsiaGFuZGxlIjoibW9uZWRhLWRlLWlmYSIsInRpdGxlIjoiTW9uZWRhIGRlIElmw6EiLCJ2YXJpYW50IjoiUGxhdGEifX0";
  const ring = decodeDesign(OLD_RING);
  ok(
    ring &&
      same(ring, {
        design: {
          front: [{ uid: "k1", ref: "tower:ofun-meji", x: 0.5, y: 0.46, scale: 1.2, rotation: 0, tower: "both" }],
          left: [{ uid: "k2", ref: "motif:sol", x: 0.5, y: 0.5, scale: 0.8, rotation: 15 }],
          right: [],
        },
        ring: { handle: "anillo-mason", title: "Anillo Masón", variant: "Plata 925", santo: "Oshún" },
      }) &&
      !isWatchPayload(ring),
    "old ring link no longer decodes to the same payload",
  );
  const coin = decodeDesign(OLD_COIN);
  ok(coin && coin.piece === "moneda" && coin.design.reverso?.[0]?.ref === "tower:eji-ogbe" && !isWatchPayload(coin), "old coin link");
  ok(ring && encodeDesign(ring) === OLD_RING, "re-encoding an old ring payload must give the same code");
  ok(decodeDesign("not-a-code") === null, "garbage code must decode to null");
  ok(decodeWatchDesign(OLD_RING) === null && decodeWatchDesign(OLD_COIN) === null && decodeWatchDesign("not-a-code") === null, "ring, coin and garbage links are not watches");
});

// ---------------------------------------------------------------------------
section("Odù orientation: flipVertical pairs + upright, unmirrored renders", () => {
  const PAIRS: [string, string][] = [
    ["irosun-meji", "owonrin-meji"],
    ["obara-meji", "okanran-meji"],
    ["ogunda-meji", "osa-meji"],
    ["ika-meji", "oturupon-meji"],
    ["otura-meji", "irete-meji"],
    ["ose-meji", "ofun-meji"],
  ];
  const SYMMETRIC = ["eji-ogbe", "oyeku-meji", "iwori-meji", "odi-meji"];
  const partner = new Map<string, string>();
  for (const [a, b] of PAIRS) {
    partner.set(a, b);
    partner.set(b, a);
  }
  for (const o of ODU_MEJI) {
    const flipped = oduByColumn(flipVertical(o.right))?.id;
    const want = partner.get(o.id) ?? (SYMMETRIC.includes(o.id) ? o.id : "?");
    ok(flipped === want, `flipVertical(${o.id}) = ${flipped}, expected ${want}`);
    ok(same(flipVertical(flipVertical(o.right)), o.right), `flipVertical twice must be identity (${o.id})`);
    ok(o.left.every((m, i) => m === o.right[i]), `${o.id}: a Meyi has equal columns`);
    ok(ODU_LUCUMI[o.id], `${o.id}: missing Lucumí name`);
  }
  ok(partner.size === 12 && SYMMETRIC.length === 4 && ODU_MEJI.length === 16, "6 pairs + 4 symmetric = 16");

  for (const s of ALL_SIGNS) {
    const want = expectCols(s);
    for (const notation of ["barras", "libreta"] as const) {
      const got = readBack(signPrimitives(s, -6.3, 0, 4, "#000", "impresion", notation));
      ok(same(got, want), `sign ${JSON.stringify(s)} (${notation}) is not drawn upright/unmirrored`);
    }
  }
  // The right column (pierna derecha) of a combination is drawn on the RIGHT.
  const combo = readBack(signPrimitives(COMBO, 0, 0, 4, "#000", "grabado"));
  ok(combo && same(combo.right, [1, 2, 1, 1]) && same(combo.left, [2, 1, 2, 2]), "Otura (derecha) must be on the right, Ika on the left");

  // Through the FULL pipelines too: every sign, at both dial positions and on
  // the caseback in both notations, read back from the primitives the SVG and
  // the 3D draw from.
  const base = resolvePreset("orula", disp);
  for (const s of ALL_SIGNS) {
    const want = expectCols(s);
    for (const pos of ["nueve", "seis"] as DialSignPos[]) {
      const c: WatchConfig = { ...base, esfera: { ...base.esfera, signo: s, signoPos: pos } };
      const marks = dialSignMarks(c);
      ok(marks.length > 0 && marks.every((m) => dialPrimitives(c).some((p) => same(p, m))), `dial (${pos}): sign marks missing from dialPrimitives`);
      ok(same(readBack(marks), want), `dial (${pos}): ${JSON.stringify(s)} is not drawn upright/unmirrored`);
    }
    for (const marcas of ["barras", "libreta"] as const) {
      const c: WatchConfig = { ...base, tapa: { ...base.tapa, signo: s, marcas, linea1: "Juan Pérez", fecha: "2019-10-04" } };
      ok(same(readBack(casebackSignMarks(c)), want), `caseback (${marcas}): ${JSON.stringify(s)} is not drawn upright/unmirrored`);
    }
  }
});

// ---------------------------------------------------------------------------
section("text allow-lists", () => {
  for (const s of ["ELEGGUÁ", "CHANGÓ", "OSHÚN", "ÑAÑO 7", "O'NEIL-3·A", "", "FAMILIA RUIZ"]) ok(isValidDialText(s), `dial text should pass: "${s}"`);
  for (const s of ["oshún", "ELEGGUÁ!", "A".repeat(DIAL_TEXT_MAX + 1), "<B>", "AMOR ❤", "ÇA"]) ok(!isValidDialText(s), `dial text should fail: "${s}"`);
  ok(cleanDialText("oshún") === "OSHÚN", "cleanDialText uppercases");
  ok(cleanDialText("Oshún") === "OSHÚN", "cleanDialText composes NFD accents (macOS keyboards)");
  ok(cleanDialText("abc<>!def ghi jkl mno") === "ABCDEF GHI J", "cleanDialText drops disallowed chars and stops at 12");
  for (const s of ["Juan Pérez", "Ñañá & Tomás", "Itá 4/12/2024", "O'Neil, Miami"]) ok(isValidCasebackLine(s), `caseback line should pass: "${s}"`);
  for (const s of ["<script>", "x".repeat(CASEBACK_MAX + 1), "Juan #1", "ok\n"]) ok(!isValidCasebackLine(s), `caseback line should fail: ${JSON.stringify(s)}`);
  ok(isValidSignName("Otura Ika") && !isValidSignName(" ") && !isValidSignName("x".repeat(25)), "sign name allow-list");
  ok(isValidFecha("2024-02-29") && !isValidFecha("2023-02-29") && !isValidFecha("04/12/2024"), "fecha validation");
  for (const [id, name] of Object.entries(DIAL_NAMES)) ok(isValidDialText(name), `canonical name ${id} passes its own allow-list`);
});

// ---------------------------------------------------------------------------
section("normalize, order lines and price (no product yet)", () => {
  const n = normalizeWithReport({ v: 1, acabado: "oro", correa: "caucho-morado", esfera: { pista: { estilo: "cuentas" }, texto: "oshún!" } });
  ok(n.config.acabado === "acero" && n.config.correa === "caucho-negro", "unknown ids fall back to defaults");
  ok(n.descontinuado.some((d) => d.campo === "correa") && n.descontinuado.some((d) => d.campo === "acabado"), "unknown ids are flagged");
  ok(n.config.esfera.pista.estilo === "rayas" && n.config.esfera.texto === "OSHÚN", "beads without Orisha → rayas; text cleaned");
  ok(same(normalize(null), normalize({})), "normalize tolerates junk");
  const c = SAMPLES.find(([k]) => k === "combinacion")![1];
  const props = lineProperties(c, designCode(c), "https://example.test/diseno?d=x", { politicaAceptada: "2026-11-21" });
  const keys = props.map((p) => p.key);
  ok(keys[0] === "Diseño" && keys[keys.length - 1] === "🔗 Ver e imprimir el diseño", "lineProperties order");
  ok(props.every((p) => p.value.trim() !== ""), "no empty property values");
  ok(props.find((p) => p.key === "Tapa · signo")?.value.includes("derecha Otura · izquierda Ika"), "combination described right-first");
  ok(summary(c).length > 20, "summary");
  ok(variantFor(c, undefined) === null && variantFor(c, []) === null, "variantFor: no product → null");
  ok(priceDelta(c, { correa: "brazalete" }, null) === null, "priceDelta: no product → null");
  const mk = (a: string, s: string, amount: string) => ({
    id: `${a}-${s}`,
    price: { amount, currencyCode: "USD" },
    selectedOptions: [
      { name: "Acabado", value: a },
      { name: "Correa", value: s },
    ],
  });
  const variants = [mk("Acero", "Caucho", "300.00"), mk("Oro rosa", "Piel", "360.00"), mk("Acero", "Brazalete", "340.00")];
  ok(variantFor(c, variants)?.id === "Acero-Caucho", "variantFor matches Acabado × Correa");
  ok(variantFor(withPatch(c, { acabado: "oro-rosa", correa: "piel-rojo" }), variants)?.id === "Oro rosa-Piel", "variantFor: Oro rosa × Piel");
  ok(priceDelta(resolvePreset("cero"), { correa: "brazalete" }, variants) === 40, "priceDelta = alternative − current");
  ok(priceDelta(resolvePreset("cero"), { acabado: "pvd-negro" }, variants) === null, "priceDelta: missing variant → null");
  for (const s of [WATCH_CUSTOM_POLICY, WATCH_RENDER_NOTE, WATCH_ODU_NOTE, WATCH_PROOF_NOTE, WATCH_ORIGIN]) ok(s.length > 20, "copy constant");
});

// ---------------------------------------------------------------------------
/** Minimal XML well-formedness check: balanced tags, quoted unique attributes,
 *  only the 5 XML entities (or numeric ones), no stray '<' or '&'. */
function xmlProblem(xml: string): string | null {
  const stack: string[] = [];
  let i = 0;
  let roots = 0;
  const entity = /^&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/;
  const textOk = (t: string) => {
    for (let k = t.indexOf("&"); k !== -1; k = t.indexOf("&", k + 1)) if (!entity.test(t.slice(k))) return false;
    return true;
  };
  while (i < xml.length) {
    const lt = xml.indexOf("<", i);
    const text = xml.slice(i, lt === -1 ? xml.length : lt);
    if (!textOk(text)) return `bad '&' in text near "${text.slice(0, 40)}"`;
    if (text.trim() && !stack.length) return "text outside the root element";
    if (lt === -1) break;
    const m = /^<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>/.exec(xml.slice(lt));
    if (!m) return `malformed tag near "${xml.slice(lt, lt + 60)}"`;
    const [whole, close, name, attrs, self] = m;
    const names = [...attrs.matchAll(/([\w:.-]+)\s*=/g)].map((a) => a[1]);
    if (new Set(names).size !== names.length) return `duplicate attribute in <${name}>`;
    for (const v of attrs.matchAll(/=\s*(?:"([^"]*)"|'([^']*)')/g)) if (!textOk(v[1] ?? v[2] ?? "")) return `bad '&' in an attribute of <${name}>`;
    if (close) {
      if (stack.pop() !== name) return `</${name}> does not close the open element`;
    } else if (!self) {
      if (!stack.length) roots++;
      stack.push(name);
    } else if (!stack.length) roots++;
    i = lt + whole.length;
  }
  if (stack.length) return `unclosed <${stack[stack.length - 1]}>`;
  if (roots !== 1) return `${roots} root elements`;
  return null;
}

// --- SVG transforms: the current transformation matrix (CTM) of every element.
// A mirror anywhere = an element whose CTM has a negative determinant. A sign
// mark must have NO rotation and no flip at all (rotate(180) keeps the
// determinant positive but turns 12 of the 16 Meyi into another sign).
type Mat = [number, number, number, number, number, number]; // a b c d e f
const ID: Mat = [1, 0, 0, 1, 0, 0];
const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
const det = (m: Mat) => m[0] * m[3] - m[1] * m[2];
/** Translation and a positive uniform scale only: no rotation, no flip. */
const isUpright = (m: Mat) => Math.abs(m[1]) < 1e-9 && Math.abs(m[2]) < 1e-9 && m[0] > 0 && Math.abs(m[0] - m[3]) < 1e-9;
const NAN_MAT: Mat = [NaN, NaN, NaN, NaN, NaN, NaN];

/** SVG transform list → matrix. Anything it cannot parse → NaN (fails every check). */
function parseTransform(s: string | undefined): Mat {
  if (!s) return ID;
  const fn = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)\s*,?/gy;
  let m = ID;
  let at = 0;
  for (let hit = fn.exec(s); hit; hit = fn.exec(s)) {
    at = fn.lastIndex;
    const a = hit[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (a.some((v) => !Number.isFinite(v))) return NAN_MAT;
    const rad = ((a[0] ?? 0) * Math.PI) / 180;
    let t: Mat;
    switch (hit[1]) {
      case "matrix":
        if (a.length !== 6) return NAN_MAT;
        t = a as Mat;
        break;
      case "translate":
        t = [1, 0, 0, 1, a[0], a[1] ?? 0];
        break;
      case "scale":
        t = [a[0], 0, 0, a[1] ?? a[0], 0, 0];
        break;
      case "rotate": {
        const [cx, cy] = [a[1] ?? 0, a[2] ?? 0];
        t = mul(mul([1, 0, 0, 1, cx, cy], [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0]), [1, 0, 0, 1, -cx, -cy]);
        break;
      }
      case "skewX":
        t = [1, 0, Math.tan(rad), 1, 0, 0];
        break;
      default:
        t = [1, Math.tan(rad), 0, 1, 0, 0];
    }
    m = mul(m, t);
  }
  return at === s.length || s.slice(at).trim() === "" ? m : NAN_MAT;
}

interface SvgEl {
  name: string;
  attrs: Record<string, string>;
  ctm: Mat;
}

/** Every element of a (well-formed) SVG with its attributes and CTM. */
function svgElements(xml: string): SvgEl[] {
  const out: SvgEl[] = [];
  const stack: Mat[] = [ID];
  const tag = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  for (const [, close, name, rawAttrs, self] of xml.matchAll(tag)) {
    if (close) {
      stack.pop();
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of rawAttrs.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = a[2] ?? a[3];
    const ctm = mul(stack[stack.length - 1], parseTransform(attrs.transform));
    out.push({ name, attrs, ctm });
    if (!self) stack.push(ctm);
  }
  return out;
}

/** Find each sign mark of `marks` in the SVG text, map it through its CTM, and
 *  read the sign back from what the SVG really draws. */
function signFromSvg(svg: string, marks: readonly Primitive[]): { cols: ReturnType<typeof readBack>; upright: boolean; found: number } {
  const els = svgElements(svg);
  const num = (e: SvgEl, k: string) => Number(e.attrs[k]);
  const near = (a: number, b: number) => Math.abs(a - b) < 0.006; // the poster writes 2 decimals
  const drawn: Primitive[] = [];
  let upright = true;
  for (const m of marks) {
    const el =
      m.kind === "rect"
        ? els.find((e) => e.name === "rect" && near(num(e, "x"), m.x) && near(num(e, "y"), m.y) && near(num(e, "width"), m.w) && near(num(e, "height"), m.h))
        : m.kind === "path"
          ? els.find((e) => e.name === "path" && e.attrs.d === m.d)
          : undefined;
    if (!el) continue;
    const t = el.ctm;
    upright &&= isUpright(t);
    if (m.kind === "rect") {
      drawn.push({ kind: "rect", capa: "guia", x: t[0] * num(el, "x") + t[4], y: t[3] * num(el, "y") + t[5], w: t[0] * num(el, "width"), h: t[3] * num(el, "height") });
    } else {
      const p = /^M(-?[\d.]+) (-?[\d.]+)/.exec(el.attrs.d)!;
      drawn.push({ kind: "path", capa: "guia", d: `M${(t[0] * Number(p[1]) + t[4]).toFixed(4)} ${(t[3] * Number(p[2]) + t[5]).toFixed(4)}` });
    }
  }
  return { cols: readBack(drawn), upright, found: drawn.length };
}

section("SVG builders: well-formed XML, 1:1 sizes, never mirrored", () => {
  ok(xmlProblem("<a><b x='1'/></a>") === null && xmlProblem("<a><b></a>") !== null && xmlProblem("<a>&</a>") !== null, "XML checker self-test");

  // Self-test of the transform guard on a real laser file.
  const [, meyiCfg] = SAMPLES.find(([n]) => n === "meyi-brazalete")!;
  const laser = laserSvg(meyiCfg);
  const laserMarks = casebackSignMarks(meyiCfg, "#000000");
  const wrap = (svg: string, t: string) => svg.replace(/^(<svg[^>]*>)/, `$1<g transform="${t}">`).replace(/<\/svg>$/, "</g></svg>");
  const mirrored = (svg: string) => svgElements(svg).some((e) => !(det(e.ctm) > 0));
  ok(!mirrored(laser) && signFromSvg(laser, laserMarks).upright, "transform self-test: the real laser file passes");
  for (const t of ["scale(-1,1)", "scale(1,-1)", "scale(1 -1)", "matrix(1 0 0 -1 0 0)", "matrix(-1,0,0,1,0,0)", "translate(2 0) scale(1, -1)"]) {
    ok(mirrored(wrap(laser, t)), `transform self-test: ${t} must be caught as a mirror`);
  }
  for (const t of ["rotate(180)", "rotate(180 0 0)", "scale(-1)", "rotate(90)", "skewX(10)", "garbage(1)"]) {
    ok(!signFromSvg(wrap(laser, t), laserMarks).upright, `transform self-test: ${t} around the sign must be caught`);
  }
  ok(signFromSvg(wrap(laser, "translate(1 1) scale(2)"), laserMarks).upright, "transform self-test: translate + positive scale is allowed");

  for (const [name, c] of SAMPLES) {
    const outs: [string, string][] = [
      ["frontSvg", frontSvg(c)],
      ["casebackSvg", casebackSvg(c)],
      ["laserSvg", laserSvg(c)],
      ["dialPrintSvg", dialPrintSvg(c)],
    ];
    for (const [kind, svg] of outs) {
      const bad = xmlProblem(svg);
      ok(!bad, `${name} ${kind}: ${bad}`);
      ok(!mirrored(svg), `${name} ${kind}: an element is mirrored (negative-determinant transform)`);
      // svgDataUrl swaps " for ' — only safe if no attribute already uses '.
      ok(!/="[^"]*'/.test(svg), `${name} ${kind}: an attribute value contains ' (breaks svgDataUrl)`);
    }
    // The sign, read back from what each SVG really draws (through its CTM).
    const checks: [string, string, Primitive[], OduSign | null][] = [
      ["frontSvg", outs[0][1], dialSignMarks(c), c.esfera.signo],
      ["dialPrintSvg", outs[3][1], dialSignMarks(c), c.esfera.signo],
      ["casebackSvg", outs[1][1], casebackSignMarks(c), c.tapa.signo],
      ["laserSvg", outs[2][1], casebackSignMarks(c), c.tapa.signo],
    ];
    for (const [kind, svg, marks, sign] of checks) {
      if (!sign) continue;
      const r = signFromSvg(svg, marks);
      ok(r.found === marks.length, `${name} ${kind}: found ${r.found} of ${marks.length} sign marks in the SVG`);
      ok(r.upright && same(r.cols, expectCols(sign)), `${name} ${kind}: the sign is not drawn upright and unmirrored`);
    }
    const url = frontSvgDataUrl(c);
    const decoded = decodeURIComponent(url.slice(url.indexOf(",") + 1));
    ok(url.startsWith("data:image/svg+xml;charset=utf-8,") && !xmlProblem(decoded), `${name}: thumbnail data URL does not decode to valid SVG`);

    const print = dialPrintSvg(c);
    ok(/^<svg [^>]*width="30\.5mm" height="30\.5mm" viewBox="-15\.25 -15\.25 30\.5 30\.5"/.test(print), `${name}: dial print file is not 30.5 mm 1:1`);
    ok(/<circle id="guia-esfera" cx="0" cy="0" r="15\.25"/.test(print), `${name}: dial print circle is not exactly Ø30.5 mm`);
    ok(!/id="imp-aplique"|lume|#e4eee1/i.test(print.split('<g id="impresion">')[1] ?? ""), `${name}: applied parts leaked into the print layer`);
    const laser = laserSvg(c);
    ok(/^<svg [^>]*width="24mm" height="24mm" viewBox="-12 -12 24 24"/.test(laser), `${name}: laser file is not Ø24 mm 1:1`);
    ok(!laser.includes("#00a0e0"), `${name}: guides leaked into the laser file`);
    ok(casebackPrimitives(c).some((p) => p.capa === "grabado" && p.kind === "arcText"), `${name}: caseback ring text missing`);
  }
  // Renderers escape text even when handed an un-normalized config.
  const raw = SAMPLES[0][1];
  const hostile: WatchConfig = {
    ...raw,
    esfera: { ...raw.esfera, texto: `<B>&"'` },
    tapa: { ...raw.tapa, linea1: `</text><script>`, linea2: `a & b "c"` },
  };
  for (const svg of [frontSvg(hostile), casebackSvg(hostile), laserSvg(hostile), dialPrintSvg(hostile)]) {
    ok(!xmlProblem(svg) && !svg.includes("<script>"), "hostile text is escaped in every SVG");
  }

  // The two PRODUCTION files, for every sign: the laser file in both notations
  // and the dial print file at both positions, read back from the SVG text.
  const base = resolvePreset("eleggua", disp);
  for (const s of ALL_SIGNS) {
    for (const marcas of ["barras", "libreta"] as const) {
      const c: WatchConfig = { ...base, tapa: { ...base.tapa, signo: s, marcas } };
      const svg = laserSvg(c);
      const marks = casebackSignMarks(c, "#000000");
      const r = signFromSvg(svg, marks);
      ok(!mirrored(svg) && r.found === marks.length && r.upright && same(r.cols, expectCols(s)), `laserSvg (${marcas}): ${JSON.stringify(s)} not upright/unmirrored`);
    }
    for (const pos of ["nueve", "seis"] as DialSignPos[]) {
      const c: WatchConfig = { ...base, esfera: { ...base.esfera, signo: s, signoPos: pos } };
      const svg = dialPrintSvg(c);
      const marks = dialSignMarks(c);
      const r = signFromSvg(svg, marks);
      ok(!mirrored(svg) && r.found === marks.length && r.upright && same(r.cols, expectCols(s)), `dialPrintSvg (${pos}): ${JSON.stringify(s)} not upright/unmirrored`);
    }
  }
});

// ---------------------------------------------------------------------------
section("dial layout: seconds hand and Odù sign clear the name, the PY applique and the date", () => {
  type Box = [number, number, number, number]; // x0 y0 x1 y1
  const L = DIAL_LAYOUT;
  const CLEAR = 0.25; // mm of air the seconds hand needs
  const SIGN_AIR = 0.3; // mm of air around the sign
  const EPS = 1e-6; // float noise: 5.75 vs 6.05 must count as 0.30
  const pointGap = (x: number, y: number, b: Box) => Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3]));
  const boxGap = (a: Box, b: Box) => Math.hypot(Math.max(b[0] - a[2], 0, a[0] - b[2]), Math.max(b[1] - a[3], 0, a[1] - b[3]));
  const rectBox = (r: { x: number; y: number; w: number; h: number }, grow = 0): Box => [r.x - grow, r.y - grow, r.x + r.w + grow, r.y + r.h + grow];
  const union = (bs: Box[]): Box => bs.reduce((u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])]);

  // The name at 6 (cap height + accent ≈ 1 em above the baseline): every
  // sample, plus the widest a 12-letter name can get (it is squeezed to maxW).
  const prims = dialPrimitives(SAMPLES[0][1]);
  const named: [string, WatchConfig][] = [
    ...SAMPLES,
    ["12 letras", { ...SAMPLES[0][1], esfera: { ...SAMPLES[0][1].esfera, texto: "WWWWWWWWWWWW" } }],
  ];
  const names: [string, Box][] = [];
  for (const [n, c] of named) {
    const t = dialPrimitives(c).find((p): p is TextRun => p.kind === "text");
    if (!t) continue;
    const half = Math.min(estimateTextWidth(t.text, t.font, t.size, t.letterSpacing), t.maxWidth ?? Infinity) / 2;
    names.push([`nombre «${t.text}» (${n})`, [t.x - half, t.y - t.size, t.x + half, t.y + 0.05 * t.size]]);
  }
  ok(names.some(([n]) => n.includes("12 letras")) && names.find(([n]) => n.includes("12 letras"))![1][2] >= L.name.maxW / 2 - 0.01, "the worst-case name fills maxW");
  const slot = prims.find((p): p is RectPrim => p.kind === "rect" && p.id === "aplique")!;
  const win = prims.find((p): p is RectPrim => p.kind === "rect" && p.id === "ventana-fecha")!;
  const signBox = (pos: DialSignPos): Box => {
    const s = L.sign[pos];
    return union(ALL_SIGNS.flatMap((sg) => signPrimitives(sg, s.cx, s.cy, s.inkH, "#000", "impresion")).map((p) => rectBox(p as RectPrim)));
  };
  const obstacles: [string, Box][] = [
    ...names,
    ["aplique PY", rectBox(slot)],
    ["ventana de fecha", rectBox(win, L.date.rim)],
    ["signo a las 9", signBox("nueve")],
    ["signo a las 6", signBox("seis")],
  ];

  // The seconds hand as drawn (HANDS, the same numbers watch-svg uses):
  // stem, arrow head, lume dot with its ring, counterweight.
  const S = HANDS.seconds;
  const deg = handAngles().seconds;
  for (const [what, b] of obstacles) {
    let gap = Infinity;
    for (let t = -S.tail; t <= S.tip; t += 0.02) {
      const p = polar(t, deg);
      gap = Math.min(gap, pointGap(p.x, p.y, b) - (t > S.tip - S.head.len ? S.head.halfW : S.halfW));
    }
    const lume = polar(S.lume.at, deg);
    gap = Math.min(gap, pointGap(lume.x, lume.y, b) - (S.lume.r + S.lume.ring / 2));
    const cw = polar(-S.counter.at, deg);
    gap = Math.min(gap, pointGap(cw.x, cw.y, b) - S.counter.r);
    ok(gap >= CLEAR - EPS, `seconds hand at ${HANDS.pose.h}:${HANDS.pose.m}:${HANDS.pose.s} comes within ${gap.toFixed(2)} mm of the ${what}`);
  }

  // The sign, at both positions, for all 16 Meyi + a combination.
  const applied: [string, Box][] = [
    ["barra de las 6", [-L.bar.w / 2, L.bar.r - L.bar.len / 2, L.bar.w / 2, L.bar.r + L.bar.len / 2]],
    ["barra de las 9", [-L.bar.r - L.bar.len / 2, -L.bar.w / 2, -L.bar.r + L.bar.len / 2, L.bar.w / 2]],
    ["triángulo de las 12", [-L.triangle.halfW, -L.triangle.outerR, L.triangle.halfW, -L.triangle.tipR]],
  ];
  for (const pos of ["nueve", "seis"] as DialSignPos[]) {
    const sb = signBox(pos);
    for (const [what, b] of [...names, ["aplique PY", rectBox(slot)] as [string, Box], ["ventana de fecha", rectBox(win, L.date.rim)] as [string, Box], ...applied]) {
      ok(boxGap(sb, b) >= SIGN_AIR - EPS, `sign at '${pos}' comes within ${boxGap(sb, b).toFixed(2)} mm of the ${what}`);
    }
    for (const h of [1, 2, 4, 5, 7, 8, 10, 11]) {
      const d = polar(L.dots.r, h * 30);
      ok(pointGap(d.x, d.y, sb) - (L.dots.dotR + L.dots.rimW / 2) >= SIGN_AIR - EPS, `sign at '${pos}' touches the ${h} o'clock dot`);
    }
    // Out from under the hand hub (the minute hand's tail reaches 1.9 mm).
    ok(pointGap(0, 0, sb) >= 1.9 - EPS, `sign at '${pos}' sits under the hand hub`);
    // Printable: a bar narrower than 0.2 mm is below what we ask the workshop to proof.
    const markW = (L.sign[pos].inkH / (ODU_GLYPH.inkBottom - ODU_GLYPH.inkTop)) * ODU_GLYPH.markW;
    ok(markW >= 0.2, `sign at '${pos}': bars ${markW.toFixed(3)} mm wide (< 0.2 mm)`);
  }
});

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`check-watch-data: ${failures} failure(s)`);
  process.exit(1);
}
