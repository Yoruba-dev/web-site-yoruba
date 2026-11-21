// ---------------------------------------------------------------------------
// CORREAS — una sola curva de muñeca y tres maneras de vestirla:
//   caucho     banda barrida con la sección real (rieles laterales, panel
//              central rebajado con las costillas transversales junto a la
//              caja, como en las capas correa-caucho-*);
//   piel       banda acolchada (más gruesa en el centro) con el grabado
//              cocodrilo y el pespunte en sus texturas;
//   brazalete  eslabones (InstancedMesh) a lo largo de la misma curva: fila
//              ancha cepillada + fila con el eslabón central pulido y sus
//              dos brazos cepillados.
// Y el CIERRE que eligió el cliente (config.cierre), con el reloj
// "desabrochado" como en las fotos de catálogo: la curva se queda abierta por
// detrás para que la tapa se vea entera desde atrás.
//   puas         hebilla de púa (marco + púa) al final de la correa de las 12,
//                con su trabilla; la de las 6 acaba en punta con 5 agujeros;
//   desplegable  las dos correas acaban en recto y cada una lleva su ala de
//                la mariposa (la de las 12, con la cabeza y sus pulsadores);
//   brazalete    tapa del cierre plegable a las 12 y su pieza final a las 6.
//
// Coordenadas: mm, y arriba (las 12), la esfera mira a +z y la muñeca queda
// detrás (−z). Se construye la correa de las 12 (+y); la de las 6 es la misma
// reflejada (scale.y = −1: three invierte las caras solo).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { CASE_DIM } from "./outline";
import { CROCO_TILE_MM } from "../tex/maps";

export type StrapKind = "caucho" | "piel" | "brazalete";

/** Línea media de la correa de las 12 (y, z en mm): sale del asa y rodea una
 *  muñeca imaginaria de ~70 × 47 mm, hasta quedar detrás de la caja. */
const WRIST_PATH: readonly [number, number][] = [
  [22.6, -2.6],
  [25.0, -2.85],
  [28.0, -4.0],
  [30.8, -6.4],
  [33.0, -10.0],
  [34.4, -14.6],
  [35.0, -20.0],
  [34.6, -25.6],
  [33.0, -31.0],
  [30.2, -36.0],
  [26.4, -40.2],
  [22.4, -43.0],
  // Más allá: solo para el cierre (la hebilla, las alas, la tapa plegable).
  [18.4, -45.2],
  [14.2, -46.6],
  [10.0, -47.4],
];

/** Dónde acaba cada pieza (mm de arco sobre la curva). Nada pasa de y ≈ 16:
 *  desde atrás, la tapa (Ø31) se sigue viendo entera entre las dos puntas. */
export const STRAP_S = {
  /** Correa de las 6 con agujeros: hasta la punta. */
  punta: 55,
  /** Correa que acaba en recto (la de la hebilla, o las dos con desplegable). */
  recto: 44,
  /** Marco de la hebilla y ala de la mariposa de las 12. */
  cierreFin: 58,
  /** Ala de la mariposa de las 6. */
  alaFin: 53,
  /** Límite de los eslabones del brazalete (el último acaba en ~39.9); el
   *  cierre plegable empieza en eslabones − 0.6, montado sobre él. */
  eslabones: 40.3,
} as const;

/** Altura (y) del suelo bajo el reloj: el punto más bajo de la correa de las
 *  6 por fuera (para las sombras de contacto). */
export const FLOOR_Y = -37.2;

export function wristCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    WRIST_PATH.map(([y, z]) => new THREE.Vector3(0, y, z)),
    false,
    "centripetal",
  );
}

/** Marco en la posición `s` (mm de arco): T a lo largo, B a lo ancho (+x),
 *  N hacia fuera de la muñeca (la cara vista de la correa). */
export interface Frame {
  p: THREE.Vector3;
  t: THREE.Vector3;
  b: THREE.Vector3;
  n: THREE.Vector3;
}

export function frameAt(curve: THREE.CatmullRomCurve3, s: number, L = curve.getLength()): Frame {
  const u = Math.max(0, Math.min(1, s / L));
  const p = curve.getPointAt(u);
  const t = curve.getTangentAt(u).normalize();
  const b = new THREE.Vector3(1, 0, 0);
  const n = new THREE.Vector3().crossVectors(b, t).normalize();
  return { p, t, b, n };
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

interface StrapSpec {
  /** Ancho (mm) en el arco s. */
  width: (s: number) => number;
  /** Grosor (mm) en el arco s. */
  thick: (s: number) => number;
  /** Relieve de la cara vista: altura extra (mm) en (u ∈ [−1, 1], s). */
  relief: (u: number, s: number, w: number) => number;
  /** Radio de los cantos de la sección. */
  edgeR: number;
  /** Pasos del barrido (mm) dentro / fuera de la zona fina. */
  fine: [number, number, number];
}

const RIB = { z0: 2.4, z1: 20.5, period: 1.15, panel: 0.31, depth: 0.5, rib: 0.42 } as const;

const SPECS: Record<Exclude<StrapKind, "brazalete">, StrapSpec> = {
  caucho: {
    width: (s) => 22.0 - 4.1 * smooth(0, 24, s),
    thick: (s) => 3.8 - 0.6 * smooth(0, 30, s),
    relief: (u, s, w) => {
      const half = (RIB.panel * w) / (w / 2);
      const panel = 1 - smooth(half - 0.025, half + 0.025, Math.abs(u));
      const zone = smooth(RIB.z0 - 0.35, RIB.z0, s) * (1 - smooth(RIB.z1, RIB.z1 + 0.35, s));
      const ph = Math.cos((2 * Math.PI * (s - RIB.z0)) / RIB.period);
      const rib = 0.5 + 0.5 * Math.tanh(4 * ph);
      const dome = 0.12 * (1 - u * u);
      return dome + panel * zone * (-RIB.depth + RIB.rib * rib);
    },
    edgeR: 0.9,
    fine: [RIB.z0 - 0.6, RIB.z1 + 0.6, 0.09],
  },
  piel: {
    width: (s) => 22.2 - 3.4 * smooth(0, 34, s),
    thick: (s) => 2.6 - 0.3 * smooth(0, 30, s),
    relief: (u) => 0.55 * (1 - u ** 4),
    edgeR: 0.7,
    fine: [0, 0, 0.5],
  },
};

/** Grosor de la cara vista (mm sobre la línea media) en el centro de la
 *  correa, en el arco s: donde se apoyan los agujeros y la trabilla. */
export function strapTop(kind: Exclude<StrapKind, "brazalete">, s: number, end: number = STRAP_S.punta): number {
  const spec = SPECS[kind];
  const e = Math.max(0, s - (end - TIP)) / TIP;
  return (spec.thick(s) * (1 - 0.25 * e)) / 2 + spec.relief(0, s, spec.width(s));
}

/** Ancho de la correa en el arco s (sin la punta). */
export function strapWidth(kind: Exclude<StrapKind, "brazalete">, s: number): number {
  return SPECS[kind].width(s);
}

/** Largo (mm) de la punta redondeada. */
const TIP = 5;

/** Barrido de una correa de caucho o piel (correa de las 12; la de las 6 es
 *  la misma reflejada). `fin`: "punta" (la de los agujeros, redondeada) o
 *  "recto" (la que entra en la hebilla o en el ala del desplegable).
 *  UV: u de canto a canto (0…1), v = s / CROCO_TILE_MM. Grupos de material:
 *  0 = cara vista y cantos, 1 = forro (la cara que toca la muñeca: sin
 *  grabado). */
export function strapGeometry(kind: Exclude<StrapKind, "brazalete">, fin: "punta" | "recto" = "punta"): THREE.BufferGeometry {
  const spec = SPECS[kind];
  const curve = wristCurve();
  const L = curve.getLength();
  const S = fin === "punta" ? STRAP_S.punta : STRAP_S.recto;
  const END = fin === "punta" ? TIP : 0;
  // Muestras a lo largo: finas en la zona de costillas y en la punta.
  const ss: number[] = [];
  const [f0, f1, fstep] = spec.fine;
  for (let s = 0; s < S; ) {
    ss.push(s);
    const fine = s >= f0 && s <= f1;
    s += fine ? fstep : END && s > S - END - 0.5 ? 0.25 : 0.6;
  }
  ss.push(S);

  // La sección: cara vista (izquierda → derecha), canto derecho, fondo, canto
  // izquierdo. (u en mm a lo ancho, v en mm hacia fuera.)
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
  // Las caras del forro: del final del canto derecho (punto TOP+2·ARC+1) al
  // principio del izquierdo (BOT segmentos).
  const botFrom = TOP + 2 * ARC;
  const botTo = botFrom + BOT;

  const pos: number[] = [];
  const uv: number[] = [];
  const idxTop: number[] = [];
  const idxBot: number[] = [];
  let M = 0;
  const frames: Frame[] = [];
  ss.forEach((s, i) => {
    const fr = frameAt(curve, s, L);
    // Punta: el ancho se cierra en un cuarto de elipse (sin llegar a cero: la
    // tapa final es una cara pequeña con sus propios vértices, sin costura).
    const e = END ? Math.min(0.94, Math.max(0, s - (S - END)) / END) : 0;
    const w = spec.width(s) * Math.sqrt(1 - e * e);
    const th = spec.thick(s) * (1 - 0.25 * e);
    const pts = ring(w, th, s);
    M = pts.length;
    for (const q of pts) {
      const p = fr.p.clone().addScaledVector(fr.b, q.u).addScaledVector(fr.n, q.v);
      pos.push(p.x, p.y, p.z);
      uv.push(q.tu, s / CROCO_TILE_MM);
    }
    frames.push(fr);
    if (i > 0) {
      const a = (i - 1) * M;
      const b = i * M;
      for (let j = 0; j < M; j++) {
        const j1 = (j + 1) % M;
        (j >= botFrom && j < botTo ? idxBot : idxTop).push(a + j, a + j1, b + j1, a + j, b + j1, b + j);
      }
    }
  });
  // Tapas de los dos extremos: vértices PROPIOS (normal = la del corte), así
  // computeVertexNormals no mezcla la tapa con los cantos.
  const capAt = (k: number, flip: boolean) => {
    const o = k * M;
    const ci = pos.length / 3;
    const c = frames[k].p;
    pos.push(c.x, c.y, c.z);
    uv.push(0.5, ss[k] / CROCO_TILE_MM);
    for (let j = 0; j < M; j++) {
      pos.push(pos[(o + j) * 3], pos[(o + j) * 3 + 1], pos[(o + j) * 3 + 2]);
      uv.push(uv[(o + j) * 2], uv[(o + j) * 2 + 1]);
    }
    for (let j = 0; j < M; j++) {
      const a = ci + 1 + j;
      const b = ci + 1 + ((j + 1) % M);
      if (flip) idxTop.push(ci, b, a);
      else idxTop.push(ci, a, b);
    }
  };
  // La sección va en sentido horario vista desde atrás: la tapa del principio
  // (que mira hacia −T) se cierra al revés que la del final.
  capAt(0, true);
  capAt(ss.length - 1, false);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([...idxTop, ...idxBot]);
  g.addGroup(0, idxTop.length, 0);
  g.addGroup(idxTop.length, idxBot.length, 1);
  g.computeVertexNormals();
  return g;
}

/** Los agujeros de la correa de las 6 (cierre de púa): óvalos en la cara
 *  vista, cada 6 mm desde cerca de la punta. Local del círculo: x a lo ancho,
 *  y a lo largo, z hacia fuera. */
export function holeMatrices(kind: Exclude<StrapKind, "brazalete">): THREE.Matrix4[] {
  const curve = wristCurve();
  const L = curve.getLength();
  return [46, 40, 34, 28, 22].map((s) => {
    const fr = frameAt(curve, s, L);
    const m = new THREE.Matrix4().makeBasis(fr.b, fr.t, fr.n);
    m.scale(new THREE.Vector3(1, 1.3, 1));
    m.setPosition(fr.p.clone().addScaledVector(fr.n, strapTop(kind, s) + 0.03));
    return m;
  });
}

/** Una lámina de metal curvada que sigue la muñeca entre s0 y s1 (sección
 *  rectangular de cantos redondeados, centrada en la línea media + `lift`
 *  hacia fuera). Para las alas del desplegable y el cierre del brazalete. */
export function bladeGeometry(s0: number, s1: number, w: number, th: number, r: number, lift = 0): THREE.BufferGeometry {
  const curve = wristCurve();
  const L = curve.getLength();
  const sec: [number, number][] = [];
  const rr = Math.min(r, th / 2 - 0.02, w / 2 - 0.02);
  const corners: [number, number, number][] = [
    [w / 2 - rr, th / 2 - rr, 0],
    [-w / 2 + rr, th / 2 - rr, Math.PI / 2],
    [-w / 2 + rr, -th / 2 + rr, Math.PI],
    [w / 2 - rr, -th / 2 + rr, (3 * Math.PI) / 2],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= 4; i++) {
      const a = a0 + (Math.PI / 2) * (i / 4);
      sec.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  }
  const N = Math.max(2, Math.ceil((s1 - s0) / 0.5));
  const pos: number[] = [];
  const idx: number[] = [];
  const M = sec.length;
  const fr0 = frameAt(curve, s0, L);
  const fr1 = frameAt(curve, s1, L);
  for (let i = 0; i <= N; i++) {
    const fr = frameAt(curve, s0 + ((s1 - s0) * i) / N, L);
    for (const [u, v] of sec) {
      const p = fr.p.clone().addScaledVector(fr.b, u).addScaledVector(fr.n, v + lift);
      pos.push(p.x, p.y, p.z);
    }
    if (i > 0) {
      const a = (i - 1) * M;
      const b = i * M;
      for (let j = 0; j < M; j++) {
        const j1 = (j + 1) % M;
        idx.push(a + j, b + j1, a + j1, a + j, b + j, b + j1);
      }
    }
  }
  const cap = (fr: Frame, flip: boolean) => {
    const ci = pos.length / 3;
    const c = fr.p.clone().addScaledVector(fr.n, lift);
    pos.push(c.x, c.y, c.z);
    for (const [u, v] of sec) {
      const p = fr.p.clone().addScaledVector(fr.b, u).addScaledVector(fr.n, v + lift);
      pos.push(p.x, p.y, p.z);
    }
    for (let j = 0; j < M; j++) {
      const a = ci + 1 + j;
      const b = ci + 1 + ((j + 1) % M);
      if (flip) idx.push(ci, b, a);
      else idx.push(ci, a, b);
    }
  };
  cap(fr0, false);
  cap(fr1, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Base plana (x a lo ancho, y a lo largo, z hacia fuera) apoyada en la
 *  cuerda de la curva entre s0 y s1: para piezas rectas (la hebilla). */
export function chordMatrix(s0: number, s1: number, lift = 0): THREE.Matrix4 {
  const curve = wristCurve();
  const L = curve.getLength();
  const a = frameAt(curve, s0, L).p;
  const b = frameAt(curve, s1, L).p;
  const t = b.clone().sub(a).normalize();
  const bx = new THREE.Vector3(1, 0, 0);
  const n = new THREE.Vector3().crossVectors(bx, t).normalize();
  const m = new THREE.Matrix4().makeBasis(bx, t, n);
  m.setPosition(a.clone().add(b).multiplyScalar(0.5).addScaledVector(n, lift));
  return m;
}

/** Base en el arco s (x a lo ancho, y a lo largo, z hacia fuera). */
export function frameMatrix(s: number, lift = 0): THREE.Matrix4 {
  const curve = wristCurve();
  const fr = frameAt(curve, s);
  const m = new THREE.Matrix4().makeBasis(fr.b, fr.t, fr.n);
  m.setPosition(fr.p.clone().addScaledVector(fr.n, lift));
  return m;
}

function roundedRectPath(p: THREE.Path, w: number, l: number, r: number): void {
  const x0 = -w / 2;
  const y0 = -l / 2;
  p.moveTo(x0 + r, y0);
  p.lineTo(x0 + w - r, y0);
  p.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  p.lineTo(x0 + w, y0 + l - r);
  p.quadraticCurveTo(x0 + w, y0 + l, x0 + w - r, y0 + l);
  p.lineTo(x0 + r, y0 + l);
  p.quadraticCurveTo(x0, y0 + l, x0, y0 + l - r);
  p.lineTo(x0, y0 + r);
  p.quadraticCurveTo(x0, y0, x0 + r, y0);
}

/** Pieza extruida (x a lo ancho, y a lo largo, centrada en z) con bisel. */
function extruded(shape: THREE.Shape, th: number, bevel: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, th - 2 * bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 3,
    curveSegments: 6,
  });
  g.translate(0, 0, -(th - 2 * bevel) / 2);
  return g;
}

/** Hebilla de púa para una correa de ancho `w` (local: x a lo ancho, y a lo
 *  largo hacia la punta, z hacia fuera; el centro del marco en el origen):
 *  marco, púa y la trabilla (pasador de la correa, en su propio origen). */
export function buckleGeometries(w: number, th: number): {
  frame: THREE.BufferGeometry;
  tongue: THREE.BufferGeometry;
  keeper: THREE.BufferGeometry;
  length: number;
} {
  const inW = w + 0.8;
  const side = 2.1;
  const L = 15;
  const end = 2.4;
  const outer = new THREE.Shape();
  roundedRectPath(outer, inW + 2 * side, L, 3.2);
  const hole = new THREE.Path();
  roundedRectPath(hole, inW, L - 2 * end, 1.4);
  outer.holes.push(hole);
  const frame = extruded(outer, 2.3, 0.45);
  // La púa: sale de la barra de cerca y descansa sobre la de lejos.
  const t = new THREE.Shape();
  t.moveTo(-0.8, -L / 2 + 0.6);
  t.lineTo(0.8, -L / 2 + 0.6);
  t.lineTo(0.55, L / 2 - 0.3);
  t.quadraticCurveTo(0, L / 2 + 0.6, -0.55, L / 2 - 0.3);
  t.closePath();
  const tongue = extruded(t, 1.1, 0.3);
  tongue.translate(0, 0, 1.35);
  // Trabilla: un aro rectangular alrededor de la correa, 5 mm de largo.
  const kw = w + 1.3;
  const kh = th + 1.2;
  const ko = new THREE.Shape();
  roundedRectPath(ko, kw, kh, 0.6);
  const ki = new THREE.Path();
  roundedRectPath(ki, w + 0.1, th + 0.1, 0.4);
  ko.holes.push(ki);
  const keeper = new THREE.ExtrudeGeometry(ko, { depth: 5, bevelEnabled: false, curveSegments: 6 });
  keeper.translate(0, 0, -2.5);
  // Del plano (x, y=grosor) extruido en z → (x, y=largo, z=grosor).
  keeper.rotateX(-Math.PI / 2);
  keeper.computeVertexNormals();
  return { frame, tongue, keeper, length: L };
}

/** Cabeza de la mariposa (bloque pulido con sus dos pulsadores) y lengüeta
 *  del cierre plegable del brazalete. Local como la hebilla. */
export function claspHeadGeometries(): { head: THREE.BufferGeometry; buttons: THREE.BufferGeometry; tab: THREE.BufferGeometry } {
  const hs = new THREE.Shape();
  roundedRectPath(hs, 12, 8, 2.2);
  const head = extruded(hs, 2.4, 0.5);
  const b1 = new THREE.CylinderGeometry(1.05, 1.05, 1.4, 20);
  b1.rotateZ(Math.PI / 2);
  b1.translate(6.4, 0, 0);
  const b2 = b1.clone();
  b2.translate(-12.8, 0, 0);
  const buttons = mergePair(b1, b2);
  const ts = new THREE.Shape();
  roundedRectPath(ts, 7, 3.6, 1.4);
  const tab = extruded(ts, 1.3, 0.35);
  return { head, buttons, tab };
}

function mergePair(a: THREE.BufferGeometry, b: THREE.BufferGeometry): THREE.BufferGeometry {
  const A = a.index ? a.toNonIndexed() : a;
  const B = b.index ? b.toNonIndexed() : b;
  const out = new THREE.BufferGeometry();
  for (const name of ["position", "normal", "uv"] as const) {
    const x = A.getAttribute(name);
    const y = B.getAttribute(name);
    const arr = new Float32Array(x.array.length + y.array.length);
    arr.set(x.array as Float32Array, 0);
    arr.set(y.array as Float32Array, x.array.length);
    out.setAttribute(name, new THREE.BufferAttribute(arr, x.itemSize));
  }
  [a, b, A, B].forEach((g) => g.dispose());
  return out;
}

/** Ancho del brazalete en el arco s. */
export const braceletWidth = (s: number) => 22.0 - 3.8 * smooth(0, 30, s);

export interface BraceletLayout {
  /** Eslabones anchos (fila cepillada a todo lo ancho). */
  outer: THREE.Matrix4[];
  /** Eslabones centrales pulidos. */
  center: THREE.Matrix4[];
  /** Brazos cepillados a los lados del central. */
  side: THREE.Matrix4[];
}

/** Geometrías de los eslabones (nominales a 20 mm de ancho; cada instancia se
 *  escala al ancho de su sitio). Local: x a lo ancho, y a lo largo, z grosor. */
export function braceletGeometries(): { outer: THREE.BufferGeometry; center: THREE.BufferGeometry; side: THREE.BufferGeometry } {
  const link = (w: number, l: number, th: number, r: number, bevel: number) => {
    const sh = new THREE.Shape();
    const x0 = -w / 2;
    const y0 = -l / 2;
    sh.moveTo(x0 + r, y0);
    sh.lineTo(x0 + w - r, y0);
    sh.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    sh.lineTo(x0 + w, y0 + l - r);
    sh.quadraticCurveTo(x0 + w, y0 + l, x0 + w - r, y0 + l);
    sh.lineTo(x0 + r, y0 + l);
    sh.quadraticCurveTo(x0, y0 + l, x0, y0 + l - r);
    sh.lineTo(x0, y0 + r);
    sh.quadraticCurveTo(x0, y0, x0 + r, y0);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: th - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelOffset: -bevel,
      bevelSegments: 3,
      curveSegments: 4,
    });
    g.translate(0, 0, -(th - 2 * bevel) / 2);
    return g;
  };
  // Un pelo más largos que el paso: en la curva de la muñeca la cara de fuera
  // se estira (~0.3 mm por junta) y los eslabones se seguirían tocando.
  return {
    outer: link(20, 3.9, 3.4, 0.5, 0.35),
    center: link(9.4, 3.45, 2.0, 0.9, 0.45),
    side: link(5.0, 3.3, 3.4, 0.4, 0.35),
  };
}

export function braceletLayout(): BraceletLayout {
  const curve = wristCurve();
  const L = curve.getLength();
  const P = 6.6;
  const out: BraceletLayout = { outer: [], center: [], side: [] };
  const place = (s: number, dx: number, dn: number, wScale: number) => {
    const fr = frameAt(curve, s, L);
    const m = new THREE.Matrix4().makeBasis(fr.b, fr.t, fr.n);
    m.scale(new THREE.Vector3(wScale, 1, 1));
    const p = fr.p.clone().addScaledVector(fr.b, dx).addScaledVector(fr.n, dn);
    m.setPosition(p);
    return m;
  };
  const END = STRAP_S.eslabones;
  for (let s = 1.9; s < END - 1.5; s += P) {
    const w = braceletWidth(s);
    out.outer.push(place(s, 0, 0, w / 20));
    const s2 = s + P / 2;
    if (s2 > END - 1.5) break;
    const w2 = braceletWidth(s2);
    out.center.push(place(s2, 0, 0.75, w2 / 20));
    const arm = (w2 - 9.4 * (w2 / 20)) / 2;
    const armX = w2 / 2 - arm / 2;
    // Los brazos llegan casi al canto (de perfil el brazalete se ve seguido).
    out.side.push(place(s2, -armX, 0, (arm - 0.1) / 5), place(s2, armX, 0, (arm - 0.1) / 5));
  }
  return out;
}

/** La pieza que llena la muesca del asa (caucho: la propia correa; piel y
 *  brazalete: el terminal de metal), en coordenadas de la caja. */
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
