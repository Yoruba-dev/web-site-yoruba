// ---------------------------------------------------------------------------
// SÓLIDOS DE METAL por rejilla: una cara de arriba y otra de abajo dadas como
// alturas sobre una rejilla (x, y) de la que se pueden quitar celdas (los
// entalles de una placa), con sus paredes. Las normales se alisan solo dentro
// de cada cara (arista viva a partir de 28°): el chaflán se ve como chaflán y
// la curva como curva. UV en mm (u a lo ancho, v a lo largo): el cepillado
// corre a lo largo, como en las piezas reales.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const CREASE = THREE.MathUtils.degToRad(28);

/** Un vértice de la rejilla: su sitio en planta y sus dos alturas. */
export interface GridVertex {
  x: number;
  y: number;
  top: number;
  bot: number;
}

export interface GridSolid {
  xs: readonly number[];
  ys: readonly number[];
  at: (x: number, y: number, i: number, j: number) => GridVertex;
  /** ¿Hay metal en la celda (i, j)? Por defecto, en todas. */
  solid?: (i: number, j: number) => boolean;
  /** Zona de la cara de arriba de una celda (0 por defecto). */
  zone?: (i: number, j: number) => number;
}

/** UV en mm según hacia dónde mira cada triángulo (sin índice). */
export function uvByNormal(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const p = g.getAttribute("position");
  const uv = new Float32Array(p.count * 2);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1).sub(a);
    c.fromBufferAttribute(p, i + 2).sub(a);
    b.cross(c);
    const nx = Math.abs(b.x);
    const ny = Math.abs(b.y);
    const nz = Math.abs(b.z);
    for (let k = i; k < i + 3; k++) {
      const x = p.getX(k);
      const y = p.getY(k);
      const z = p.getZ(k);
      if (nx > nz && nx >= ny) {
        uv[k * 2] = z;
        uv[k * 2 + 1] = y;
      } else if (ny > nz) {
        uv[k * 2] = x;
        uv[k * 2 + 1] = z;
      } else {
        uv[k * 2] = x;
        uv[k * 2 + 1] = y;
      }
    }
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Cierra una geometría hecha a triángulos sueltos: aristas vivas y UV en mm. */
export function finishSolid(tris: readonly number[], crease = CREASE): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(tris as number[], 3));
  g.computeVertexNormals();
  return uvByNormal(toCreasedNormals(g, crease));
}

/** El sólido de la rejilla, una geometría por zona (la 0 lleva además el
 *  fondo y las paredes). */
export function gridSolid(d: GridSolid, crease = CREASE): THREE.BufferGeometry[] {
  const nx = d.xs.length;
  const ny = d.ys.length;
  const V: GridVertex[] = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V.push(d.at(d.xs[i], d.ys[j], i, j));
  const v = (i: number, j: number) => V[j * nx + i];
  const has = (i: number, j: number) => i >= 0 && j >= 0 && i < nx - 1 && j < ny - 1 && (d.solid ? d.solid(i, j) : true);
  const out: number[][] = [[]];
  type P = [number, number, number];
  const T = (q: GridVertex): P => [q.x, q.y, q.top];
  const B = (q: GridVertex): P => [q.x, q.y, q.bot];
  const quad = (z: number, a: P, b: P, c: P, e: P) => {
    (out[z] ??= []).push(...a, ...b, ...c, ...a, ...c, ...e);
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      if (!has(i, j)) continue;
      const a = v(i, j);
      const b = v(i + 1, j);
      const c = v(i + 1, j + 1);
      const e = v(i, j + 1);
      quad(d.zone?.(i, j) ?? 0, T(a), T(b), T(c), T(e));
      quad(0, B(a), B(e), B(c), B(b));
      if (!has(i, j - 1)) quad(0, B(a), B(b), T(b), T(a));
      if (!has(i, j + 1)) quad(0, B(c), B(e), T(e), T(c));
      if (!has(i - 1, j)) quad(0, B(e), B(a), T(a), T(e));
      if (!has(i + 1, j)) quad(0, B(b), B(c), T(c), T(b));
    }
  }
  return out.map((t) => finishSolid(t, crease));
}

/** Une sólidos sin índice (posición, normal y UV) y libera los de entrada. */
export function joinSolids(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (!n.getAttribute("uv")) uvByNormal(n);
    for (const k of Object.keys(n.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") n.deleteAttribute(k);
    n.clearGroups();
    return n;
  });
  const g = mergeGeometries(flat);
  flat.forEach((x) => x.dispose());
  parts.forEach((x) => x.dispose());
  return g;
}

/** Una barra torneada a lo largo de x (perfil [x, r] de izquierda a derecha). */
export function rodX(profile: readonly (readonly [number, number])[], y: number, z: number, seg = 24): THREE.BufferGeometry {
  const tris: number[] = [];
  const pt = (k: number, a: number): [number, number, number] => [profile[k][0], y + profile[k][1] * Math.cos(a), z + profile[k][1] * Math.sin(a)];
  for (let k = 0; k + 1 < profile.length; k++) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      const A = pt(k, a0);
      const B = pt(k + 1, a0);
      const C = pt(k + 1, a1);
      const D = pt(k, a1);
      if (profile[k][1] > 1e-6) tris.push(...A, ...D, ...C);
      if (profile[k + 1][1] > 1e-6) tris.push(...A, ...C, ...B);
    }
  }
  return finishSolid(tris);
}
