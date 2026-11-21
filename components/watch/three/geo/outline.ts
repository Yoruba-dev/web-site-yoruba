// ---------------------------------------------------------------------------
// CONTORNOS DE LA CAJA (mm, y HACIA ARRIBA, origen en el centro de la esfera)
// y las piezas de geometría con las que se levanta: anillos con chaflán
// ("loft"), tapas planas y polígonos redondeados con desplazamiento exacto.
//
// La silueta exterior NO es inventada: se trazó UNA vez sobre el alfa de
// public/assets/images/reloj/capas/caja-acero-1200.webp (la foto de la caja que
// usa el compositor), así:
//   1. alfa > 128, borde izquierdo y derecho de cada fila de la plantilla;
//   2. simétrica: media de |izquierda| y |derecha| (en las filas de la corona,
//      solo la izquierda) y media de la mitad de arriba y la de abajo (la foto
//      tiene algo de perspectiva: 22.57 mm arriba, 23.67 abajo → 23.12);
//   3. px → mm con PLANTILLA.PX_POR_MM (16.3934, lib/watch-capas.ts), centro
//      de la esfera en (600, 800);
//   4. Douglas-Peucker a 0.08 mm y a mano los cantos de la muesca de las asas.
// El bisel octogonal (huella del chaflán pulido y su cara cepillada 1.2 mm
// dentro) se midió con perfiles radiales de luminancia sobre la misma foto y
// se comprobó superponiéndolo (12 y 6 a 19.6 mm, 3 y 9 a 18.4 mm).
// ---------------------------------------------------------------------------
import * as THREE from "three";

export type P2 = readonly [number, number];

/** Cuarto superior izquierdo de la silueta, de las 9 (y = 0) a las 12 (x = 0):
 *  orejas, flanco, diagonal hacia el asa, asa y la muesca donde entra la correa. */
export const CASE_QUARTER: readonly P2[] = [
  [-20.0, 0.0],
  [-20.0, 1.7],
  [-19.85, 4.0],
  [-19.45, 6.7],
  [-19.1, 7.5],
  [-17.75, 9.15],
  [-17.1, 10.1],
  [-15.45, 12.9],
  [-13.9, 16.3],
  [-11.55, 22.5],
  [-11.0, 23.1],
  [-7.2, 23.1],
  [-6.85, 22.75],
  [-6.85, 20.75],
  [-6.5, 20.4],
  [0, 20.4],
];

/** Medidas de la caja derivadas del trazo (mm). */
export const CASE_DIM = {
  /** Mitad del largo de asa a asa. */
  lugEnd: 23.1,
  /** Fondo de la muesca de las asas (la correa entra aquí). */
  notchY: 20.4,
  /** Media anchura de la muesca. */
  notchHalfW: 6.85,
  /** Media anchura del extremo del asa (la correa la cubre entera). */
  lugHalfW: 11.0,
  /** Radio exterior a las 3 (oreja). */
  earX: 20.0,
} as const;

/** Huella del bisel (pie del chaflán pulido): octógono, medio cuarto (las 9 a
 *  las 12). Las esquinas se redondean con BEZEL_CORNER_R. */
export const BEZEL_QUARTER: readonly P2[] = [
  [-18.4, 0],
  [-18.4, 7.6],
  [-10.3, 19.6],
  [0, 19.6],
];
export const BEZEL_CORNER_R = 2.0;

/** Polígono completo y en sentido ANTIHORARIO a partir de un cuarto (de las 9
 *  a las 12), por simetría en x y en y. */
export function mirrorQuarter(q: readonly P2[]): [number, number][] {
  const tl = q.map(([x, y]) => [x, y] as [number, number]);
  const tr = [...q].reverse().map(([x, y]) => [-x, y] as [number, number]);
  const br = q.map(([x, y]) => [-x, -y] as [number, number]);
  const bl = [...q].reverse().map(([x, y]) => [x, -y] as [number, number]);
  const cw = [...tl, ...tr.slice(1), ...br.slice(1), ...bl.slice(1, -1)];
  const out: [number, number][] = [];
  for (const p of cw) {
    const last = out[out.length - 1];
    if (!last || Math.abs(last[0] - p[0]) + Math.abs(last[1] - p[1]) > 1e-6) out.push(p);
  }
  return out.reverse();
}

/** Área con signo (positiva = antihorario). */
export function signedArea(pts: readonly P2[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

/** Normal exterior (unitaria) de la arista i → i+1 de un polígono antihorario. */
function edgeNormal(a: P2, b: P2): [number, number] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.hypot(dx, dy) || 1;
  return [dy / n, -dx / n];
}

/** Desplaza un polígono antihorario `d` mm hacia fuera (negativo = hacia
 *  dentro) con inglete en cada vértice. Para desplazamientos pequeños sobre
 *  una silueta suave (el canto de la caja). */
export function offsetPolygon(pts: readonly P2[], d: number): [number, number][] {
  const n = pts.length;
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const n0 = edgeNormal(prev, p);
    const n1 = edgeNormal(p, next);
    const k = 1 + n0[0] * n1[0] + n0[1] * n1[1];
    const m = k > 0.2 ? 1 / k : 5;
    return [p[0] + (n0[0] + n1[0]) * m * d, p[1] + (n0[1] + n1[1]) * m * d] as [number, number];
  });
}

/** Polígono CONVEXO antihorario con esquinas redondeadas, desplazado `d` mm
 *  (los centros de los redondeos son fijos y el radio pasa a r + d: un
 *  desplazamiento EXACTO, así el chaflán es paralelo en todo el contorno).
 *  `segs` puntos por esquina (siempre los mismos: los anillos casan). */
export function roundedConvex(base: readonly P2[], r: number, d: number, segs = 6): [number, number][] {
  const n = base.length;
  const out: [number, number][] = [];
  const rr = Math.max(0.05, r + d);
  for (let i = 0; i < n; i++) {
    const p = base[i];
    const n0 = edgeNormal(base[(i - 1 + n) % n], p);
    const n1 = edgeNormal(p, base[(i + 1) % n]);
    const k = 1 + n0[0] * n1[0] + n0[1] * n1[1];
    // Centro del redondeo de radio r dentro de la esquina.
    const cx = p[0] - (r * (n0[0] + n1[0])) / k;
    const cy = p[1] - (r * (n0[1] + n1[1])) / k;
    let a0 = Math.atan2(n0[1], n0[0]);
    let a1 = Math.atan2(n1[1], n1[0]);
    while (a1 < a0) a1 += Math.PI * 2;
    if (a1 - a0 > Math.PI) a0 += Math.PI * 2;
    for (let s = 0; s <= segs; s++) {
      const a = a0 + ((a1 - a0) * s) / segs;
      out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  }
  return out;
}

/** Círculo antihorario de `n` puntos. */
export function circlePts(r: number, n = 96): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [r * Math.cos(a), r * Math.sin(a)] as [number, number];
  });
}

export interface Ring {
  pts: readonly P2[];
  z: number;
}

/** Superficie lateral entre anillos consecutivos (mismo número de puntos,
 *  antihorarios, ordenados de abajo arriba). Normales suaves a lo largo del
 *  contorno salvo en las aristas vivas (giro > creaseDeg), y vivas entre un
 *  par de anillos y el siguiente (el chaflán no se funde con la pared).
 *  UV: u = longitud a lo largo del contorno (mm), v = z (mm). */
export function loft(rings: readonly Ring[], creaseDeg = 35): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const cos = Math.cos((creaseDeg * Math.PI) / 180);
  const base = rings[0].pts;
  const N = base.length;
  // Arista viva en el vértice i (según el contorno de abajo).
  const crease = base.map((p, i) => {
    const a = base[(i - 1 + N) % N];
    const b = base[(i + 1) % N];
    const d0 = [p[0] - a[0], p[1] - a[1]];
    const d1 = [b[0] - p[0], b[1] - p[1]];
    const l = Math.hypot(d0[0], d0[1]) * Math.hypot(d1[0], d1[1]) || 1;
    return (d0[0] * d1[0] + d0[1] * d1[1]) / l < cos;
  });
  const acc: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const a = base[i - 1];
    const b = base[i % N];
    acc.push(acc[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const v3 = (p: P2, z: number) => new THREE.Vector3(p[0], p[1], z);
  for (let r = 0; r + 1 < rings.length; r++) {
    const A = rings[r];
    const B = rings[r + 1];
    // Normal de cada cara (arista e = i → i+1).
    const face: THREE.Vector3[] = [];
    for (let e = 0; e < N; e++) {
      const a0 = v3(A.pts[e], A.z);
      const a1 = v3(A.pts[(e + 1) % N], A.z);
      const b0 = v3(B.pts[e], B.z);
      const b1 = v3(B.pts[(e + 1) % N], B.z);
      const u = new THREE.Vector3().subVectors(a1, a0).add(new THREE.Vector3().subVectors(b1, b0));
      const w = new THREE.Vector3().subVectors(b0, a0).add(new THREE.Vector3().subVectors(b1, a1));
      face.push(u.cross(w).normalize());
    }
    const vn = (i: number, e: number) =>
      crease[i] ? face[e] : new THREE.Vector3().addVectors(face[(i - 1 + N) % N], face[i % N]).normalize();
    for (let e = 0; e < N; e++) {
      const i0 = e;
      const i1 = (e + 1) % N;
      const quad = [
        [A, i0, vn(i0, e), acc[e]],
        [A, i1, vn(i1, e), acc[e + 1]],
        [B, i1, vn(i1, e), acc[e + 1]],
        [B, i0, vn(i0, e), acc[e]],
      ] as const;
      for (const k of [0, 1, 2, 0, 2, 3]) {
        const [R, i, n, u] = quad[k];
        pos.push(R.pts[i][0], R.pts[i][1], R.z);
        nor.push(n.x, n.y, n.z);
        uv.push(u, R.z);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Tapa plana (cara a +z) de un contorno con agujeros, a la altura z. UV en
 *  mm (x, y). `down` = cara a −z (la de abajo de la caja). */
export function cap(outer: readonly P2[], z: number, holes: readonly (readonly P2[])[] = [], down = false): THREE.BufferGeometry {
  const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const g = new THREE.ShapeGeometry(shape, 1);
  if (down) {
    // Girar sobre x invierte y: las siluetas de la caja son simétricas en y.
    g.rotateX(Math.PI);
    g.translate(0, 0, z);
  } else {
    g.translate(0, 0, z);
  }
  return g;
}

/** Shape de three a partir de puntos. */
export function shapeOf(pts: readonly P2[], holes: readonly (readonly P2[])[] = []): THREE.Shape {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  return s;
}

/** Rectángulo redondeado antihorario centrado en (cx, cy). */
export function roundRectPts(cx: number, cy: number, w: number, h: number, r: number, segs = 4): [number, number][] {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr < 1e-4) {
    return [
      [cx - w / 2, cy - h / 2],
      [cx + w / 2, cy - h / 2],
      [cx + w / 2, cy + h / 2],
      [cx - w / 2, cy + h / 2],
    ];
  }
  const out: [number, number][] = [];
  const corners: [number, number, number][] = [
    [cx + w / 2 - rr, cy - h / 2 + rr, -Math.PI / 2],
    [cx + w / 2 - rr, cy + h / 2 - rr, 0],
    [cx - w / 2 + rr, cy + h / 2 - rr, Math.PI / 2],
    [cx - w / 2 + rr, cy - h / 2 + rr, Math.PI],
  ];
  for (const [x, y, a0] of corners) {
    for (let s = 0; s <= segs; s++) {
      const a = a0 + ((Math.PI / 2) * s) / segs;
      out.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
  }
  return out;
}

/** Desplaza un polígono convexo sin redondeos (intersección de las aristas
 *  desplazadas): el triángulo de las 12 y sus aros. */
export function offsetConvex(pts: readonly P2[], d: number): [number, number][] {
  const ccw = signedArea(pts) > 0 ? pts : [...pts].reverse();
  return offsetPolygon(ccw, d);
}
