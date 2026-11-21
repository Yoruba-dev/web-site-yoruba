// ---------------------------------------------------------------------------
// LA CAJA OCTOGONAL EN 3D (mm, y arriba, la esfera en z = 0, grosor total
// WATCH_SPECS.thicknessMm = 9.95: del cristal/bisel a +2.7 a la tapa a −7.25).
//
//   cuerpo   la silueta trazada de la foto (CASE_QUARTER) con cantos de
//            0.35 mm: flancos y asas cepillados, cantos pulidos;
//   bisel    la huella octogonal (BEZEL_QUARTER): pared pulida, chaflán
//            pulido a 45° de 1.2 mm, cara cepillada en radial y chaflán
//            interior pulido hasta la ventana de Ø28.8 (R_ABERTURA);
//   corona   a las 3, con su moleteado de 30 dientes y el tubo;
//   tapa     anillo cepillado con las 6 muescas de la llave + el disco liso
//            del grabado (Ø25.2), un pelo saliente.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { WATCH_SPECS } from "@/lib/watch";
import {
  BEZEL_CORNER_R,
  BEZEL_QUARTER,
  CASE_DIM,
  CASE_QUARTER,
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
  /** Chaflán interior: de la cara del bisel a la ventana. */
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
  bodyWall: THREE.BufferGeometry;
  bodyEdges: THREE.BufferGeometry;
  bodyCaps: THREE.BufferGeometry;
  bezelPolished: THREE.BufferGeometry;
  bezelTop: THREE.BufferGeometry;
  innerChamfer: THREE.BufferGeometry;
  innerWall: THREE.BufferGeometry;
  crown: THREE.BufferGeometry;
  crownTube: THREE.BufferGeometry;
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
  const bodyEdges = mergeNonIndexed([edgeBottom, edgeTop]);

  // — Bisel ————————————————————————————————————————————————————————————
  const B = mirrorQuarter(BEZEL_QUARTER);
  // mirrorQuarter repite el vértice de las 12 y de las 3 en medio de una
  // arista recta: fuera (el redondeo necesita vértices de esquina reales).
  const corners = B.filter(([x, y]) => Math.abs(x) > 1e-6 && Math.abs(y) > 1e-6);
  const b0 = roundedConvex(corners, BEZEL_CORNER_R, 0, 8);

  // La cara de arriba del cuerpo: solo lo que queda fuera del bisel (asas y
  // orejas), con el hueco del bisel un pelo por dentro de su pared.
  const capTop = cap(silIn, CZ.bodyTop, [roundedConvex(corners, BEZEL_CORNER_R, -0.3, 8)]);
  const capBottom = cap(silIn, CZ.bodyBottom, [circlePts(15.6, 96)], true);
  const bodyCaps = mergeNonIndexed([capTop, capBottom]);
  const b1 = roundedConvex(corners, BEZEL_CORNER_R, -BEZEL_CHAMFER, 8);
  const bezelWall = loft([
    { pts: b0, z: CZ.bezelBase },
    { pts: b0, z: CZ.bezelWallTop },
  ]);
  const bezelChamfer = loft([
    { pts: b0, z: CZ.bezelWallTop },
    { pts: b1, z: CZ.bezelTop },
  ]);
  const bezelPolished = mergeNonIndexed([bezelWall, bezelChamfer]);
  const bezelTop = cap(b1, CZ.bezelTop, [circlePts(INNER_CHAMFER_R, 160)]);
  const innerChamfer = latheZ([
    [INNER_CHAMFER_R, CZ.bezelTop],
    [OPENING_R, CZ.innerChamferBottom],
  ]);
  const innerWall = latheZ([
    [OPENING_R, CZ.innerChamferBottom],
    [OPENING_R, -0.45],
  ]);

  // — Corona (a las 3: eje x) ——————————————————————————————————————————
  const TEETH = 30;
  const crownShape = new THREE.Shape();
  for (let i = 0; i <= TEETH * 4; i++) {
    const a = (i / (TEETH * 4)) * Math.PI * 2;
    const q = i % 4;
    const r = q === 0 || q === 1 ? 2.45 : 2.25;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    if (i === 0) crownShape.moveTo(x, y);
    else crownShape.lineTo(x, y);
  }
  const crown = new THREE.ExtrudeGeometry(crownShape, {
    depth: 1.5,
    bevelEnabled: true,
    bevelThickness: 0.25,
    bevelSize: 0.2,
    bevelOffset: -0.2,
    bevelSegments: 3,
    curveSegments: 4,
  });
  // Del eje z al eje x, sobresaliendo de la oreja.
  crown.rotateY(Math.PI / 2);
  crown.translate(CASE_DIM.earX + 0.65, 0, CZ.crownZ);
  const crownTube = new THREE.CylinderGeometry(1.2, 1.2, 1.0, 32);
  crownTube.rotateZ(Math.PI / 2);
  crownTube.translate(CASE_DIM.earX + 0.2, 0, CZ.crownZ);

  // — Tapa ————————————————————————————————————————————————————————————
  const casebackRing = latheZ([
    [CASEBACK_FIELD_R + 0.02, CZ.casebackField + 0.02],
    [CASEBACK_FIELD_R + 0.35, CZ.casebackRing - 0.04],
    [CASEBACK_FIELD_R + 0.55, CZ.casebackRing],
    [15.0, CZ.casebackRing],
    [15.5, CZ.casebackRing + 0.25],
    [15.7, CZ.bodyBottom + 0.02],
  ]);
  // Seis muescas de la llave en el anillo: rectángulos oscuros a ras (vistas
  // de lejos, una muesca es una sombra).
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

  // — Cristal de zafiro plano ——————————————————————————————————————————
  const crystal = new THREE.CircleGeometry(OPENING_R + 0.05, 128);
  crystal.translate(0, 0, CZ.crystalTop);

  const all = {
    bodyWall,
    bodyEdges,
    bodyCaps,
    bezelPolished,
    bezelTop,
    innerChamfer,
    innerWall,
    crown,
    crownTube,
    casebackRing,
    casebackNotches,
    casebackField,
    crystal,
  };
  return {
    ...all,
    dispose() {
      for (const g of Object.values(all)) g.dispose();
    },
  };
}

/** Une geometrías sin índice (posición, normal y uv). */
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
    const nn = g.getAttribute("normal");
    const u = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) {
      pos.set([p.getX(i), p.getY(i), p.getZ(i)], (o + i) * 3);
      if (nn) nor.set([nn.getX(i), nn.getY(i), nn.getZ(i)], (o + i) * 3);
      if (u) uv.set([u.getX(i), u.getY(i)], (o + i) * 2);
    }
    o += p.count;
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}
