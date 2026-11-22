// ---------------------------------------------------------------------------
// CORREAS en el ESPACIO LOCAL de la correa (s a lo largo desde el asa, u a lo
// ancho, v hacia fuera de la muñeca). Se construyen UNA vez "en recto"
// (x = u, y = s, z = v) y se colocan con ../pose.ts (cerrada en la muñeca de
// 17 cm o abierta boca abajo). Tres maneras de vestir la muñeca:
//   caucho     banda barrida con su sección real: rieles laterales y panel
//              central rebajado con costillas (RIB.dir) junto a la caja;
//   piel       banda acolchada (corona de 0.55 mm), grabado cocodrilo en las
//              texturas, pespunte de hilo (cápsulas) y canto pintado;
//   brazalete  eslabones H (piezas rígidas colocadas con los marcos) sobre un
//              alma oscura que sigue la curva (las juntas se leen oscuras).
// Y el CIERRE (ver geo/clasp.ts para las piezas de metal):
//   hebilla      la de las 12 acaba en L − 7 abrazando la barra; la de las 6
//                mide 120, pasa por el marco y su cola sube por fuera de la
//                de las 12, sujeta por dos trabillas; 7 agujeros cada 7 mm;
//   desplegable  las dos acaban en recto en L − 8 sobre su bisagra;
//   brazalete    eslabones hasta la tapa del cierre plegable (30 mm, abajo).
// L = L_BOTTOM: arco del asa al punto de abajo (≈ 78.9 mm).
// Grupos de material de una banda: 0 = cara vista, tapas y biseles de los
// agujeros; 1 = forro (contra la muñeca, liso); 2 = cantos (la piel los
// pinta).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CASE_DIM } from "./outline";
import { CROCO_TILE_MM } from "../tex/maps";
import { L_BOTTOM, toStrapSpace } from "../pose";

export type StrapKind = "caucho" | "piel" | "brazalete";
export type ClaspKind = "puas" | "desplegable" | "brazalete";

/** Costillas del caucho. `dir`: "trans" (las de las capas y los renders del
 *  dueño, por defecto) o "long" (las de las fotos del proveedor, refs 1 y 7).
 *  Pregunta Q1 al dueño (SPEC §9). */
export const RIB: { dir: "trans" | "long"; s0: number; s1: number; period: number; panel: number; depth: number; rib: number } = {
  dir: "trans",
  s0: 2.4,
  s1: 26,
  period: 1.15,
  panel: 0.31,
  depth: 0.5,
  rib: 0.42,
};

/** Agujeros de la correa de las 6. "redondo" hoy; "oblongo" (3.2 × 1.8) si
 *  el dueño confirma la ref 1. Cada agujero lleva un bisel de 0.2 mm. */
export const HOLE: { forma: "redondo" | "oblongo"; d: number; oblongo: readonly [number, number]; bevel: number } = {
  forma: "redondo",
  d: 1.9,
  oblongo: [3.2, 1.8],
  bevel: 0.2,
};

/** Cómo acaba la piel junto a la caja: con terminal de metal (refs 5, 9) o
 *  con muesca sin terminal (ref 10). Pregunta Q2 al dueño. */
export const PIEL: { final: "terminal" | "muesca" } = { final: "terminal" };

/** Largos (mm de arco desde el asa). */
export const STRAP_LEN = {
  /** Hebilla: la de las 12 abraza la barra del marco. */
  hebilla12: L_BOTTOM - 7,
  /** Hebilla: la de los agujeros. */
  hebilla6: 120,
  /** Desplegable: las dos, hasta su bisagra. */
  desplegable: L_BOTTOM - 8,
  /** Agujeros (s de la de las 6): 7 cada 7 mm. La púa entra en el 4.º. */
  holes: [64, 71, 78, 85, 92, 99, 106] as readonly number[],
  /** Trabillas sobre la de las 12: fija (6 mm) y flotante (5 mm). */
  keepers: [
    { s: 66, len: 6 },
    { s: 52, len: 5 },
  ] as readonly { s: number; len: number }[],
  /** Brazalete: los eslabones paran a 15 mm del punto de abajo (la tapa del
   *  cierre mide 30). */
  eslabones: L_BOTTOM - 15,
} as const;

/** Altura (y) del suelo: el punto más bajo de la correa por fuera (la línea
 *  media llega a −32.76; medio grueso del final 1.6–1.7, el eslabón con su
 *  corona 2.05) y un pelo de aire para la sombra de contacto. */
export const FLOOR_Y = -35.0;

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

interface StrapSpec {
  width: (s: number) => number;
  thick: (s: number) => number;
  /** Altura extra de la cara vista (mm) en (u ∈ [−1, 1], s). */
  relief: (u: number, s: number, w: number) => number;
  edgeR: number;
}

/** Relieve de las costillas en (u ∈ [−1, 1], s). */
function ribRelief(u: number, s: number, w: number): number {
  const half = (RIB.panel * w) / (w / 2);
  const panel = 1 - smooth(half - 0.025, half + 0.025, Math.abs(u));
  const zone = smooth(RIB.s0 - 0.35, RIB.s0, s) * (1 - smooth(RIB.s1, RIB.s1 + 0.35, s));
  const x = RIB.dir === "trans" ? s - RIB.s0 : (u * w) / 2;
  const ph = Math.cos((2 * Math.PI * x) / RIB.period);
  const rib = 0.5 + 0.5 * Math.tanh(4 * ph);
  const dome = 0.12 * (1 - u * u);
  return dome + panel * zone * (-RIB.depth + RIB.rib * rib);
}

const SPECS: Record<Exclude<StrapKind, "brazalete">, StrapSpec> = {
  caucho: {
    // Ancho MEDIDO en correa-caucho-*-1200.webp (vista de frente, R1.4): un
    // hombro rápido al salir del asa (22 → 20.4 en 7 mm) y luego 20.4 → 18.
    width: (s) => 22.0 - 1.6 * smooth(0, 7, s) - 2.4 * smooth(7, 40, s),
    thick: (s) => 3.8 - 0.6 * smooth(0, 30, s),
    relief: ribRelief,
    edgeR: 0.9,
  },
  piel: {
    // Medido en correa-piel-*-1200.webp: 22.6 en el terminal, hombro de
    // 1.2 mm en 7 mm y luego hasta 18.8.
    width: (s) => 22.6 - 1.2 * smooth(0, 7, s) - 2.6 * smooth(7, 45, s),
    thick: (s) => 2.65 - 0.2 * smooth(0, 30, s),
    // Acolchada: corona de 0.55 mm en el centro.
    relief: (u) => 0.55 * (1 - u ** 4),
    edgeR: 0.7,
  },
};

/** Ancho de la correa en el arco s (sin la punta). */
export function strapWidth(kind: Exclude<StrapKind, "brazalete">, s: number): number {
  return SPECS[kind].width(s);
}

/** Largo (mm) de la punta redondeada. */
const TIP = 5;

/** Mitad del grueso + relieve en el centro (la cara vista sobre la línea
 *  media) en el arco s. */
export function strapTop(kind: Exclude<StrapKind, "brazalete">, s: number, end = Infinity, u = 0): number {
  const spec = SPECS[kind];
  const e = end === Infinity ? 0 : Math.max(0, s - (end - TIP)) / TIP;
  return (spec.thick(s) * (1 - 0.25 * e)) / 2 + spec.relief(u, s, spec.width(s));
}

export function strapThick(kind: Exclude<StrapKind, "brazalete">, s: number): number {
  return SPECS[kind].thick(s);
}

type Zone = 0 | 1 | 2;

/** Barrido de una banda en recto (x = u, y = s, z = v). `fin`: "punta"
 *  (redondeada) o "recto". `fineStep`: paso en la zona de costillas. */
function sweepBand(kind: Exclude<StrapKind, "brazalete">, S: number, fin: "punta" | "recto", fineStep: number): THREE.BufferGeometry {
  const spec = SPECS[kind];
  const END = fin === "punta" ? TIP : 0;
  const ribs = kind === "caucho";
  const ss: number[] = [];
  for (let s = 0; s < S; ) {
    ss.push(s);
    const fine = ribs && s >= RIB.s0 - 0.6 && s <= RIB.s1 + 0.6;
    s += fine ? fineStep : END && s > S - END - 0.5 ? 0.25 : kind === "piel" ? 0.5 : 0.6;
  }
  ss.push(S);

  const TOP = 44;
  const ARC = 5;
  const BOT = 10;
  const ring = (w: number, th: number, s: number): { u: number; v: number; tu: number }[] => {
    const r = Math.min(spec.edgeR, th / 2 - 0.05, w / 2 - 0.05);
    const hw = w / 2;
    const top = (u: number) => th / 2 + spec.relief(u / hw, s, w) * Math.min(1, (hw - Math.abs(u)) / r + 0.2);
    const pts: { u: number; v: number; tu: number }[] = [];
    for (let i = 0; i <= TOP; i++) {
      const u = -hw + r + ((w - 2 * r) * i) / TOP;
      pts.push({ u, v: top(u), tu: u / w + 0.5 });
    }
    const yTop = top(hw - r);
    for (let i = 1; i <= ARC; i++) {
      const a = (Math.PI / 2) * (1 - i / ARC);
      pts.push({ u: hw - r + r * Math.cos(a), v: yTop - r + r * Math.sin(a), tu: 1 });
    }
    for (let i = 0; i <= ARC; i++) {
      const a = -(Math.PI / 2) * (i / ARC);
      pts.push({ u: hw - r + r * Math.cos(a), v: -th / 2 + r + r * Math.sin(a), tu: 1 });
    }
    for (let i = 1; i < BOT; i++) {
      const u = hw - r - ((w - 2 * r) * i) / BOT;
      pts.push({ u, v: -th / 2, tu: u / w + 0.5 });
    }
    for (let i = 0; i <= ARC; i++) {
      const a = -Math.PI / 2 - (Math.PI / 2) * (i / ARC);
      pts.push({ u: -hw + r + r * Math.cos(a), v: -th / 2 + r + r * Math.sin(a), tu: 0 });
    }
    for (let i = 1; i < ARC; i++) {
      const a = Math.PI - (Math.PI / 2) * (i / ARC);
      pts.push({ u: -hw + r + r * Math.cos(a), v: top(-hw + r) - r + r * Math.sin(a), tu: 0 });
    }
    return pts;
  };

  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[][] = [[], [], []];
  let M = 0;
  // Índices del anillo: 0…TOP la cara vista; el canto derecho baja hasta su
  // tangente de abajo (RB); el forro va de RB a la tangente izquierda (LB).
  const RB = TOP + 2 * ARC + 1;
  const LB = RB + BOT;
  const zoneOf = (j: number): Zone => (j < TOP ? 0 : j >= RB && j < LB ? 1 : 2);
  ss.forEach((s, i) => {
    const e = END ? Math.min(0.94, Math.max(0, s - (S - END)) / END) : 0;
    const w = spec.width(s) * Math.sqrt(1 - e * e);
    const th = spec.thick(s) * (1 - 0.25 * e);
    const pts = ring(w, th, s);
    M = pts.length;
    for (const q of pts) {
      pos.push(q.u, s, q.v);
      uv.push(q.tu, s / CROCO_TILE_MM);
    }
    if (i > 0) {
      const a = (i - 1) * M;
      const b = i * M;
      for (let j = 0; j < M; j++) {
        const j1 = (j + 1) % M;
        // La cara vista mira a +z (u crece, s crece: u × s = +v).
        idx[zoneOf(j)].push(a + j, a + j1, b + j1, a + j, b + j1, b + j);
      }
    }
  });
  // Tapas de los extremos (vértices propios: normal = la del corte).
  const capAt = (k: number, flip: boolean) => {
    const o = k * M;
    const ci = pos.length / 3;
    let cu = 0;
    let cv = 0;
    for (let j = 0; j < M; j++) {
      cu += pos[(o + j) * 3];
      cv += pos[(o + j) * 3 + 2];
    }
    pos.push(cu / M, ss[k], cv / M);
    uv.push(0.5, ss[k] / CROCO_TILE_MM);
    for (let j = 0; j < M; j++) {
      pos.push(pos[(o + j) * 3], pos[(o + j) * 3 + 1], pos[(o + j) * 3 + 2]);
      uv.push(uv[(o + j) * 2], uv[(o + j) * 2 + 1]);
    }
    for (let j = 0; j < M; j++) {
      const a = ci + 1 + j;
      const b = ci + 1 + ((j + 1) % M);
      if (flip) idx[2].push(ci, b, a);
      else idx[2].push(ci, a, b);
    }
  };
  capAt(0, true);
  capAt(ss.length - 1, false);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([...idx[0], ...idx[1], ...idx[2]]);
  g.addGroup(0, idx[0].length, 0);
  g.addGroup(idx[0].length, idx[1].length, 1);
  g.addGroup(idx[0].length + idx[1].length, idx[2].length, 2);
  g.computeVertexNormals();
  return g;
}

/** Banda de caucho o piel en el espacio de la correa, lista para posar.
 *  `fineStep`: paso de las costillas (0.12 mm en escritorio, 0.16 táctil). */
export function bandGeometry(
  kind: Exclude<StrapKind, "brazalete">,
  S: number,
  fin: "punta" | "recto",
  fineStep = 0.12,
): THREE.BufferGeometry {
  return toStrapSpace(sweepBand(kind, S, fin, fineStep));
}

// ===========================================================================
// Agujeros, trabillas y pespunte (también en el espacio de la correa)
// ===========================================================================
/** Contorno de un agujero (mm, x a lo ancho, y a lo largo). */
function holeOutline(grow: number, n = 28): THREE.Vector2[] {
  const [L, W] = HOLE.forma === "oblongo" ? HOLE.oblongo : [HOLE.d, HOLE.d];
  const rx = W / 2 + grow;
  const ry = L / 2 + grow;
  const r = Math.min(rx, ry);
  const pts: THREE.Vector2[] = [];
  // Estadio: semicírculos de radio r en los extremos del largo.
  const straight = ry - r;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pts.push(new THREE.Vector2(r * c, s * r + Math.sign(s) * straight));
  }
  return pts;
}

/** Los agujeros de la de las 6: el hueco oscuro (`dark`) y su bisel de
 *  0.2 mm en el color de la correa (`bevel`, va al grupo 0 de la banda). */
export function holeGeometries(kind: Exclude<StrapKind, "brazalete">): { dark: THREE.BufferGeometry; bevel: THREE.BufferGeometry } {
  const darks: THREE.BufferGeometry[] = [];
  const bevels: THREE.BufferGeometry[] = [];
  const inner = holeOutline(0);
  const outer = holeOutline(HOLE.bevel);
  for (const s of STRAP_LEN.holes) {
    const top = strapTop(kind, s);
    // El hueco: un disco hundido 0.12 mm (se ve oscuro desde cualquier lado).
    const disc = new THREE.ShapeGeometry(new THREE.Shape(inner), 1);
    disc.translate(0, s, top - 0.04);
    darks.push(disc.toNonIndexed());
    // El bisel: un anillo inclinado del borde del hueco a la cara vista.
    const pos: number[] = [];
    for (let i = 0; i < inner.length; i++) {
      const j = (i + 1) % inner.length;
      const a0 = [inner[i].x, s + inner[i].y, top - 0.04];
      const a1 = [inner[j].x, s + inner[j].y, top - 0.04];
      const b0 = [outer[i].x, s + outer[i].y, top + 0.02];
      const b1 = [outer[j].x, s + outer[j].y, top + 0.02];
      pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1);
    }
    const ring = new THREE.BufferGeometry();
    ring.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    ring.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2).fill(0.5), 2));
    ring.computeVertexNormals();
    bevels.push(ring);
  }
  const dark = mergeGeometries(darks);
  darks.forEach((g) => g.dispose());
  dark.computeVertexNormals();
  const bevel = mergeGeometries(bevels);
  bevels.forEach((g) => g.dispose());
  return { dark: toStrapSpace(dark), bevel: toStrapSpace(bevel) };
}

/** Pega `extra` (sin índice, con aLocal) al grupo 0 de una banda ya en el
 *  espacio de la correa. Devuelve una geometría nueva (y libera las dos). */
export function appendToBand(band: THREE.BufferGeometry, extra: THREE.BufferGeometry): THREE.BufferGeometry {
  const names = ["position", "normal", "uv", "aLocal", "aNLocal"] as const;
  const nb = band.getAttribute("position").count;
  const ne = extra.getAttribute("position").count;
  const out = new THREE.BufferGeometry();
  for (const name of names) {
    const a = band.getAttribute(name) as THREE.BufferAttribute;
    const b = extra.getAttribute(name) as THREE.BufferAttribute;
    const arr = new Float32Array((nb + ne) * a.itemSize);
    arr.set(a.array as Float32Array, 0);
    if (b) arr.set(b.array as Float32Array, nb * a.itemSize);
    const attr = new THREE.BufferAttribute(arr, a.itemSize);
    if (name === "position" || name === "normal") attr.setUsage(THREE.DynamicDrawUsage);
    out.setAttribute(name, attr);
  }
  const bi = band.getIndex()!.array;
  const g0 = band.groups[0];
  const extraIdx: number[] = [];
  const ei = extra.getIndex();
  if (ei) for (let i = 0; i < ei.count; i++) extraIdx.push(nb + ei.getX(i));
  else for (let i = 0; i < ne; i++) extraIdx.push(nb + i);
  const idx: number[] = [];
  for (let i = 0; i < g0.count; i++) idx.push(bi[g0.start + i]);
  idx.push(...extraIdx);
  const rest: number[] = [];
  for (let i = g0.start + g0.count; i < bi.length; i++) rest.push(bi[i]);
  out.setIndex([...idx, ...rest]);
  out.addGroup(0, idx.length, 0);
  let o = idx.length;
  for (const g of band.groups.slice(1)) {
    out.addGroup(o, g.count, g.materialIndex ?? 0);
    o += g.count;
  }
  band.dispose();
  extra.dispose();
  return out;
}

/** Una trabilla (aro alrededor de la correa de las 12 y la cola de la de las
 *  6), en el espacio de la pista de las 12. Acanalada en caucho (ref 1). */
export function keeperGeometry(kind: Exclude<StrapKind, "brazalete">, s: number, len: number): THREE.BufferGeometry {
  const th = strapThick(kind, s);
  const w = strapWidth(kind, s);
  // Por dentro: la de las 12 (v = 0) y la cola encima (v = th + 0.3).
  const cola = th + 0.3;
  const innerW = w + 0.4;
  const v0 = -th / 2 - 0.25;
  const v1 = cola + th / 2 + 0.25;
  const wall = 0.9;
  const outer = roundRect2(innerW + 2 * wall, v1 - v0 + 2 * wall, 1.2);
  const inner = roundRect2(innerW, v1 - v0, 0.6);
  const shape = new THREE.Shape(outer);
  shape.holes.push(new THREE.Path(inner.slice().reverse()));
  const ribbed = kind === "caucho";
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: len,
    bevelEnabled: true,
    bevelThickness: 0.25,
    bevelSize: 0.25,
    bevelOffset: -0.25,
    bevelSegments: 2,
    curveSegments: 6,
    steps: ribbed ? Math.round(len / 0.25) : 1,
  });
  // (x, y = alto, z = largo) → (x = u, y = s, z = v).
  g.rotateX(Math.PI / 2);
  g.translate(0, s - len / 2 + len, (v0 + v1) / 2);
  g.scale(1, 1, 1);
  if (ribbed) {
    // Acanalado transversal en la cara de fuera (pequeñas ondas de 0.12 mm).
    const p = g.getAttribute("position");
    const top = (v1 - v0) / 2 + wall - 0.05 + (v0 + v1) / 2;
    for (let i = 0; i < p.count; i++) {
      if (p.getZ(i) > top - 0.3) {
        const k = Math.cos(((p.getY(i) - s) * 2 * Math.PI) / 1.0);
        p.setZ(i, p.getZ(i) + 0.06 * k);
      }
    }
  }
  g.deleteAttribute("normal");
  g.computeVertexNormals();
  return toStrapSpace(g);
}

/** Rectángulo redondeado centrado (puntos antihorarios). */
function roundRect2(w: number, h: number, r: number, seg = 5): THREE.Vector2[] {
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

/** Pespunte de la piel: cápsulas de 2.4 mm (Ø0.5) cada 3.2 mm, a 1.3 mm de
 *  cada canto, medio hundidas en la cara vista. Hasta `S` (sin la punta). */
export function stitchGeometry(S: number, fin: "punta" | "recto"): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const cap = new THREE.CapsuleGeometry(0.25, 1.9, 2, 6);
  const end = fin === "punta" ? S - TIP - 1 : S - 2;
  for (let s = 3.2; s <= end; s += 3.2) {
    const w = SPECS.piel.width(s);
    for (const side of [-1, 1]) {
      const u = side * (w / 2 - 1.3);
      const v = strapTop("piel", s, Infinity, u / (w / 2)) - 0.08;
      const g = cap.clone();
      g.translate(u, s, v);
      parts.push(g.index ? g.toNonIndexed() : g);
    }
  }
  // La vuelta de la punta: puntadas siguiendo el contorno redondeado.
  if (fin === "punta") {
    for (let k = 0; k <= 4; k++) {
      const a = (-Math.PI / 2) * (1 - k / 4) + (Math.PI / 2) * (k / 4);
      const w = SPECS.piel.width(S - TIP) / 2 - 1.3;
      const s = S - TIP + Math.cos(a) * (TIP - 1.3);
      const u = Math.sin(a) * w;
      const g = cap.clone();
      g.rotateZ(-a + Math.PI / 2);
      g.translate(u, s, strapTop("piel", s) - 0.2);
      parts.push(g.index ? g.toNonIndexed() : g);
    }
  }
  cap.dispose();
  const out = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return toStrapSpace(out);
}

// ===========================================================================
// Brazalete
// ===========================================================================
/** Ancho del brazalete en el arco s (medido en brazalete-*-1200.webp: 22.4
 *  junto a la caja, hombro de 1.6 en 7 mm, luego hasta 18). */
export const braceletWidth = (s: number) => 22.4 - 1.6 * smooth(0, 7, s) - 2.8 * smooth(7, 45, s);

/** Paso de los eslabones (mm). */
export const LINK_PITCH = 6.6;

/** Las piezas del eslabón H (nominales a 20 mm de ancho; cada instancia se
 *  escala a su sitio). Local: x a lo ancho, y a lo largo, z grosor.
 *  - outer: la fila ancha cepillada (corona de 0.35 y chaflanes pulidos de
 *    0.3 en `outerBevel`);
 *  - side: los dos brazos cepillados a los lados del central;
 *  - center: el central pulido, 0.4 más alto, con los extremos redondeados. */
export function braceletGeometries(): { outer: THREE.BufferGeometry; side: THREE.BufferGeometry; center: THREE.BufferGeometry } {
  const crowned = (w: number, l: number, th: number, r: number, bevel: number, crown: number) => {
    const sh = new THREE.Shape(roundRect2(w, l, r, 4));
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: th - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelOffset: -bevel,
      bevelSegments: 2,
      curveSegments: 4,
      steps: 1,
    });
    g.translate(0, 0, -(th - 2 * bevel) / 2);
    // Corona: la cara de arriba sube hasta `crown` en el centro (a lo ancho).
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      if (p.getZ(i) > 0) {
        const u = (2 * p.getX(i)) / w;
        p.setZ(i, p.getZ(i) + crown * Math.max(0, 1 - u * u) * (p.getZ(i) / (th / 2)));
      }
    }
    g.deleteAttribute("normal");
    g.computeVertexNormals();
    return g;
  };
  const center = (() => {
    // Extremos redondeados (estadio) y 0.4 más alto.
    const w = 9.2;
    const l = 3.4;
    const sh = new THREE.Shape(roundRect2(w, l, l / 2 - 0.05, 8));
    const th = 2.4;
    const bevel = 0.45;
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: th - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelOffset: -bevel,
      bevelSegments: 4,
      curveSegments: 8,
    });
    g.translate(0, 0, -(th - 2 * bevel) / 2);
    return g;
  })();
  // Un pelo más largos que el paso a media altura: en la curva de la muñeca
  // la cara de fuera se estira y las piezas se seguirían tocando.
  return {
    outer: crowned(20, 3.9, 3.4, 0.5, 0.3, 0.35),
    side: crowned(5.0, 3.3, 3.4, 0.4, 0.3, 0.2),
    center,
  };
}

export interface LinkSlot {
  s: number;
  /** Desplazamiento a lo ancho (mm) y hacia fuera. */
  dx: number;
  dn: number;
  /** Escala a lo ancho. */
  sx: number;
}

/** Dónde va cada pieza del brazalete (por lado, en el arco de la pista). */
export function braceletSlots(): { outer: LinkSlot[]; center: LinkSlot[]; side: LinkSlot[] } {
  const out = { outer: [] as LinkSlot[], center: [] as LinkSlot[], side: [] as LinkSlot[] };
  const END = STRAP_LEN.eslabones;
  for (let s = 1.9; s < END - 1.5; s += LINK_PITCH) {
    const w = braceletWidth(s);
    out.outer.push({ s, dx: 0, dn: 0, sx: w / 20 });
    const s2 = s + LINK_PITCH / 2;
    if (s2 > END - 1.5) break;
    const w2 = braceletWidth(s2);
    const cw = 9.2 * (w2 / 20);
    out.center.push({ s: s2, dx: 0, dn: 0.9, sx: w2 / 20 });
    const arm = (w2 - cw) / 2 - 0.15;
    const armX = cw / 2 + 0.15 + arm / 2;
    out.side.push({ s: s2, dx: -armX, dn: 0, sx: arm / 5 }, { s: s2, dx: armX, dn: 0, sx: arm / 5 });
  }
  return out;
}

/** El alma oscura bajo los eslabones (sigue la curva hasta la tapa del
 *  cierre): las juntas de 0.25 mm se leen como líneas oscuras. */
export function braceletCoreGeometry(): THREE.BufferGeometry {
  const S = L_BOTTOM + 2;
  const pos: number[] = [];
  const idx: number[] = [];
  const N = Math.ceil(S / 1.0);
  const sec = (w: number): [number, number][] => [
    [-w / 2, -1.2],
    [w / 2, -1.2],
    [w / 2, 0.9],
    [-w / 2, 0.9],
  ];
  for (let i = 0; i <= N; i++) {
    const s = (S * i) / N;
    for (const [u, v] of sec(braceletWidth(s) - 1.4)) pos.push(u, s, v);
    if (i > 0) {
      const a = (i - 1) * 4;
      const b = i * 4;
      for (let j = 0; j < 4; j++) {
        const j1 = (j + 1) % 4;
        idx.push(a + j, b + j1, a + j1, a + j, b + j, b + j1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return toStrapSpace(g.toNonIndexed());
}

// ===========================================================================
// La pieza que llena la muesca del asa (caucho: la propia correa; piel y
// brazalete: el terminal de metal), en coordenadas de la caja (fija).
// ===========================================================================
export function tongueGeometry(): THREE.BufferGeometry {
  const w = CASE_DIM.notchHalfW * 2 - 0.2;
  const y0 = CASE_DIM.notchY + 0.05;
  const y1 = CASE_DIM.lugEnd + 0.15;
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, y0);
  sh.lineTo(w / 2, y0);
  sh.lineTo(w / 2, y1);
  sh.lineTo(-w / 2, y1);
  sh.closePath();
  const depth = 5.2;
  const bevel = 0.3;
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
  });
  g.translate(0, 0, -5.1 + bevel);
  return g;
}
