// ---------------------------------------------------------------------------
// LA POSE DE LA CORREA — curvatura por longitud de arco, integrada desde el asa.
//
// El reloj se apoya sobre su correa CERRADA como puesto en una muñeca de
// 17 cm: una elipse en el plano y–z de semiejes 31 (y) × 23 (z) con centro en
// z = −30.5 (su parte de arriba, z = −7.5, queda justo bajo la tapa). Cada
// correa sale de su asa (y = 22.6, z = −2.6, con la tangente del asa), se une
// con continuidad C1 a la elipse desplazada medio grueso hacia fuera y la
// sigue hasta abajo (y = 0). La unión (una Hermite del asa a la elipse) se
// eligió con un barrido numérico (PLAN-REALISMO-V3 2.7): la correa sale del
// asa casi recta y cae en una curva larga, como en los renders 13 y 19 y la
// foto r11: radio mínimo 16.2 mm (antes 9.8) y 31.6° caídos a los 8 mm (antes
// 48°), sin entrar en la muñeca (línea media a ≥ 1.8 mm).
//
// Una correa se describe por su CURVATURA κ(s) (1/mm) cada DS mm de arco. Su
// geometría se construye UNA vez en el espacio local de la correa (s a lo
// largo, u a lo ancho, v hacia fuera) y se coloca integrando κ desde el asa:
//   posición = P(s) + u·B + v·N(s),   normal = n_t·T + n_b·B + n_n·N,
// con B = +x siempre (la correa no sale de su franja en x). Así la pose
// "cerrada" (en la muñeca) y la "abierta" (boca abajo, para ver la tapa) son
// la MISMA geometría con otra κ, y el paso de una a otra (750 ms) es
// κ = mix(κ_cerrada, κ_abierta, t): la correa no se estira nunca.
//
// Coordenadas de LADO: la correa de las 12 tal cual (y > 0); la de las 6 se
// pinta dentro de un grupo con scale.y = −1 (three invierte las caras solo).
// Ángulo θ medido en el plano (y, z): T = (cos θ, sin θ), N = (−sin θ, cos θ)
// (en x, y, z: B × T con B = +x). κ < 0 = dobla hacia la muñeca.
// ---------------------------------------------------------------------------
import * as THREE from "three";

/** Paso (mm) de las tablas de curvatura y de los marcos. */
export const DS = 0.25;

/** Muñeca de 17 cm (perímetro ≈ 170 mm): elipse en y–z. */
export const WRIST = { a: 31, b: 23, zc: -30.5 } as const;

/** Anclaje de la correa en el asa de las 12 (y, z) y su tangente. */
export const LUG = { y: 22.6, z: -2.6, theta: Math.atan2(-0.25, 2.4) } as const;

/** Medio grueso de la correa sobre la muñeca (la línea media va desplazada). */
export const BASE_OFFSET = 1.8;

/** La unión C1 asa → elipse (ver cabecera). */
const JOIN = { phi: 2.1, m0: 40, m1: 90 } as const;

/** Largo de las tablas (mm de arco): de sobra para la cola de la correa de
 *  agujeros y las hojas del desplegable, que pasan del punto de abajo. */
export const TABLE_LEN = 132;

export interface PoseTable {
  /** κ cada DS mm, desde el asa. */
  kappa: Float32Array;
}

/** Marcos de una pista (posición y tangente en el plano y–z). */
export interface Frames {
  n: number;
  py: Float32Array;
  pz: Float32Array;
  ty: Float32Array;
  tz: Float32Array;
}

export const SAMPLES = Math.round(TABLE_LEN / DS) + 1;

export function newFrames(): Frames {
  return {
    n: SAMPLES,
    py: new Float32Array(SAMPLES),
    pz: new Float32Array(SAMPLES),
    ty: new Float32Array(SAMPLES),
    tz: new Float32Array(SAMPLES),
  };
}

/** Integra κ desde el asa: θ con la regla del trapecio, posición con el
 *  ángulo del punto medio. Escribe en `out`. */
export function integratePose(kappa: Float32Array, out: Frames, y0: number = LUG.y, z0: number = LUG.z, theta0: number = LUG.theta): Frames {
  let th = theta0;
  let y = y0;
  let z = z0;
  const n = Math.min(out.n, kappa.length);
  out.py[0] = y;
  out.pz[0] = z;
  out.ty[0] = Math.cos(th);
  out.tz[0] = Math.sin(th);
  for (let i = 1; i < n; i++) {
    const dth = 0.5 * (kappa[i - 1] + kappa[i]) * DS;
    const mid = th + dth / 2;
    y += Math.cos(mid) * DS;
    z += Math.sin(mid) * DS;
    th += dth;
    out.py[i] = y;
    out.pz[i] = z;
    out.ty[i] = Math.cos(th);
    out.tz[i] = Math.sin(th);
  }
  return out;
}

/** κ = mix(a, b, t) en `out`. */
export function mixKappa(a: Float32Array, b: Float32Array, t: number, out: Float32Array): Float32Array {
  const k = 1 - t;
  for (let i = 0; i < out.length; i++) out[i] = a[i] * k + b[i] * t;
  return out;
}

// ===========================================================================
// Tablas de curvatura a partir de un trazo (y, z)
// ===========================================================================
/** Punto de la elipse de la muñeca desplazado `d` mm hacia fuera, en el
 *  parámetro φ (0 = arriba, π/2 = el lado de las 12, π = abajo). */
export function wristPoint(phi: number, d: number): [number, number] {
  const { a, b, zc } = WRIST;
  const y = a * Math.sin(phi);
  const z = zc + b * Math.cos(phi);
  const ny = b * Math.sin(phi);
  const nz = a * Math.cos(phi);
  const l = Math.hypot(ny, nz) || 1;
  return [y + (d * ny) / l, z + (d * nz) / l];
}

function wristTangent(phi: number, d: number): [number, number] {
  const h = 1e-4;
  const p = wristPoint(phi - h, d);
  const q = wristPoint(phi + h, d);
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
  return [(q[0] - p[0]) / l, (q[1] - p[1]) / l];
}

/** El trazo cerrado de una pista: asa → Hermite → elipse desplazada `dOf(φ)`
 *  hasta `phiEnd` (más allá de π sube por el otro lado). */
export function closedPath(dOf: (phi: number) => number, phiEnd: number): [number, number][] {
  const P1 = wristPoint(JOIN.phi, dOf(JOIN.phi));
  const T1 = wristTangent(JOIN.phi, dOf(JOIN.phi));
  const T0: [number, number] = [Math.cos(LUG.theta), Math.sin(LUG.theta)];
  const pts: [number, number][] = [];
  const H = 240;
  for (let i = 0; i <= H; i++) {
    const t = i / H;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    const h11 = t ** 3 - t ** 2;
    pts.push([
      h00 * LUG.y + h10 * JOIN.m0 * T0[0] + h01 * P1[0] + h11 * JOIN.m1 * T1[0],
      h00 * LUG.z + h10 * JOIN.m0 * T0[1] + h01 * P1[1] + h11 * JOIN.m1 * T1[1],
    ]);
  }
  const E = Math.ceil(((phiEnd - JOIN.phi) / Math.PI) * 1400);
  for (let i = 1; i <= E; i++) {
    const phi = JOIN.phi + ((phiEnd - JOIN.phi) * i) / E;
    pts.push(wristPoint(phi, dOf(phi)));
  }
  return pts;
}

/** Remuestrea un trazo cada DS mm y saca κ(s) (suavizada con una caja de
 *  `boxMm`). Más allá del final del trazo, κ sigue con el último valor. */
export function tableFromPath(pts: readonly [number, number][], boxMm = 3): { table: PoseTable; length: number } {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = acc[acc.length - 1];
  const n = Math.floor(L / DS);
  const rs: [number, number][] = [];
  let j = 0;
  for (let k = 0; k <= n; k++) {
    const s = k * DS;
    while (j < acc.length - 2 && acc[j + 1] < s) j++;
    const f = (s - acc[j]) / (acc[j + 1] - acc[j] || 1);
    rs.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f]);
  }
  const th: number[] = [];
  for (let i = 0; i + 1 < rs.length; i++) th.push(Math.atan2(rs[i + 1][1] - rs[i][1], rs[i + 1][0] - rs[i][0]));
  for (let i = 1; i < th.length; i++) {
    while (th[i] - th[i - 1] > Math.PI) th[i] -= 2 * Math.PI;
    while (th[i] - th[i - 1] < -Math.PI) th[i] += 2 * Math.PI;
  }
  // κ en el punto medio de cada par de segmentos → en la muestra i.
  const raw = new Float32Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const a = Math.min(Math.max(i - 1, 0), th.length - 2);
    raw[i] = (th[a + 1] - th[a]) / DS;
  }
  // Más allá del trazo: la última curvatura (la tabla siempre llena).
  const last = Math.min(n - 2, SAMPLES - 1);
  for (let i = last + 1; i < SAMPLES; i++) raw[i] = raw[last];
  const W = Math.max(1, Math.round(boxMm / DS / 2));
  const kappa = new Float32Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    let s = 0;
    let c = 0;
    for (let q = i - W; q <= i + W; q++) {
      if (q < 0 || q >= SAMPLES) continue;
      s += raw[q];
      c++;
    }
    kappa[i] = s / c;
  }
  // El primer tramo arranca con la tangente exacta del asa.
  return { table: { kappa }, length: L };
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// ===========================================================================
// Las pistas de cada cierre
// ===========================================================================
/** Arco (mm) del asa al punto de abajo (y = 0) con la línea media a BASE_OFFSET. */
export const L_BOTTOM: number = (() => {
  const { length } = tableFromPath(closedPath(() => BASE_OFFSET, Math.PI));
  return length;
})();

export type TrackId =
  /** La línea media a medio grueso de la muñeca, siguiendo la elipse. */
  | "base"
  /** Hebilla: la correa de agujeros, que pasa por el marco y sube por fuera
   *  de la de las 12 (su cola). */
  | "cola";

export interface TrackTables {
  closed: Float32Array;
  open: Float32Array;
  /** Solo "cola": la cola ya separada (la primera parte de la apertura). */
  lifted?: Float32Array;
}

/** Grueso de la correa de las 6 (para la cola sobre la de las 12). */
const COLA = { th: 3.2, gap: 0.3 } as const;

/** κ de la pose ABIERTA ("boca abajo"): sale del asa, dobla 18° hacia +z en
 *  12 mm, vuelve a quedar recta en ±y en otros 12 y sigue recta. */
export function openKappa(): Float32Array {
  const k = new Float32Array(SAMPLES);
  const up = THREE.MathUtils.degToRad(18);
  const th = (s: number) => LUG.theta + up * smooth(0, 12, s) - (LUG.theta + up) * smooth(12, 24, s);
  for (let i = 0; i < SAMPLES; i++) {
    const s = i * DS;
    k[i] = (th(s + DS / 2) - th(s - DS / 2)) / DS;
  }
  return k;
}

/** El trazo de la COLA: la línea media de la correa de las 6 hasta abajo y,
 *  de ahí, la de las 12 recorrida al revés (la cola sube POR ENCIMA de ella,
 *  no por la elipse: cerca de la caja la correa se separa de la muñeca),
 *  desplazada `d(σ)` hacia fuera en el arco σ. */
function tailPath(d: (s: number) => number): [number, number][] {
  const down = closedPath(() => BASE_OFFSET, Math.PI);
  const up = down
    .slice(0, -1)
    .reverse()
    .map(([y, z]): [number, number] => [-y, z]);
  const mid = [...down, ...up];
  const out: [number, number][] = [];
  let s = 0;
  for (let i = 0; i < mid.length; i++) {
    const a = mid[Math.max(0, i - 1)];
    const b = mid[Math.min(mid.length - 1, i + 1)];
    if (i > 0) s += Math.hypot(mid[i][0] - a[0], mid[i][1] - a[1]);
    // La tabla no necesita más (y se queda lejos del asa de las 12).
    if (s > TABLE_LEN + 2) break;
    const ty = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(ty, tz) || 1;
    // Hacia fuera de la muñeca: N = (−T_z, T_y).
    out.push([mid[i][0] - (d(s) * tz) / l, mid[i][1] + (d(s) * ty) / l]);
  }
  return out;
}

const tableCache = new Map<TrackId, TrackTables>();

/** Las tablas de una pista (memo: son las mismas para toda la vida). */
export function trackTables(id: TrackId): TrackTables {
  const hit = tableCache.get(id);
  if (hit) return hit;
  const open = openKappa();
  const end = Math.PI + 1.5;
  let out: TrackTables;
  if (id === "base") {
    out = { closed: tableFromPath(closedPath(() => BASE_OFFSET, end)).table.kappa, open };
  } else {
    // La correa pasa por el marco de la hebilla (centrado abajo) y sube por
    // fuera de la de las 12, a un grueso de ella.
    const d = (s: number) => (COLA.th + COLA.gap) * smooth(L_BOTTOM - 7, L_BOTTOM + 6.5, s);
    const dLift = (s: number) => d(s) + 4 * smooth(L_BOTTOM - 9.5, L_BOTTOM + 3.5, s);
    out = {
      closed: tableFromPath(tailPath(d)).table.kappa,
      open,
      lifted: tableFromPath(tailPath(dLift)).table.kappa,
    };
  }
  tableCache.set(id, out);
  return out;
}

// ===========================================================================
// Colocar vértices y piezas rígidas
// ===========================================================================
/** Atributos locales de una geometría de correa: aLocal = (s, u, v) y
 *  aNLocal = (n_t, n_b, n_n). La posición y la normal se escriben con pose(). */
export function poseGeometry(g: THREE.BufferGeometry, fr: Frames): void {
  const loc = g.getAttribute("aLocal") as THREE.BufferAttribute | undefined;
  const nl = g.getAttribute("aNLocal") as THREE.BufferAttribute | undefined;
  if (!loc || !nl) return;
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const nor = g.getAttribute("normal") as THREE.BufferAttribute;
  const L = loc.array as Float32Array;
  const NL = nl.array as Float32Array;
  const P = pos.array as Float32Array;
  const NN = nor.array as Float32Array;
  const { py, pz, ty, tz } = fr;
  const last = fr.n - 1;
  for (let i = 0, o = 0; i < loc.count; i++, o += 3) {
    const s = L[o] / DS;
    let k = Math.floor(s);
    if (k < 0) k = 0;
    else if (k >= last) k = last - 1;
    const f = s - k;
    const g0 = 1 - f;
    const Ty = ty[k] * g0 + ty[k + 1] * f;
    const Tz = tz[k] * g0 + tz[k + 1] * f;
    // Fuera de la tabla (s < 0 o s > largo): recto por la tangente.
    const ex = s < 0 ? s * DS : s > last ? (s - last) * DS : 0;
    const Py = py[k] * g0 + py[k + 1] * f + Ty * ex;
    const Pz = pz[k] * g0 + pz[k + 1] * f + Tz * ex;
    const u = L[o + 1];
    const v = L[o + 2];
    // N = (−Tz, Ty) en (y, z).
    P[o] = u;
    P[o + 1] = Py - v * Tz;
    P[o + 2] = Pz + v * Ty;
    const nt = NL[o];
    const nb = NL[o + 1];
    const nn = NL[o + 2];
    NN[o] = nb;
    NN[o + 1] = nt * Ty - nn * Tz;
    NN[o + 2] = nt * Tz + nn * Ty;
  }
  pos.needsUpdate = true;
  nor.needsUpdate = true;
}

/** Base rígida en el arco s (x a lo ancho, y a lo largo, z hacia fuera)
 *  levantada `lift` mm sobre la línea media. */
export function frameMatrix(fr: Frames, s: number, lift = 0, out = new THREE.Matrix4()): THREE.Matrix4 {
  const q = s / DS;
  let k = Math.floor(q);
  const last = fr.n - 1;
  if (k < 0) k = 0;
  else if (k >= last) k = last - 1;
  const f = q - k;
  let Ty = fr.ty[k] * (1 - f) + fr.ty[k + 1] * f;
  let Tz = fr.tz[k] * (1 - f) + fr.tz[k + 1] * f;
  const l = Math.hypot(Ty, Tz) || 1;
  Ty /= l;
  Tz /= l;
  const ex = q < 0 ? q * DS : q > last ? (q - last) * DS : 0;
  const Py = fr.py[k] * (1 - f) + fr.py[k + 1] * f + Ty * ex;
  const Pz = fr.pz[k] * (1 - f) + fr.pz[k + 1] * f + Tz * ex;
  // Columnas: B = +x, T, N = (0, −Tz, Ty).
  out.set(1, 0, 0, 0, 0, Ty, -Tz, Py - lift * Tz, 0, Tz, Ty, Pz + lift * Ty, 0, 0, 0, 1);
  return out;
}

/** Base rígida apoyada en la CUERDA entre s0 y s1 (para piezas rectas
 *  largas: el marco de la hebilla, la tapa del cierre plegable). */
export function chordMatrix(fr: Frames, s0: number, s1: number, lift = 0, out = new THREE.Matrix4()): THREE.Matrix4 {
  const a = frameMatrix(fr, s0, 0, _ma);
  const b = frameMatrix(fr, s1, 0, _mb);
  const ay = a.elements[13];
  const az = a.elements[14];
  const by = b.elements[13];
  const bz = b.elements[14];
  let Ty = by - ay;
  let Tz = bz - az;
  const l = Math.hypot(Ty, Tz) || 1;
  Ty /= l;
  Tz /= l;
  const My = (ay + by) / 2;
  const Mz = (az + bz) / 2;
  out.set(1, 0, 0, 0, 0, Ty, -Tz, My - lift * Tz, 0, Tz, Ty, Mz + lift * Ty, 0, 0, 0, 1);
  return out;
}
const _ma = new THREE.Matrix4();
const _mb = new THREE.Matrix4();

/** Marca una geometría como "de correa": copia position/normal (construidas
 *  en recto: x = u, y = s, z = v) a aLocal / aNLocal (s, u, v) / (n_t, n_b,
 *  n_n) y deja position/normal listos para pose(). */
export function toStrapSpace(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = g.getAttribute("position");
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  const nor = g.getAttribute("normal");
  const n = pos.count;
  const loc = new Float32Array(n * 3);
  const nl = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    loc[i * 3] = pos.getY(i);
    loc[i * 3 + 1] = pos.getX(i);
    loc[i * 3 + 2] = pos.getZ(i);
    nl[i * 3] = nor.getY(i);
    nl[i * 3 + 1] = nor.getX(i);
    nl[i * 3 + 2] = nor.getZ(i);
  }
  g.setAttribute("aLocal", new THREE.BufferAttribute(loc, 3));
  g.setAttribute("aNLocal", new THREE.BufferAttribute(nl, 3));
  // Posición y normal se reescriben en cada pose.
  const p2 = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
  const n2 = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
  p2.setUsage(THREE.DynamicDrawUsage);
  n2.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute("position", p2);
  g.setAttribute("normal", n2);
  return g;
}

// ===========================================================================
// El conductor de la pose: anima t (0 = cerrada, 1 = abierta) y coloca todo
// lo que se le registra (geometrías de correa, piezas rígidas, instancias).
// ===========================================================================
export type Side = "12" | "6";

interface TrackState {
  side: Side;
  id: TrackId;
  frames: Frames;
  tmp: Float32Array;
}

export type RigidPlace = (fr: Frames, t: number, out: THREE.Matrix4) => THREE.Matrix4;
export type InstancePlace = (fr: Frames, t: number, i: number, out: THREE.Matrix4) => THREE.Matrix4;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export class PoseDriver {
  /** 0 = cerrada (en la muñeca), 1 = abierta (boca abajo). */
  t = 0;
  /** Hacia dónde va. */
  open = false;
  private anim: { from: number; to: number; t0: number; dur: number } | null = null;
  private tracks = new Map<string, TrackState>();
  private geos = new Map<THREE.BufferGeometry, string>();
  private rigid = new Map<THREE.Object3D, { key: string; place: RigidPlace }>();
  private inst = new Map<THREE.InstancedMesh, { key: string; count: number; place: InstancePlace }>();
  private dirtyBounds = false;
  /** Cambió la forma (para rehornear la sombra al acabar). */
  onSettled?: () => void;

  private track(side: Side, id: TrackId): TrackState {
    const key = `${side}:${id}`;
    let tr = this.tracks.get(key);
    if (!tr) {
      tr = { side, id, frames: newFrames(), tmp: new Float32Array(SAMPLES) };
      this.tracks.set(key, tr);
      this.integrate(tr, this.t);
    }
    return tr;
  }

  private integrate(tr: TrackState, t: number) {
    const tb = trackTables(tr.id);
    if (tr.id === "cola" && tb.lifted) {
      // La cola se separa primero (0–30 %), luego se abre.
      if (t < 0.3) mixKappa(tb.closed, tb.lifted, t / 0.3, tr.tmp);
      else mixKappa(tb.lifted, tb.open, (t - 0.3) / 0.7, tr.tmp);
    } else {
      // Con cola (hebilla o puente), la de las 12 espera debajo a que la cola
      // se aparte: si no, la atravesaría al abrirse hacia fuera.
      const wait = tr.side === "12" && this.hasCola();
      mixKappa(tb.closed, tb.open, wait ? Math.max(0, (t - 0.42) / 0.58) : t, tr.tmp);
    }
    integratePose(tr.tmp, tr.frames);
  }

  /** ¿Hay una cola montada? (las pistas no se borran al cambiar de correa). */
  private hasCola(): boolean {
    for (const key of this.geos.values()) if (key === "6:cola") return true;
    return false;
  }

  frames(side: Side, id: TrackId): Frames {
    return this.track(side, id).frames;
  }

  addGeometry(g: THREE.BufferGeometry, side: Side, id: TrackId): () => void {
    const key = `${side}:${id}`;
    const tr = this.track(side, id);
    this.geos.set(g, key);
    poseGeometry(g, tr.frames);
    g.computeBoundingSphere();
    return () => {
      this.geos.delete(g);
    };
  }

  addRigid(o: THREE.Object3D, side: Side, id: TrackId, place: RigidPlace): () => void {
    const key = `${side}:${id}`;
    const tr = this.track(side, id);
    o.matrixAutoUpdate = false;
    place(tr.frames, this.t, o.matrix);
    o.matrixWorldNeedsUpdate = true;
    this.rigid.set(o, { key, place });
    return () => {
      this.rigid.delete(o);
    };
  }

  addInstances(m: THREE.InstancedMesh, side: Side, id: TrackId, count: number, place: InstancePlace): () => void {
    const key = `${side}:${id}`;
    const tr = this.track(side, id);
    this.inst.set(m, { key, count, place });
    this.writeInstances(m, tr.frames, count, place);
    return () => {
      this.inst.delete(m);
    };
  }

  private writeInstances(m: THREE.InstancedMesh, fr: Frames, count: number, place: InstancePlace) {
    for (let i = 0; i < count; i++) {
      place(fr, this.t, i, _m4);
      m.setMatrixAt(i, _m4);
    }
    m.instanceMatrix.needsUpdate = true;
  }

  /** Coloca todo con la pose `t` (lo usa también la foto de estudio). */
  applyPose(t: number) {
    this.t = t;
    this.tracks.forEach((tr) => this.integrate(tr, t));
    this.geos.forEach((key, g) => {
      const tr = this.tracks.get(key);
      if (tr) poseGeometry(g, tr.frames);
    });
    this.rigid.forEach(({ key, place }, o) => {
      const tr = this.tracks.get(key);
      if (!tr) return;
      place(tr.frames, t, o.matrix);
      o.matrixWorldNeedsUpdate = true;
    });
    this.inst.forEach(({ key, count, place }, m) => {
      const tr = this.tracks.get(key);
      if (tr) this.writeInstances(m, tr.frames, count, place);
    });
    this.dirtyBounds = true;
  }

  private settle() {
    if (this.dirtyBounds) {
      this.geos.forEach((_, g) => g.computeBoundingSphere());
      this.dirtyBounds = false;
    }
    this.onSettled?.();
  }

  /** Abre o cierra (750 ms, easeInOutCubic). Con `cut`, al momento. */
  setOpen(open: boolean, now: number, cut = false) {
    if (open === this.open && !this.anim) return;
    this.open = open;
    const to = open ? 1 : 0;
    if (cut) {
      this.anim = null;
      this.applyPose(to);
      this.settle();
      return;
    }
    this.anim = { from: this.t, to, t0: now, dur: 750 * Math.abs(to - this.t) };
  }

  busy(): boolean {
    return !!this.anim;
  }

  tick(now: number): boolean {
    const a = this.anim;
    if (!a) return false;
    const k = Math.min(1, (now - a.t0) / Math.max(1, a.dur));
    this.applyPose(a.from + (a.to - a.from) * easeInOutCubic(k));
    if (k >= 1) {
      this.anim = null;
      this.settle();
      return false;
    }
    return true;
  }
}
const _m4 = new THREE.Matrix4();
