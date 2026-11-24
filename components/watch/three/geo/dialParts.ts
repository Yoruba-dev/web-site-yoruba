// ---------------------------------------------------------------------------
// PIEZAS SOBRE LA ESFERA como geometría real (mm, y arriba, la esfera en z=0):
// el disco con el hueco de la fecha, los índices aplicados (aro pulido + lume)
// y las agujas. Las medidas salen SOLO de lib/watch-art.ts (DIAL_LAYOUT,
// dialPrimitives, HANDS): las mismas cifras que el cartel, el compositor y la
// hoja del taller.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { DIAL_LAYOUT, HANDS, dialHasDate, dialPrimitives, handLume, handOutline, type RectPrim } from "@/lib/watch-art";
import type { WatchConfig } from "@/lib/watch";
import { cap, circlePts, loft, offsetConvex, roundRectPts, shapeOf, type P2 } from "./outline";
import { APLIQUE_IMG, APLIQUE_OUTLINE } from "./apliqueOutline";

/** Alturas (z, mm) de cada nivel sobre la esfera. */
export const Z = {
  dial: 0,
  /** Índices aplicados (≈0.45 en la foto 14 y e10). */
  applied: 0.45,
  /** Marco de la fecha (el embudo baja a 45° sus 0.3 hasta la esfera). */
  frame: 0.3,
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

/** Lo que tapa la esfera por detrás (el movimiento, sin detalle): un disco que
 *  mira hacia la muñeca. Con la tapa aún en cristal se veían los índices y el
 *  aplique PY al revés. Va a 3.5 mm y no pegado a la esfera: ahí, los cantos de
 *  esas piezas, vistos casi de perfil, asomaban como puntos claros. */
export function dialBackGeometry(): THREE.BufferGeometry {
  const g = new THREE.CircleGeometry(DIAL_LAYOUT.r, 96);
  g.rotateY(Math.PI);
  g.translate(0, 0, -3.5);
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

/** Anillo extruido con bisel (`segs` = 1: chaflán recto a 45°). */
const ringExtrude = (outer: P2[], inner: P2[], depth: number, bevel: number, segs: number) => {
  const g = new THREE.ExtrudeGeometry(shapeOf(outer, [inner]), {
    depth: Math.max(0.01, depth - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: segs,
    curveSegments: 6,
  });
  g.translate(0, 0, bevel);
  return g;
};

/** y abajo (primitivas) → y arriba (3D). */
const up = (pts: readonly P2[]): P2[] => pts.map(([x, y]) => [x, -y] as P2);

/** Lume de los índices: borde (0.11 por debajo del aro) y abombado (mm). */
const LUME_EDGE = 0.34;
const LUME_DOME = 0.08;
/** Bisel a 45° de los aros de barras y triángulo (mm). */
const RIM_BEVEL = 0.12;

/** Aro de un punto: pared recta y canto redondeado (torno). */
function dotRim(r: number, w: number): THREE.BufferGeometry {
  const o = r + w / 2;
  const i = r - w / 2;
  const H = Z.applied;
  const prof: P2[] = [
    [o, 0],
    [o, H - 0.09],
    [o - 0.05, H - 0.02],
    [r, H],
    [i + 0.05, H - 0.02],
    [i, H - 0.09],
    [i, LUME_EDGE - 0.05],
  ];
  const g = new THREE.LatheGeometry(
    prof.map(([x, y]) => new THREE.Vector2(x, y)),
    56,
  );
  // LatheGeometry gira alrededor de y: y → z.
  g.rotateX(Math.PI / 2);
  return g;
}

/** Lume abombado: el contorno (`ring(d)` = el suyo, `d` mm hacia dentro) sube
 *  LUME_DOME en parábola hasta el centro. */
function domedLume(ring: (d: number) => readonly P2[], inset: number): THREE.BufferGeometry[] {
  const rings = [0, 0.25, 0.55, 0.9].map((t) => ({ pts: ring(inset * t), z: LUME_EDGE + LUME_DOME * (1 - (1 - t) ** 2) }));
  const top = rings[rings.length - 1];
  return [loft(rings), cap(top.pts, top.z)];
}

/** Banda plana del marco de la fecha: canto de fuera con bisel, esquina redonda
 *  y, por dentro, el borde vivo donde empieza el embudo. */
function dateBand(p: RectPrim, w: number): THREE.BufferGeometry[] {
  const cx = p.x + p.w / 2;
  const cy = -(p.y + p.h / 2);
  const r = (p.rx ?? 0) + w / 2;
  const B = 0.06;
  const out = roundRectPts(cx, cy, p.w + w, p.h + w, r, 6);
  const top = roundRectPts(cx, cy, p.w + w - 2 * B, p.h + w - 2 * B, r - B, 6);
  const hole = roundRectPts(cx, cy, p.w - w, p.h - w, 0).reverse();
  return [
    loft([
      { pts: out, z: 0 },
      { pts: out, z: Z.frame - B },
      { pts: top, z: Z.frame },
    ]),
    cap(top, Z.frame, [hole]),
  ];
}

/** Embudo del marco de la fecha: 4 facetas a 45° de la banda al hueco (fotos 4,
 *  11 y 14, renders 8 y 19). */
function dateFunnel(p: RectPrim, w: number): THREE.BufferGeometry {
  const cx = p.x + p.w / 2;
  const cy = -(p.y + p.h / 2);
  const ring = (d: number, z: number) => roundRectPts(cx, cy, p.w + d, p.h + d, 0).map(([x, y]) => [x, y, z]);
  const T = ring(w, Z.frame);
  const B = ring(-w, Z.frame - w);
  const pos: number[] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    pos.push(...T[i], ...T[j], ...B[j], ...T[i], ...B[j], ...B[i]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.computeVertexNormals();
  return g;
}

/** Aros pulidos y rellenos de lume de los índices aplicados y el marco de la
 *  fecha. `rims` en metal, `lume` en pintura luminosa. */
export function appliedGeometries(c: WatchConfig): { rims: THREE.BufferGeometry | null; lume: THREE.BufferGeometry | null } {
  const rims: THREE.BufferGeometry[] = [];
  const lume: THREE.BufferGeometry[] = [];
  const add = (list: THREE.BufferGeometry[], ...gs: THREE.BufferGeometry[]) => gs.forEach((g) => list.push(g.index ? g.toNonIndexed() : g));
  for (const p of dialPrimitives(c)) {
    if (p.capa !== "aplicado" || p.id === "aplique") continue;
    const w = p.strokeWidth ?? 0.2;
    switch (p.kind) {
      case "circle": {
        add(rims, dotRim(p.r, w * 1.2).translate(p.cx, -p.cy, 0));
        // Casquete: media esfera aplastada hasta LUME_DOME de alto.
        const rl = p.r - w * 0.5;
        const dome = new THREE.SphereGeometry(rl, 40, 5, 0, Math.PI * 2, 0, Math.PI / 2);
        dome.scale(1, LUME_DOME / rl, 1);
        dome.rotateX(Math.PI / 2);
        add(lume, dome.translate(p.cx, -p.cy, LUME_EDGE));
        break;
      }
      case "rect": {
        if (p.id === "marco-fecha") {
          add(rims, ...dateBand(p, w));
          break;
        }
        if (p.id === "embudo-fecha") {
          add(rims, dateFunnel(p, w));
          break;
        }
        const cx = p.x + p.w / 2;
        const cy = -(p.y + p.h / 2);
        const rx = p.rx ?? 0;
        const outer = roundRectPts(cx, cy, p.w + w, p.h + w, rx + w / 2);
        const inner = roundRectPts(cx, cy, p.w - w, p.h - w, Math.max(0, rx - w / 2)).reverse();
        add(rims, ringExtrude(outer, inner, Z.applied, RIM_BEVEL, 1));
        const [lw, lh] = [p.w - w * 0.6, p.h - w * 0.6];
        add(lume, ...domedLume((d) => roundRectPts(cx, cy, lw - 2 * d, lh - 2 * d, Math.max(0.02, rx - w / 4 - d)), Math.min(lw, lh) / 2));
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
        add(rims, ringExtrude(outer, inner, Z.applied, RIM_BEVEL, 1));
        const base = offsetConvex(tri, -w * 0.2);
        add(lume, ...domedLume((d) => offsetConvex(base, -d), 0.7));
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
/** Aguja de espada: buje redondo, cuello, marco pulido y el lume dentro (como
 *  las reales; sin cola: renders 8, 13, 18 y 19 del dueño). */
export function swordHand(kind: "hour" | "minute"): { frame: THREE.BufferGeometry; lume: THREE.BufferGeometry } {
  const b = HANDS[kind];
  const lumePts = up(handLume(b));
  const hole = offsetConvex(lumePts, 0.02).reverse();
  const T = 0.08;
  const DEPTH = 0.06;
  const frame = new THREE.ExtrudeGeometry(shapeOf(up(handOutline(b)), [hole]), {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: T,
    bevelSize: 0.09,
    bevelOffset: -0.09,
    bevelSegments: 2,
  });
  frame.translate(0, 0, T);
  // Facetada (§4.9 #15): la cara de arriba son dos planos a ±8° que se
  // juntan en una arista central (cresta de 0.12 mm sobre los cantos). El
  // cuello y el buje son planos: ahí se cruzan las dos agujas.
  const tilt = Math.tan((8 * Math.PI) / 180);
  const top = DEPTH + 2 * T;
  const p = frame.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    if (z > DEPTH + T - 0.02 && p.getY(i) > b.neck.to + 0.05) {
      const rise = Math.min(0.12, tilt * Math.max(0, b.halfW - Math.abs(p.getX(i))));
      p.setZ(i, z + rise * ((z - T) / (top - T)));
    }
  }
  frame.deleteAttribute("normal");
  frame.computeVertexNormals();
  // El buje: disco con el canto biselado, un pelo más alto que el cuello.
  const H = 0.24;
  const hub = new THREE.LatheGeometry(
    [
      new THREE.Vector2(b.hubR, 0),
      new THREE.Vector2(b.hubR, H - 0.07),
      new THREE.Vector2(b.hubR - 0.07, H),
      new THREE.Vector2(0.0001, H),
    ],
    48,
  ).toNonIndexed();
  hub.rotateX(Math.PI / 2);
  // Canto vivo (normales planas), como el resto de la aguja.
  hub.computeVertexNormals();
  const whole = mergeGeometries([frame, hub]);
  frame.dispose();
  hub.dispose();
  // El lume, un pelo más estrecho que el hueco del marco (si las paredes
  // coinciden, parpadean) y hundido 0.1 mm bajo el canto del marco.
  const holeRise = tilt * Math.max(0, b.halfW - b.lume.halfW);
  const lume = new THREE.ExtrudeGeometry(shapeOf(offsetConvex(lumePts, -0.01)), {
    depth: Math.max(0.05, top + holeRise - 0.1 - 0.02),
    bevelEnabled: false,
  });
  lume.translate(0, 0, 0.02);
  return { frame: whole, lume };
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
