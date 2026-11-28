// ---------------------------------------------------------------------------
// LOS CIERRES en metal (en el acabado de la caja):
//   hebilla      U ABIERTA con cabeza de pentágono macizo (fotos 1, 5, 7, 9):
//                24.3 en los hombros, pies a 0.88, 19 de alto, faceta frontal
//                de 1.2 × 0.7 en las dos aguas del tejado; barra Ø1.5 escondida
//                en el pliegue de la correa de las 12; púa de facetas planas
//                que sale por un agujero de la cola y monta 2.4 en la cabeza;
//   desplegable  el PUENTE de la foto 10: marco en U de 24 × 15.7 por encima de
//                la cola (que conserva punta, agujeros y trabillas), panel
//                central en un escalón, pasador con un pulsador por lado y, por
//                dentro, las hojas con su ranura;
//   brazalete    una barra lisa de 9 mm (ver geo/bracelet.ts), dos medias lunas
//                pulidas que asoman por los flancos y dos hojas por dentro.
// Todo lo rígido va en el marco de la pista "base" de las 12 en L_BOTTOM (x a
// lo ancho, y hacia las 6, z hacia fuera de la muñeca) y se apoya en la cola
// REAL (colaSurface): si cambia la curva de la muñeca, el cierre la sigue.
// Las hojas van en el espacio de la correa (se doblan con la pose).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { DS, L_BOTTOM, SAMPLES, frameMatrix, integratePose, newFrames, toStrapSpace, trackTables, type Frames } from "../pose";
import { BAR_HALF, braceletWidth } from "./bracelet";
import { finishSolid, gridSolid, joinSolids, rodX } from "./solids";
import { STRAP_HOLES, STRAP_LEN, strapThick, strapTop, strapWidth, type StrapKind } from "./strap";

export type BandKind = Exclude<StrapKind, "brazalete">;

// ===========================================================================
// La cola (la correa de las 6 sobre la de las 12), en el marco del cierre
// ===========================================================================
export interface ColaSurface {
  /** Cara vista y forro de la cola (z local) a la altura y. */
  top(y: number): number;
  bot(y: number): number;
  /** Altura y del punto s de la correa de las 6 (en su cara vista). */
  yOf(s6: number): number;
  /** La línea media de la correa de las 12 (z local). */
  base(y: number): number;
}

let closedFrames: { base: Frames; cola: Frames } | null = null;

function framesClosed(): { base: Frames; cola: Frames } {
  return (closedFrames ??= {
    base: integratePose(trackTables("base").closed, newFrames()),
    cola: integratePose(trackTables("cola").closed, newFrames()),
  });
}

/** El perfil de la cola CERRADA en el marco del cierre. */
export function colaSurface(kind: BandKind): ColaSurface {
  const { base, cola } = framesClosed();
  const inv = frameMatrix(base, L_BOTTOM).invert();
  const p = new THREE.Vector3();
  const rows = (v: (s: number) => number, fr: Frames, mirror: boolean): [y: number, z: number][] => {
    const out: [number, number][] = [];
    for (let i = Math.round((L_BOTTOM - 24) / DS); i < Math.min(SAMPLES, Math.round((L_BOTTOM + 24) / DS)); i++) {
      const s = i * DS;
      const d = v(s);
      p.set(0, (mirror ? -1 : 1) * (fr.py[i] - d * fr.tz[i]), fr.pz[i] + d * fr.ty[i]).applyMatrix4(inv);
      out.push([p.y, p.z]);
    }
    return out.sort((a, b) => a[0] - b[0]);
  };
  const lerp = (t: [number, number][]) => (y: number) => {
    let i = 0;
    while (i < t.length - 2 && t[i + 1][0] < y) i++;
    const [a, b] = [t[i], t[i + 1]];
    return a[1] + ((b[1] - a[1]) * (y - a[0])) / (b[0] - a[0] || 1);
  };
  const top = (s: number) => strapTop(kind, s);
  return {
    top: lerp(rows(top, cola, true)),
    bot: lerp(rows((s) => -strapThick(kind, s) / 2, cola, true)),
    base: lerp(rows(() => 0, base, false)),
    yOf: (s6) => {
      const i = Math.min(SAMPLES - 1, Math.round(s6 / DS));
      const d = top(s6);
      return p.set(0, -(cola.py[i] - d * cola.tz[i]), cola.pz[i] + d * cola.ty[i]).applyMatrix4(inv).y;
    },
  };
}

/** El agujero más cercano a la altura y (mm de arco de la de las 6). */
function holeNear(kind: BandKind, c: ColaSurface, y: number): number {
  return [...STRAP_HOLES[kind].holes].sort((a, b) => Math.abs(c.yOf(a) - y) - Math.abs(c.yOf(b) - y))[0];
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

// ===========================================================================
// La hebilla
// ===========================================================================
/** Medidas de la hebilla (mm) sobre el ancho de la correa. El alto, 19, está
 *  entre los 18.1 de la foto 7 y los 20.5 de la foto 1: calibre pendiente. */
export const BUCKLE = {
  shoulders: 6.3,
  feet: 3.4,
  length: 19,
  apex: 4.9,
  head: 5.0,
  arm: 3.0,
  foot: 1.5,
  hHead: 2.6,
  hFoot: 1.6,
  facet: [1.2, 0.7],
  bar: 1.5,
  tongue: [2.0, 1.5],
  over: 2.4,
} as const;

export interface Buckle {
  frame: THREE.BufferGeometry;
  tongue: THREE.BufferGeometry;
  /** El eje de la barra: ahí giran el marco y la púa al abrir. */
  pivot: THREE.Vector3;
}

export function buckleGeometries(kind: BandKind): Buckle {
  const cola = colaSurface(kind);
  const strapW = strapWidth(kind, L_BOTTOM);
  const W = (strapW + BUCKLE.shoulders) / 2;
  const F = (strapW + BUCKLE.feet) / 2;
  // La barra, dentro del pliegue con que acaba la correa de las 12.
  const yBar = STRAP_LEN.hebilla12 - L_BOTTOM - 0.95;
  const yF = yBar - 1.2;
  const yA = yF + BUCKLE.length;
  const yS = yA - BUCKLE.apex;
  // El interior de la U va pegado a la correa (0.2 por lado).
  const xi = Math.max(strapW / 2 + 0.2, F - BUCKLE.foot);
  const yi = yS - 2.1;
  const zBar = cola.base(yBar);

  // — Perfil: el fondo del marco. Bajo la cabeza, la recta que libra la cola;
  //   los brazos bajan desde ahí hasta la barra.
  const air = 0.14;
  const z0 = cola.top(yi + 0.9) + air;
  const z1 = cola.top(yA) + air;
  // El metal no sigue toda la caída de la correa: la cabeza queda más plana y
  // el vértice, un milímetro al aire (como en la foto 1).
  const m1 = Math.max((z1 - z0) / (yA - yi - 0.9), -0.16);
  const zl = (y: number) => z0 + m1 * (y - yi - 0.9);
  const zFoot = zBar - BUCKLE.hFoot / 2;
  const zBot = (y: number) => {
    if (y >= yi) return zl(y);
    // Hermite de la barra (subiendo) al arranque de la recta.
    const d = yi - yBar;
    const t = (y - yBar) / d;
    if (t < 0) return zFoot + 0.42 * (y - yBar);
    const m0 = 0.42 * d;
    const mE = m1 * d;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * zFoot + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * zl(yi) + (t3 - t2) * mE;
  };
  const tall = (y: number) => mix(BUCKLE.hFoot, BUCKLE.hHead, ease(yF, yS, y));

  // — Estaciones del lado derecho (del pie al vértice): por fuera y por dentro.
  type Sta = { o: [number, number]; i: [number, number]; fw: number; fh: number; bi: number };
  const st: Sta[] = [];
  const armAt = (y: number): [number, number] => [mix(F, W, (y - yF) / (yS - yF)), y];
  const roofAt = (x: number): [number, number] => [x, yA - (BUCKLE.apex * x) / W];
  const armFacet = { fw: 0.75, fh: 0.5, bi: 0.5 };
  const roofFacet = { fw: BUCKLE.facet[0], fh: BUCKLE.facet[1], bi: 0.42 };
  // Pie redondeado.
  for (const a of [0, 0.35, 0.7, 1]) {
    const k = Math.sqrt(1 - (1 - a) ** 2);
    const y = yF + 0.75 * a;
    const c = (xi + F) / 2;
    const hw = ((F - xi) / 2) * (0.35 + 0.65 * k);
    st.push({ o: [c + hw, y], i: [c - hw, y], fw: 0.3 * (0.3 + 0.7 * k), fh: 0.25, bi: 0.25 });
  }
  // Brazo recto.
  for (let k = 1; k <= 12; k++) {
    const t = k / 12;
    const yO = mix(yF + 0.75, yS - 0.45, t);
    const yI = mix(yF + 0.75, yi - 0.9, t);
    st.push({ o: armAt(yO), i: [xi, yI], fw: mix(0.4, armFacet.fw, t), fh: mix(0.28, armFacet.fh, t), bi: mix(0.28, armFacet.bi, t) });
  }
  // Hombro (r 0.6 por fuera, 0.9 por dentro): curva de Bézier entre las dos rectas.
  const bez = (a: [number, number], c: [number, number], b: [number, number], t: number): [number, number] => [
    (1 - t) ** 2 * a[0] + 2 * t * (1 - t) * c[0] + t * t * b[0],
    (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * c[1] + t * t * b[1],
  ];
  const archTop = yA - BUCKLE.head;
  const arch = (x: number): [number, number] => [x, mix(yi, archTop, Math.sqrt(Math.max(0, 1 - (x / (xi * 1.02)) ** 2)) * 0.45 + (1 - x / xi) * 0.55)];
  const oA = armAt(yS - 0.45);
  const oB = roofAt(W - 0.55);
  const iA: [number, number] = [xi, yi - 0.9];
  const iB = arch(xi - 1.0);
  for (let k = 1; k <= 5; k++) {
    const t = k / 5;
    st.push({
      o: bez(oA, [W, yS], oB, t),
      i: bez(iA, [xi, iB[1] - 0.15], iB, t),
      fw: mix(armFacet.fw, roofFacet.fw, t),
      fh: mix(armFacet.fh, roofFacet.fh, t),
      bi: mix(armFacet.bi, roofFacet.bi, t),
    });
  }
  // Agua del tejado, hasta el vértice.
  for (let k = 1; k <= 8; k++) {
    const t = k / 8;
    const x = (W - 0.55) * (1 - t);
    st.push({ o: k === 8 ? [0, yA - 0.1] : roofAt(x), i: arch((xi - 1.0) * (1 - t)), ...roofFacet });
  }

  // — Sección (de dentro abajo, en redondo) ————————————————————————————————
  const section = (s: Sta, sx: 1 | -1): [number, number, number][] => {
    const dx = s.o[0] - s.i[0];
    const dy = s.o[1] - s.i[1];
    const w = Math.hypot(dx, dy);
    const at = (d: number, up: number, down: boolean): [number, number, number] => {
      const k = d / w;
      const x = s.i[0] + dx * k;
      const y = s.i[1] + dy * k;
      return [sx * x, y, zBot(y) + (down ? up : tall(y) - up)];
    };
    const bb = Math.min(0.3, w * 0.25);
    const fw = Math.min(s.fw, w * 0.45);
    const bi = Math.min(s.bi, w * 0.3);
    return [at(bb, 0, true), at(w - bb, 0, true), at(w, bb, true), at(w, s.fh, false), at(w - fw, 0, false), at(bi, 0, false), at(0, bi, false), at(0, bb, true)];
  };
  const tris: number[] = [];
  for (const sx of [1, -1] as const) {
    const rings = st.map((s) => section(s, sx));
    const M = rings[0].length;
    const tri = (a: number[], b: number[], c: number[]) => (sx < 0 ? tris.push(...a, ...b, ...c) : tris.push(...a, ...c, ...b));
    for (let r = 0; r + 1 < rings.length; r++) {
      for (let k = 0; k < M; k++) {
        const k1 = (k + 1) % M;
        tri(rings[r][k], rings[r][k1], rings[r + 1][k1]);
        tri(rings[r][k], rings[r + 1][k1], rings[r + 1][k]);
      }
    }
    // La tapa del pie.
    for (let k = 1; k + 1 < M; k++) tri(rings[0][0], rings[0][k + 1], rings[0][k]);
  }
  const bar = rodX(
    [
      [-F + 0.6, 0],
      [-F + 0.6, BUCKLE.bar / 2],
      [F - 0.6, BUCKLE.bar / 2],
      [F - 0.6, 0],
    ],
    yBar,
    zBar,
    16,
  );
  const frame = joinSolids([finishSolid(tris), bar]);

  // — La púa: sale por el agujero, sube con una joroba y descansa en la cabeza
  //   (facetas planas, no un alambre) ——————————————————————————————————————
  const yh = cola.yOf(holeNear(kind, cola, yBar + 5));
  const zs = cola.top(yh);
  const [tw, th] = BUCKLE.tongue;
  const yHead = archTop;
  const yTip = yHead + BUCKLE.over;
  const headTop = (y: number) => zBot(y) + tall(y);
  const lie = (y: number) => headTop(y) + 0.03;
  const prof: [y: number, top: number, bot: number, w: number][] = [
    [yh - 0.75, zs - 0.75, zs - 1.9, 0.8],
    [yh + 0.15, zs + 0.5, zs - 1.1, 0.95],
    [yh + 1.1, Math.max(zs + 1.15, lie(yHead) + th * 0.55), zs - 0.05, 1],
    [yHead - 0.9, lie(yHead) + th * 0.95, lie(yHead) - 0.25, 1],
    [yHead + 0.35, lie(yHead + 0.35) + th * 0.92, lie(yHead + 0.35), 0.98],
    [yTip - 0.7, lie(yTip - 0.7) + th * 0.66, lie(yTip - 0.7), 0.94],
    [yTip, lie(yTip) + 0.3, lie(yTip), 0.86],
  ];
  const rows = prof.filter((q, k) => k === 0 || q[0] - prof[k - 1][0] > 0.05);
  const bevel = 0.28;
  const hook = gridSolid(
    {
      xs: [-1, -0.6, 0.6, 1],
      ys: rows.map((q) => q[0]),
      at: (x, y, i, j) => {
        const [, top, bot, w] = rows[j];
        const hw = (tw / 2) * w;
        const edge = i === 0 || i === 3;
        return { x: edge ? Math.sign(x) * hw : Math.sign(x) * (hw - bevel), y, top: top - (edge ? bevel : 0), bot };
      },
    },
    THREE.MathUtils.degToRad(6),
  )[0];
  // Por debajo de la cola: el ojo de la barra y el vástago hasta el agujero.
  const eye = rodX(
    [
      [-tw / 2, 0],
      [-tw / 2, 1.15],
      [tw / 2, 1.15],
      [tw / 2, 0],
    ],
    yBar,
    zBar,
    16,
  );
  const shankAt = (t: number) => ({ y: mix(yBar, yh - 0.1, t), z: mix(zBar, zs - 1.7, t) });
  const shank = gridSolid({
    xs: [-tw * 0.4, tw * 0.4],
    ys: [0, 0.5, 1],
    at: (x, t) => {
      const q = shankAt(t);
      return { x, y: q.y, top: q.z + 0.5, bot: q.z - 0.5 };
    },
  })[0];
  return { frame, tongue: joinSolids([hook, eye, shank]), pivot: new THREE.Vector3(0, yBar, zBar) };
}

// ===========================================================================
// El desplegable de puente (foto 10)
// ===========================================================================
/** Medidas del puente (mm). */
export const BRIDGE = { gap: 0.25, arm: 2.75, panel: [15.2, 6.8], step: 0.35, rod: 1.05, button: [1.3, 1.8], across: 30, along: 18 } as const;

export interface Deployant {
  /** Marco, panel, pasador, pulsadores y la lengüeta (todo pulido). */
  bridge: THREE.BufferGeometry;
  /** Las hojas por dentro de la muñeca (espacio de la correa de las 12). */
  blades: THREE.BufferGeometry;
  /** Arco de la de las 6 por el que la cola lleva el marco al abrir. */
  s6: number;
}

export function deployantGeometries(kind: BandKind): Deployant {
  const cola = colaSurface(kind);
  const half = strapWidth(kind, L_BOTTOM - 4) / 2;
  const inX = half + BRIDGE.gap;
  const outX = inX + BRIDGE.arm;
  const pw = BRIDGE.panel[0] / 2;
  // El pasador, justo tras el final de la correa de las 12.
  const yR = STRAP_LEN.hebilla12 - L_BOTTOM + BRIDGE.rod + 0.2;
  const zR = cola.base(yR);
  const y0 = 1.6;
  const y1 = y0 + BRIDGE.panel[1];
  const yc = (y0 + y1) / 2;
  // Por debajo: la recta que libra la cola de y0 a y1.
  const z0 = cola.top(y0) + 0.16;
  const z1 = cola.top(y1) + 0.16;
  const under = (y: number) => z0 + ((z1 - z0) * (y - y0)) / (y1 - y0);
  // Por encima: combado a lo ancho (R 30) y a lo largo (R 18).
  const sag = (d: number, R: number) => (d * d) / (2 * R);
  const over = (x: number, y: number) => under(y) + 1.85 + sag(y1 - yc, BRIDGE.along) - sag(y - yc, BRIDGE.along) - sag(x, BRIDGE.across);

  // — El panel central —————————————————————————————————————————————————————
  const b = 0.3;
  const px = [-pw, -pw + b, -5, -2.5, 0, 2.5, 5, pw - b, pw];
  const py = [y0, y0 + b, y0 + 1.3, y0 + 2.4, yc, y1 - 2.4, y1 - 1.3, y1 - b, y1];
  const panel = gridSolid({
    xs: px,
    ys: py,
    at: (x0, yy, i, j) => {
      // El canto de fuera, algo combado; las esquinas, matadas.
      const u = x0 / pw;
      const y = yy + (yy > yc ? (-0.45 * u * u * (yy - yc)) / (y1 - yc) : (0.2 * u * u * (yc - yy)) / (yc - y0));
      const corner = (j === 0 || j === py.length - 1) && (i === 0 || i === px.length - 1);
      const x = corner ? x0 * 0.97 : x0;
      const edge = i === 0 || j === 0 || i === px.length - 1 || j === py.length - 1;
      return { x, y, top: over(x, y) - (edge ? b : 0), bot: under(y) + 0.55 * Math.max(0, 1 - u * u) };
    },
  })[0];

  // — Un hombro con su brazo (el otro, en espejo) ———————————————————————————
  const yo1 = y1 - 0.75;
  const lug = 1.5;
  const yEnd = yR - lug;
  const ax = [pw - 0.35, inX - 0.12, inX, inX + 0.4, outX - 0.45, outX];
  const ay = [yEnd, yEnd + 0.12, yEnd + 0.4, yEnd + 0.85, yR, yR + 1.6, -2.6, -1, y0 - 1.2, y0 - 0.3, y0, y0 + 0.7, yc - 0.6, yc + 1, yo1 - 0.35, yo1];
  const yShoulder = y0 - 0.3;
  // Cara de arriba: del escalón del puente baja hasta el ojo del pasador.
  const crestAt = (x: number, y: number) => over(x, Math.max(y, y0)) - BRIDGE.step;
  const lugTop = (y: number) => zR + Math.sqrt(Math.max(0.02, lug * lug - Math.min(0, y - yR) ** 2));
  const lugBot = (y: number) => zR - Math.sqrt(Math.max(0.02, lug * lug - Math.min(0, y - yR) ** 2));
  const topAt = (x: number, y: number) => {
    const k = ease(yR - 0.2, yShoulder, y);
    return mix(lugTop(Math.min(y, yR)), crestAt(x, y), k);
  };
  const botAt = (y: number) => mix(lugBot(Math.min(y, yR)), crestAt(outX, yc) - 1.8, ease(yR, yo1, y) * 0.9 + 0.1 * clamp((y - yR) / (yo1 - yR), 0, 1));
  const arm = (sx: 1 | -1) =>
    gridSolid({
      xs: sx > 0 ? ax : ax.map((x) => -x).reverse(),
      ys: ay,
      solid: (i, j) => {
        const k = sx > 0 ? i : ax.length - 2 - i;
        // Entre el panel y el brazo solo hay metal en el hombro.
        return k >= 2 || ay[j] >= yShoulder - 1e-6;
      },
      at: (x0, yy, i, j) => {
        const k = sx > 0 ? i : ax.length - 1 - i;
        const x = Math.abs(x0);
        // El canto de fuera del hombro sube hacia el brazo.
        const cut = ((x - pw) / (outX - pw)) * 1.5;
        const y = yy > yc ? yy - (clamp(cut, 0, 2) * (yy - yc)) / (yo1 - yc) : yy;
        let drop = 0;
        if (k === ax.length - 1) drop = 0.45;
        if (j === ay.length - 1) drop = Math.max(drop, 0.35);
        // Canto vivo del brazo hacia la correa (y del hombro hacia el hueco).
        if (k === 2 && yy < yShoulder) drop = Math.max(drop, 0.3);
        if (yy === yShoulder && k <= 2) drop = Math.max(drop, 0.25);
        return { x: sx * x, y, top: topAt(x, y) - drop, bot: k <= 1 ? Math.min(under(y), topAt(x, y) - 0.25) : botAt(y) + (j === ay.length - 1 ? 0.4 : 0) };
      },
    })[0];

  // — Pasador y pulsadores ——————————————————————————————————————————————————
  const [br, bl] = BRIDGE.button;
  const e = outX + bl;
  const rod = rodX(
    [
      [-e, 0],
      [-e, br - 0.2],
      [-e + 0.2, br],
      [-outX + 0.1, br],
      [-outX + 0.1, BRIDGE.rod],
      [outX - 0.1, BRIDGE.rod],
      [outX - 0.1, br],
      [e - 0.2, br],
      [e, br - 0.2],
      [e, 0],
    ],
    yR,
    zR,
    28,
  );
  // — La lengüeta: del pasador al agujero más cercano de la cola ————————————
  const yh = cola.yOf(holeNear(kind, cola, yR + 3));
  const zh = cola.top(yh) + 0.04;
  const pin = rodX(
    [
      [zR - 0.4, 0],
      [zR - 0.4, 0.85],
      [zh - 0.3, 0.85],
      [zh, 0.5],
      [zh, 0],
    ],
    0,
    0,
    16,
  );
  // De x a z (media vuelta de la barra) y a su sitio.
  pin.rotateY(-Math.PI / 2);
  pin.translate(0, yh, 0);
  // Su palanca, del pasador a la lengüeta, por debajo de la cola.
  const lever = gridSolid({
    xs: [-1.6, -1.4, 1.4, 1.6],
    ys: [Math.min(yR, yh) - 0.6, Math.max(yR, yh) + 0.6],
    at: (x, y, i) => ({ x, y, top: zR + 0.7 - (i === 0 || i === 3 ? 0.2 : 0), bot: zR - 0.5 }),
  })[0];
  const bridge = joinSolids([panel, arm(1), arm(-1), rod, pin, lever]);

  // — Las hojas: por dentro de la muñeca, la de la ranura entre las dos de
  //   fuera (foto 10: encajan una en otra al plegarse) ————————————————————————
  const vTop = -strapThick(kind, L_BOTTOM) / 2 - 0.08;
  const A = L_BOTTOM - 12;
  const B = L_BOTTOM + 14;
  const blades = bladeGeometry([
    { s0: A, s1: B - 1.6, u0: 4.3, u1: 7.25, v0: vTop - 1.2, v1: vTop },
    { s0: A, s1: B - 1.6, u0: -7.25, u1: -4.3, v0: vTop - 1.2, v1: vTop },
    { s0: A + 1, s1: B, u0: 1.65, u1: 4.05, v0: vTop - 1.2, v1: vTop },
    { s0: A + 1, s1: B, u0: -4.05, u1: -1.65, v0: vTop - 1.2, v1: vTop },
    { s0: A + 1, s1: A + 6, u0: -1.8, u1: 1.8, v0: vTop - 1.1, v1: vTop - 0.1 },
    { s0: B - 4.5, s1: B, u0: -1.8, u1: 1.8, v0: vTop - 1.1, v1: vTop - 0.1 },
    // La hoja de abajo (la otra mitad plegada), con su ranura de 3.3.
    { s0: A + 1.2, s1: B - 1.2, u0: 1.65, u1: 4.4, v0: vTop - 2.3, v1: vTop - 1.2 },
    { s0: A + 1.2, s1: B - 1.2, u0: -4.4, u1: -1.65, v0: vTop - 2.3, v1: vTop - 1.2 },
    { s0: A + 1.2, s1: A + 7.5, u0: -1.8, u1: 1.8, v0: vTop - 2.2, v1: vTop - 1.25 },
    { s0: B - 8, s1: B - 1.2, u0: -1.8, u1: 1.8, v0: vTop - 2.2, v1: vTop - 1.25 },
    // Los dos nudillos que suben al pasador.
    { s0: yR + L_BOTTOM - 1.0, s1: yR + L_BOTTOM + 1.0, u0: 4.3, u1: 7.25, v0: vTop - 0.3, v1: 1.15 },
    { s0: yR + L_BOTTOM - 1.0, s1: yR + L_BOTTOM + 1.0, u0: -7.25, u1: -4.3, v0: vTop - 0.3, v1: 1.15 },
  ], [{ s: B - 0.9, v: vTop - 1.2, r: 1.15, u: 7.25 }]);
  return { bridge, blades, s6: L_BOTTOM - 1 };
}

/** Cómo va el marco del puente cuando la cola lo lleva consigo (en la pista
 *  "cola" de las 6): la matriz de la pista, pasada al lado de las 12, por el
 *  desfase con que está cerrado. */
export function bridgeOffset(s6: number): THREE.Matrix4 {
  const { base, cola } = framesClosed();
  return mirrored(frameMatrix(cola, s6)).invert().multiply(frameMatrix(base, L_BOTTOM));
}

const MIRROR = new THREE.Matrix4().makeScale(1, -1, 1);

/** Una matriz del lado de las 6 vista desde el de las 12 (sin espejar la pieza). */
export function mirrored(m: THREE.Matrix4): THREE.Matrix4 {
  return m.premultiply(MIRROR).multiply(MIRROR);
}

// ===========================================================================
// El plegable del brazalete
// ===========================================================================
/** Debajo de la barra lisa: dos medias lunas pulidas (pulsadores) que asoman
 *  por los flancos, con su taco, en el marco de la barra. */
export function foldoverPushers(): THREE.BufferGeometry {
  const w = braceletWidth(L_BOTTOM) / 2;
  const R = 3.8;
  const parts: THREE.BufferGeometry[] = [];
  for (const sx of [1, -1] as const) {
    // La media luna: cuerda de 7.6 y 2.1 de saliente, 1.25 de grueso.
    const N = 22;
    const bulge = 2.1;
    const xOut = (t: number) => {
      // Arco de círculo por (±R, 0) y (0, bulge).
      const rad = (R * R + bulge * bulge) / (2 * bulge);
      return Math.sqrt(Math.max(0, rad * rad - t * t)) - (rad - bulge);
    };
    const ys = Array.from({ length: N + 1 }, (_, k) => -R + (2 * R * k) / N);
    const zt = -1.4;
    const zb = -2.7;
    const bev = 0.3;
    const xs = [0, 1, 2, 3];
    parts.push(
      gridSolid({
        xs: sx > 0 ? xs : xs.map((x) => -x).reverse(),
        ys,
        at: (x0, y, i) => {
          const k = sx > 0 ? i : 3 - i;
          const out = w - 0.55 + xOut(y) + 0.55 * ease(R, R - 0.6, Math.abs(y));
          const x = k === 0 ? w - 1.6 : k === 1 ? w - 0.9 : k === 2 ? Math.max(w - 0.85, out - bev) : Math.max(w - 0.8, out);
          const edge = k === 3;
          return { x: sx * x, y, top: zt - (edge ? bev : 0), bot: zb + (edge ? bev : 0) };
        },
      })[0],
    );
    // El taco que la lleva, por dentro del flanco.
    parts.push(
      gridSolid({
        xs: [sx > 0 ? 5.75 : -(w - 0.9), sx > 0 ? w - 0.9 : -5.75],
        ys: [-3.4, -3.2, 3.2, 3.4],
        at: (x, y, _i, j) => ({ x, y, top: -1.3, bot: -2.6 + (j === 0 || j === 3 ? 0.2 : 0) }),
      })[0],
    );
  }
  return joinSolids(parts);
}

/** Las dos hojas del plegable, por dentro (en la mitad de las 6): 11 × 28. */
export function foldoverBlades(): THREE.BufferGeometry {
  const A = L_BOTTOM - 14;
  const B = L_BOTTOM + 14;
  return bladeGeometry([
    { s0: A, s1: B, u0: -5.5, u1: 5.5, v0: -2.45, v1: -1.48 },
    { s0: A + 0.9, s1: B - 4, u0: 1.65, u1: 4.6, v0: -3.4, v1: -2.43 },
    { s0: A + 0.9, s1: B - 4, u0: -4.6, u1: -1.65, v0: -3.4, v1: -2.43 },
    { s0: A + 0.9, s1: A + 6.5, u0: -1.8, u1: 1.8, v0: -3.3, v1: -2.43 },
    { s0: B - 10.5, s1: B - 4, u0: -1.8, u1: 1.8, v0: -3.3, v1: -2.43 },
  ], [{ s: A + 0.5, v: -2.45, r: 0.95, u: 5.5 }]);
}

/** La barra del plegable sobre su cuerda; al abrir se voltea hacia el forro
 *  por su bisagra (la junta con la última placa, por dentro). */
export const BAR_HINGE = new THREE.Vector3(0, -BAR_HALF, -2.75);

// ===========================================================================
// Hojas curvas
// ===========================================================================
interface BladePart {
  s0: number;
  s1: number;
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

/** Láminas con bisel que siguen la muñeca, en el espacio de la correa, y sus
 *  bisagras (un tubo a lo ancho: centro s, v; radio r; media anchura u). */
function bladeGeometry(parts: readonly BladePart[], hinges: readonly { s: number; v: number; r: number; u: number }[] = []): THREE.BufferGeometry {
  const solids = parts.map(({ s0, s1, u0, u1, v0, v1 }) => {
    const b = 0.18;
    const n = Math.max(2, Math.ceil((s1 - s0) / 1.2));
    const ys = [s0, s0 + b];
    for (let k = 1; k < n; k++) ys.push(s0 + ((s1 - s0) * k) / n);
    ys.push(s1 - b, s1);
    const xs = [u0, u0 + b, u1 - b, u1];
    return gridSolid({
      xs,
      ys,
      at: (x, y, i, j) => {
        const e = i === 0 || i === 3 || j === 0 || j === ys.length - 1 ? b : 0;
        return { x, y, top: v1 - e, bot: v0 + e };
      },
    })[0];
  });
  for (const { s, v, r, u } of hinges) {
    solids.push(
      rodX(
        [
          [-u, 0],
          [-u, r],
          [u, r],
          [u, 0],
        ],
        s,
        v,
        18,
      ),
    );
  }
  return toStrapSpace(joinSolids(solids));
}
