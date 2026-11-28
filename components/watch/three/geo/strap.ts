// ---------------------------------------------------------------------------
// CORREAS en el ESPACIO LOCAL de la correa (s a lo largo desde el asa, u a lo
// ancho, v hacia fuera de la muñeca). Se construyen UNA vez "en recto"
// (x = u, y = s, z = v) y se colocan con ../pose.ts (cerrada en la muñeca de
// 17 cm o abierta boca abajo).
//   caucho  la de la FOTO 1 del dueño (decisión 19): extremo con muesca y dos
//           puntas, panel hundido entre rieles con costillas a lo ancho cada
//           1.5 mm, canto en dos niveles, 10 ranuras a lo ancho que ATRAVIESAN
//           la correa, una trabilla acanalada y punta en ojiva con almohadilla;
//   piel    la de las fotos 5, 9 y 10: acolchada (meseta de 0.95), grabado en
//           filas a todo el ancho (tex/maps.ts), pespunte hundido a 1.9 del
//           canto con su agujero entre puntadas, canto pintado mate.
//   Las dos nacen en la muesca del asa, que llena un bloque de metal en el
//   acabado de la caja (endLinkGeometry, PLAN-REALISMO-V3 2.2).
// El brazalete está en ./bracelet.ts y los cierres en ./clasp.ts.
//
// La banda es una malla de TIRAS a lo largo: cada tira tiene sus vértices (las
// aristas entre tiras quedan vivas) y su sombra propia en el color de vértice
// (lo hondo de las ranuras, el escalón del canto, la pared de un agujero: luz
// que el cuarto no puede dar). En la punta, cada arista del canto es la curva
// PARALELA de la ojiva (no un estrechamiento de la sección): el escalón da la
// vuelta con el mismo ancho.
// L = L_BOTTOM: arco del asa al punto de abajo (≈ 83.0 mm).
// Grupos de material de una banda: 0 = cara vista; 1 = forro (contra la
// muñeca); 2 = cantos (la piel los pinta); 3 = paredes de los agujeros.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CASE_DIM } from "./outline";
import { CROCO_TILE_MM } from "../tex/maps";
import { L_BOTTOM, toStrapSpace } from "../pose";

export type StrapKind = "caucho" | "piel" | "brazalete";
export type ClaspKind = "puas" | "desplegable" | "brazalete";
type Soft = Exclude<StrapKind, "brazalete">;

export const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Largo (arco) de la muesca del extremo: de ahí para fuera empieza el panel. */
export const NOTCH_S = 2.5;
/** Media anchura de la muesca de la correa: la de la caja menos un pelo (el
 *  bloque de metal entra con 0.12 por lado). */
const NOTCH_HALF = CASE_DIM.notchHalfW - 0.08;

/** Costillas del caucho (foto 1 rectificada y renders 13 y 19: SIEMPRE a lo
 *  ancho). La escala de la foto 1 tiene ±6–8 % de error: todo son constantes. */
export const RIB = {
  s0: NOTCH_S,
  s1: 31,
  period: 1.5,
  /** Hondo de la ranura bajo el listón y cuánto baja el listón del riel. */
  depth: 0.45,
  drop: 0.1,
  /** Ranura: fondo y cada pared (a lo largo). */
  floor: 0.2,
  wall: 0.14,
  /** Corona del listón y su filo. */
  crown: 0.05,
  edge: 0.1,
  /** Ranura oscura entre el listón y la pared del riel (a lo ancho). */
  side: 0.15,
  /** Media anchura del panel / ancho de la correa: nace de la muesca. */
  panel: NOTCH_HALF / 22,
} as const;

/** Canto del caucho en dos niveles: riel plano hasta hw − rail, chaflán hasta
 *  (hw − step, −chamfer), pared hasta la repisa y pared baja redondeada. */
const CANTO = { rail: 1.0, step: 0.35, chamfer: 0.65, wall: 0.55, r: 0.4 } as const;

/** Agujeros que atraviesan: los del caucho son ranuras A LO ANCHO (foto 1);
 *  los de la piel, redondos (fotos 5 y 9). [ancho, largo, radio de esquina]. */
const HOLE: Readonly<Record<Soft, readonly [number, number, number]>> = {
  caucho: [3.5, 1.9, 0.6],
  piel: [2.0, 2.0, 1.0],
};
/** Bisel del borde de un agujero. */
const HOLE_BEVEL = 0.18;
/** Media anchura de la franja central donde se abren los agujeros. */
const HOLE_U = 2.6;

/** Cómo acaba la piel junto a la caja: con terminal de metal (refs 5, 9) o
 *  con muesca sin terminal (ref 10). Pregunta Q2 al dueño. */
export const PIEL: { final: "terminal" | "muesca" } = { final: "terminal" };

/** Largos (mm de arco desde el asa). */
export const STRAP_LEN = {
  /** Hebilla: la de las 12 abraza la barra del marco. */
  hebilla12: L_BOTTOM - 7,
  /** Brazalete: las placas llegan a la barra lisa del cierre (9 mm, va con la
   *  mitad de las 12) y, por las 6, a la junta de 0.3 por donde se abre. */
  eslabones: { "12": L_BOTTOM - 4.5, "6": L_BOTTOM - 4.8 },
} as const;

/** Lo propio de cada correa de agujeros: largo de la de las 6, agujeros (la
 *  púa entra en s = 85) y trabillas sobre la de las 12. */
export const STRAP_HOLES: Readonly<
  Record<Soft, { len6: number; holes: readonly number[]; keepers: readonly { s: number; len: number }[] }>
> = {
  // Foto 1: 10 ranuras cada 6.9–7 mm (dos quedan tras el marco y la trabilla)
  // y UNA trabilla de 9 mm.
  caucho: { len6: 125, holes: [36, 43, 50, 57, 64, 71, 78, 85, 92, 99], keepers: [{ s: 65, len: 9 }] },
  // Fotos 5 y 9: 7 agujeros y dos trabillas juntas cerca de la hebilla.
  piel: { len6: 122.5, holes: [57, 64, 71, 78, 85, 92, 99], keepers: [{ s: 64.5, len: 5.6 }, { s: 57.6, len: 5.6 }] },
};

/** Altura (y) del suelo: el punto más bajo de la correa por fuera (la línea
 *  media llega a −38.1; medio grueso 1.6–1.8, el eslabón con su corona 2.05)
 *  y un pelo de aire para la sombra de contacto. */
export const FLOOR_Y = -40.4;

// ===========================================================================
// Ancho, grueso y perfil
// ===========================================================================
const WIDTH: Readonly<Record<Soft, (s: number) => number>> = {
  // Ancho MEDIDO en correa-caucho-*-1200.webp (vista de frente, R1.4): un
  // hombro rápido al salir del asa (22 → 20.4 en 7 mm) y luego 20.4 → 18.
  caucho: (s) => 22.0 - 1.6 * smooth(0, 7, s) - 2.4 * smooth(7, 40, s),
  // Medido en correa-piel-*-1200.webp: 22.6 en el terminal, hombro de 1.2 mm
  // en 7 mm y luego hasta 18.8.
  piel: (s) => 22.6 - 1.2 * smooth(0, 7, s) - 2.6 * smooth(7, 45, s),
};
const THICK: Readonly<Record<Soft, (s: number) => number>> = {
  caucho: (s) => 3.8 - 0.6 * smooth(0, 30, s),
  piel: (s) => 2.65 - 0.2 * smooth(0, 30, s),
};
/** Punta en ojiva: largo y radio de la nariz. */
const TIP: Readonly<Record<Soft, { L: number; r: number }>> = {
  caucho: { L: 12, r: 0.6 },
  piel: { L: 11.5, r: 1.5 },
};

/** Acolchado de la piel: alto de la meseta en el arco s (nace plano en el
 *  rollo del asa y baja hacia la punta) y hombros coseno que mueren 0.5 mm
 *  antes del pespunte. */
const PAD = { h0: 0.95, h1: 0.35, foot: 2.4, shoulder: 1.6, stitch: 1.9 } as const;
const padHeight = (s: number) => (PAD.h0 - (PAD.h0 - PAD.h1) * smooth(30, 58, s)) * (0.18 + 0.82 * smooth(2.6, 8, s));
const padShape = (d: number) => {
  const t = Math.max(0, Math.min(1, (d - PAD.foot) / PAD.shoulder));
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
};

/** Ancho de la correa en el arco s (sin la punta). */
export function strapWidth(kind: Soft, s: number): number {
  return WIDTH[kind](s);
}

export function strapThick(kind: Soft, s: number): number {
  return THICK[kind](s);
}

/** La cara vista sobre la línea media, en el centro, en el arco s. */
export function strapTop(kind: Soft, s: number): number {
  return THICK[kind](s) / 2 + (kind === "piel" ? padHeight(s) : 0);
}

// ===========================================================================
// El constructor de bandas
// ===========================================================================
interface Pt {
  u: number;
  s: number;
  v: number;
  /** Sombra propia (multiplica el color). */
  ao: number;
}

/** Una fila de la banda. `t` < 0: tramo recto; 0…1: la punta. */
interface Row {
  s: number;
  t: number;
  /** Alto y sombra del listón en esta fila (solo el panel del caucho). */
  rib: number;
  ribAo: number;
  /** Fondo de la ranura en esta fila (0 fuera del panel). */
  floor: number;
}

type ColFn = (r: Row) => Pt;

class Band {
  pos: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  idx: [number[], number[], number[], number[]] = [[], [], [], []];
  constructor(
    private uvOf: (p: Pt) => [number, number],
    /** Sombra de contacto horneada (trabilla, cola, asa) en (u, s): solo por
     *  fuera (v > 0), el forro va contra la muñeca. */
    private shade: (u: number, s: number) => number = () => 1,
  ) {}

  vert(p: Pt): number {
    const i = this.pos.length / 3;
    this.pos.push(p.u, p.s, p.v);
    const [a, b] = this.uvOf(p);
    this.uv.push(a, b);
    const c = p.ao * (p.v > 0 ? this.shade(p.u, p.s) : 1);
    this.col.push(c, c, c);
    return i;
  }

  /** Tira de columnas `cols` (de izquierda a derecha vista desde fuera) a lo
   *  largo de las filas; lisa por dentro, viva con las de al lado. */
  run(rows: readonly Row[], cols: readonly ColFn[], group: 0 | 1 | 2, active?: (i: number, j: number) => boolean) {
    const base: number[][] = rows.map((r) => cols.map((c) => this.vert(c(r))));
    for (let i = 0; i + 1 < rows.length; i++) {
      for (let j = 0; j + 1 < cols.length; j++) {
        if (active && !active(i, j)) continue;
        const a = base[i][j];
        const b = base[i][j + 1];
        const c = base[i + 1][j + 1];
        const d = base[i + 1][j];
        // u crece, s crece: u × s = +v (mira hacia fuera).
        this.idx[group].push(a, b, c, a, c, d);
      }
    }
  }

  quad(a: Pt, b: Pt, c: Pt, d: Pt, group: 0 | 1 | 2) {
    const i = [a, b, c, d].map((p) => this.vert(p));
    this.idx[group].push(i[0], i[1], i[2], i[0], i[2], i[3]);
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx.flat());
    let o = 0;
    this.idx.forEach((l, k) => {
      if (l.length) g.addGroup(o, l.length, k);
      o += l.length;
    });
    g.computeVertexNormals();
    return g;
  }
}

/** Un punto del contorno de la punta desplazado `d` hacia dentro (curva
 *  paralela de la ojiva con nariz), en t ∈ [0, 1]: [u, x desde su arranque]. */
function tipPoint(h: number, tip: { L: number; r: number }, d: number, t: number): [number, number] {
  const rho = (h * h + tip.L * tip.L) / (2 * h);
  const k = rho - h;
  if (d < tip.r) {
    const xc = Math.sqrt((rho - tip.r) ** 2 - k * k);
    const thT = Math.asin(xc / (rho - tip.r));
    const T1 = 0.8;
    if (t <= T1) {
      const th = (thT * t) / T1;
      return [(rho - d) * Math.cos(th) - k, (rho - d) * Math.sin(th)];
    }
    const ph = thT + (Math.PI / 2 - thT) * ((t - T1) / (1 - T1));
    return [(tip.r - d) * Math.cos(ph), xc + (tip.r - d) * Math.sin(ph)];
  }
  const thM = Math.acos(Math.min(1, k / (rho - d)));
  const th = thM * t;
  return [Math.max(0, (rho - d) * Math.cos(th) - k), (rho - d) * Math.sin(th)];
}

/** Largo real de la punta (hasta la nariz). */
function tipLength(h: number, tip: { L: number; r: number }): number {
  return tipPoint(h, tip, 0, 1)[1];
}

/** Sombra de contacto que el cuarto de luz no da (multiplica el color): la de
 *  la punta de la cola sobre la correa de las 12, la de las trabillas sobre la
 *  cola y la del asa en el arranque. */
function contactShade(kind: Soft, punta: boolean): (u: number, s: number) => number {
  const { len6, keepers } = STRAP_HOLES[kind];
  const lug = (s: number) => 0.62 + 0.38 * smooth(0.3, 2.2, s);
  if (punta) {
    return (_u, s) => {
      let f = lug(s);
      for (const k of keepers) {
        const d = Math.abs(s - (2 * L_BOTTOM - k.s)) - k.len / 2;
        f *= d < 0 ? 0.45 : 1 - 0.5 * Math.exp(-d / 0.75);
      }
      return f;
    };
  }
  // El contorno de la cola puesto sobre la de las 12 (s12 = 2L − s6).
  const h = WIDTH[kind](len6) / 2;
  const tip = TIP[kind];
  const L = tipLength(h, tip);
  const sT = 2 * L_BOTTOM - (len6 - L);
  const line: [number, number][] = [];
  for (let k = 0; k <= 24; k++) {
    const [u, x] = tipPoint(h, tip, 0, k / 24);
    line.push([u, sT - x]);
  }
  return (u, s) => {
    const a = Math.abs(u);
    let f = lug(s);
    if (s < sT - L - 8) return f;
    let inside = false;
    let d = 99;
    if (s >= sT) {
      inside = a < h;
      d = Math.abs(a - h);
    } else {
      for (let k = 0; k < line.length; k++) {
        d = Math.min(d, Math.hypot(a - line[k][0], s - line[k][1]));
        if (k > 0 && s <= line[k - 1][1] && s >= line[k][1]) inside = a < line[k][0];
      }
    }
    f *= inside ? 0.5 : 1 - 0.5 * Math.exp(-d / 1.0);
    return f;
  };
}

/** Banda de caucho o piel, lista para posar. `fin`: "punta" (la de las 6, con
 *  sus agujeros) o "recto". `shift`: dónde cae el grabado (mm). */
export function bandGeometry(kind: Soft, S: number, fin: "punta" | "recto", shift = 0): THREE.BufferGeometry {
  const caucho = kind === "caucho";
  const width = WIDTH[kind];
  const thick = THICK[kind];
  const tip = TIP[kind];
  const punta = fin === "punta";
  const hEnd = width(S) / 2;
  const sTip = punta ? S - tipLength(hEnd, tip) : S;
  const holes = punta ? STRAP_HOLES[kind].holes : [];

  // — Filas ————————————————————————————————————————————————————————————
  const rows: Row[] = [];
  const plain = (s: number, t = -1): Row => ({ s, t, rib: 0, ribAo: 1, floor: 0 });
  /** Las costillas se van apagando hacia el final del panel (foto 1). */
  const fade = (s: number) => 1 - 0.5 * smooth(22, 31, s);
  const rib = (s: number, q: "floor" | "lip" | "edge" | "top"): Row => {
    const f = fade(s);
    const floor = -(RIB.drop + RIB.depth) * f;
    const v = q === "floor" ? floor : (-RIB.drop + (q === "lip" ? -0.07 : q === "top" ? RIB.crown : 0)) * f;
    return { s, t: -1, rib: v, ribAo: q === "floor" ? lerp(0.72, 0.3, f) : q === "lip" ? 0.82 : 1, floor };
  };
  if (caucho) {
    rows.push(plain(0), plain(1.3));
    const n = Math.round((RIB.s1 - RIB.s0) / RIB.period);
    const P = RIB.period;
    for (let k = 0; k < n; k++) {
      const b = RIB.s0 + k * P;
      const a0 = RIB.floor + RIB.wall;
      const a1 = P - RIB.wall;
      rows.push(rib(b, "floor"), rib(b + RIB.floor, "floor"));
      rows.push(rib(b + a0, "lip"), rib(b + a0 + RIB.edge, "edge"));
      rows.push(rib(b + (a0 + a1) / 2, "top"));
      rows.push(rib(b + a1 - RIB.edge, "edge"), rib(b + a1, "lip"));
    }
    rows.push(rib(RIB.s1, "floor"), rib(RIB.s1 + RIB.floor, "floor"), plain(RIB.s1 + 0.5));
  } else {
    for (const s of [0, 0.8, 1.6, NOTCH_S, 3.2, 4, 5, 6, 7, 8]) rows.push(plain(s));
  }
  // El resto: cada ≈1 mm, con filas exactas en el borde de cada agujero.
  {
    const marks = [rows[rows.length - 1].s];
    for (const h of holes) marks.push(h - 1.6, h + 1.6);
    marks.push(sTip);
    // Filas propias donde cae una sombra de contacto (fuera de los agujeros).
    const free = (s: number) => s < sTip - 0.4 && !holes.some((h) => Math.abs(s - h) < 1.9);
    if (punta)
      for (const k of STRAP_HOLES[kind].keepers)
        for (const s of [-k.len / 2 - 1.2, -k.len / 2, k.len / 2, k.len / 2 + 1.2].map((d) => 2 * L_BOTTOM - k.s + d)) if (free(s)) marks.push(s);
    marks.sort((a, b) => a - b);
    for (let i = 0; i + 1 < marks.length; i++) {
      const n = Math.max(1, Math.ceil((marks[i + 1] - marks[i]) / 1.05));
      for (let k = 1; k <= n; k++) rows.push(plain(lerp(marks[i], marks[i + 1], k / n)));
    }
    if (punta) for (let k = 1; k <= 24; k++) rows.push(plain(sTip, k / 24));
  }

  // — Dónde cae cada columna ———————————————————————————————————————————
  const hwAt = (r: Row) => (r.t < 0 ? width(r.s) / 2 : hEnd);
  const thAt = (r: Row) => thick(r.s) * (r.t < 0 ? 1 : 1 - 0.22 * smooth(0, 1, r.t));
  /** Columna a `d` mm del canto (curva paralela en la punta). */
  const off = (r: Row, d: number, side: 1 | -1): { u: number; s: number } => {
    if (r.t < 0) return { u: side * (width(r.s) / 2 - d), s: r.s };
    const [u, x] = tipPoint(hEnd, tip, d, r.t);
    return { u: side * u, s: sTip + x };
  };
  /** Borde interior liso (de ahí al centro, columnas fijas en u). */
  const dIn = caucho ? CANTO.rail + 0.1 : PAD.foot + PAD.shoulder;
  const inner = (r: Row, u: number): { u: number; s: number } => {
    if (r.t < 0) return { u, s: r.s };
    const [w, x] = tipPoint(hEnd, tip, dIn, r.t);
    return { u: (u * w) / (hEnd - dIn), s: sTip + x };
  };

  const band = new Band(
    caucho ? (p) => [p.u / 6, p.s / 6] : (p) => [0.5 + p.u / width(Math.min(p.s, sTip)), (p.s + shift) / CROCO_TILE_MM],
    contactShade(kind, punta),
  );
  const panelHalf = (r: Row) => Math.min(RIB.panel * 2 * hwAt(r), NOTCH_HALF);
  /** Borde de la muesca y, más allá, la columna que la sigue. */
  const notchU = (r: Row) => (caucho ? panelHalf(r) : Math.min(NOTCH_HALF, hwAt(r) - dIn - 0.05));
  const iNotch = rows.findIndex((r) => r.s >= NOTCH_S - 1e-6);
  const inNotch = (i: number) => i < iNotch;
  // Celdas con agujero: la franja |u| < HOLE_U entre h − 1.6 y h + 1.6.
  const holed = new Set<number>();
  rows.forEach((r, i) => {
    if (i + 1 < rows.length && r.t < 0 && rows[i + 1].t < 0)
      for (const h of holes) if (r.s >= h - 1.6 - 1e-6 && rows[i + 1].s <= h + 1.6 + 1e-6) holed.add(i);
  });

  const top = (r: Row) => thAt(r) / 2;
  // Columnas del centro (más finas en la de las 12: ahí cae la sombra de la
  // punta de la cola) y cuál de sus celdas se abre para los agujeros.
  const midU = holes.length ? [-4.2, -HOLE_U, HOLE_U, 4.2] : [-4.2, -HOLE_U, -1.3, 0, 1.3, HOLE_U, 4.2];
  const jHole = 1;
  if (caucho) {
    // — Cara: riel · pared · ranura lateral · listones · … ————————————————
    for (const side of [-1, 1] as const) {
      const ord = (a: ColFn[]) => (side < 0 ? a : [...a].reverse());
      const P = panelHalf;
      const railOut: ColFn = (r) => ({ ...off(r, dIn, side), v: top(r), ao: 1 });
      const railIn: ColFn = (r) => ({ ...inner(r, side * P(r)), v: top(r), ao: 1 });
      band.run(rows, ord([railOut, railIn]), 0);
      // La pared del riel y la ranura oscura junto al listón (solo en el panel).
      const inPanel = (i: number) => !inNotch(i) && (rows[i].floor < 0 || rows[i + 1].floor < 0);
      const wallB: ColFn = (r) => ({ ...inner(r, side * (P(r) - 0.02)), v: top(r) + r.floor, ao: 0.34 });
      band.run(rows, ord([(r) => ({ ...railIn(r), ao: 0.92 }), wallB]), 0, inPanel);
      const floorIn: ColFn = (r) => ({ ...inner(r, side * (P(r) - RIB.side)), v: top(r) + r.floor, ao: 0.3 });
      band.run(rows, ord([wallB, floorIn]), 0, inPanel);
      const slatB: ColFn = (r) => ({ ...inner(r, side * (P(r) - RIB.side)), v: top(r) + r.floor, ao: 0.32 });
      const slatT: ColFn = (r) => ({ ...inner(r, side * (P(r) - RIB.side - 0.07)), v: top(r) + r.rib, ao: r.ribAo });
      band.run(rows, ord([slatB, slatT]), 0, inPanel);
    }
    const slat =
      (u: (r: Row) => number): ColFn =>
      (r) => ({ ...inner(r, u(r)), v: top(r) + r.rib, ao: r.ribAo });
    const edgeU = (r: Row) => panelHalf(r) - RIB.side - 0.07;
    band.run(
      rows,
      [slat((r) => -edgeU(r)), ...midU.map((u) => slat(() => u)), slat((r) => edgeU(r))],
      0,
      (i, j) => !inNotch(i) && !(j === 1 + jHole && holed.has(i)),
    );
    // Fuera del panel, los 0.22 mm de la ranura lateral son cara lisa.
    for (const side of [-1, 1] as const) {
      const a: ColFn = (r) => ({ ...inner(r, side * panelHalf(r)), v: top(r), ao: 1 });
      const b: ColFn = (r) => ({ ...inner(r, side * edgeU(r)), v: top(r), ao: 1 });
      band.run(rows, side < 0 ? [a, b] : [b, a], 0, (i) => !inNotch(i) && rows[i].floor === 0 && rows[i + 1].floor === 0);
    }
    // — Canto en dos niveles ————————————————————————————————————————————
    const C = CANTO;
    for (const side of [1, -1] as const) {
      const ord = (a: ColFn[]) => (side > 0 ? a : [...a].reverse());
      const e =
        (d: number, dv: number, ao: number): ColFn =>
        (r) => ({ ...off(r, d, side), v: top(r) + dv, ao });
      const y2 = -(C.chamfer + C.wall);
      band.run(rows, ord([e(dIn, 0, 1), e(C.rail, -0.035, 1), e(C.step + 0.05, -C.chamfer + 0.04, 0.98), e(C.step, -C.chamfer - 0.06, 0.94)]), 2);
      band.run(rows, ord([e(C.step, -C.chamfer - 0.06, 0.9), e(C.step, y2 + 0.12, 0.6), e(C.step - 0.03, y2, 0.42)]), 2);
      band.run(rows, ord([e(C.step - 0.03, y2, 0.5), e(0.09, y2 - 0.01, 0.92), e(0, y2 - 0.1, 1)]), 2);
      const low: ColFn[] = [e(0, y2 - 0.1, 1)];
      const b =
        (a: number): ColFn =>
        (r) => ({ ...off(r, C.r * (1 - Math.cos(a)), side), v: -top(r) + C.r * (1 - Math.sin(a)), ao: lerp(0.96, 0.86, a / (Math.PI / 2)) });
      for (let k = 0; k <= 4; k++) low.push(b((Math.PI / 2) * (k / 4)));
      band.run(rows, ord(low), 2);
    }
  } else {
    // — Piel: cara acolchada de una sola tira (lisa) ————————————————————————
    const ds = [0.42, 0.9, 1.35, 1.62, PAD.stitch, 2.18, PAD.foot, 2.7, 3.05, 3.4, 3.75, PAD.foot + PAD.shoulder];
    const face = (d: number, r: Row) => {
      const pad = padHeight(r.s) * (r.t < 0 ? 1 : 1 - 0.5 * r.t);
      // El pespunte tira de la piel: un surco de 0.1 a su paso.
      const groove = 0.11 * Math.exp(-(((d - PAD.stitch) / 0.28) ** 2)) * (r.s > 3 ? 1 : 0);
      // El canto baja un poco (la piel se adelgaza para coserla).
      const skive = 0.12 * (1 - smooth(0.4, 1.7, d));
      return top(r) + pad * padShape(d) - groove - skive;
    };
    const aoOf = (d: number) => 1 - 0.22 * Math.exp(-(((d - PAD.stitch) / 0.3) ** 2)) - 0.1 * Math.exp(-(((d - PAD.foot) / 0.35) ** 2));
    const L: ColFn[] = ds.map((d) => (r) => ({ ...off(r, d, -1), v: face(d, r), ao: aoOf(d) }));
    const R: ColFn[] = ds.map((d): ColFn => (r) => ({ ...off(r, d, 1), v: face(d, r), ao: aoOf(d) })).reverse();
    const flat =
      (u: (r: Row) => number): ColFn =>
      (r) => ({ ...inner(r, u(r)), v: face(99, r), ao: 1 });
    const mid: ColFn[] = [flat((r) => -notchU(r)), ...midU.map((u) => flat(() => u)), flat(notchU)];
    const cols = [...L, ...mid, ...R];
    const jm = L.length; // cols[jm] = el borde izquierdo de la muesca
    // En la muesca faltan las celdas del centro; con agujero, la suya.
    band.run(rows, cols, 0, (i, j) =>
      inNotch(i) ? j < jm || j > jm + mid.length - 2 : !(j === jm + 1 + jHole && holed.has(i)),
    );
    // — Canto pintado: redondo arriba y abajo, recto en medio ——————————————
    const r0 = 0.42;
    const r1 = 0.3;
    for (const side of [1, -1] as const) {
      const c: ColFn[] = [];
      for (let k = 0; k <= 4; k++) {
        const a = (Math.PI / 2) * (k / 4);
        c.push((r) => ({ ...off(r, r0 * (1 - Math.sin(a)), side), v: face(r0, r) - r0 * (1 - Math.cos(a)), ao: 1 }));
      }
      for (let k = 0; k <= 3; k++) {
        const a = (Math.PI / 2) * (k / 3);
        c.push((r) => ({ ...off(r, r1 * (1 - Math.cos(a)), side), v: -top(r) + r1 * (1 - Math.sin(a)), ao: lerp(1, 0.85, k / 3) }));
      }
      band.run(rows, side > 0 ? c : [...c].reverse(), 2);
    }
  }

  // — Forro ————————————————————————————————————————————————————————————
  {
    const dB = caucho ? CANTO.r : 0.3;
    const bot = (r: Row) => -top(r);
    const P = notchU;
    const c: ColFn[] = [
      (r) => ({ ...off(r, dB, 1), v: bot(r), ao: 0.95 }),
      (r) => ({ ...inner(r, P(r)), v: bot(r), ao: 1 }),
      (r) => ({ ...inner(r, HOLE_U), v: bot(r), ao: 1 }),
      (r) => ({ ...inner(r, -HOLE_U), v: bot(r), ao: 1 }),
      (r) => ({ ...inner(r, -P(r)), v: bot(r), ao: 1 }),
      (r) => ({ ...off(r, dB, -1), v: bot(r), ao: 0.95 }),
    ];
    band.run(rows, c, 1, (i, j) => (inNotch(i) ? j === 0 || j === 4 : !(j === 2 && holed.has(i))));
  }

  // — La muesca: sus dos costados y el fondo ————————————————————————————————
  {
    const nr = rows.slice(0, iNotch + 1);
    const edgeTop = (r: Row) => (caucho ? top(r) : top(r) + padHeight(r.s) * padShape(hwAt(r) - NOTCH_HALF));
    for (const side of [1, -1] as const) {
      const P = notchU;
      const a: ColFn = (r) => ({ u: side * P(r), s: r.s, v: edgeTop(r), ao: 0.9 });
      const b: ColFn = (r) => ({ u: side * P(r), s: r.s, v: -top(r), ao: 0.7 });
      band.run(nr, side > 0 ? [b, a] : [a, b], 2);
    }
    const r = rows[iNotch];
    const P = notchU(r);
    const vt = caucho ? top(r) + r.floor : top(r) + padHeight(r.s);
    const p = (u: number, v: number, ao: number): Pt => ({ u, s: r.s, v, ao });
    band.quad(p(P, vt, 0.5), p(-P, vt, 0.5), p(-P, -top(r), 0.6), p(P, -top(r), 0.6), 2);
  }
  // — La tapa del extremo recto (bajo la hebilla) ————————————————————————————
  if (!punta) {
    const r = rows[rows.length - 1];
    const w = hwAt(r) - 0.2;
    const p = (u: number, v: number): Pt => ({ u, s: r.s, v, ao: 0.8 });
    const vt = caucho ? top(r) : top(r) + padHeight(r.s) * 0.5;
    band.quad(p(-w, -top(r)), p(w, -top(r)), p(w, vt), p(-w, vt), 2);
  }

  // — Agujeros que atraviesan: parche con hueco arriba y abajo, bisel y pared —
  for (const h of holes) {
    const [hw, hl, hr] = HOLE[kind];
    const out = roundRect2(hw + 2 * HOLE_BEVEL, hl + 2 * HOLE_BEVEL, hr + HOLE_BEVEL, 4).map((q) => new THREE.Vector2(q.x, q.y + h));
    const ins = roundRect2(hw, hl, hr, 4).map((q) => new THREE.Vector2(q.x, q.y + h));
    const zone = rows.filter((r) => r.t < 0 && r.s >= h - 1.6 - 1e-6 && r.s <= h + 1.6 + 1e-6).map((r) => r.s);
    const contour = [...zone.map((s) => new THREE.Vector2(HOLE_U, s)), ...[...zone].reverse().map((s) => new THREE.Vector2(-HOLE_U, s))];
    const vTop = (s: number) => thick(s) / 2 + (caucho ? 0 : padHeight(s));
    const vBot = (s: number) => -thick(s) / 2;
    const plate = (hole: THREE.Vector2[], v: (s: number) => number, group: 0 | 1, up: boolean, ao: number) => {
      const faces = THREE.ShapeUtils.triangulateShape(contour, [[...hole].reverse()]);
      const all = [...contour, ...[...hole].reverse()];
      const ids = all.map((q, k) => band.vert({ u: q.x, s: q.y, v: v(q.y), ao: k < contour.length ? 1 : ao }));
      for (const [a, b, c] of faces) {
        const A = all[a];
        const B = all[b];
        const C = all[c];
        const ccw = (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x) > 0;
        if (ccw === up) band.idx[group].push(ids[a], ids[b], ids[c]);
        else band.idx[group].push(ids[a], ids[c], ids[b]);
      }
    };
    plate(out, vTop, 0, true, 0.9);
    plate(ins, vBot, 1, false, 0.75);
    // Bisel y pared (miran hacia dentro del agujero).
    const n = ins.length;
    const rings: { pts: THREE.Vector2[]; v: (s: number) => number; ao: number }[] = [
      { pts: out, v: vTop, ao: 0.78 },
      { pts: ins, v: (s) => vTop(s) - 0.14, ao: 0.5 },
      { pts: ins, v: (s) => vTop(s) - 0.7, ao: 0.2 },
      { pts: ins, v: vBot, ao: 0.26 },
    ];
    for (let q = 0; q + 1 < rings.length; q++) {
      const A = rings[q];
      const B = rings[q + 1];
      const ia = A.pts.map((p) => band.vert({ u: p.x, s: p.y, v: A.v(p.y), ao: A.ao }));
      const ib = B.pts.map((p) => band.vert({ u: p.x, s: p.y, v: B.v(p.y), ao: B.ao }));
      for (let k = 0; k < n; k++) {
        const m = (k + 1) % n;
        band.idx[q === 0 ? 0 : 3].push(ia[k], ia[m], ib[m], ia[k], ib[m], ib[k]);
      }
    }
  }

  // — Almohadilla de la punta (caucho): cuña en forma de púa ————————————————
  if (caucho && punta) tipPad(band, S - 9.2, (s) => thick(s) / 2);

  return toStrapSpace(band.geometry());
}

/** La almohadilla de la punta (foto 1): nace a ras por su lado ancho y sube
 *  0.5 mm hasta el pico, con el borde vivo. Centrada en s = c. */
function tipPad(band: Band, c: number, top: (s: number) => number) {
  const sh = new THREE.Shape();
  sh.moveTo(-2.9, -3.6);
  sh.lineTo(2.9, -3.6);
  sh.quadraticCurveTo(4.1, -3.6, 3.8, -2.3);
  sh.quadraticCurveTo(3.1, 1.4, 1.0, 3.35);
  sh.quadraticCurveTo(0, 4.15, -1.0, 3.35);
  sh.quadraticCurveTo(-3.1, 1.4, -3.8, -2.3);
  sh.quadraticCurveTo(-4.1, -3.6, -2.9, -3.6);
  const pts = sh.getPoints(7).slice(0, -1);
  const H = (y: number) => 0.06 + 0.46 * smooth(-3.6, 2.2, y);
  const rings: { k: number; f: number; ao: number }[] = [
    { k: 1, f: 0, ao: 0.62 },
    { k: 0.965, f: 0.55, ao: 0.85 },
    { k: 0.92, f: 0.9, ao: 1 },
    { k: 0.86, f: 1, ao: 1 },
    { k: 0.45, f: 1, ao: 1 },
  ];
  const ids = rings.map(({ k, f, ao }) =>
    pts.map((q) => {
      const s = c + q.y * k;
      return band.vert({ u: q.x * k, s, v: top(s) * 0.985 + (f === 0 ? -0.02 : H(q.y * k) * f) + 0.02, ao });
    }),
  );
  const ctr = band.vert({ u: 0, s: c, v: top(c) * 0.985 + H(0) + 0.02, ao: 1 });
  const n = pts.length;
  for (let r = 0; r + 1 < ids.length; r++)
    for (let j = 0; j < n; j++) {
      const m = (j + 1) % n;
      band.idx[0].push(ids[r][j], ids[r][m], ids[r + 1][m], ids[r][j], ids[r + 1][m], ids[r + 1][j]);
    }
  const last = ids[ids.length - 1];
  for (let j = 0; j < n; j++) band.idx[0].push(last[j], last[(j + 1) % n], ctr);
}

// ===========================================================================
// Trabillas, pespunte y pasadores (también en el espacio de la correa)
// ===========================================================================
/** Una trabilla: el aro alrededor de la correa de las 12 y la cola de la de
 *  las 6, en el espacio de la pista de las 12. La del caucho (foto 1) lleva 9
 *  surcos a lo ancho cada 0.8 con 1.9 lisos a cada lado; la de piel es lisa y
 *  más delgada (fotos 5 y 9). */
export function keeperGeometry(kind: Soft, s: number, len: number): THREE.BufferGeometry {
  const caucho = kind === "caucho";
  const th = strapThick(kind, s);
  const w = strapWidth(kind, s);
  const wall = caucho ? 1.5 : 1.15;
  // Por dentro: la de las 12 (v = 0) y la cola encima (v = th + 0.3).
  const innerW = w + 0.3;
  const v0 = -th / 2 - 0.15;
  const v1 = 3.5 + strapTop(kind, 118) + 0.15;
  const W = innerW / 2 + wall;
  const zTop = v1 + wall;
  const zBot = v0 - 0.85;
  const rc = caucho ? 0.9 : 0.7;
  const Ug = W - 1.9;
  // El aro por fuera (u, v), antihorario visto desde −s; la cara de arriba con
  // sus puntos propios para los surcos.
  const path: { u: number; v: number; g: number; face: 0 | 1 | 2 | 3 }[] = [];
  const corner = (cu: number, cv: number, a0: number) => {
    for (let k = 0; k <= 5; k++) {
      const a = a0 + (Math.PI / 2) * (k / 5);
      path.push({ u: cu + rc * Math.cos(a), v: cv + rc * Math.sin(a), g: 0, face: 3 });
    }
  };
  corner(W - rc, zTop - rc, 0);
  if (caucho) {
    for (const [u, g] of [
      [Ug + 0.12, 0],
      [Ug, 1],
      [Ug / 3, 1],
      [-Ug / 3, 1],
      [-Ug, 1],
      [-Ug - 0.12, 0],
    ] as const)
      path.push({ u, v: zTop, g, face: 0 });
  }
  corner(-W + rc, zTop - rc, Math.PI / 2);
  corner(-W + rc, zBot + rc, Math.PI);
  corner(W - rc, zBot + rc, (3 * Math.PI) / 2);
  // Filas a lo largo: canto redondeado, surcos y canto redondeado.
  const r = caucho ? 0.45 : 0.3;
  interface Prof {
    s: number;
    inset: number;
    g: number;
    ao: number;
  }
  const body: Prof[] = [];
  if (caucho) {
    const n = 9;
    const q = 0.8;
    const s0 = -((n - 1) * q) / 2;
    for (let k = 0; k < n; k++) {
      const c = s0 + k * q;
      body.push(
        { s: c - 0.26, inset: 0, g: 0, ao: 1 },
        { s: c - 0.14, inset: 0, g: 0.9, ao: 0.6 },
        { s: c, inset: 0, g: 1.1, ao: 0.5 },
        { s: c + 0.14, inset: 0, g: 0.9, ao: 0.6 },
        { s: c + 0.26, inset: 0, g: 0, ao: 1 },
      );
    }
  }
  const head: Prof[] = [];
  for (let k = 0; k <= 3; k++) {
    const a = (Math.PI / 2) * (k / 3);
    head.push({ s: -len / 2 + r - r * Math.cos(a), inset: r - r * Math.sin(a), g: 0, ao: 1 });
  }
  const tail = head.map((p) => ({ ...p, s: -p.s })).reverse();
  const all = [...head, ...body, ...tail];
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  let acc = 0;
  const per: number[] = path.map((p, i) => {
    if (i > 0) acc += Math.hypot(p.u - path[i - 1].u, p.v - path[i - 1].v);
    return acc;
  });
  const ctrU = 0;
  const ctrV = (zTop + zBot) / 2;
  const N = path.length;
  // Piel: la cara de arriba de un lado a otro de la textura; los costados
  // vuelven sobre ella (el pliegue cae en la esquina).
  // Cada trabilla, de una fila distinta: dos iguales seguidas parecían copia.
  const fila = STRAP_HOLES[kind].keepers.findIndex((k) => k.s === s) === 1 ? 53 : 35.6;
  const keeperU = (u: number, v: number) => 0.5 + (v > zTop - rc - 1e-4 ? (0.4 * u) / W : Math.sign(u) * (0.4 - (zTop - rc - v) / 20));
  const push = (u: number, sv: number, v: number, a: number, b: number, ao: number) => {
    pos.push(u, sv, v);
    // Piel: un trozo liso de una fila (con su pliegue largo cruzando el aro).
    uv.push(caucho ? a / 6 : keeperU(u, v), caucho ? b / 6 : (fila + b - s) / CROCO_TILE_MM);
    col.push(ao, ao, ao);
    return pos.length / 3 - 1;
  };
  // Cara de fuera (cerrada a lo ancho).
  for (const p of all) {
    for (let j = 0; j <= N; j++) {
      const q = path[j % N];
      // El canto redondeado encoge el aro hacia su centro.
      const du = Math.sign(q.u - ctrU) * Math.min(p.inset, Math.abs(q.u - ctrU));
      const dv = Math.sign(q.v - ctrV) * p.inset;
      const flat = q.face === 0;
      const groove = flat ? 0.15 * p.g * q.g : 0;
      push(q.u - (flat ? 0 : du), s + p.s, q.v - dv - groove, j < N ? per[j] : acc + 4, s + p.s, flat && q.g && p.g ? p.ao : 1);
    }
  }
  const M = N + 1;
  for (let i = 0; i + 1 < all.length; i++)
    for (let j = 0; j < N; j++) {
      const a = i * M + j;
      const b = (i + 1) * M + j;
      // El camino va antihorario mirando hacia +s: por fuera, (a, a+1, b+1).
      idx.push(a, b + 1, a + 1, a, b, b + 1);
    }
  // Tapas: el canto del aro (de fuera adentro) en los dos extremos, y por
  // dentro hasta medio largo (lo que se ve asomarse).
  const inU = innerW / 2;
  const innerPt = (q: { u: number; v: number }) => {
    const u = Math.max(-inU, Math.min(inU, q.u));
    const v = Math.max(v0, Math.min(v1, q.v));
    return { u, v };
  };
  for (const end of [0, 1] as const) {
    const p = end ? all[all.length - 1] : all[0];
    const base = end ? (all.length - 1) * M : 0;
    const ia: number[] = [];
    const ib: number[] = [];
    const ic: number[] = [];
    for (let j = 0; j <= N; j++) {
      const q = path[j % N];
      const o = base + j;
      ia.push(push(pos[o * 3], s + p.s, pos[o * 3 + 2], per[j % N], s, 0.95));
      const n = innerPt(q);
      ib.push(push(n.u, s + p.s, n.v, per[j % N], s, 0.6));
      ic.push(push(n.u, s + p.s * 0.2, n.v, per[j % N], s, 0.3));
    }
    for (let j = 0; j < N; j++) {
      if (end) {
        idx.push(ia[j], ib[j + 1], ia[j + 1], ia[j], ib[j], ib[j + 1]);
        idx.push(ib[j], ic[j + 1], ib[j + 1], ib[j], ic[j], ic[j + 1]);
      } else {
        idx.push(ia[j], ia[j + 1], ib[j + 1], ia[j], ib[j + 1], ib[j]);
        idx.push(ib[j], ib[j + 1], ic[j + 1], ib[j], ic[j + 1], ic[j]);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return toStrapSpace(g);
}

/** Rectángulo redondeado centrado (puntos antihorarios). */
export function roundRect2(w: number, h: number, r: number, seg = 5): THREE.Vector2[] {
  const rr = Math.min(r, w / 2, h / 2);
  const out: THREE.Vector2[] = [];
  const corners: [number, number, number][] = [
    [w / 2 - rr, -h / 2 + rr, -Math.PI / 2],
    [w / 2 - rr, h / 2 - rr, 0],
    [-w / 2 + rr, h / 2 - rr, Math.PI / 2],
    [-w / 2 + rr, -h / 2 + rr, Math.PI],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + ((Math.PI / 2) * i) / seg;
      out.push(new THREE.Vector2(cx + rr * Math.cos(a), cy + rr * Math.sin(a)));
    }
  }
  return out;
}

/** Una puntada (a lo largo de y): hilo de dos cabos retorcidos, Ø0.56, que se
 *  mete en la piel por las dos puntas. */
function threadGeometry(): THREE.BufferGeometry {
  const LEN = 2.4;
  const N = 9;
  const R = 7;
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * 2 - 1;
    const r0 = 0.27 * Math.pow(Math.max(0, 1 - t ** 6), 0.5) + 0.02;
    for (let j = 0; j < R; j++) {
      const a = (j / R) * Math.PI * 2;
      const tw = Math.cos(2 * a - t * 5.2);
      const r = r0 * (1 + 0.16 * tw);
      pos.push(r * Math.cos(a), (t * LEN) / 2, 0.85 * r * Math.sin(a) - 0.24 * t ** 4);
      uv.push(0, 0);
      const c = (0.82 + 0.18 * tw) * (1 - 0.45 * t ** 6);
      col.push(c, c, c);
    }
    if (i > 0)
      for (let j = 0; j < R; j++) {
        const a = (i - 1) * R + j;
        const b = (i - 1) * R + ((j + 1) % R);
        idx.push(a, i * R + j, b, b, i * R + j, i * R + ((j + 1) % R));
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const out = g.toNonIndexed();
  g.dispose();
  return out;
}

/** Pespunte de la piel (fotos 5, 9 y 10): puntadas Ø0.56 cada 3.0 mm a 1.9 del
 *  canto, medio hundidas y ladeadas 8° alternas, siguiendo el contorno (también
 *  la ojiva), con el agujero oscuro de la aguja entre una y otra. */
export function stitchGeometry(S: number, fin: "punta" | "recto"): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const pitch = 3.0;
  const cap = threadGeometry();
  const hole = new THREE.CircleGeometry(0.3, 8).toNonIndexed();
  const paint = (g: THREE.BufferGeometry, c: number) => {
    const n = g.getAttribute("position").count;
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).fill(c), 3));
    return g;
  };
  const tip = TIP.piel;
  const hEnd = WIDTH.piel(S) / 2;
  const sTip = fin === "punta" ? S - tipLength(hEnd, tip) : S - 3;
  // El camino del pespunte de un lado (u, s, t de la punta), muy fino.
  const path: [number, number, number][] = [];
  for (let s = 3.4; s < sTip; s += 0.25) path.push([WIDTH.piel(s) / 2 - PAD.stitch, s, 0]);
  if (fin === "punta")
    for (let k = 0; k <= 60; k++) {
      const [u, x] = tipPoint(hEnd, tip, PAD.stitch, k / 60);
      path.push([u, sTip + x, k / 60]);
    }
  let acc = 0;
  let half = 1; // medios pasos: impar = puntada, par = agujero
  for (let i = 1; i < path.length; i++) {
    const [u0, s0] = path[i - 1];
    const [u1, s1, t1] = path[i];
    const l = Math.hypot(u1 - u0, s1 - s0);
    acc += l;
    for (; (half * pitch) / 2 <= acc; half++) {
      const f = 1 - (acc - (half * pitch) / 2) / (l || 1);
      const u = lerp(u0, u1, f);
      const s = lerp(s0, s1, f);
      const ang = Math.atan2(s1 - s0, u1 - u0) - Math.PI / 2;
      const puntada = half % 2 === 1;
      const v = (THICK.piel(s) / 2) * (1 - 0.22 * smooth(0, 1, t1)) - (puntada ? 0.07 : 0.085);
      for (const side of [-1, 1]) {
        const g = puntada ? cap.clone() : paint(hole.clone(), 0.12);
        if (puntada) g.rotateZ(side * ang + (half % 4 === 1 ? 1 : -1) * THREE.MathUtils.degToRad(8));
        g.translate(side * u, s, v);
        parts.push(g);
      }
    }
  }
  cap.dispose();
  hole.dispose();
  const out = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return toStrapSpace(out);
}

/** Los pasadores que asoman en los dos cantos junto a la caja (r11, r12, p12):
 *  un disco pulido Ø1.0 en el caucho, Ø1.2 con ranura en la piel. */
export function pinGeometry(kind: Soft): THREE.BufferGeometry {
  const r = kind === "caucho" ? 0.5 : 0.6;
  const parts: THREE.BufferGeometry[] = [];
  const s = 1.75;
  const hw = strapWidth(kind, s) / 2;
  for (const side of [1, -1] as const) {
    const disc = new THREE.CylinderGeometry(r * 0.86, r, 0.16, 24, 1).toNonIndexed();
    disc.rotateZ(side > 0 ? -Math.PI / 2 : Math.PI / 2);
    disc.translate(side * (hw + 0.04), s, -0.25);
    parts.push(disc);
  }
  const g = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return toStrapSpace(g);
}

// ===========================================================================
// El BLOQUE de metal que llena la muesca (caucho y piel; fotos 5 y 9, renders
// 13 y 19, p12), en coordenadas de la caja (fijo).
// ===========================================================================
/** Perfil (y, z) extruido a lo ancho: chaflán corto contra la caja, cara
 *  convexa que rueda sobre la punta del asa y baja hasta la correa; por detrás,
 *  cepillado y a ras del forro, con su tornillo ranurado. Grupos: 0 = pulido,
 *  1 = cepillado (por detrás). */
export function endLinkGeometry(): THREE.BufferGeometry {
  const w = CASE_DIM.notchHalfW * 2 - 0.22;
  const top: [number, number][] = [
    [CASE_DIM.notchY + 0.04, 0.3],
    [21.0, 0.95],
    [22.5, 0.88],
  ];
  // La cara convexa: un arco que sale casi plano y acaba casi vertical.
  const P0 = [22.5, 0.88];
  const P1 = [24.6, 0.7];
  const P2 = [25.5, -1.25];
  for (let k = 1; k <= 10; k++) {
    const t = k / 10;
    const a = (1 - t) ** 2;
    const b = 2 * t * (1 - t);
    const c = t * t;
    top.push([a * P0[0] + b * P1[0] + c * P2[0], a * P0[1] + b * P1[1] + c * P2[1]]);
  }
  const prof: [number, number][] = [...top, [24.72, -4.55], [CASE_DIM.notchY + 0.04, -4.3]];
  const sh = new THREE.Shape(prof.map(([y, z]) => new THREE.Vector2(y, z)));
  const bevel = 0.22;
  const g0 = new THREE.ExtrudeGeometry(sh, {
    depth: w - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 1,
  });
  // (x, y, z) de la extrusión = (y, z, x) de la caja.
  g0.translate(0, 0, -(w - 2 * bevel) / 2);
  const m = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
  g0.applyMatrix4(m);
  const g = toCreasedNormals(g0.index ? g0.toNonIndexed() : g0, THREE.MathUtils.degToRad(32));
  const p = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const polished: number[] = [];
  const brushed: number[] = [];
  for (let i = 0; i < p.count; i += 3) {
    const back = (nor.getZ(i) + nor.getZ(i + 1) + nor.getZ(i + 2)) / 3 < -0.85;
    (back ? brushed : polished).push(i, i + 1, i + 2);
  }
  // El tornillo: dos medias lunas (la ranura deja ver el cepillado de debajo).
  const extra: THREE.BufferGeometry[] = [];
  for (const k of [0, 1]) {
    const half = new THREE.Shape();
    half.absarc(0, 0, 1.0, 0.16, Math.PI - 0.16, false);
    half.closePath();
    const disc = new THREE.ExtrudeGeometry(half, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelOffset: -0.05, bevelSegments: 1, curveSegments: 14 });
    disc.rotateZ(k * Math.PI + 0.5);
    disc.translate(0, 22.6, -4.56);
    extra.push(disc.index ? disc.toNonIndexed() : disc);
  }
  const scr = mergeGeometries(extra);
  extra.forEach((e) => e.dispose());
  const out = new THREE.BufferGeometry();
  const take = (src: THREE.BufferGeometry, ids: number[], pos: number[], nn: number[]) => {
    const a = src.getAttribute("position");
    const b = src.getAttribute("normal");
    for (const i of ids) {
      pos.push(a.getX(i), a.getY(i), a.getZ(i));
      nn.push(b.getX(i), b.getY(i), b.getZ(i));
    }
  };
  const pos: number[] = [];
  const nn: number[] = [];
  take(g, polished, pos, nn);
  const scrN = scr.getAttribute("position").count;
  take(scr, Array.from({ length: scrN }, (_, i) => i), pos, nn);
  const n0 = pos.length / 3;
  take(g, brushed, pos, nn);
  const uv: number[] = [];
  for (let i = 0; i < pos.length / 3; i++) uv.push(pos[i * 3], pos[i * 3 + 1]);
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nn, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  out.addGroup(0, n0, 0);
  out.addGroup(n0, pos.length / 3 - n0, 1);
  g0.dispose();
  g.dispose();
  scr.dispose();
  return out;
}
