// ---------------------------------------------------------------------------
// LA CAJA OCTOGONAL EN 3D (mm, y arriba, la esfera en z = 0, grosor total
// WATCH_SPECS.thicknessMm = 9.95: del bisel a +2.7 a la tapa a −7.25).
// SPEC §4.9 #1–10, medido sobre caja-acero-1200.webp y las refs 8, 13, 19:
//
//   cuerpo    la silueta trazada de la foto (CASE_QUARTER) con cantos de
//             0.35 mm: flancos cepillados en VERTICAL, cantos pulidos;
//   bisel     octógono acolchado (radios de esquina medidos, outline.ts):
//             pared pulida, chaflán pulido a 45° de 1.2 mm (medido a las 9:
//             1.22), cara cepillada en LINEAL paralela a 3–9 (ref 8) y escalón
//             interior pulido hasta la ventana de Ø28.8;
//   orejas    guardacoronas a las 3 y a las 9 con su faceta de arriba pulida;
//   cubreasas a las 12 y a las 6: bloques trapecio pulidos espejo, biseles de
//             0.4 y cara convexa de 0.3 (refs 8, 13, 19);
//   tornillos dos cabezas Ø1.1 pulidas en el flanco derecho, junto a las asas
//             (se ven en la ref 8 a resolución completa y en la 19);
//   corona    Ø6.6 × 3.6 con 18 estrías redondeadas (±0.18), tapa abombada
//             pulida, anillo de hombro y tubo Ø3 (ref 19);
//   tapa      anillo cepillado en radial con las 6 muescas de la llave, bisel
//             pulido de 0.3 y el campo del grabado (Ø25.2), un pelo saliente;
//   cristal   zafiro plano (ver el material) con un aro pulido de 0.25 mm.
// Las piezas fijas se UNEN por material (cepillado vertical / lineal x /
// pulido / mate): menos llamadas de dibujo.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { WATCH_SPECS } from "@/lib/watch";
import {
  BEZEL_QUARTER,
  CASE_DIM,
  CASE_QUARTER,
  bezelCornerRadii,
  cap,
  circlePts,
  loft,
  mirrorQuarter,
  offsetPolygon,
  roundedConvex,
  type P2,
} from "./outline";
import { CASEBACK_FIELD_R } from "../tex/maps";

/** Cotas z (mm). */
export const CZ = {
  bodyBottom: -6.4,
  bodyTop: 0.9,
  bezelBase: 0.7,
  bezelWallTop: 1.5,
  bezelTop: 2.7,
  /** Escalón interior: de la cara del bisel a la ventana. */
  innerChamferBottom: 1.9,
  crystalTop: 1.92,
  casebackRing: -6.98,
  casebackField: -7.25,
  crownZ: -2.6,
} as const;

/** Radio de la ventana del bisel = lo que se ve de la esfera (14.4). */
export const OPENING_R = WATCH_SPECS.aberturaVisibleMm / 2;
const INNER_CHAMFER_R = OPENING_R + 0.85;
const BODY_EDGE = 0.35;
const BEZEL_CHAMFER = 1.2;

export interface CaseGeometries {
  /** Cepillado vertical: flancos, caras de arriba y abajo, tubo de la corona. */
  brushed: THREE.BufferGeometry;
  /** Cepillado lineal paralelo a 3–9: la cara del bisel. */
  brushedX: THREE.BufferGeometry;
  /** Pulido: cantos, pared y chaflanes del bisel, escalón interior, corona,
   *  cubreasas, facetas de las orejas, tornillos, aro del cristal, bisel del
   *  campo de la tapa. */
  polished: THREE.BufferGeometry;
  /** Mate: la pared de la ventana sobre la esfera. */
  matte: THREE.BufferGeometry;
  casebackRing: THREE.BufferGeometry;
  casebackNotches: THREE.BufferGeometry;
  casebackField: THREE.BufferGeometry;
  crystal: THREE.BufferGeometry;
  dispose(): void;
}

/** Lathe alrededor del eje z (los puntos son [r, z]). */
function latheZ(pts: readonly P2[], segs = 128): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    pts.map(([r, z]) => new THREE.Vector2(r, z)),
    segs,
  );
  // LatheGeometry gira alrededor de y: y → z.
  g.rotateX(Math.PI / 2);
  return g;
}

/** x de la silueta (cuarto de arriba a la izquierda, en valor absoluto) a la
 *  altura |y|. */
function silX(y: number): number {
  const q = CASE_QUARTER;
  const ay = Math.abs(y);
  for (let i = 0; i + 1 < q.length; i++) {
    const [x0, y0] = q[i];
    const [x1, y1] = q[i + 1];
    if (ay >= Math.min(y0, y1) && ay <= Math.max(y0, y1) && y1 !== y0) {
      return Math.abs(x0 + ((x1 - x0) * (ay - y0)) / (y1 - y0));
    }
  }
  return Math.abs(q[0][0]);
}

/** Corona: torno con estrías a lo largo del eje x (local: x′ = 0 en el
 *  flanco). Hombro Ø4.6, tambor Ø6.6 con 18 estrías redondeadas, tapa
 *  abombada (media elipse). */
function crownGeometry(): THREE.BufferGeometry {
  const FLUTES = 18;
  const A = 0.18;
  const SEG = FLUTES * 8;
  const prof: { x: number; r: number; flute: number }[] = [];
  const push = (x: number, r: number, flute: number) => prof.push({ x, r, flute });
  push(0, 2.3, 0);
  push(0.45, 2.3, 0);
  push(0.5, 2.6, 0);
  push(0.62, 3.25, 0);
  for (let i = 0; i <= 20; i++) {
    const x = 0.7 + (2.3 * i) / 20;
    const f = Math.min(1, (x - 0.7) / 0.15, (3.0 - x) / 0.15);
    push(x, 3.3, Math.max(0, f));
  }
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    push(3.0 + 0.6 * Math.sin(a), 3.3 * Math.cos(a) * (0.35 + 0.65 * Math.cos(a)) + 0.0001, 0);
  }
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  prof.forEach((p, i) => {
    for (let j = 0; j <= SEG; j++) {
      const th = (j / SEG) * Math.PI * 2;
      // Estría redondeada: el radio baja en un coseno (no en dientes).
      const r = p.r - A * p.flute * (0.5 + 0.5 * Math.cos(FLUTES * th));
      pos.push(p.x, r * Math.cos(th), r * Math.sin(th));
      uv.push(j / SEG, i / prof.length);
    }
    if (i > 0) {
      const a = (i - 1) * (SEG + 1);
      const b = i * (SEG + 1);
      for (let j = 0; j < SEG; j++) idx.push(a + j, b + j, a + j + 1, a + j + 1, b + j, b + j + 1);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Cubreasas: trapecio pulido (13.4 → 12.6 de ancho), biseles 0.4, cara de
 *  arriba convexa 0.3. En la muesca de las 12 (la de las 6 es su espejo). */
function lugHoodGeometry(): THREE.BufferGeometry {
  const y0 = CASE_DIM.notchY + 0.04;
  const y1 = CASE_DIM.lugEnd - 0.05;
  const w0 = CASE_DIM.notchHalfW * 2 - 0.3;
  const w1 = w0 - 0.8;
  const sh = new THREE.Shape();
  sh.moveTo(-w0 / 2, y0);
  sh.lineTo(w0 / 2, y0);
  sh.lineTo(w1 / 2, y1);
  sh.lineTo(-w1 / 2, y1);
  sh.closePath();
  const z0 = -1.7;
  const z1 = 0.75;
  const bevel = 0.4;
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: z1 - z0 - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 3,
    curveSegments: 2,
  });
  g.translate(0, 0, z0 + bevel);
  // Convexa 0.3 a lo ancho en la cara de arriba.
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    if (z > z1 - bevel - 0.01) {
      const u = (2 * p.getX(i)) / w0;
      p.setZ(i, z + 0.3 * Math.max(0, 1 - u * u));
    }
  }
  g.deleteAttribute("normal");
  g.computeVertexNormals();
  return g;
}

export function caseGeometries(): CaseGeometries {
  // — Cuerpo ———————————————————————————————————————————————————————————
  const sil = mirrorQuarter(CASE_QUARTER);
  const silIn = offsetPolygon(sil, -BODY_EDGE);
  const bodyWall = loft([
    { pts: sil, z: CZ.bodyBottom + BODY_EDGE },
    { pts: sil, z: CZ.bodyTop - BODY_EDGE },
  ]);
  const edgeBottom = loft([
    { pts: silIn, z: CZ.bodyBottom },
    { pts: sil, z: CZ.bodyBottom + BODY_EDGE },
  ]);
  const edgeTop = loft([
    { pts: sil, z: CZ.bodyTop - BODY_EDGE },
    { pts: silIn, z: CZ.bodyTop },
  ]);

  // — Bisel ————————————————————————————————————————————————————————————
  const B = mirrorQuarter(BEZEL_QUARTER);
  // mirrorQuarter repite el vértice de las 12 y de las 3 en medio de una
  // arista recta: fuera (el redondeo necesita vértices de esquina reales).
  const corners = B.filter(([x, y]) => Math.abs(x) > 1e-6 && Math.abs(y) > 1e-6);
  const radii = bezelCornerRadii(corners);
  const b0 = roundedConvex(corners, radii, 0, 10);
  const capTop = cap(silIn, CZ.bodyTop, [roundedConvex(corners, radii, -0.3, 10)]);
  const capBottom = cap(silIn, CZ.bodyBottom, [circlePts(15.6, 96)], true);
  const b1 = roundedConvex(corners, radii, -BEZEL_CHAMFER, 10);
  const bezelWall = loft([
    { pts: b0, z: CZ.bezelBase },
    { pts: b0, z: CZ.bezelWallTop },
  ]);
  const bezelChamfer = loft([
    { pts: b0, z: CZ.bezelWallTop },
    { pts: b1, z: CZ.bezelTop },
  ]);
  const bezelTop = cap(b1, CZ.bezelTop, [circlePts(INNER_CHAMFER_R, 160)]);
  const innerChamfer = latheZ([
    [INNER_CHAMFER_R, CZ.bezelTop],
    [OPENING_R, CZ.innerChamferBottom],
  ]);
  const innerWall = latheZ([
    [OPENING_R, CZ.innerChamferBottom],
    [OPENING_R, -0.45],
  ]);

  // — Orejas: faceta de arriba pulida (3 y 9), un pelo sobre la cara ——————
  const facets: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    const pts: P2[] = [];
    const Y = 6.4;
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const y = -Y + (2 * Y * i) / N;
      pts.push([sx * (silX(y) - BODY_EDGE - 0.05), y]);
    }
    for (let i = N; i >= 0; i--) {
      const y = -Y + (2 * Y * i) / N;
      pts.push([sx * 18.5, y]);
    }
    const ccw = sx > 0 ? pts.reverse() : pts;
    facets.push(cap(ccw, CZ.bodyTop + 0.015));
  }

  // — Corona (a las 3: eje x) y su tubo ————————————————————————————————
  const crown = crownGeometry();
  crown.translate(CASE_DIM.earX + 0.05, 0, CZ.crownZ);
  const crownTube = new THREE.CylinderGeometry(1.5, 1.5, 1.2, 40);
  crownTube.rotateZ(Math.PI / 2);
  crownTube.translate(CASE_DIM.earX - 0.4, 0, CZ.crownZ);

  // — Cubreasas (12 y 6) ——————————————————————————————————————————————
  const hood12 = lugHoodGeometry();
  const hood6 = lugHoodGeometry();
  hood6.scale(1, -1, 1);
  // El espejo invierte las caras: se rehacen.
  hood6.index && hood6.setIndex(Array.from(hood6.index.array).reverse());

  // — Tornillos del flanco derecho (Ø1.1, cúpulas pulidas) ——————————————
  const pins: THREE.BufferGeometry[] = [];
  for (const sy of [-1, 1]) {
    // En la pared del asa: el tramo de la silueta de (13.9, 16.3) a
    // (11.55, 22.5), a y = 18.6 y media altura.
    const y = 18.6;
    const x = silX(y);
    const n = new THREE.Vector3(6.2, sy * 2.35, 0).normalize();
    const dome = new THREE.SphereGeometry(0.55, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1, 0.45, 1);
    // De +y (eje de la cúpula) a la normal de la pared.
    dome.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n));
    dome.translate(x - 0.02, sy * y, -2.75);
    pins.push(dome);
  }

  // — Tapa ————————————————————————————————————————————————————————————
  const fieldBevel = latheZ([
    [CASEBACK_FIELD_R, CZ.casebackField + 0.005],
    [CASEBACK_FIELD_R + 0.3, CZ.casebackField + 0.22],
  ]);
  const casebackRing = latheZ([
    [CASEBACK_FIELD_R + 0.3, CZ.casebackField + 0.22],
    [CASEBACK_FIELD_R + 0.55, CZ.casebackRing],
    [15.0, CZ.casebackRing],
    [15.5, CZ.casebackRing + 0.25],
    [15.7, CZ.bodyBottom + 0.02],
  ]);
  const notches: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const box = new THREE.BoxGeometry(1.5, 0.85, 0.1);
    box.translate(0, 14.1, CZ.casebackRing + 0.03);
    box.rotateZ(a);
    notches.push(box.toNonIndexed());
  }
  const casebackNotches = mergeNonIndexed(notches);
  // El campo liso, mirando a −z: girado sobre y (u crece hacia −x: mirado
  // por detrás, el grabado se lee derecho, con las 12 arriba).
  const casebackField = new THREE.CircleGeometry(CASEBACK_FIELD_R, 160);
  casebackField.rotateY(Math.PI);
  casebackField.translate(0, 0, CZ.casebackField);

  // — Cristal de zafiro plano y su aro pulido ——————————————————————————
  const crystal = new THREE.CircleGeometry(OPENING_R + 0.05, 128);
  crystal.translate(0, 0, CZ.crystalTop);
  const crystalRing = latheZ([
    [OPENING_R - 0.25, CZ.crystalTop + 0.01],
    [OPENING_R + 0.02, CZ.crystalTop - 0.1],
  ]);

  const out = {
    brushed: mergeNonIndexed([bodyWall, capTop, capBottom, crownTube]),
    brushedX: mergeNonIndexed([bezelTop]),
    polished: mergeNonIndexed([
      edgeBottom,
      edgeTop,
      bezelWall,
      bezelChamfer,
      innerChamfer,
      crown,
      hood12,
      hood6,
      ...facets,
      ...pins,
      crystalRing,
      fieldBevel,
    ]),
    matte: mergeNonIndexed([innerWall]),
    casebackRing,
    casebackNotches,
    casebackField,
    crystal,
  };
  return {
    ...out,
    dispose() {
      for (const g of Object.values(out)) g.dispose();
    },
  };
}

/** Une geometrías (posición, normal y uv; sin índice). Libera las de
 *  entrada. */
function mergeNonIndexed(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const parts = list.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const g of parts) n += g.getAttribute("position").count;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  let o = 0;
  for (const g of parts) {
    const p = g.getAttribute("position");
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    const nn = g.getAttribute("normal");
    const u = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) {
      pos[(o + i) * 3] = p.getX(i);
      pos[(o + i) * 3 + 1] = p.getY(i);
      pos[(o + i) * 3 + 2] = p.getZ(i);
      nor[(o + i) * 3] = nn.getX(i);
      nor[(o + i) * 3 + 1] = nn.getY(i);
      nor[(o + i) * 3 + 2] = nn.getZ(i);
      if (u) {
        uv[(o + i) * 2] = u.getX(i);
        uv[(o + i) * 2 + 1] = u.getY(i);
      }
    }
    o += p.count;
  }
  new Set([...list, ...parts]).forEach((g) => g.dispose());
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}
