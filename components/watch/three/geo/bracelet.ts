// ---------------------------------------------------------------------------
// BRAZALETE: los eslabones rígidos y su alma, en el ESPACIO LOCAL de la correa
// (ver geo/strap.ts: s a lo largo, u a lo ancho, v hacia fuera).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { L_BOTTOM, toStrapSpace } from "../pose";
import { STRAP_LEN, roundRect2, smooth } from "./strap";

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
