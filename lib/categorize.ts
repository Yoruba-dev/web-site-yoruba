import { ORISHA_NAMES } from "./orishas";

// Live Shopify products have no tags / product type set, so we derive the piece
// type + Orisha(s) from the product TITLE. This powers the shop filters and the
// "Comprar por Orisha" navigation without the store owner having to tag anything.
// (If they later add real tags in Shopify, those are merged in — see lib/shopify.ts.)

/** lowercase + strip accents, e.g. "Yemayá" -> "yemaya". */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Piece-type keywords (stems, substring match). Order = priority; first hit wins.
const TYPE_RULES: { cat: string; kw: string[] }[] = [
  { cat: "Opele", kw: ["opele", "ekuele", "okpele", "okuele"] },
  { cat: "Idde", kw: ["idde", "ide de", "manilla de ifa"] },
  { cat: "Herramientas", kw: ["herramienta", "remo", "muleta", "atributo"] },
  { cat: "Anillos", kw: ["anillo", "sortija"] },
  { cat: "Pulseras", kw: ["pulso", "pulsera", "esclava", "brazalete", "manilla", "semanario"] },
  { cat: "Monedas", kw: ["moneda", "medalla"] },
  { cat: "Azabaches", kw: ["azabache"] },
  { cat: "Rosarios", kw: ["rosario"] },
  { cat: "Collares", kw: ["collar", "eleke", "ileke", "mazo", "gargantilla"] },
  { cat: "Dijes", kw: ["dije", "colgante", "medallon", "amuleto"] },
  { cat: "Cadenas", kw: ["cadena"] },
  { cat: "Aretes", kw: ["arete", "pantalla", "candonga", "zarcillo"] },
];

// Orisha keyword -> canonical name. Only names present in ORISHA_NAMES are emitted
// (so they land in the shop's "Por Orisha" group).
const ORISHA_KW: { name: string; kw: string[] }[] = [
  { name: "Yemayá", kw: ["yemaya", "regla"] },
  { name: "Oshún", kw: ["oshun", "ochun", "caridad"] },
  { name: "Obatalá", kw: ["obbatala", "obatala", "mercedes"] },
  { name: "Changó", kw: ["chango", "santa barbara", "santabarbara"] },
  { name: "Elegguá", kw: ["elegua", "eleggua", "eshu", "echu"] },
  { name: "Orula", kw: ["orula", "orunmila", "orunla", "ifa", "opele", "awo"] },
  { name: "Oyá", kw: ["oya"] },
  { name: "Ogún", kw: ["ogun"] },
  { name: "Ochosi", kw: ["ochosi", "oshosi", "oshossi"] },
  { name: "Babalú Ayé", kw: ["san lazaro", "lazaro", "babalu", "asojano", "azojano"] },
  { name: "Olokun", kw: ["olokun"] },
  { name: "Inle", kw: ["inle"] },
  { name: "Aggayú", kw: ["aggayu", "agayu"] },
  { name: "Obba", kw: ["obba"] },
  { name: "Yewá", kw: ["yewa"] },
];

// Precompiled whole-word matchers (so "obba" doesn't match inside "obbatala",
// and "oya" doesn't match inside another word).
const ORISHA_MATCHERS = ORISHA_KW.filter((o) => ORISHA_NAMES.includes(o.name)).map(
  (o) => ({ name: o.name, res: o.kw.map((k) => new RegExp(`(^|[^a-z])${k}([^a-z]|$)`)) }),
);

/** Derives [pieceType?, ...orishas] tags from a product title. */
export function deriveTags(title: string): string[] {
  const t = norm(title);
  const tags: string[] = [];
  const type = TYPE_RULES.find((r) => r.kw.some((k) => t.includes(k)));
  if (type) tags.push(type.cat);
  for (const o of ORISHA_MATCHERS) {
    if (o.res.some((re) => re.test(t))) tags.push(o.name);
  }
  return tags;
}
