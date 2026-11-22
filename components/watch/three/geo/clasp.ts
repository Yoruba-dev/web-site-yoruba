// ---------------------------------------------------------------------------
// LOS CIERRES en metal (en el acabado de la caja), a la medida de §4.6:
//   hebilla de púa  marco de alambre 2.2 × 2.0 mm, 17 mm de largo, barra de
//                   arriba en arco apuntado (ref 1), ancho interior = correa
//                   + 0.6; púa de 1.8 mm con la punta redondeada;
//   desplegable     cabeza pulida 14 × 8 × 2.6 con pulsadores Ø2.1 × 1.6 a
//                   x = ±7.6, bisagras Ø2 en la punta de cada correa y dos
//                   hojas cepilladas 15.5 × 1.4 × 26 por dentro del aro;
//   brazalete       tapa del cierre plegable 18.4 × 30 × 2.8 (cara
//                   cepillada, bisel pulido de 0.5 y la pestaña de 6 × 2
//                   para levantarla) con su hoja doblada debajo.
// Las piezas rígidas van en local (x a lo ancho, y a lo largo, z hacia fuera,
// centradas) y se colocan con los marcos de la pose; las hojas y la tapa
// curvada van en el espacio de la correa (se doblan con la pose).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { toStrapSpace } from "../pose";

/** Medidas de la hebilla. */
export const BUCKLE = { wire: 2.2, height: 2.0, length: 17, arch: 5.2, tongueW: 1.8 } as const;

function extrudeCentered(shape: THREE.Shape, th: number, bevel: number, segs = 3, curve = 12): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, th - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: segs,
    curveSegments: curve,
  });
  g.translate(0, 0, -(th - 2 * bevel) / 2);
  return g;
}

/** Contorno del marco (antihorario): barra de la púa recta abajo (y = −L/2),
 *  lados rectos y arriba un arco apuntado que acaba en (0, L/2). */
function buckleOutline(w: number, L: number, arch: number, r: number): THREE.Path {
  const p = new THREE.Shape();
  const y0 = -L / 2;
  const yA = L / 2 - arch;
  p.moveTo(-w / 2 + r, y0);
  p.lineTo(w / 2 - r, y0);
  p.quadraticCurveTo(w / 2, y0, w / 2, y0 + r);
  p.lineTo(w / 2, yA);
  // Arco apuntado: cada mitad es una curva que llega a la punta con tangente
  // inclinada (no horizontal): se lee "en punta".
  p.bezierCurveTo(w / 2, yA + arch * 0.55, w * 0.22, L / 2 - arch * 0.12, 0, L / 2);
  p.bezierCurveTo(-w * 0.22, L / 2 - arch * 0.12, -w / 2, yA + arch * 0.55, -w / 2, yA);
  p.lineTo(-w / 2, y0 + r);
  p.quadraticCurveTo(-w / 2, y0, -w / 2 + r, y0);
  return p;
}

/** Marco y púa de la hebilla para una correa de ancho `strapW` al llegar a
 *  ella. Local: centro del marco en el origen, la barra de la púa en
 *  y = −L/2. La púa gira sobre esa barra (ver `tonguePivot`). */
export function buckleGeometries(strapW: number): {
  frame: THREE.BufferGeometry;
  tongue: THREE.BufferGeometry;
  /** Eje de giro de la púa (en local del marco). */
  tonguePivot: THREE.Vector3;
} {
  const { wire, height, length: L, arch } = BUCKLE;
  const inW = strapW + 0.6;
  const outW = inW + 2 * wire;
  const outer = buckleOutline(outW, L, arch, 1.4) as THREE.Shape;
  const inner = buckleOutline(inW, L - 2 * wire, arch - wire * 0.55, 0.5);
  // El hueco, en sentido contrario.
  const holePts = inner.getPoints(16).reverse();
  outer.holes.push(new THREE.Path(holePts));
  const frame = extrudeCentered(outer, height, 0.42, 4, 16);

  // La púa: vista de arriba (x, y) con la punta redondeada, extruida 1.0 y
  // doblada: sale de la barra (z = 0) y sube a apoyarse en el arco (z ≈ 1.3).
  const tw = BUCKLE.tongueW;
  const y0 = -L / 2 + 0.2;
  const y1 = L / 2 - wire * 0.7;
  const t = new THREE.Shape();
  t.moveTo(-tw / 2, y0);
  t.lineTo(tw / 2, y0);
  t.lineTo(tw / 2 * 0.8, y1 - tw / 2);
  t.quadraticCurveTo(0, y1 + tw * 0.35, -tw / 2 * 0.8, y1 - tw / 2);
  t.closePath();
  const tongue = new THREE.ExtrudeGeometry(t, {
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelOffset: -0.2,
    bevelSegments: 2,
    curveSegments: 8,
    steps: 1,
  });
  tongue.translate(0, 0, -0.3);
  // Doblez: la púa rodea la barra (y cerca de y0) y luego va casi recta.
  const p = tongue.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = Math.min(1, Math.max(0, (y - y0) / 2.6));
    const rise = 1.35 * (k * k * (3 - 2 * k)) - 0.05 * Math.max(0, y - (y1 - 3));
    p.setZ(i, p.getZ(i) + rise);
  }
  tongue.deleteAttribute("normal");
  tongue.computeVertexNormals();
  return { frame, tongue, tonguePivot: new THREE.Vector3(0, -L / 2 + 0.6, 0) };
}

/** Desplegable: la cabeza pulida con sus dos pulsadores, y una bisagra (para
 *  la punta de una correa de ancho `strapW`). */
export function deployantGeometries(strapW: number): {
  head: THREE.BufferGeometry;
  pushers: THREE.BufferGeometry;
  barrel: THREE.BufferGeometry;
} {
  const hs = new THREE.Shape(roundRectPts(14, 8, 2.2));
  const head = extrudeCentered(hs, 2.6, 0.55, 4, 10);
  const b1 = new THREE.CylinderGeometry(1.05, 1.05, 1.6, 24, 1);
  b1.rotateZ(Math.PI / 2);
  // El borde de la cabeza está en x = ±7: los pulsadores asoman a ±7.6.
  b1.translate(7.6, 0, 0);
  const b2 = b1.clone();
  b2.translate(-15.2, 0, 0);
  const pushers = mergeGeometries([b1.toNonIndexed(), b2.toNonIndexed()]);
  b1.dispose();
  b2.dispose();
  const barrel = new THREE.CylinderGeometry(1.0, 1.0, strapW - 0.8, 24, 1);
  barrel.rotateZ(Math.PI / 2);
  return { head, pushers, barrel };
}

function roundRectPts(w: number, l: number, r: number, seg = 6): THREE.Vector2[] {
  const rr = Math.min(r, w / 2, l / 2);
  const out: THREE.Vector2[] = [];
  const corners: [number, number, number][] = [
    [w / 2 - rr, -l / 2 + rr, -Math.PI / 2],
    [w / 2 - rr, l / 2 - rr, 0],
    [-w / 2 + rr, l / 2 - rr, Math.PI / 2],
    [-w / 2 + rr, -l / 2 + rr, Math.PI],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + ((Math.PI / 2) * i) / seg;
      out.push(new THREE.Vector2(cx + rr * Math.cos(a), cy + rr * Math.sin(a)));
    }
  }
  return out;
}

/** Una pieza larga de metal en el espacio de la correa (de s0 a s1, ancho w,
 *  grueso th, centrada en v = `v`), con bisel `bevel`. Grupos: 0 = caras
 *  planas de arriba y abajo (cepilladas), 1 = biseles, cantos y tapas
 *  (pulidos). `lip`: la pestaña de levantar (x, largo, alto) en el extremo s1. */
export function sweptPlate(
  s0: number,
  s1: number,
  w: number,
  th: number,
  bevel: number,
  v: number,
  lip?: { w: number; l: number; h: number },
): THREE.BufferGeometry {
  // Sección (u, v) antihoraria con biseles a 45°: 8 puntos.
  const b = Math.min(bevel, th / 2 - 0.05, w / 2 - 0.05);
  const sec: [number, number, 0 | 1][] = [
    [-w / 2 + b, th / 2, 0],
    [w / 2 - b, th / 2, 1],
    [w / 2, th / 2 - b, 1],
    [w / 2, -th / 2 + b, 1],
    [w / 2 - b, -th / 2, 0],
    [-w / 2 + b, -th / 2, 1],
    [-w / 2, -th / 2 + b, 1],
    [-w / 2, th / 2 - b, 1],
  ];
  // Vértices duplicados por cara (normales planas en cada cara de la sección).
  const N = Math.max(2, Math.ceil((s1 - s0) / 0.5));
  const pos: number[] = [];
  const idx: [number[], number[]] = [[], []];
  const M = sec.length;
  for (let e = 0; e < M; e++) {
    const [u0, w0, zone] = sec[e];
    const [u1, w1] = sec[(e + 1) % M];
    const base = pos.length / 3;
    for (let i = 0; i <= N; i++) {
      const s = s0 + ((s1 - s0) * i) / N;
      pos.push(u0, s, v + w0, u1, s, v + w1);
      if (i > 0) {
        const a = base + (i - 1) * 2;
        const c = base + i * 2;
        // La sección va antihoraria vista desde +s: cara hacia fuera.
        idx[zone].push(a, a + 1, c + 1, a, c + 1, c);
      }
    }
  }
  // Tapas.
  const capAt = (s: number, flip: boolean) => {
    const ci = pos.length / 3;
    pos.push(0, s, v);
    for (const [u, w0] of sec) pos.push(u, s, v + w0);
    for (let j = 0; j < M; j++) {
      const a = ci + 1 + j;
      const c = ci + 1 + ((j + 1) % M);
      if (flip) idx[1].push(ci, c, a);
      else idx[1].push(ci, a, c);
    }
  };
  capAt(s0, true);
  capAt(s1, false);
  let g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([...idx[0], ...idx[1]]);
  g.addGroup(0, idx[0].length, 0);
  g.addGroup(idx[0].length, idx[1].length, 1);
  g = g.toNonIndexed();
  g.computeVertexNormals();
  // toNonIndexed conserva los grupos (en orden de vértices).
  if (lip) {
    const box = new THREE.BoxGeometry(lip.w, lip.l, lip.h, 1, 1, 1);
    box.translate(0, s1 - lip.l / 2 - 0.6, v + th / 2 + lip.h / 2 - 0.1);
    const nb = box.toNonIndexed();
    nb.deleteAttribute("uv");
    const before = g.getAttribute("position").count;
    const merged = mergeGeometries([g, nb], false);
    // mergeGeometries sin grupos: se rehacen (la pestaña va pulida).
    merged.clearGroups();
    const g0 = g.groups[0];
    const g1 = g.groups[1];
    merged.addGroup(g0.start, g0.count, 0);
    merged.addGroup(g1.start, g1.count, 1);
    merged.addGroup(before, nb.getAttribute("position").count, 1);
    g.dispose();
    box.dispose();
    nb.dispose();
    g = merged;
  }
  g.deleteAttribute("uv");
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2));
  // UV en mm para el cepillado: u a lo ancho, v a lo largo.
  const p = g.getAttribute("position");
  const uv = g.getAttribute("uv");
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i));
  return toStrapSpace(g);
}
