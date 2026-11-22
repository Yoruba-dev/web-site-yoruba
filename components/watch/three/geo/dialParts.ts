// ---------------------------------------------------------------------------
// PIEZAS SOBRE LA ESFERA como geometría real (mm, y arriba, la esfera en z=0):
// el disco con el hueco de la fecha, los índices aplicados (aro pulido + lume)
// y las agujas. Las medidas salen SOLO de lib/watch-art.ts (DIAL_LAYOUT,
// dialPrimitives, HANDS): las mismas cifras que el cartel, el compositor y la
// hoja del taller.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { DIAL_LAYOUT, HANDS, dialHasDate, dialPrimitives } from "@/lib/watch-art";
import type { WatchConfig } from "@/lib/watch";
import { circlePts, offsetConvex, roundRectPts, shapeOf, type P2 } from "./outline";
import { APLIQUE_IMG, APLIQUE_OUTLINE } from "./apliqueOutline";

/** Alturas (z, mm) de cada nivel sobre la esfera. */
export const Z = {
  dial: 0,
  applied: 0.3,
  hour: 0.85,
  minute: 1.12,
  seconds: 1.4,
  crystalBottom: 1.6,
} as const;

/** El disco de la esfera (Ø30.5) con el hueco de la ventana de fecha; UV de
 *  la textura de la esfera (u = x/30.5 + 0.5, v = y/30.5 + 0.5). */
export function dialDiscGeometry(c: WatchConfig): THREE.BufferGeometry {
  const R = DIAL_LAYOUT.r;
  const holes: P2[][] = [];
  if (dialHasDate(c)) {
    const D = DIAL_LAYOUT.date;
    holes.push(roundRectPts(D.cx, 0, D.w, D.h, 0.02, 1).reverse());
  }
  const g = new THREE.ShapeGeometry(shapeOf(circlePts(R, 160), holes), 1);
  const p = g.getAttribute("position");
  const uv = g.getAttribute("uv");
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * R) + 0.5, p.getY(i) / (2 * R) + 0.5);
  uv.needsUpdate = true;
  return g;
}

/** Las paredes del hueco de la fecha (la esfera tiene 0.4 mm de grueso). */
export function dateWellGeometry(): THREE.BufferGeometry {
  const D = DIAL_LAYOUT.date;
  const outer = roundRectPts(D.cx, 0, D.w + 0.04, D.h + 0.04, 0.02, 1);
  const inner = roundRectPts(D.cx, 0, D.w, D.h, 0.02, 1).reverse();
  const g = new THREE.ExtrudeGeometry(shapeOf(outer, [inner]), { depth: 0.42, bevelEnabled: false });
  g.translate(0, 0, -0.42);
  return g;
}

const ringExtrude = (outer: P2[], inner: P2[] | null, depth: number, bevel: number) => {
  const g = new THREE.ExtrudeGeometry(shapeOf(outer, inner ? [inner] : []), {
    depth: Math.max(0.01, depth - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.translate(0, 0, bevel);
  return g;
};

/** y abajo (primitivas) → y arriba (3D). */
const up = (pts: readonly P2[]): P2[] => pts.map(([x, y]) => [x, -y] as P2);

/** Aros pulidos y rellenos de lume de los índices aplicados y el marco de la
 *  fecha. `rims` en metal, `lume` en pintura luminosa. */
export function appliedGeometries(c: WatchConfig): { rims: THREE.BufferGeometry | null; lume: THREE.BufferGeometry | null } {
  const rims: THREE.BufferGeometry[] = [];
  const lume: THREE.BufferGeometry[] = [];
  const add = (list: THREE.BufferGeometry[], g: THREE.BufferGeometry) => list.push(g.index ? g.toNonIndexed() : g);
  for (const p of dialPrimitives(c)) {
    if (p.capa !== "aplicado" || p.id === "aplique") continue;
    const w = p.strokeWidth ?? 0.2;
    const filled = !!p.fill && p.fill !== "none";
    switch (p.kind) {
      case "circle": {
        const torus = new THREE.TorusGeometry(p.r, w * 0.6, 10, 56);
        torus.scale(1, 1, 1.25);
        torus.translate(p.cx, -p.cy, Z.applied - w * 0.6 * 1.25);
        add(rims, torus);
        if (filled) {
          const cyl = new THREE.CylinderGeometry(p.r - w * 0.25, p.r - w * 0.25, 0.22, 40, 1);
          cyl.rotateX(Math.PI / 2);
          cyl.translate(p.cx, -p.cy, 0.11);
          add(lume, cyl);
        }
        break;
      }
      case "rect": {
        const cx = p.x + p.w / 2;
        const cy = -(p.y + p.h / 2);
        const rx = p.rx ?? 0;
        if (filled) {
          const outer = roundRectPts(cx, cy, p.w + w, p.h + w, rx + w / 2);
          const inner = roundRectPts(cx, cy, p.w - w, p.h - w, Math.max(0, rx - w / 2)).reverse();
          add(rims, ringExtrude(outer, inner, Z.applied, 0.05));
          add(lume, ringExtrude(roundRectPts(cx, cy, p.w - w * 0.6, p.h - w * 0.6, Math.max(0, rx - w / 4)), null, 0.22, 0.03));
        } else {
          // Marco de la fecha: el trazo cubre del hueco hacia fuera.
          const outer = roundRectPts(cx, cy, p.w + w, p.h + w, (p.rx ?? 0) + w / 2);
          const inner = roundRectPts(cx, cy, p.w - w, p.h - w, 0.02, 1).reverse();
          // 0.3 mm por encima de la esfera (§4.9 #12).
          add(rims, ringExtrude(outer, inner, 0.3, 0.05));
        }
        break;
      }
      case "path": {
        // El triángulo de las 12: M x0 y0 L x1 y1 L x2 y2 Z.
        const nums = (p.d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
        if (nums.length < 6) break;
        const tri = up([
          [nums[0], nums[1]],
          [nums[2], nums[3]],
          [nums[4], nums[5]],
        ]);
        const outer = offsetConvex(tri, w / 2);
        const inner = offsetConvex(tri, -w / 2).reverse();
        add(rims, ringExtrude(outer, inner, Z.applied, 0.05));
        add(lume, ringExtrude(offsetConvex(tri, -w * 0.2), null, 0.22, 0.03));
        break;
      }
      default:
        break;
    }
  }
  return {
    rims: rims.length ? mergeGeometries(rims) : null,
    lume: lume.length ? mergeGeometries(lume) : null,
  };
}

// ===========================================================================
// AGUJAS — en local apuntan a las 12 (+y); se giran −ángulo sobre z.
// ===========================================================================
/** Lume de las agujas: las mismas formas que el compositor (y abajo). */
const HOUR_LUME: P2[] = [
  [-0.44, -1.7],
  [-0.44, -6.35],
  [0, -7.3],
  [0.44, -6.35],
  [0.44, -1.7],
];
const MINUTE_LUME: P2[] = [
  [-0.32, -2],
  [-0.32, -11.15],
  [0, -11.95],
  [0.32, -11.15],
  [0.32, -2],
];

type Blade = { readonly tail: number; readonly tip: number; readonly shoulder: number; readonly halfW: number };

function bladePts(b: Blade): P2[] {
  return [
    [-b.halfW, -b.tail],
    [b.halfW, -b.tail],
    [b.halfW, b.shoulder],
    [0, b.tip],
    [-b.halfW, b.shoulder],
  ];
}

/** Aguja de espada: marco pulido con el lume dentro (como las reales). */
export function swordHand(kind: "hour" | "minute"): { frame: THREE.BufferGeometry; lume: THREE.BufferGeometry } {
  const b = kind === "hour" ? HANDS.hour : HANDS.minute;
  const lumePts = up(kind === "hour" ? HOUR_LUME : MINUTE_LUME);
  const outline = bladePts(b);
  const hole = offsetConvex(lumePts, 0.02).reverse();
  const frame = new THREE.ExtrudeGeometry(shapeOf(outline, [hole]), {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelOffset: -0.06,
    bevelSegments: 2,
  });
  frame.translate(0, 0, 0.06);
  // Facetada (§4.9 #15): la cara de arriba son dos planos a ±8° que se
  // juntan en una arista central (cresta de 0.12 mm sobre los cantos).
  const tilt = Math.tan((8 * Math.PI) / 180);
  const top = 0.06 + 0.1 + 0.06;
  const p = frame.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    if (z > 0.12) {
      const rise = Math.min(0.12, tilt * Math.max(0, b.halfW - Math.abs(p.getX(i))));
      p.setZ(i, z + rise * ((z - 0.06) / (top - 0.06)));
    }
  }
  frame.deleteAttribute("normal");
  frame.computeVertexNormals();
  // El lume, un pelo más estrecho que el hueco del marco (si las paredes
  // coinciden, parpadean) y hundido 0.1 mm bajo el canto del marco.
  const holeRise = tilt * Math.max(0, b.halfW - Math.max(...lumePts.map(([x]) => Math.abs(x))));
  const lume = new THREE.ExtrudeGeometry(shapeOf(offsetConvex(lumePts, -0.01)), {
    depth: Math.max(0.05, top + holeRise - 0.1 - 0.02),
    bevelEnabled: false,
  });
  lume.translate(0, 0, 0.02);
  return { frame, lume };
}

/** Segundero: varilla, flecha hueca, aro del punto luminoso y contrapeso (en
 *  el color elegido) + el punto luminoso. */
export function secondsHand(): { body: THREE.BufferGeometry; lume: THREE.BufferGeometry } {
  const S = HANDS.seconds;
  const neck = S.tip - S.head.len;
  const stem = shapeOf([
    [-S.halfW, -S.tail],
    [S.halfW, -S.tail],
    [S.halfW, neck + 0.05],
    [-S.halfW, neck + 0.05],
  ]);
  const triOut: P2[] = [
    [-S.head.halfW, neck],
    [S.head.halfW, neck],
    [0, S.tip],
  ];
  const head = shapeOf(triOut, [offsetConvex(triOut, -0.12).reverse()]);
  const lumeRing = shapeOf(circlePts(S.lume.r + S.lume.ring / 2, 40).map(([x, y]) => [x, y + S.lume.at] as P2), [
    circlePts(S.lume.r - S.lume.ring / 2, 40)
      .map(([x, y]) => [x, y + S.lume.at] as P2)
      .reverse(),
  ]);
  const counter = shapeOf(circlePts(S.counter.r, 40).map(([x, y]) => [x, y - S.counter.at] as P2));
  const body = new THREE.ExtrudeGeometry([stem, head, lumeRing, counter], {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: -0.02,
    bevelSegments: 1,
    curveSegments: 6,
  });
  body.translate(0, 0, 0.02);
  const lume = new THREE.CylinderGeometry(S.lume.r - S.lume.ring / 2 + 0.01, S.lume.r - S.lume.ring / 2 + 0.01, 0.08, 32);
  lume.rotateX(Math.PI / 2);
  lume.translate(0, S.lume.at, 0.05);
  return { body, lume };
}

/** Grados (horario, 0 = las 12) → giro z de three (antihorario). */
export const handRotation = (deg: number) => (-deg * Math.PI) / 180;

// ===========================================================================
// APLIQUE PY en relieve (§4.9 #14): el contorno trazado sin conexión
// (apliqueOutline.ts), extruido 0.3 mm con bisel de 0.05. Las caras de arriba
// y abajo llevan UV de la foto del aplique (u, v de la imagen cuadrada); las
// paredes van en metal (grupo 1 de ExtrudeGeometry).
// ===========================================================================
export function appliqueGeometry(side: number, depth = 0.3, bevel = 0.05): THREE.BufferGeometry {
  const k = side / APLIQUE_IMG.w;
  const cx = APLIQUE_IMG.w / 2;
  const cy = APLIQUE_IMG.h / 2;
  const pts = (s: string): THREE.Vector2[] => {
    const v = s.split(",").map(Number);
    const out: THREE.Vector2[] = [];
    for (let i = 0; i + 1 < v.length; i += 2) out.push(new THREE.Vector2((v[i] / 10 - cx) * k, (v[i + 1] / 10 - cy) * k));
    return out;
  };
  const shapes = APLIQUE_OUTLINE.map(([outer, ...holes]) => {
    const sh = new THREE.Shape(pts(outer));
    for (const h of holes) sh.holes.push(new THREE.Path(pts(h)));
    return sh;
  });
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth: Math.max(0.01, depth - 2 * bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelOffset: -bevel * 0.8,
    bevelSegments: 1,
    curveSegments: 1,
  });
  g.translate(0, 0, bevel);
  const p = g.getAttribute("position");
  const uv = g.getAttribute("uv");
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / side + 0.5, p.getY(i) / side + 0.5);
  uv.needsUpdate = true;
  // ExtrudeGeometry deja DOS grupos por isla (27 islas → 54 llamadas de
  // dibujo): se reordenan los vértices en dos grupos (caras / paredes).
  return twoGroups(g);
}

/** Reordena una geometría sin índice para que todos los grupos de cada
 *  material queden seguidos: un grupo por material. */
function twoGroups(g: THREE.BufferGeometry): THREE.BufferGeometry {
  if (g.index || g.groups.length <= 2) return g;
  const names = Object.keys(g.attributes);
  const byMat = new Map<number, { start: number; count: number }[]>();
  for (const gr of g.groups) {
    const m = gr.materialIndex ?? 0;
    if (!byMat.has(m)) byMat.set(m, []);
    byMat.get(m)!.push(gr);
  }
  const mats = [...byMat.keys()].sort((a, b) => a - b);
  const out = new THREE.BufferGeometry();
  const total = g.getAttribute("position").count;
  for (const name of names) {
    const a = g.getAttribute(name) as THREE.BufferAttribute;
    const arr = new Float32Array(total * a.itemSize);
    let o = 0;
    for (const m of mats) {
      for (const gr of byMat.get(m)!) {
        arr.set((a.array as Float32Array).subarray(gr.start * a.itemSize, (gr.start + gr.count) * a.itemSize), o);
        o += gr.count * a.itemSize;
      }
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize));
  }
  let start = 0;
  for (const m of mats) {
    const count = byMat.get(m)!.reduce((n, gr) => n + gr.count, 0);
    out.addGroup(start, count, m);
    start += count;
  }
  g.dispose();
  return out;
}
