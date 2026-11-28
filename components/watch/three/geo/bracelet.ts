// ---------------------------------------------------------------------------
// BRAZALETE de placas H (fotos 2 y 16 del dueño): piezas RÍGIDAS colocadas con
// los marcos de la correa (s a lo largo, u a lo ancho, v hacia fuera).
//   • placa   una por paso, en H: cepillada a lo largo, con un entalle de media
//             pieza en cada extremo y la cara combada a lo largo; su canto de
//             arriba es una media luna pulida. Va por la CUERDA entre sus dos
//             juntas: cada placa es plana y cambia de tono frente a la vecina;
//   • bloque  pulido, montado SOBRE cada junta (es la bisagra): 0.49 del ancho
//             de la fila, asoma un poco y por dentro queda a ras;
//   • primera la de junto a la caja (entalle del ancho del bloque del asa) y
//             ÚLTIMA la del cierre (lisa por el lado de la barra);
//   • alma    una cinta oscura por dentro: las juntas se leen como líneas, y
//             lleva los orificios de los pasadores del canto.
// Por dentro placa y bloque quedan a ras: ningún recuadro negro.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { L_BOTTOM, toStrapSpace, type Side } from "../pose";
import { CASE_DIM } from "./outline";
import { gridSolid, joinSolids } from "./solids";
import { STRAP_LEN, smooth } from "./strap";

/** Ancho del brazalete en el arco s (medido en brazalete-*-1200.webp: 22.4
 *  junto a la caja, hombro de 1.6 en 7 mm, luego hasta 18). */
export const braceletWidth = (s: number) => 22.4 - 1.6 * smooth(0, 7, s) - 2.8 * smooth(7, 45, s);

/** Paso nominal (b03 a 33.6 px/mm); el real reparte un número entero de placas
 *  entre la junta de la caja y la barra del cierre. */
export const LINK_PITCH = 6.5;

/** Primera junta: el centro del bloque que llena la muesca del asa. */
const S0 = 0.15;
/** Donde arranca la primera placa (pasada la punta del asa) y el sitio del
 *  bloque que llena la muesca (endLinkGeometry: 13.48 de ancho, hasta 25.5 de
 *  la caja = 2.9 de arco). */
const FIRST = 0.62;
const END_BLOCK = { half: CASE_DIM.notchHalfW, s1: 2.95 } as const;

/** Medidas de la placa y del bloque (mm, a 20 mm de ancho de fila). */
const PLATE = { w: 20, gap: 0.18, zTop: 0.9, zBot: -1.35, crown: 0.48, notch: 2.35, bevel: 0.1 } as const;
const BLOCK = { w: 0.49 * 20, l: 4.6, r: 0.5, bevel: 0.28, zEnd: 1.12, crown: 0.64 } as const;
/** Media luna del canto: ancho en el centro y en los extremos. */
const MOON = { mid: 0.5, end: 0.12 } as const;

interface PlateDef {
  w: number;
  l: number;
  /** Media anchura y fondo del entalle de abajo (−y) y de arriba (+y); 0 = liso. */
  lo: readonly [half: number, depth: number] | null;
  hi: readonly [half: number, depth: number] | null;
  crown?: number;
}

/** Una placa (o la barra lisa del cierre: sin entalles). Devuelve la pieza
 *  cepillada y las dos medias lunas pulidas de sus cantos. */
function plateGeometry({ w, l, lo, hi, crown = PLATE.crown }: PlateDef): { body: THREE.BufferGeometry; moon: THREE.BufferGeometry } {
  const hw = w / 2;
  const hl = l / 2;
  const b = PLATE.bevel;
  const nb = 0.12;
  const xs = new Set<number>([-hw, -hw + MOON.mid, 0, hw - MOON.mid, hw]);
  const ys = new Set<number>([-hl, -hl + b, 0, hl - b, hl]);
  for (const [n, sg] of [
    [lo, -1],
    [hi, 1],
  ] as const) {
    if (!n) continue;
    for (const s of [-1, 1]) {
      xs.add(s * n[0]);
      xs.add(s * (n[0] + nb));
    }
    ys.add(sg * (hl - n[1]));
    ys.add(sg * (hl - n[1] - nb));
  }
  // Filas de la comba: solo donde no haya ya una al lado.
  for (let k = 1; k < 10; k++) {
    const y = -hl + (l * k) / 10;
    if ([...ys].every((q) => Math.abs(q - y) > 0.18)) ys.add(y);
  }
  const X = [...xs].sort((p, q) => p - q);
  const Y = [...ys].sort((p, q) => p - q);
  const moonW = (y: number) => MOON.end + (MOON.mid - MOON.end) * (1 - (y / hl) ** 2);
  const notchAt = (y: number) => (y < 0 ? lo : hi);
  const inNotch = (x: number, y: number) => {
    const n = notchAt(y);
    return !!n && Math.abs(x) < n[0] - 1e-4 && hl - Math.abs(y) < n[1] - 1e-4;
  };
  const last = X.length - 2;
  const [body, moon] = gridSolid({
    xs: X,
    ys: Y,
    solid: (i, j) => !inNotch((X[i] + X[i + 1]) / 2, (Y[j] + Y[j + 1]) / 2),
    zone: (i) => (i === 0 || i === last ? 1 : 0),
    at: (x0, y, i) => {
      const m = moonW(y);
      const dy = hl - Math.abs(y);
      // La columna de dentro de la media luna sigue su arco.
      const x = i === 1 ? -hw + m : i === X.length - 2 ? hw - m : x0;
      let drop = 0;
      if (dy < b - 1e-4) drop = Math.max(drop, b - dy);
      const n = notchAt(y);
      if (n) {
        const ax = Math.abs(x0);
        const onSide = Math.abs(ax - n[0]) < 1e-4 && dy < n[1] + 1e-4;
        const onFloor = Math.abs(dy - n[1]) < 1e-4 && ax < n[0] + 1e-4;
        if (onSide || onFloor) drop = Math.max(drop, nb);
      }
      if (i === 0 || i === X.length - 1) drop += m * 0.9;
      return {
        x,
        y,
        top: PLATE.zTop + crown * (1 - (y / hl) ** 2) - drop,
        bot: PLATE.zBot + (dy < b - 1e-4 ? 0.18 : 0),
      };
    },
  });
  smoothCrown(body, PLATE.zTop, crown, hl);
  return { body, moon };
}

/** La cara combada lleva su normal exacta (las filas de la rejilla no son
 *  parejas y promediando se notaban como rayas a lo ancho). */
function smoothCrown(g: THREE.BufferGeometry, zEnd: number, crown: number, hl: number) {
  const p = g.getAttribute("position");
  const n = g.getAttribute("normal");
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (n.getZ(i) < 0.95 || Math.abs(n.getX(i)) > 0.02) continue;
    if (Math.abs(p.getZ(i) - (zEnd + crown * (1 - (y / hl) ** 2))) > 0.004) continue;
    v.set(0, (2 * crown * y) / (hl * hl), 1).normalize();
    n.setXYZ(i, v.x, v.y, v.z);
  }
}

/** El bloque pulido de una junta (nominal a 20 mm de fila) y, aparte, su fondo
 *  cepillado (contra la muñeca: pulido y plano reflejaba un recuadro negro). */
function blockGeometry(): { top: THREE.BufferGeometry; base: THREE.BufferGeometry } {
  const hw = BLOCK.w / 2;
  const hl = BLOCK.l / 2;
  const { r, bevel: b } = BLOCK;
  // Esquinas redondeadas en planta: cuánto se mete el canto cerca del extremo.
  const corner = (y: number) => {
    const d = hl - Math.abs(y);
    return d >= r ? 0 : r - Math.sqrt(Math.max(0, r * r - (r - d) ** 2));
  };
  const ys = [-hl, -hl + 0.1, -hl + b, -hl + r];
  const N = 8;
  for (let k = 1; k < N; k++) ys.push(-hl + r + ((2 * (hl - r)) * k) / N);
  ys.push(hl - r, hl - b, hl - 0.1, hl);
  const xs = [-hw, -hw + b, 0, hw - b, hw];
  const [g] = gridSolid({
    xs,
    ys,
    at: (x0, y, i) => {
      const c = corner(y);
      const x = Math.sign(x0) * Math.max(0, Math.abs(x0) - c);
      const d = Math.min(hl - Math.abs(y), i === 0 || i === xs.length - 1 ? 0 : b);
      return { x, y, top: BLOCK.zEnd + BLOCK.crown * (1 - (y / hl) ** 2) - Math.max(0, b - d), bot: PLATE.zBot + 0.25 };
    },
  });
  smoothCrown(g, BLOCK.zEnd, BLOCK.crown, hl);
  const base = gridSolid({
    xs: [-hw + 0.08, hw - 0.08],
    ys: [-hl + 0.08, hl - 0.08],
    at: (x, y) => ({ x, y, top: PLATE.zBot + 0.5, bot: PLATE.zBot }),
  })[0];
  return { top: g, base };
}

export interface LinkSlot {
  /** Centro (bloques) o primera junta (placas, con s1 = la segunda). */
  s: number;
  s1?: number;
  /** Escala a lo ancho. */
  sx: number;
}

export interface BraceletSide {
  slots: { plates: LinkSlot[]; blocks: LinkSlot[]; first: LinkSlot[]; last: LinkSlot[] };
  /** Primera y última placa (a su medida, sin escala). */
  first: THREE.BufferGeometry;
  last: THREE.BufferGeometry;
  core: THREE.BufferGeometry;
}

export interface Bracelet {
  plate: THREE.BufferGeometry;
  moon: THREE.BufferGeometry;
  block: THREE.BufferGeometry;
  blockBase: THREE.BufferGeometry;
  sides: Record<Side, BraceletSide>;
  /** La barra lisa del cierre (9 mm). */
  bar: THREE.BufferGeometry;
  dispose(): void;
}

/** Juntas de un lado (sin la de la barra) y su paso. */
function joints(end: number): { pitch: number; s: number[] } {
  const n = Math.round((end - S0) / LINK_PITCH);
  const pitch = (end - S0) / n;
  return { pitch, s: Array.from({ length: n }, (_, k) => S0 + pitch * k) };
}

export function braceletGeometries(): Bracelet {
  const pitch = joints(STRAP_LEN.eslabones["12"]).pitch;
  const half = 0.49 * (PLATE.w / 2) + 0.1;
  const l = pitch - PLATE.gap;
  const { body: plate, moon } = plateGeometry({ w: PLATE.w, l, lo: [half, PLATE.notch], hi: [half, PLATE.notch] });
  const { top: block, base: blockBase } = blockGeometry();

  const mk = (end: number): BraceletSide => {
    const { pitch: p, s } = joints(end);
    const plates: LinkSlot[] = [];
    const blocks: LinkSlot[] = [];
    const wOf = (k: number) => braceletWidth(s[k] + p / 2);
    const lastK = s.length - 1;
    for (let k = 1; k < lastK; k++) plates.push({ s: s[k], s1: s[k + 1], sx: wOf(k) / PLATE.w });
    // El bloque cabe entre los dos entalles que cierra (el más estrecho manda).
    for (let k = 1; k <= lastK; k++) blocks.push({ s: s[k], sx: Math.min(wOf(k - 1), wOf(k)) / PLATE.w });
    const w0 = wOf(0);
    const l0 = s[1] - FIRST - PLATE.gap / 2;
    const deep = END_BLOCK.s1 - FIRST + 0.1;
    const a = plateGeometry({ w: w0, l: l0, lo: [END_BLOCK.half, deep], hi: [half * (w0 / PLATE.w), PLATE.notch] });
    // El bloque del asa se estrecha por detrás: un escalón en el fondo del
    // entalle cierra la rendija que quedaba (por dentro se veía negra).
    const y0 = -l0 / 2 + deep;
    const step = gridSolid({
      xs: [-END_BLOCK.half + 0.1, END_BLOCK.half - 0.1],
      ys: [y0 - 0.55, y0 + 0.2],
      at: (x, y) => ({ x, y, top: -0.5, bot: PLATE.zBot }),
    })[0];
    const wl = wOf(lastK);
    const z = plateGeometry({ w: wl, l: end - s[lastK] - PLATE.gap / 2, lo: [half * (wl / PLATE.w), PLATE.notch], hi: null });
    return {
      slots: {
        plates,
        blocks,
        first: [{ s: FIRST, s1: s[1] - PLATE.gap / 2, sx: 1 }],
        last: [{ s: s[lastK] + PLATE.gap / 2, s1: end, sx: 1 }],
      },
      first: joinSolids([a.body, a.moon, step]),
      last: joinSolids([z.body, z.moon]),
      core: coreGeometry(end, s, wOf),
    };
  };
  const sides = { "12": mk(STRAP_LEN.eslabones["12"]), "6": mk(STRAP_LEN.eslabones["6"]) };
  const bar = plateGeometry({ w: braceletWidth(L_BOTTOM), l: 2 * BAR_HALF - 0.12, lo: null, hi: null, crown: 0.35 });
  const barGeo = joinSolids([bar.body, bar.moon]);
  return {
    plate,
    moon,
    block,
    blockBase,
    sides,
    bar: barGeo,
    dispose: () => [plate, moon, block, blockBase, barGeo, ...(["12", "6"] as const).flatMap((k) => [sides[k].first, sides[k].last, sides[k].core])].forEach((g) => g.dispose()),
  };
}

/** Media barra del cierre plegable (mm). */
export const BAR_HALF = 4.5;

/** El alma oscura (sigue la curva por dentro de las placas) y los orificios
 *  Ø0.7 de los pasadores en los dos cantos, junto a cada junta. */
function coreGeometry(end: number, s: readonly number[], wOf: (k: number) => number): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const S = end - 0.4;
  const N = Math.ceil((S - 1) / 1.0);
  for (let i = 0; i <= N; i++) {
    const q = 1 + ((S - 1) * i) / N;
    const w = braceletWidth(q) - 1.6;
    pos.push(-w / 2, q, -0.85, w / 2, q, -0.85, w / 2, q, 0.5, -w / 2, q, 0.5);
    if (i > 0) {
      const a = (i - 1) * 4;
      const b = i * 4;
      for (let j = 0; j < 4; j++) {
        const j1 = (j + 1) % 4;
        idx.push(a + j, b + j1, a + j1, a + j, b + j, b + j1);
      }
    }
  }
  const o = (q: number) => q * 4;
  // Tapas de los extremos.
  idx.push(o(0), o(0) + 1, o(0) + 2, o(0), o(0) + 2, o(0) + 3);
  idx.push(o(N), o(N) + 2, o(N) + 1, o(N), o(N) + 3, o(N) + 2);
  const flat: number[] = [];
  for (const i of idx) flat.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  // Orificios: un disco un pelo fuera del canto, a 1.35 de cada junta.
  const K = 10;
  for (let k = 1; k < s.length; k++) {
    const x = wOf(k) / 2 + 0.015;
    for (const sx of [-1, 1]) {
      for (let i = 0; i < K; i++) {
        const a0 = (i / K) * Math.PI * 2;
        const a1 = ((i + 1) / K) * Math.PI * 2;
        const c: [number, number, number] = [sx * x, s[k] + 1.35, -0.4];
        const p = (a: number): [number, number, number] => [sx * x, s[k] + 1.35 + 0.35 * Math.cos(a), -0.4 + 0.35 * Math.sin(a)];
        if (sx > 0) flat.push(...c, ...p(a0), ...p(a1));
        else flat.push(...c, ...p(a1), ...p(a0));
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(flat, 3));
  g.computeVertexNormals();
  return toStrapSpace(g);
}
