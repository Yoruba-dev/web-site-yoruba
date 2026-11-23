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
  DIAL_MODELS,
  DIAL_NAMES,
  DIAL_TEXT_IFA,
  DIAL_TEXT_MAX,
  FLAGS,
  ORISHA_WATCH_PRESETS,
  PRESET_ORDER,
  RULES,
  WATCH_CUSTOM_POLICY,
  WATCH_IFA_NOTE,
  WATCH_MATERIALS,
  WATCH_ODU_NOTE,
  WATCH_SPECS,
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
  withDialModel,
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
  dialHasDate,
  dialPrimitives,
  estimateTextWidth,
  handAngles,
  handPose,
  ifaSignSlots,
  polar,
  signInkSize,
  signPrimitives,
  type IfaSlot,
  type Primitive,
  type RectPrim,
  type TextRun,
} from "../lib/watch-art";
import { casebackSvg, dialPrintSvg, frontSvg, frontSvgDataUrl, laserSvg } from "../lib/watch-svg";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DIAL_GRADIENTS,
  DIAL_GRADIENT_CENTERS,
  DIAL_GRADIENT_DEFAULT,
  DIAL_GRADIENT_STEPS,
  DIAL_GRADIENT_WIDTH,
  DIAL_NAME_SPAN,
  DIAL_SIGN_SPANS,
  SECONDS,
  WATCH_COLORS,
  canonicalJson,
  contrastRatio,
  dialInkOver,
  dialMinContrast,
  dialColorAt,
  dialInkAt,
  gradientMix,
  withGradientStep,
  type DialBaseId,
} from "../lib/watch";
import { capaUrl, nombresCapas } from "../lib/watch-capas";
import { dialPrintSvgCurvas, laserSvgCurvas, missingGlyphs, pathBounds, pathReach, textRunToPath, textWidthMm } from "../lib/watch-curvas";
import { CASEBACK_LAYOUT } from "../lib/watch-art";
import { decodeDesign, encodeDesign, encodeWatchDesign, isWatchPayload } from "../lib/design-code";
import { createHash } from "node:crypto";
import {
  BUILD_STEPS,
  PART_STEP,
  STEPS,
  STEP_VIEW,
  SUBS,
  confirmedMask,
  creatorReducer,
  fixSub,
  isStepId,
  parseDraft,
  stepOfField,
} from "../components/watch/creator-state";
import { ALL_GHOST, ALL_SOLID, WATCH_PARTS, maskKey } from "../components/watch/stage3d-contract";
import { buildOrderInfo, isLocalOrigin } from "../components/watch/order";
import { isFocusRoute } from "../lib/focus-routes";
import { SITE_URL } from "../lib/site";
import { GLYPH_FONTS, type GlyphFont } from "../lib/watch-glyphs";
import { CLASICA_ADV, CLASICA_KERN_POS, FINA_ADV, FINA_KERN_POS } from "../lib/watch-glyph-metrics";
import { FONT_STYLES } from "../lib/watch-art";
import { getStrap, withStrapType, type WatchField } from "../lib/watch";

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
  [
    // The star piece as ordered: the customer's personal sign on the caseback.
    "ifa-tapa",
    (() => {
      const c = resolvePreset("ifa", disp);
      return { ...c, tapa: { ...c.tapa, signo: COMBO, linea1: "Juan Pérez", fecha: "2019-10-04" } } satisfies WatchConfig;
    })(),
  ],
];
const byName = (n: string): WatchConfig => SAMPLES.find(([k]) => k === n)![1];
const withText = (c: WatchConfig, texto: string): WatchConfig => ({ ...c, esfera: { ...c.esfera, texto } });

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
    if (id === "cero" || id === "ifa") continue;
    ok(c.aplique === "oro" && c.esfera.pista.estilo === "cuentas" && c.esfera.texto === DIAL_NAMES[id], `preset ${id}: gold, beads, canonical name`);
    ok(c.esfera.modelo === "clasica", `preset ${id}: classic dial`);
  }
  // The star piece (owner §12): Ifá first, green sunray, Orula's green/yellow
  // beads, gold applique, yellow seconds, green rubber, steel, "IFÁ" at 6, the
  // 16 Meyis on the dial and the personal sign left for the caseback.
  ok(PRESET_ORDER[0] === "ifa" && new Set(PRESET_ORDER).size === PRESET_ORDER.length, "Ifá is the first preset (and no preset repeats)");
  const ifa = p.ifa;
  ok(
    ifa.esfera.modelo === "ifa" &&
      ifa.esfera.base === "verde" &&
      ifa.esfera.pista.estilo === "cuentas" &&
      ifa.esfera.pista.orisha === "orula" &&
      ifa.esfera.texto === DIAL_TEXT_IFA &&
      ifa.esfera.signo === null &&
      ifa.aplique === "oro" &&
      ifa.segundero === "amarillo" &&
      ifa.correa === "caucho-verde" &&
      ifa.acabado === "acero" &&
      ifa.tapa.signo === null &&
      ifa.preset === "ifa",
    `Ifá preset: ${JSON.stringify(ifa)}`,
  );
  ok(DIAL_TEXT_IFA === "IFÁ" && isValidDialText(DIAL_TEXT_IFA), "the Ifá dial text is IFÁ (with its accent) and passes the allow-list");
  ok(ORISHA_WATCH_PRESETS.ifa.label === "Ifá" && WATCH_IFA_NOTE.includes("16 Meyis"), "Ifá label and card copy");
  ok(DIAL_MODELS.clasica.ventanaFecha, "the classic dial keeps the 3 o'clock date window");
  // Pending owner question, shipped as the reviewer's default: the Ifá dial has
  // NO date window, so the 16 Meyis form a perfect ring (flip to true to bring
  // the window back; the ring checks below cover both).
  ok(DIAL_MODELS.ifa.ventanaFecha === false, "the Esfera Ifá ships without the date window (perfect ring)");
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
    "signo-esfera-ifa": { c: esf({ modelo: "ifa", signo: { tipo: "meyi", oduId: "ofun-meji" } }) },
    "signo-esfera-apagado": { c: esf({ signo: { tipo: "meyi", oduId: "ofun-meji" } }), flags: off },
    "signo-desconocido": { c: tapa({ signo: { tipo: "meyi", oduId: "no-existe" } }) },
    "combinacion-sin-nombre": { c: tapa({ signo: { ...COMBO, nombre: "  " } }) },
    "nombre-combinacion": { c: tapa({ signo: { ...COMBO, nombre: "x".repeat(25) } }) },
    "texto-tapa": { c: tapa({ linea1: "<script>" }) },
    "fecha-tapa": { c: tapa({ fecha: "2025-02-30" }) },
    "contraste-segundero": { c: withPatch(esf({ base: "blanco" }), { segundero: "blanco" }) },
    "contraste-signo": { c: esf({ base: "degradado-yemaya", degradado: 3, signo: COMBO, signoPos: "seis" }) },
    "ifa-sin-signo": { c: esf({ modelo: "ifa", texto: DIAL_TEXT_IFA, signo: null }) },
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
  // With free text off, the Ifá dial may still carry its own canonical "IFÁ".
  const ifaFixed = withPatch(base, { esfera: { ...base.esfera, modelo: "ifa", texto: DIAL_TEXT_IFA } });
  ok(validate(ifaFixed, disp, off).ok, "DIAL_FREE_TEXT off: the Ifá dial keeps IFÁ");
  ok(!validate(withPatch(ifaFixed, { esfera: { ...ifaFixed.esfera, texto: "ELEGGUÁ" } }), disp, off).ok, "DIAL_FREE_TEXT off: an Ifá dial with another name is blocked");
  ok(validate({ ...base, esfera: { ...base.esfera, modelo: "nada" as "ifa" } }).issues.some((i) => i.campo === "esfera.modelo"), "an unknown dial model is blocked");
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
  // Links made before the Ifá dial carry no `modelo`: they stay classic, silently.
  const eleggua = resolvePreset("eleggua", disp);
  const { modelo: _m, ...oldEsfera } = eleggua.esfera;
  const oldLink = encodeDesign({ design: {}, piece: "reloj", watch: { ...eleggua, esfera: oldEsfera } });
  const old = decodeWatchDesign(oldLink);
  ok(old && same(old.config, eleggua) && old.descontinuado.length === 0, "a pre-Ifá link (no esfera.modelo) decodes to the same classic watch, unflagged");
  const junkModel = normalizeWithReport({ ...eleggua, esfera: { ...eleggua.esfera, modelo: "dorada" } });
  ok(junkModel.config.esfera.modelo === "clasica" && junkModel.descontinuado.some((d) => d.campo === "esfera.modelo"), "an unknown dial model falls back to clasica and is flagged");
  ok(normalize({ ...eleggua, preset: "ifa" }).preset === "ifa" && normalize({ ...eleggua, preset: "obatala" }).preset === undefined, "normalize keeps the ifa preset tag, drops unknown ones");
  // withDialModel: canonical text follows the model, a customer's own text stays,
  // and the Ifá dial drops a dial sign (the personal sign goes on the caseback).
  const orula = resolvePreset("orula", disp);
  const toIfa = withDialModel({ ...orula, esfera: { ...orula.esfera, signo: { tipo: "meyi", oduId: "ofun-meji" } } }, "ifa");
  ok(toIfa.esfera.modelo === "ifa" && toIfa.esfera.texto === DIAL_TEXT_IFA && toIfa.esfera.signo === null && validate(toIfa).ok, "withDialModel → ifa: ORULA → IFÁ, dial sign cleared");
  ok(withDialModel(toIfa, "clasica").esfera.texto === "ORULA", "withDialModel → clasica: IFÁ → ORULA");
  const own = { ...orula, esfera: { ...orula.esfera, texto: "MI CAMINO" } };
  ok(withDialModel(own, "ifa").esfera.texto === "MI CAMINO", "withDialModel keeps a customer's own text");
  ok(withDialModel(orula, "clasica") === orula && withDialModel(orula, "x" as "ifa") === orula, "withDialModel: same or unknown model is a no-op");
  const ifaProps = lineProperties(presets[0][1], designCode(presets[0][1]), "u");
  const prop = (k: string) => ifaProps.find((x) => x.key === k)?.value ?? "";
  ok(prop("Orisha") === "Orula" && prop("Esfera").includes("Esfera Ifá (los 16 Meyis)") && prop("Esfera · texto") === "«IFÁ»", `Ifá order lines: ${JSON.stringify(ifaProps.slice(0, 6))}`);
  ok(summary(presets[0][1]).includes("Ifá con los 16 Meyis"), "Ifá summary names the 16 Meyis");
  const c = SAMPLES.find(([k]) => k === "combinacion")![1];
  const props = lineProperties(c, designCode(c), "https://example.test/diseno?d=x", { politicaAceptada: "2026-11-21" });
  const keys = props.map((p) => p.key);
  ok(keys[0] === "Diseño" && keys[keys.length - 1] === "🔗 Ver e imprimir el diseño", "lineProperties order");
  ok(props.every((p) => p.value.trim() !== ""), "no empty property values");
  ok(props.find((p) => p.key === "Tapa · signo")?.value.includes("derecha Otura · izquierda Ika"), "combination described right-first");
  ok(summary(c).length > 20, "summary");
  // The caseback date reads as engraved (DD · MM · AAAA) everywhere a person
  // reads it; the ISO value only travels inside ?d=.
  const dated = withPatch(c, { tapa: { ...c.tapa, fecha: "2019-10-04" } });
  ok(
    lineProperties(dated, designCode(dated), "u").find((p) => p.key === "Tapa · fecha")?.value === "04 · 10 · 2019",
    "lineProperties: caseback date as engraved",
  );
  ok(summary(dated).includes("04 · 10 · 2019") && !summary(dated).includes("2019-10-04"), "summary: caseback date as engraved, never ISO");
  ok(decodeWatchDesign(encodeWatchDesign(dated))?.config.tapa.fecha === "2019-10-04", "?d= keeps the ISO date");
  // The Ifá preset starts with a blank caseback: it can be ordered, with an aviso
  // pointing to Tu tapa (owner §12: the personal sign goes on the caseback).
  const ifaPreset = presets.find(([id]) => id === "ifa")![1];
  const ifaV = validate(ifaPreset);
  ok(!ifaPreset.tapa.signo && ifaV.ok && ifaV.issues.some((i) => i.regla === "ifa-sin-signo" && i.nivel === "aviso" && i.campo === "tapa.signo"), "Ifá preset: orderable, with the ifa-sin-signo aviso on tapa.signo");
  ok(!validate(withPatch(ifaPreset, { tapa: { ...ifaPreset.tapa, signo: { tipo: "meyi", oduId: "ofun-meji" } } })).issues.some((i) => i.regla === "ifa-sin-signo"), "Ifá with a caseback sign: no aviso");
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

// --- Geometry helpers for the layout sections -------------------------------
type Box = [number, number, number, number]; // x0 y0 x1 y1
const EPS = 1e-6; // float noise: 5.75 vs 6.05 must count as 0.30
const pointGap = (x: number, y: number, b: Box) => Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3]));
const boxGap = (a: Box, b: Box) => Math.hypot(Math.max(b[0] - a[2], 0, a[0] - b[2]), Math.max(b[1] - a[3], 0, a[1] - b[3]));
const rectBox = (r: { x: number; y: number; w: number; h: number }, grow = 0): Box => [r.x - grow, r.y - grow, r.x + r.w + grow, r.y + r.h + grow];
const union = (bs: Box[]): Box => bs.reduce((u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])]);
/** Farthest point of a box from the dial centre. */
const boxR = (b: Box) => Math.hypot(Math.max(Math.abs(b[0]), Math.abs(b[2])), Math.max(Math.abs(b[1]), Math.abs(b[3])));

/** The text at 6 as a box (cap height + accent ≈ 1 em above the baseline). */
function textBox(t: TextRun): Box {
  const half = Math.min(estimateTextWidth(t.text, t.font, t.size, t.letterSpacing), t.maxWidth ?? Infinity) / 2;
  return [t.x - half, t.y - t.size, t.x + half, t.y + 0.05 * t.size];
}

/** Closest approach (mm, edge to edge) of a hand at `deg` to box `b`. The blade
 *  runs from -tail to tip; `half(t)` is its half-width at distance t. */
function handGap(deg: number, tail: number, tip: number, half: (t: number) => number, b: Box): number {
  let gap = Infinity;
  for (let t = -tail; t <= tip + 1e-9; t += 0.02) {
    const p = polar(t, deg);
    gap = Math.min(gap, pointGap(p.x, p.y, b) - half(t));
  }
  return gap;
}
const S = HANDS.seconds;
const secondsHalf = (t: number) => (t > S.tip - S.head.len ? S.head.halfW : S.halfW);
/** Seconds hand incl. its lume dot (with ring) and counterweight. */
function secondsGap(deg: number, b: Box): number {
  const lume = polar(S.lume.at, deg);
  const cw = polar(-S.counter.at, deg);
  return Math.min(
    handGap(deg, S.tail, S.tip, secondsHalf, b),
    pointGap(lume.x, lume.y, b) - (S.lume.r + S.lume.ring / 2),
    pointGap(cw.x, cw.y, b) - S.counter.r,
  );
}
/** Hour / minute blade: full width up to the shoulder, then to a point. */
const bladeHalf = (h: { shoulder: number; tip: number; halfW: number }) => (t: number) =>
  t <= h.shoulder ? h.halfW : (h.halfW * (h.tip - t)) / (h.tip - h.shoulder);

/** The 16 ring signs of an Ifá dial as dialPrimitives() must draw them. */
function ifaRing(c: WatchConfig, slots: IfaSlot[] = ifaSignSlots()): { slot: IfaSlot; sign: OduSign; marks: Primitive[]; box: Box }[] {
  const I = DIAL_LAYOUT.ifa;
  const ink = dialInk(c.esfera.base).hex;
  return slots.map((slot) => {
    const sign: OduSign = { tipo: "meyi", oduId: slot.oduId };
    const marks = signPrimitives(sign, slot.cx, slot.cy, I.inkH, ink, "impresion", "barras", { barScale: I.barScale });
    return { slot, sign, marks, box: union(marks.map((m) => rectBox(m as RectPrim))) };
  });
}

/** Farthest reach of one primitive from the dial centre (mm), strokes included. */
function primReach(p: Primitive): number {
  const sw = p.stroke ? (p.strokeWidth ?? 0.1) / 2 : 0;
  switch (p.kind) {
    case "circle":
      return Math.hypot(p.cx, p.cy) + p.r + sw;
    case "rect": {
      const c = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
      const a = ((p.rotate ?? 0) * Math.PI) / 180;
      let r = 0;
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const [x, y] = [(dx * p.w) / 2, (dy * p.h) / 2];
        r = Math.max(r, Math.hypot(c.x + x * Math.cos(a) - y * Math.sin(a), c.y + x * Math.sin(a) + y * Math.cos(a)));
      }
      return r + sw;
    }
    case "path": {
      // Dial paths are absolute M/L polygons (the 12 o'clock triangle).
      if (/[^MLZ\d\s.,-]/.test(p.d)) return Infinity;
      const n = p.d.match(/-?\d*\.?\d+/g)!.map(Number);
      let r = 0;
      for (let i = 0; i + 1 < n.length; i += 2) r = Math.max(r, Math.hypot(n[i], n[i + 1]));
      return r + sw;
    }
    case "text":
      return boxR(textBox(p));
    case "arcText":
      return Infinity; // never on a dial
  }
}

// ---------------------------------------------------------------------------
section("print area: everything printed or applied sits inside the case opening", () => {
  const L = DIAL_LAYOUT;
  ok(WATCH_SPECS.aberturaVisibleMm === 28.8 && WATCH_SPECS.measured === false, "aberturaVisibleMm is the 28.8 mm placeholder (measured:false)");
  // The photo template: R_ABERTURA 236 px at 16.3934 px/mm.
  ok(Math.abs(236 / 16.3934 - WATCH_SPECS.aberturaVisibleMm / 2) < 0.01, "aberturaVisibleMm matches the photo layers' R_ABERTURA (236 px / 16.39 px/mm)");
  ok(L.visibleR === WATCH_SPECS.aberturaVisibleMm / 2 && Math.abs(L.printR - (L.visibleR - 0.25)) < EPS, `printR = visibleR − 0.25 (${L.printR})`);
  ok(frontSvg(SAMPLES[0][1]).includes(`<clipPath id="pywdial"><circle cx="0" cy="0" r="${L.visibleR}"/>`), "the poster shows the dial through exactly the case opening");
  const all: [string, WatchConfig][] = [
    ...SAMPLES,
    ...(["rayas", "cuentas"] as const).flatMap((estilo): [string, WatchConfig][] =>
      PRESET_ORDER.filter((id) => id !== "cero").map((id) => {
        const c = resolvePreset(id, disp);
        return [`${id} (${estilo})`, { ...c, esfera: { ...c.esfera, pista: { ...c.esfera.pista, estilo } } }];
      }),
    ),
    ["12 letras", withText(byName("eleggua"), "WWWWWWWWWWWW")],
    ["Ifá, 12 letras", withText(byName("ifa"), "WWWWWWWWWWWW")],
  ];
  for (const [name, c] of all) {
    let worst = 0;
    let what = "";
    for (const p of dialPrimitives(c)) {
      if (p.capa === "base" || p.capa === "guia") continue;
      const r = primReach(p);
      if (r > worst) [worst, what] = [r, `${p.capa} ${p.kind}${p.id ? ` #${p.id}` : ""}`];
    }
    ok(worst <= L.printR + EPS, `${name}: ${what} reaches ${worst.toFixed(3)} mm (limit ${L.printR} = opening ${L.visibleR} − 0.25)`);
  }
  // The classic applied indices stay clear of the minute track (both styles).
  const T = L.track;
  const ticksIn = T.outerR - T.major.len;
  const beadsIn = T.r - T.beadR * T.accentScale;
  const TRACK_AIR = 0.15;
  ok(ticksIn - (L.triangle.outerR + L.triangle.rimW / 2) >= TRACK_AIR - EPS, "the 12 o'clock triangle clears the 12 o'clock tick");
  ok(beadsIn - (L.triangle.outerR + L.triangle.rimW / 2) >= TRACK_AIR - EPS, "the 12 o'clock triangle clears the 12 o'clock bead");
  ok(ticksIn - (L.dots.r + L.dots.dotR + L.dots.rimW / 2) >= TRACK_AIR - EPS, "the hour dots clear the hour ticks");
  ok(ticksIn - (L.bar.r + L.bar.len / 2 + L.bar.rimW / 2) >= TRACK_AIR - EPS, "the 6 and 9 bars clear the ticks");
  ok(L.triangle.tipR + (L.applique.cy - L.applique.h / 2) >= 0.8 - EPS, "the triangle tip stays ≥ 0.8 mm above the PY applique");
});

// ---------------------------------------------------------------------------
section("classic dial layout: seconds hand and Odù sign clear the name, the PY applique and the date", () => {
  const L = DIAL_LAYOUT;
  const CLEAR = 0.25; // mm of air the seconds hand needs
  const SIGN_AIR = 0.3; // mm of air around the sign
  const classic = SAMPLES.filter(([, c]) => c.esfera.modelo === "clasica");
  const ref = classic.find(([n]) => n === "eleggua")![1];

  // The name at 6: every classic sample, plus the widest a 12-letter name can
  // get (it is squeezed to maxW).
  const prims = dialPrimitives(ref);
  const named: [string, WatchConfig][] = [...classic, ["12 letras", { ...ref, esfera: { ...ref.esfera, texto: "WWWWWWWWWWWW" } }]];
  const names: [string, Box][] = [];
  for (const [n, c] of named) {
    const t = dialPrimitives(c).find((p): p is TextRun => p.kind === "text");
    if (t) names.push([`nombre «${t.text}» (${n})`, textBox(t)]);
  }
  ok(names.find(([n]) => n.includes("12 letras"))![1][2] >= L.name.maxW / 2 - 0.01, "the worst-case name fills maxW");
  const slot = prims.find((p): p is RectPrim => p.kind === "rect" && p.id === "aplique")!;
  const win = prims.find((p): p is RectPrim => p.kind === "rect" && p.id === "ventana-fecha")!;
  ok(slot && win && dialHasDate(ref), "the classic dial has the applique slot and the date window");
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

  // The seconds hand as drawn (HANDS, the same numbers watch-svg uses).
  const deg = handAngles(handPose(ref)).seconds;
  ok(same(handPose(ref), HANDS.pose), "the classic poster keeps 10:10:40");
  for (const [what, b] of obstacles) {
    const gap = secondsGap(deg, b);
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
    ok(pointGap(0, 0, sb) >= HANDS.minute.tail - EPS, `sign at '${pos}' sits under the hand hub`);
    // Printable: a bar narrower than 0.2 mm is below what we ask the workshop to proof.
    const markW = (L.sign[pos].inkH / (ODU_GLYPH.inkBottom - ODU_GLYPH.inkTop)) * ODU_GLYPH.markW;
    ok(markW >= 0.2, `sign at '${pos}': bars ${markW.toFixed(3)} mm wide (< 0.2 mm)`);
  }
});

// ---------------------------------------------------------------------------
section("Esfera Ifá: the 16 Meyis in order, upright, unmirrored and clear of everything", () => {
  const L = DIAL_LAYOUT;
  const I = L.ifa;
  const SIGN_AIR = 0.3;
  const CLEAR = 0.25;
  const ifa = SAMPLES.find(([n]) => n === "ifa")![1];
  const prims = dialPrimitives(ifa);

  // Order and placement: Baba Ejiogbe at 12, then clockwise every 22.5°.
  for (const fecha of [true, false]) {
    const slots = ifaSignSlots(fecha);
    ok(slots.length === 16 && slots.every((s, k) => s.oduId === ODU_MEJI[k].id && Math.abs(s.deg - k * 22.5) < EPS), `ring (fecha ${fecha}): the 16 Meyi in ODU_MEJI order, one every 22.5°`);
    ok(slots[0].oduId === "eji-ogbe" && ODU_LUCUMI[slots[0].oduId] === "Baba Ejiogbe" && Math.abs(slots[0].cx) < EPS && slots[0].cy < 0, "Baba Ejiogbe sits at 12");
    for (const s of slots) {
      // On its own radius: the angle of its centre is its slot angle.
      const ang = ((Math.atan2(s.cx, -s.cy) * 180) / Math.PI + 360) % 360;
      ok(Math.abs(ang - s.deg) < 1e-6 || Math.abs(Math.hypot(s.cx, s.cy)) < EPS, `${s.oduId}: centre is not on its ${s.deg}° radius`);
    }
    const moved = slots.filter((s) => Math.abs(Math.hypot(s.cx, s.cy) - I.ringR) > 1e-6).map((s) => s.oduId);
    ok(same(moved, fecha ? ["irosun-meji"] : []), `ring (fecha ${fecha}): only the sign over the date window leaves the ring, got ${moved.join(", ") || "none"}`);
  }
  ok(DIAL_MODELS.ifa.ventanaFecha === dialHasDate(ifa) && same(ifaSignSlots(), ifaSignSlots(DIAL_MODELS.ifa.ventanaFecha)), "the dial follows DIAL_MODELS.ifa.ventanaFecha");

  // Every ring sign is in dialPrimitives, and reads back as itself: upright,
  // unmirrored, never rotated with the ring.
  const ring = ifaRing(ifa);
  for (const { sign, marks } of ring) {
    ok(marks.every((m) => prims.some((p) => same(p, m))), `${JSON.stringify(sign)}: ring marks missing from dialPrimitives`);
    ok(same(readBack(marks), expectCols(sign)), `ring: ${JSON.stringify(sign)} is not drawn upright/unmirrored`);
  }
  const ringMarks = ring.flatMap((r) => r.marks);
  ok(prims.filter((p) => p.capa === "impresion" && p.kind === "rect").length === ringMarks.length, "the Ifá dial prints exactly the 16 ring signs (no extra dial sign)");
  // …and through the SVG text of the poster and of the print file (CTM read-back).
  for (const [kind, svg] of [["frontSvg", frontSvg(ifa)], ["dialPrintSvg", dialPrintSvg(ifa)]] as const) {
    for (const { sign, marks } of ring) {
      const r = signFromSvg(svg, marks);
      ok(r.found === marks.length && r.upright && same(r.cols, expectCols(sign)), `${kind}: ring sign ${sign.tipo === "meyi" ? sign.oduId : ""} not upright/unmirrored (found ${r.found}/${marks.length})`);
    }
  }
  // The ring replaces the lume indices; the classic dial has no ring.
  const lume = (c: WatchConfig) => dialPrimitives(c).filter((p) => p.fill === WATCH_MATERIALS.lume).length;
  ok(lume(ifa) === 0 && lume(SAMPLES.find(([n]) => n === "eleggua")![1]) === 11, "Ifá: no lume dots/triangle/bars (the Meyis are the indices); classic: 8 dots + triangle + 2 bars");
  ok(!dialPrimitives(resolvePreset("orula", disp)).some((p) => ringMarks.some((m) => same(p, m))), "a classic dial never prints the ring");
  ok(validate(ifa).ok && !validate({ ...ifa, esfera: { ...ifa.esfera, signo: { tipo: "meyi", oduId: "ofun-meji" } } }).ok, "an Ifá dial blocks a second (personal) sign on the dial");

  // Collisions, for the layout in use AND the no-date alternative.
  const slot = prims.find((p): p is RectPrim => p.kind === "rect" && p.id === "aplique")!;
  const dateBox: Box = (() => {
    const D = L.date;
    return [D.cx - D.w / 2 - D.rim, -D.h / 2 - D.rim, D.cx + D.w / 2 + D.rim, D.h / 2 + D.rim];
  })();
  const nameBoxes: [string, Box][] = ["IFÁ", "WWWWWWWWWWWW", "MI CAMINO"].map((texto) => {
    const t = dialPrimitives({ ...ifa, esfera: { ...ifa.esfera, texto } }).find((p): p is TextRun => p.kind === "text")!;
    return [`texto «${texto}»`, textBox(t)];
  });
  const T = L.track;
  const trackIn = Math.min(T.outerR - T.major.len, T.r - T.beadR * T.accentScale);
  for (const fecha of [true, false]) {
    const tag = fecha ? "con fecha" : "sin fecha";
    const signs = ifaRing(ifa, ifaSignSlots(fecha));
    const obstacles: [string, Box][] = [["aplique PY", rectBox(slot)], ...nameBoxes, ...(fecha ? [["ventana de fecha", dateBox] as [string, Box]] : [])];
    for (const { slot: s, box } of signs) {
      for (const [what, b] of obstacles) ok(boxGap(box, b) >= SIGN_AIR - EPS, `${tag}: ${s.oduId} comes within ${boxGap(box, b).toFixed(2)} mm of the ${what}`);
      ok(pointGap(0, 0, box) >= HANDS.minute.tail + SIGN_AIR - EPS, `${tag}: ${s.oduId} sits under the hand pinion`);
      ok(trackIn - boxR(box) >= SIGN_AIR - EPS, `${tag}: ${s.oduId} comes within ${(trackIn - boxR(box)).toFixed(2)} mm of the minute track`);
    }
    for (let i = 0; i < signs.length; i++) {
      for (let j = i + 1; j < signs.length; j++) {
        const g = boxGap(signs[i].box, signs[j].box);
        ok(g >= SIGN_AIR - EPS, `${tag}: ${signs[i].slot.oduId} and ${signs[j].slot.oduId} are ${g.toFixed(2)} mm apart`);
      }
    }
  }
  // The triangle is left off on purpose: at 12 it would sit on Baba Ejiogbe.
  const triangle: Box = [-L.triangle.halfW, -L.triangle.outerR, L.triangle.halfW, -L.triangle.tipR];
  ok(boxGap(triangle, ring[0].box) < SIGN_AIR, "the classic triangle would collide with Baba Ejiogbe (that is why Ejiogbe is the 12 marker)");

  // The poster hands at the Ifá pose: no hand covers a Meyi, the text, the
  // applique or the date (the hour hand never reaches the ring).
  const pose = handPose(ifa);
  ok(same(pose, HANDS.poseIfa), "the Ifá poster uses its own pose");
  const ang = handAngles(pose);
  const handObstacles: [string, Box][] = [...ring.map((r): [string, Box] => [r.slot.oduId, r.box]), ["aplique PY", rectBox(slot)], nameBoxes[0], ["ventana de fecha", dateBox]];
  for (const [what, b] of handObstacles) {
    const sg = secondsGap(ang.seconds, b);
    ok(sg >= CLEAR - EPS, `Ifá pose: the seconds hand comes within ${sg.toFixed(2)} mm of ${what}`);
    if (what === "aplique PY" || what.startsWith("texto")) continue; // the hands sit above the applique and the print
    // The wide hands only need to stay off the ink (they pass over every
    // sign in use); the thin seconds hand keeps the poster's 0.25 mm of air.
    const mg = handGap(ang.minute, HANDS.minute.tail, HANDS.minute.tip, bladeHalf(HANDS.minute), b);
    ok(mg >= 0, `Ifá pose: the minute hand covers ${what} (${mg.toFixed(2)} mm)`);
    const hg = handGap(ang.hour, HANDS.hour.tail, HANDS.hour.tip, bladeHalf(HANDS.hour), b);
    ok(hg >= 0, `Ifá pose: the hour hand covers ${what} (${hg.toFixed(2)} mm)`);
  }

  // Printable at this size: ≥ 0.2 mm bars, a visible gap inside a double mark
  // and between rows (what we ask the workshop to proof).
  const u = I.inkH / (ODU_GLYPH.inkBottom - ODU_GLYPH.inkTop);
  const barW = ODU_GLYPH.markW * I.barScale * u;
  const doubleGap = (2 * ODU_GLYPH.doubleHalf - ODU_GLYPH.markW * I.barScale) * u;
  const rowGap = (ODU_GLYPH.rowY[1] - ODU_GLYPH.rowY[0] - ODU_GLYPH.markH) * u;
  ok(I.inkH >= 1.9 && I.inkH <= 2.3, `ring signs ${I.inkH} mm tall (1.9–2.3)`);
  ok(barW >= 0.2 - EPS, `ring bars ${barW.toFixed(3)} mm wide (< 0.2 mm)`);
  ok(doubleGap >= 0.15 - EPS, `gap inside a double mark ${doubleGap.toFixed(3)} mm (< 0.15 mm)`);
  ok(rowGap >= 0.2 - EPS, `gap between rows ${rowGap.toFixed(3)} mm (< 0.2 mm)`);
  ok(Math.abs(signInkSize(I.inkH, I.barScale).w - (ring.find((r) => r.slot.oduId === "oyeku-meji")!.box[2] - ring.find((r) => r.slot.oduId === "oyeku-meji")!.box[0])) < 1e-9, "signInkSize is the real worst-case width (Oyeku, all doubles)");
});

section("production files: text in curves (no <text>), every glyph present, inside its field", () => {
  // Every character the allow-lists accept (dial ⊂ caseback ⊂ sign names) and
  // the fixed ring text has an outline in BOTH fonts: nothing ever falls back.
  const allowed = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÉÍÓÚÜÑáéíóúüñ .,'·&/-"];
  ok(allowed.every((ch) => isValidCasebackLine(ch)), "the glyph alphabet is exactly what CASEBACK_ALLOW accepts");
  for (const font of ["py-dial", "py-dial-fina"] as const) {
    const miss = missingGlyphs(allowed.join(""), font);
    ok(miss.length === 0, `${font}: no outline for ${JSON.stringify(miss.join(""))}`);
  }
  ok(textWidthMm("MM", "py-dial", 1.55) > textWidthMm("II", "py-dial", 1.55), "textWidthMm measures real advances");

  const L = DIAL_LAYOUT;
  const R = CASEBACK_LAYOUT.fieldR;
  const long: [string, WatchConfig][] = [
    ...SAMPLES,
    [
      "texto largo + tapa llena (clásica)",
      withPatch(resolvePreset("chango", disp), {
        esfera: { ...resolvePreset("chango", disp).esfera, texto: "MMMMMMMMMMMM" },
        tapa: { signo: COMBO, marcas: "barras", linea1: "MMMMMMMMMMMMMMMMMMMM", linea2: "WWWWWWWWWWWWWWWWWWWW", fecha: "2024-12-04", fuente: "clasica" },
      }),
    ],
    [
      "tapa llena (fina) sin signo",
      withPatch(resolvePreset("oshun", disp), {
        tapa: { signo: null, marcas: "barras", linea1: "Ñañá & Tomás O'Neil", linea2: "MMMMMMMMMMMMMMMMMMMM", fecha: "1984-03-15", fuente: "fina" },
      }),
    ],
  ];
  for (const [name, c] of long) {
    const laser = laserSvgCurvas(c);
    const dial = dialPrintSvgCurvas(c);
    ok(!/<text[\s>]/.test(laser) && !/<text[\s>]/.test(dial), `${name}: a production file still has <text>`);
    ok(!/font-family/.test(laser) && !/font-family/.test(dial), `${name}: a production file still names a font`);
    ok(xmlProblem(laser) === null, `${name}: laser (curvas) XML: ${xmlProblem(laser)}`);
    ok(xmlProblem(dial) === null, `${name}: dial print (curvas) XML: ${xmlProblem(dial)}`);
    ok(/width="30\.5mm" height="30\.5mm"/.test(dial), `${name}: dial print (curvas) is not 30.5 mm`);
    ok(new RegExp(`width="${2 * R}mm" height="${2 * R}mm"`).test(laser), `${name}: laser (curvas) is not ${2 * R} mm`);
    // Every outlined letter stays inside its field: the caseback text inside
    // the engraving field, the dial text inside the printable radius.
    const pathsOf = (svg: string) => [...svg.matchAll(/<path[^>]* d="([^"]+)"/g)].map((m) => m[1]);
    for (const d of pathsOf(laser)) {
      const reach = pathReach(d);
      if (reach === null) continue;
      ok(reach <= R + EPS, `${name}: an engraved outline reaches ${reach.toFixed(2)} mm (field ${R})`);
    }
    const printed = dial.slice(dial.indexOf('<g id="impresion">'));
    for (const d of pathsOf(printed)) {
      const reach = pathReach(d);
      if (reach === null) continue;
      ok(reach <= L.printR + EPS, `${name}: a printed outline reaches ${reach.toFixed(2)} mm (print radius ${L.printR})`);
    }
    // The dial name never overflows its line (curves are compressed to maxW).
    const name6 = dialPrimitives(c).find((p): p is TextRun => p.kind === "text");
    if (name6?.maxWidth) {
      const b = pathBounds(textRunToPath(name6).d);
      ok(b && b[2] - b[0] <= name6.maxWidth + 0.05, `${name}: the dial name is ${(b ? b[2] - b[0] : NaN).toFixed(2)} mm wide (max ${name6.maxWidth})`);
    }
  }
});

section("gradient dials: same colours as the layers, every step legible, the step survives links", () => {
  // 1 · The data and the layer generator agree (colours, positions, width).
  //     design-assets/ is not in git (Netlify builds without it): that half of
  //     the check runs only where the generator exists (the owner's machine).
  const pyPath = join(process.cwd(), "design-assets/creador-relojes/piezas/esferas.py");
  const py = existsSync(pyPath) ? readFileSync(pyPath, "utf8") : null;
  if (!py) console.log("  · esferas.py not here (design-assets/ is not in git): skipping the generator comparison");
  const hex = (rgb: string) =>
    `#${rgb
      .split(",")
      .map((n) => Number(n.trim()).toString(16).padStart(2, "0"))
      .join("")}`;
  for (const g of DIAL_GRADIENTS) {
    const m = py?.match(new RegExp(`"${g.key}": \\(\\(([^)]+)\\), \\(([^)]+)\\)`));
    if (py) ok(m, `gradient ${g.key}: not in piezas/esferas.py DEGRADADOS`);
    if (m) ok(hex(m[1]) === g.arriba && hex(m[2]) === g.abajo, `gradient ${g.key}: colours differ from esferas.py (${hex(m[1])} → ${hex(m[2])})`);
    const b = DIAL_BASES.find((x) => x.id === `degradado-${g.key}`);
    ok(b?.textura === "degradado" && b.degradado?.key === g.key, `gradient ${g.key}: no catalogue entry`);
    // Every step has its photo layer at both sizes.
    for (const n of DIAL_GRADIENT_STEPS)
      for (const size of [1200, 600] as const)
        ok(
          existsSync(join(process.cwd(), "public", capaUrl(`esfera-degradado-${g.key}-p${n}`, size))),
          `gradient ${g.key} p${n}: missing layer ${size}`,
        );
  }
  if (py) {
    const pos = py.match(/POSICIONES = \{([^}]+)\}/)?.[1] ?? "";
    for (const n of DIAL_GRADIENT_STEPS) {
      const v = pos.match(new RegExp(`${n}: ([0-9.]+)`))?.[1];
      ok(v !== undefined && Number(v) === DIAL_GRADIENT_CENTERS[n], `gradient step ${n}: centre differs from esferas.py POSICIONES`);
    }
    ok(Number(py.match(/ANCHO_TRANSICION = ([0-9.]+)/)?.[1]) === DIAL_GRADIENT_WIDTH, "gradient width differs from esferas.py");
  }

  // 2 · The colour really runs top → bottom, and a solid dial is flat.
  for (const g of DIAL_GRADIENTS) {
    const e = { base: `degradado-${g.key}` as DialBaseId, degradado: 3 as const };
    ok(dialColorAt(e, -15.25) === g.arriba && dialColorAt(e, 15.25) === g.abajo, `gradient ${g.key}: ends are not its two colours`);
  }
  ok(dialColorAt({ base: "verde" }, -10) === dialColorAt({ base: "verde" }, 10), "a solid dial changes colour");
  // Step 1 keeps more of the top colour at the centre than step 5.
  ok(gradientMix(1, 0) < gradientMix(3, 0) && gradientMix(3, 0) < gradientMix(5, 0), "gradient steps do not move the blend");

  // 3 + 4 · Every printed piece in one of the three inks reaches 3:1 over ITS
  //     OWN height (not just its centre: a 4 mm sign crosses part of the blend),
  //     for every gradient × step × dial (classic with the sign at 9 and at 6,
  //     plain-striped track with a name, Esfera Ifá). Letters are measured by
  //     their real outline; the name also stays inside DIAL_NAME_SPAN, the span
  //     its ink is chosen for. validate() never blocks on contrast.
  const INKS = [WATCH_MATERIALS["tinta-oro"], WATCH_MATERIALS["tinta-oro-oscuro"], WATCH_MATERIALS["tinta-negra"]] as string[];
  const yExtent = (q: Primitive): [number, number] | null => {
    if (q.kind === "circle") return [q.cy - q.r, q.cy + q.r];
    if (q.kind === "rect") {
      const cy = q.y + q.h / 2;
      const rad = ((q.rotate ?? 0) * Math.PI) / 180;
      const hy = Math.abs((q.h / 2) * Math.cos(rad)) + Math.abs((q.w / 2) * Math.sin(rad));
      return [cy - hy, cy + hy];
    }
    const b = q.kind === "text" ? pathBounds(textRunToPath(q).d) : q.kind === "path" ? pathBounds(q.d) : null;
    return b ? [b[1], b[3]] : null;
  };
  const ifaBase = resolvePreset("ifa", disp);
  const base0 = resolvePreset("orula", disp);
  const cero = { ...resolvePreset("cero", disp) };
  let measured = 0;
  let warned = 0;
  // DIAL_SIGN_SPANS (used by the warning) = the sign's real ink box.
  for (const pos of ["nueve", "seis"] as const) {
    const S = DIAL_LAYOUT.sign[pos];
    ok(
      Math.abs(DIAL_SIGN_SPANS[pos][0] - (S.cy - S.inkH / 2)) < 1e-9 && Math.abs(DIAL_SIGN_SPANS[pos][1] - (S.cy + S.inkH / 2)) < 1e-9,
      `DIAL_SIGN_SPANS.${pos} differs from DIAL_LAYOUT.sign`,
    );
  }
  for (const g of DIAL_GRADIENTS)
    for (const n of DIAL_GRADIENT_STEPS) {
      const id = `degradado-${g.key}` as DialBaseId;
      const cases: [string, WatchConfig][] = [
        ...(["nueve", "seis"] as const).map((pos): [string, WatchConfig] => [
          `sign at ${pos}`,
          withGradientStep(withPart({ ...base0, esfera: { ...base0.esfera, signo: COMBO, signoPos: pos } }, "esfera", id), n),
        ]),
        ["plain track + name", withGradientStep(withPart({ ...cero, esfera: { ...cero.esfera, texto: "BABALÚ AYÉ" } }, "esfera", id), n)],
        ["Esfera Ifá", withGradientStep(withPart(ifaBase, "esfera", id), n)],
      ];
      for (const [what, c] of cases) {
        ok(c.esfera.base === id && c.esfera.degradado === n, `${g.key} p${n} ${what}: step not stored`);
        ok(!validate(c).issues.some((i) => i.regla === "contraste-texto"), `${g.key} p${n} ${what}: contrast blocks the order`);
        for (const q of dialPrimitives(c)) {
          if (q.capa !== "impresion") continue;
          const ink = q.fill && INKS.includes(q.fill) ? q.fill : q.stroke && INKS.includes(q.stroke) ? q.stroke : null;
          if (!ink) continue; // the Orisha's bead colours are decoration, not ink
          const ext = yExtent(q);
          ok(ext, `${g.key} p${n} ${what}: a printed ${q.kind} has no measurable height`);
          if (!ext) continue;
          measured++;
          const min = dialMinContrast(c.esfera, ink, ext[0], ext[1]);
          // The personal sign is one ink for the whole sign: where no ink can
          // reach 3:1 over its height, the customer must get 'contraste-signo'.
          const signBar = what.startsWith("sign") && q.kind === "rect" && q.rotate === undefined;
          if (signBar && min < 3) {
            warned++;
            ok(min >= 2.5, `${g.key} p${n} ${what}: a sign bar is only ${min.toFixed(2)}:1`);
            ok(
              validate(c).issues.some((i) => i.regla === "contraste-signo"),
              `${g.key} p${n} ${what}: a sign bar is ${min.toFixed(2)}:1 and the customer is not warned`,
            );
          } else
            ok(min >= 3, `${g.key} p${n} ${what}: a printed ${q.kind} at y ${ext[0].toFixed(2)}–${ext[1].toFixed(2)} is ${min.toFixed(2)}:1 in ${ink}`);
          if (q.kind === "text")
            ok(
              ext[0] >= DIAL_NAME_SPAN[0] && ext[1] <= DIAL_NAME_SPAN[1],
              `${g.key} p${n} ${what}: the name (${ext[0].toFixed(2)}–${ext[1].toFixed(2)}) leaves DIAL_NAME_SPAN`,
            );
        }
      }
      // The Ifá ring really prints in the inks (not the solid-dial one).
      const ifa = cases[3][1];
      const used = new Set(dialPrimitives(ifa).flatMap((q) => (q.capa === "impresion" && q.fill && INKS.includes(q.fill) ? [q.fill] : [])));
      ok(used.size >= 1, `${g.key} p${n}: the Ifá dial prints in none of the three inks`);
    }
  ok(measured > 5000, `only ${measured} printed pieces measured`);
  ok(warned < 60, `${warned} sign bars below 3:1 (expected only a handful of rare sign/step combinations)`);
  // The warning never fires where the sign is fine.
  for (const g of DIAL_GRADIENTS)
    for (const n of DIAL_GRADIENT_STEPS)
      for (const pos of ["nueve", "seis"] as const) {
        const c = withGradientStep(withPart({ ...base0, esfera: { ...base0.esfera, signo: COMBO, signoPos: pos } }, "esfera", `degradado-${g.key}` as DialBaseId), n);
        const best = dialInkOver(c.esfera, ...DIAL_SIGN_SPANS[pos]).contraste;
        const fires = validate(c).issues.some((i) => i.regla === "contraste-signo");
        ok(fires === best < 3, `${g.key} p${n} sign at ${pos}: best ink ${best.toFixed(2)}:1 but warning ${fires ? "on" : "off"}`);
      }
  // The exact minimum agrees with fine sampling (the method behind every check above).
  {
    const e = { base: "degradado-chango" as DialBaseId, degradado: 4 as const };
    let dense = Infinity;
    for (let y = 1.95; y <= 5.75; y += 0.01) dense = Math.min(dense, contrastRatio(WATCH_MATERIALS["tinta-oro"], dialColorAt(e, y)));
    ok(Math.abs(dialMinContrast(e, WATCH_MATERIALS["tinta-oro"], 1.95, 5.75) - dense) < 0.02, "dialMinContrast disagrees with sampling");
  }

  // 4b · The seconds-hand warning sees the WHOLE dial: it fires exactly when
  //      the hand drops under 1.3:1 somewhere it sweeps (fine sampling).
  const RV = WATCH_SPECS.aberturaVisibleMm / 2;
  for (const g of DIAL_GRADIENTS)
    for (const n of DIAL_GRADIENT_STEPS)
      for (const h of SECONDS) {
        const c = { ...withGradientStep(withPart(base0, "esfera", `degradado-${g.key}` as DialBaseId), n), segundero: h.id };
        let dense = Infinity;
        for (let y = -RV; y <= RV; y += 0.05) dense = Math.min(dense, contrastRatio(WATCH_COLORS[h.color].hex, dialColorAt(c.esfera, y)));
        const fires = validate(c).issues.some((i) => i.regla === "contraste-segundero");
        if (dense < 1.29) ok(fires, `${g.key} p${n} + ${h.id}: hand at ${dense.toFixed(2)}:1 but no warning`);
        if (dense > 1.31) ok(!fires, `${g.key} p${n} + ${h.id}: warning although the hand stays at ${dense.toFixed(2)}:1`);
      }
  {
    const c = { ...withGradientStep(withPart(base0, "esfera", "degradado-chango"), 3), segundero: "rojo" as const };
    ok(validate(c).issues.some((i) => i.regla === "contraste-segundero"), "Changó p3 + red hand (vanishes in the blend) gives no warning");
  }

  // 5 · Solid dials keep exactly their old ink (best of the two golds).
  for (const b of DIAL_BASES.filter((x) => !x.degradado && x.status === "verificado")) {
    const i = dialInk(b.id);
    ok(i.id === "oro" || i.id === "oro-oscuro", `solid ${b.id}: ink ${i.id} is not one of the golds`);
  }

  // 6 · The step lives only with a gradient base, and survives links.
  const g0 = withPart(base0, "esfera", "degradado-orula");
  ok(g0.esfera.degradado === DIAL_GRADIENT_DEFAULT, "a new gradient does not start at step 3");
  const g4 = withGradientStep(g0, 4);
  ok(withPart(g4, "esfera", "degradado-oshun").esfera.degradado === 4, "switching gradients loses the step");
  ok(!("degradado" in withPart(g4, "esfera", "verde").esfera), "a solid dial keeps a gradient step");
  ok(withGradientStep(base0, 2) === base0, "a step changes a solid dial");
  ok(canonicalJson(normalize(JSON.parse(JSON.stringify(g4)))) === canonicalJson(g4), "a gradient design does not round-trip through normalize");
  ok(normalize({ ...g0, esfera: { ...g0.esfera, degradado: undefined } }).esfera.degradado === 3, "missing step is not 3");
  const bad = normalizeWithReport({ ...g0, esfera: { ...g0.esfera, degradado: 9 } });
  ok(bad.config.esfera.degradado === 3 && bad.descontinuado.some((d) => d.campo === "esfera.degradado"), "a bad step is not reported");
  ok(!("degradado" in normalize({ ...base0, esfera: { ...base0.esfera, degradado: 2 } }).esfera), "a solid dial keeps a step from a link");
  ok(designCode(g4) !== designCode(g0), "the design code ignores the step");
  ok(nombresCapas(g4).esfera === "esfera-degradado-orula-p4" && nombresCapas(g4).aproximadas.length === 0, "wrong gradient layer");
  const props = lineProperties(g4, "PY-R-TEST", "https://x/diseno?d=x").find((p) => p.key === "Esfera")?.value ?? "";
  ok(/Degradado Orula \(amarillo → verde\), paso 4 de 5/.test(props), `the order line does not state the step: ${props}`);
  ok(/paso 4 de 5/.test(summary(g4)), "the summary does not state the step");
});

// ===========================================================================
// EDITOR V2 (spec design-assets/creador-relojes/SPEC-EDITOR-V2.md): el modelo
// de pasos (4 + "Listo"), el borrador v2, el cambio de tipo de correa, los
// enlaces que se comparten, la ruta de enfoque y la letra fina.
// ===========================================================================
section("editor v2: steps, sub-tabs, assembly mask, field → step", () => {
  ok(same(STEPS.map((s) => s.id), ["caja", "esfera", "correa", "tapa", "resumen"]), "the steps are not caja · esfera · correa · tapa · resumen");
  ok(same(STEPS.map((s) => s.label), ["Caja", "Esfera", "Correa", "Tapa", "Listo"]), "the stepper labels changed");
  ok(BUILD_STEPS === 4 && STEPS.length === BUILD_STEPS + 1, "4 build steps + Listo");
  ok(!isStepId("agujas"), "'agujas' is still a step (it lives in Esfera › Detalles)");
  ok(same(SUBS.esfera, ["color", "pista", "texto", "detalles"]) && same(SUBS.tapa, ["signo", "grabado"]), "wrong sub-tabs");
  for (const st of STEPS) {
    const list = SUBS[st.id] ?? [];
    ok(fixSub(st.id, null) === (list[0] ?? null), `${st.id}: fixSub(null) is not the first sub-tab`);
    ok(fixSub(st.id, "grabado") === (list.includes("grabado") ? "grabado" : (list[0] ?? null)), `${st.id}: fixSub keeps a foreign sub-tab`);
    ok(STEP_VIEW[st.id] !== undefined, `${st.id}: no camera view`);
  }
  for (const p of WATCH_PARTS) ok(isStepId(PART_STEP[p]) && PART_STEP[p] !== "resumen", `${p}: no build step`);
  // Ghost counts per moment (§2 R2.2): entry 6 · caja 5 · esfera 3 · correa 1 · tapa 0 · Listo 0.
  const ghosts = (m: Record<string, boolean>) => WATCH_PARTS.filter((p) => !m[p]).length;
  ok(same([-1, 0, 1, 2, 3, 4].map((max) => ghosts(confirmedMask(max, false))), [6, 5, 3, 1, 0, 0]), "ghost counts are not 6/5/3/1/0/0");
  ok(ghosts(confirmedMask(-1, true)) === 0 && maskKey(confirmedMask(0, true)) === maskKey(ALL_SOLID), "'Ver completo' / a shared link does not show every part solid");
  ok(maskKey(ALL_GHOST) === "000000" && maskKey(ALL_SOLID) === "111111", "maskKey");
  // Every field a rule can blame lands on a real step and one of ITS sub-tabs.
  const fields = new Set<WatchField>(["caja", "acabado", "esfera.modelo", "esfera.base", "esfera.pista", "esfera.texto", "esfera.signo", "aplique", "segundero", "correa", "cierre", "tapa.signo", "tapa.linea1", "tapa.linea2", "tapa.fecha"]);
  for (const f of fields) {
    const { step, sub } = stepOfField(f);
    const list = SUBS[step] ?? [];
    ok(isStepId(step) && step !== "resumen", `${f}: "Corregir" goes nowhere`);
    ok(list.length ? !!sub && list.includes(sub) : sub === null, `${f}: sub-tab ${sub} is not one of ${step}'s`);
  }
  ok(stepOfField("segundero").sub === "detalles" && stepOfField("tapa.linea1").sub === "grabado", "the old Agujas / Grabado fields moved");
  // Every preset is order-ready (R5.1: preset → Pedir → WhatsApp, ≤ 3 taps).
  for (const [id, c] of presets) ok(validate(c).ok, `preset ${id} is not order-ready`);
  // The new reducer action is withStrapType, exactly.
  const c0 = resolvePreset("chango", disp);
  ok(same(creatorReducer(c0, { type: "tipoCorrea", tipo: "piel" }), withStrapType(c0, "piel")), "tipoCorrea ≠ withStrapType");
});

section("editor v2: Draft v2 + migration of v1 drafts", () => {
  const c = resolvePreset("oshun", disp);
  const v1 = (step: string) => JSON.stringify({ v: 1, config: c, step, at: 5 });
  const a = parseDraft(v1("agujas"));
  ok(!!a && a.v === 2 && a.step === "esfera" && a.sub === "detalles" && a.max === 1, `v1 "agujas" does not open Esfera › Detalles (max 1): ${JSON.stringify(a && { step: a.step, sub: a.sub, max: a.max })}`);
  const r = parseDraft(v1("resumen"));
  ok(!!r && r.step === "resumen" && r.sub === null && r.max === 4, "v1 'resumen' does not open Listo with every part solid");
  const t = parseDraft(v1("tapa"));
  ok(!!t && t.step === "tapa" && t.sub === "signo" && t.max === 3, "v1 'tapa' → tapa/signo, max 3");
  ok(parseDraft(v1("inventado"))?.step === "caja", "an unknown step does not fall back to caja");
  const d2 = { v: 2, config: c, step: "esfera", sub: "pista", max: 3, at: 9 };
  const b = parseDraft(JSON.stringify(d2));
  ok(!!b && b.step === "esfera" && b.sub === "pista" && b.max === 3 && b.at === 9, "a v2 draft does not round-trip");
  ok(canonicalJson(b!.config) === canonicalJson(c), "the draft's design changed on the way");
  ok(parseDraft(JSON.stringify({ ...d2, sub: "grabado" }))?.sub === "color", "a foreign sub-tab is not fixed");
  ok(parseDraft(JSON.stringify({ ...d2, step: "tapa", max: 0 }))?.max === 3, "max below the saved step is not raised");
  ok(parseDraft(JSON.stringify({ ...d2, max: 99 }))?.max === 4, "max above Listo is not clamped");
  ok(parseDraft(null) === null && parseDraft("{nope") === null && parseDraft("{}") === null && parseDraft("null") === null, "garbage drafts are not null");
});

section("editor v2: withStrapType (R6 type cards)", () => {
  const types = ["caucho", "piel", "brazalete"] as const;
  const offered = visibleParts(CATALOG.correa) as { id: string; tipo?: string }[];
  for (const [id, c] of [...presets, ["brazalete", withPart(resolvePreset("orula", disp), "correa", "brazalete")] as [string, WatchConfig]]) {
    for (const tipo of types) {
      const n = withStrapType(c, tipo);
      const s = getStrap(n.correa);
      ok(s?.tipo === tipo, `${id} → ${tipo}: got ${n.correa}`);
      ok(offered.some((p) => p.id === n.correa) && partState("correa", n.correa, disp) === "disponible", `${id} → ${tipo}: ${n.correa} is not offered`);
      ok(withStrapType(n, tipo) === n, `${id} → ${tipo}: not idempotent`);
      ok(same({ ...n, correa: c.correa }, c), `${id} → ${tipo}: changed more than the strap`);
      if (tipo === "brazalete") ok(n.correa === "brazalete", `${id}: the bracelet is not "brazalete"`);
    }
  }
  const rojo = withPart(resolvePreset("chango", disp), "correa", "caucho-rojo");
  ok(withStrapType(rojo, "piel").correa === "piel-rojo", "caucho rojo → piel does not keep the red");
  ok(withStrapType(withStrapType(rojo, "piel"), "caucho").correa === "caucho-rojo", "piel roja → caucho does not keep the red");
  ok(withStrapType(rojo, "piel", "piel-verde").correa === "piel-verde", "the remembered strap of that type is ignored");
  ok(withStrapType(rojo, "piel", "caucho-azul").correa === "piel-rojo", "a remembered strap of ANOTHER type is used");
  const brz = withPart(rojo, "correa", "brazalete");
  ok(getStrap(withStrapType(brz, "caucho").correa)?.tipo === "caucho", "bracelet → caucho has no rubber strap");
  ok(withStrapType(withPart(resolvePreset("yemaya", disp), "correa", "brazalete"), "caucho").correa === resolvePreset("yemaya", disp).correa, "bracelet → caucho does not use the preset's own strap");
  ok(same(rojo, withStrapType(rojo, "caucho")), "same type changes the strap");
});

section("editor v2: share links (R8) — origin, paso=resumen, local note", () => {
  const c = normalize(resolvePreset("ifa", disp));
  const def = buildOrderInfo(c);
  ok(def.creatorUrl.startsWith(`${SITE_URL}/creador-de-relojes?d=`) && def.sheetUrl.startsWith(`${SITE_URL}/diseno?d=`), "the default origin is not SITE_URL");
  ok(def.creatorUrl.endsWith("&paso=resumen"), "creatorUrl does not end with &paso=resumen");
  ok(!def.origenLocal, "SITE_URL is flagged as a local origin");
  const lan = buildOrderInfo(c, null, "http://192.168.1.20:3000/");
  ok(lan.creatorUrl.startsWith("http://192.168.1.20:3000/creador-de-relojes?d=") && lan.sheetUrl.startsWith("http://192.168.1.20:3000/diseno?d="), "the given origin is not used");
  ok(lan.origenLocal && buildOrderInfo(c, null, "http://localhost:3000").origenLocal, "localhost / LAN are not flagged");
  ok(!buildOrderInfo(c, null, "https://deploy-preview-12--pyj.netlify.app").origenLocal, "a deploy preview is flagged as local");
  for (const [o, want] of [
    ["http://127.0.0.1:3000", true],
    ["http://10.0.0.4", true],
    ["http://172.20.1.1", true],
    ["http://172.40.1.1", false],
    ["http://mac.local:3000", true],
    ["https://pedrojewelryyoruba.com", false],
  ] as const)
    ok(isLocalOrigin(o) === want, `isLocalOrigin(${o}) ≠ ${want}`);
  const d = new URL(lan.creatorUrl).searchParams.get("d") ?? "";
  ok(designCode(decodeWatchDesign(d)!.config) === lan.code && canonicalJson(decodeWatchDesign(d)!.config) === canonicalJson(c), "the shared link does not rebuild the same design");
  ok(new URL(lan.creatorUrl).searchParams.get("paso") === "resumen", "?paso is not resumen");
  ok(decodeURIComponent(lan.shareHref).includes(lan.creatorUrl), "the WhatsApp share does not carry the creator link");
  ok(decodeURIComponent(lan.whatsappHref.split("text=")[1] ?? "") === lan.whatsappText, "the copied message is not the WhatsApp text");
  ok(lan.whatsappText.includes(lan.code) && lan.whatsappText.includes(lan.sheetUrl), "the order text lacks the code or the /diseno link");
  ok(lan.ctaLabel === "Solicitar por WhatsApp", "CTA label");
  // The editor really passes the origin (pre-launch: this deployment; after: SITE_URL).
  const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8");
  const hooks = read("components/watch/shell/hooks.ts");
  ok(/SECCION_RELOJES\.lanzado\s*\?\s*SITE_URL\s*:\s*window\.location\.origin/.test(hooks), "useShareOrigin is not `lanzado ? SITE_URL : location.origin`");
  ok(/buildOrderInfo\(final, product, origin\)/.test(read("components/watch/WatchCreator.tsx")), "WatchCreator does not pass the share origin");
});

section("editor v2: focus route is exact (the guide page keeps the site chrome)", () => {
  ok(isFocusRoute("/creador-de-relojes") && isFocusRoute("/creador-de-relojes/") && isFocusRoute("/creador-de-relojes?d=x#y"), "the creator is not a focus route");
  ok(!isFocusRoute("/creador-de-relojes/como-funciona"), "the guide page is a focus route");
  ok(!isFocusRoute("/creador-de-relojes-viejo") && !isFocusRoute("/") && !isFocusRoute(null), "a prefix / other route is a focus route");
});

section("letra fina (R7): Cormorant Garamond Italic 500, py-dial untouched", () => {
  const fina = readFileSync(join(process.cwd(), "lib/watch-glyphs-fina.ts"), "utf8");
  ok(/Cormorant Garamond Italic 500, OFL 1\.1/.test(fina), "the fina glyph file does not name Cormorant Garamond Italic 500, OFL 1.1");
  // py-dial (Cinzel) is byte-identical to the table before the split (sha-256
  // of JSON.stringify of the pre-V2 GLYPH_FONTS["py-dial"]).
  const h = createHash("sha256").update(JSON.stringify(GLYPH_FONTS["py-dial"])).digest("hex");
  ok(h === "43a7c7fa87695b03117bd365d8c0529219c9732ccacd4c067b029defe6c37d70", `GLYPH_FONTS["py-dial"] changed (${h})`);
  // Every sign name the caseback can carry, and the specimen default, has an outline in fina.
  const names = [...ODU_MEJI.map((o) => ODU_LUCUMI[o.id] ?? o.name), ...ODU_MEJI.map((o) => o.name), "Omo Orula"];
  for (const n of names) ok(missingGlyphs(n, "py-dial-fina").length === 0, `fina: no outline for a char of «${n}»`);
  ok(FONT_STYLES["py-dial-fina"] === "italic" && FONT_STYLES["py-dial"] === "normal", "FONT_STYLES");
  ok(textWidthMm("Omo Orula", "py-dial-fina", 2) < textWidthMm("OMO ORULA", "py-dial", 2), "fina is not narrower than the roman capitals");
  const props = lineProperties({ ...resolvePreset("orula", disp), tapa: { ...resolvePreset("orula", disp).tapa, linea1: "Omo Orula", fuente: "fina" } }, "PY-R-T", "https://x");
  ok(props.find((p) => p.key === "Tapa · fuente")?.value === "Fina (cursiva)", "the order line does not say 'Fina (cursiva)'");
});

section("caseback text: real widths, shrinks evenly (never squashed sideways), inside the field", () => {
  // 1) The light first-load metrics (lib/watch-glyph-metrics.ts) are EXACTLY
  //    the outline tables': advances / upm and only the kerning that spreads.
  //    On a mismatch, print the right line to paste back.
  const em = (u: number, upm: number) => Number((u / upm).toFixed(4));
  const advOf = (F: GlyphFont) => Object.fromEntries(Object.entries(F.glyphs).map(([ch, g]) => [ch, em(g[0], F.upm)]));
  const spreadOf = (F: GlyphFont) =>
    Object.fromEntries(Object.entries(F.kern).filter(([, v]) => v > 0).map(([pair, v]) => [pair, em(v, F.upm)]));
  const sameMap = (a: Readonly<Record<string, number>>, b: Record<string, number>) =>
    Object.keys(a).length === Object.keys(b).length && Object.entries(b).every(([k, v]) => a[k] === v);
  const tables: [string, Readonly<Record<string, number>>, Record<string, number>][] = [
    ["CLASICA_ADV", CLASICA_ADV, advOf(GLYPH_FONTS["py-dial"])],
    ["CLASICA_KERN_POS", CLASICA_KERN_POS, spreadOf(GLYPH_FONTS["py-dial"])],
    ["FINA_ADV", FINA_ADV, advOf(GLYPH_FONTS["py-dial-fina"])],
    ["FINA_KERN_POS", FINA_KERN_POS, spreadOf(GLYPH_FONTS["py-dial-fina"])],
  ];
  for (const [name, have, want] of tables) {
    const good = sameMap(have, want);
    ok(good, `lib/watch-glyph-metrics.ts: ${name} does not match the outline table`);
    if (!good) console.error(`    export const ${name}: Readonly<Record<string, number>> = ${JSON.stringify(want)};`);
  }

  // 2) Worst-case lines, both letters, with and without a sign, alone (the
  //    biggest text) and stacked with a second line and the date (the tightest
  //    chords): every char 20×, every pair that kerning spreads 10×, and real
  //    mixed-case lines. Each engraved line must keep its real width within
  //    maxWidth — so textRunToPath never compresses it sideways (sx = 1: the
  //    whole line shrank evenly) — and its outline stays inside the inner
  //    filete of the ring.
  const L = CASEBACK_LAYOUT;
  const fill = (s: string) => s.repeat(Math.ceil(CASEBACK_MAX / s.length)).slice(0, CASEBACK_MAX);
  const glyphs = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÉÍÓÚÜÑáéíóúüñ.,'·&/-"];
  const real = ["Siempre contigo mamá", "Mercedes Rodríguez", "Ñañá & Tomás O'Neil", "Familia Rodríguez"];
  const base = resolvePreset("orula", disp);
  const fonts = [
    ["clasica", CLASICA_KERN_POS],
    ["fina", FINA_KERN_POS],
  ] as const;
  let worstSx = 1;
  let worst = "";
  for (const [fuente, spread] of fonts) {
    const lines = [...glyphs.map(fill), ...Object.keys(spread).map(fill), ...real];
    for (const line of lines) {
      ok(isValidCasebackLine(line), `caseback test line «${line}» is not a valid line`);
      for (const signo of [null, COMBO]) {
        for (const stack of [false, true]) {
          const c = withPatch(base, {
            tapa: { signo, marcas: "barras", linea1: line, linea2: stack ? line : "", ...(stack ? { fecha: "2024-12-04" } : {}), fuente },
          });
          const runs = casebackPrimitives(c).filter((p): p is TextRun => p.kind === "text");
          let squashed = "";
          let outside = "";
          for (const p of runs) {
            const w = textWidthMm(p.text, p.font, p.size, p.letterSpacing);
            const sx = p.maxWidth && w > p.maxWidth ? p.maxWidth / w : 1;
            if (sx < worstSx) [worstSx, worst] = [sx, `«${p.text}» (${fuente})`];
            if (sx < 1 - 1e-9) squashed ||= `«${p.text}» sx ${sx.toFixed(3)}`;
            const reach = pathReach(textRunToPath(p).d);
            if (reach !== null && reach > L.innerR - L.lineW / 2 + EPS) outside ||= `«${p.text}» reaches ${reach.toFixed(2)} mm`;
          }
          const tag = `${fuente}${signo ? " + sign" : ""}${stack ? " + 2 lines + date" : ""}`;
          ok(runs.length >= (stack ? 3 : 1), `${tag}, «${line}»: the caseback lost a text line`);
          ok(!squashed, `${tag}: caseback text compressed sideways — ${squashed}`);
          ok(!outside, `${tag}: caseback text outside the ring's inner filete (${L.innerR} mm) — ${outside}`);
        }
      }
    }
  }
  ok(worstSx > 1 - 1e-9, `worst caseback squash: ${worst} sx ${worstSx.toFixed(4)}`);
  // The reviewer's case: a mixed-case Clásica line now shrinks evenly instead
  // of being narrowed ~8 % (it used to be sized from the capitals estimate).
  const mama = casebackPrimitives(withPatch(base, { tapa: { signo: null, marcas: "barras", linea1: "Siempre contigo mamá", linea2: "", fuente: "clasica" } }))
    .find((p): p is TextRun => p.kind === "text" && p.text === "Siempre contigo mamá");
  ok(mama && mama.maxWidth && textWidthMm(mama.text, mama.font, mama.size, mama.letterSpacing) <= mama.maxWidth + EPS, "«Siempre contigo mamá» (clásica) still overflows its line");
});

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`check-watch-data: ${failures} failure(s)`);
  process.exit(1);
}
