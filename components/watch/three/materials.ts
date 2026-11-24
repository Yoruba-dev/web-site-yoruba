// ---------------------------------------------------------------------------
// MATERIALES DE LA VISTA 3D — tonos medidos (no supuestos):
//   • acero: mediana del cepillado plano de las asas en caja-acero-1200.webp
//     (la capa del compositor).
//   • negro PVD y oro rosa (SPEC §4.9 #24): el MATIZ sale de las fotos del
//     proveedor (ref 2 y ref 16: mediana del anillo cepillado del bisel,
//     r 88–108 px y 90–110 px desde el centro de la ventana, sin brillos); la
//     LUMINANCIA se queda la de las capas (en una foto el nivel absoluto
//     depende de lo que refleja el metal, que no se conoce). Ref 2 da un PVD
//     algo frío (B/R lineal 1.30); ref 16 un oro rosa algo más rojo
//     (G/R 0.67, B/R 0.51 lineal).
//   • correas: mediana del centro de la correa en correa-<id>-1200.webp (las
//     que no tienen foto, el color del catálogo).
// Colores en sRGB (three los pasa a lineal).
//
// Cada pieza del reloj (caja, correa, cierre…) tiene sus PROPIOS materiales
// (un plano de recorte por pieza: ver reveal.ts); las texturas se comparten.
// Un cambio de acabado o de color no crea materiales: se interpola en 250 ms
// (FinishTween).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { WATCH_COLORS, getStrap, type FinishId, type WatchConfig } from "@/lib/watch";
import { withRevealGlint, type PartUniforms } from "./reveal";

export const FINISH_TONE: Readonly<Record<FinishId, string>> = {
  acero: "#c6c8ca",
  "pvd-negro": "#5d5e66",
  "oro-rosa": "#e3bda7",
};

/** Rugosidad por acabado (§4.9 #24): cepillado .30–.34 (PVD .36–.40),
 *  pulido .05–.07 (PVD .10–.14). */
const ROUGH: Readonly<Record<FinishId, { brushed: number; polished: number }>> = {
  acero: { brushed: 0.32, polished: 0.06 },
  "pvd-negro": { brushed: 0.38, polished: 0.12 },
  "oro-rosa": { brushed: 0.31, polished: 0.06 },
};

/** Correas con foto: mediana medida en su capa. */
const STRAP_PHOTO_TONE: Readonly<Record<string, string>> = {
  "caucho-negro": "#3c3c3d",
  "caucho-gris": "#767677",
  "caucho-blanco": "#ececea",
  "caucho-azul-marino": "#2f3c52",
  "caucho-azul": "#38598c",
  "caucho-naranja": "#ec7c3c",
  "caucho-verde": "#58624a",
  "caucho-rojo": "#9a3735",
  "caucho-tan": "#b48e66",
  "piel-verde": "#42564c",
  "piel-rojo": "#83302d",
  "piel-azul-marino": "#28374f",
};

export function finishOf(c: Pick<WatchConfig, "acabado">): FinishId {
  return c.acabado in FINISH_TONE ? c.acabado : "acero";
}

/** Tono de la correa (sRGB). */
export function strapTone(c: Pick<WatchConfig, "correa">): string {
  const s = getStrap(c.correa);
  if (!s) return STRAP_PHOTO_TONE["caucho-negro"];
  return STRAP_PHOTO_TONE[s.id] ?? WATCH_COLORS[s.color ?? "negro"].hex;
}

/** Anisotropía de TODO lo cepillado (PLAN-REALISMO-V3 §2.1). three dobla la
 *  normal con un peso (1 − a(1 − r))⁴: con 0.7–0.8 (lo que había) solo quedaba
 *  un 7 % de la normal real y cada pieza reflejaba UN punto del cuarto, fuera
 *  cual fuera su forma (blanca en "tres4", negra en "cierre"). Con 0.25 queda
 *  el 47 %: se ve la curva y se conserva el brillo alargado. */
const BRUSH_ANISO = 0.25;

/** La veta del cepillado de una pieza (tex/maps.ts → brushStreaks): su mapa (a
 *  la vez tinte y rugosidad) y por cuánto van el color y la rugosidad del
 *  material: la MEDIA del color sigue siendo FINISH_TONE. */
export interface BrushVeta {
  map: THREE.Texture;
  colorGain: number;
  roughGain: number;
}

export interface FinishMaterials {
  /** Cepillado lineal a lo largo de v: VERTICAL en la caja (cara del bisel,
   *  flancos, asas, tubo de la corona) y a lo largo en eslabones y cierres. */
  brushed: THREE.MeshPhysicalMaterial;
  /** Cepillado radial (anillo de la tapa). */
  brushedRadial: THREE.MeshPhysicalMaterial;
  /** Pulido espejo (chaflanes, orejas, cubre-asas, corona, cierres). */
  polished: THREE.MeshPhysicalMaterial;
  /** Interior mate (pared de la ventana sobre la esfera). */
  matte: THREE.MeshPhysicalMaterial;
  /** Compensación de la veta (para interpolar acabados). */
  veta: Pick<BrushVeta, "colorGain" | "roughGain">;
  all: THREE.MeshPhysicalMaterial[];
  dispose(): void;
}

/** Los materiales de metal de un acabado para UNA pieza (con su plano y su
 *  brillo de barrido). `veta` = la veta del cepillado lineal (a lo largo de
 *  v); `radial` = dirección del cepillado radial. */
export function finishMaterials(
  fin: FinishId,
  maps: { radial: THREE.Texture; veta: BrushVeta },
  part: { plane: THREE.Plane; u: PartUniforms },
): FinishMaterials {
  const { veta } = maps;
  const tone = new THREE.Color(FINISH_TONE[fin]);
  const r = ROUGH[fin];
  // A dos caras: los tornos no tienen un sentido fijo.
  const side = THREE.DoubleSide;
  const clip = [part.plane];
  const brushed = new THREE.MeshPhysicalMaterial({
    side,
    color: tone.clone().multiplyScalar(veta.colorGain),
    map: veta.map,
    metalness: 1,
    roughness: r.brushed * veta.roughGain,
    roughnessMap: veta.map,
    anisotropy: BRUSH_ANISO,
    anisotropyRotation: Math.PI / 2,
    clippingPlanes: clip,
  });
  const radial = maps.radial.clone();
  // El anillo de la tapa lleva UV en mm (−24…24): al rango 0…1.
  radial.repeat.set(1 / 48, 1 / 48);
  radial.offset.set(0.5, 0.5);
  radial.needsUpdate = true;
  const brushedRadial = new THREE.MeshPhysicalMaterial({
    side,
    color: tone,
    metalness: 1,
    roughness: r.brushed,
    anisotropy: BRUSH_ANISO,
    anisotropyMap: radial,
    clippingPlanes: clip,
  });
  const polished = new THREE.MeshPhysicalMaterial({
    side,
    color: tone.clone().lerp(new THREE.Color("#ffffff"), fin === "pvd-negro" ? 0.02 : 0.06),
    metalness: 1,
    roughness: r.polished,
    clippingPlanes: clip,
  });
  const matte = new THREE.MeshPhysicalMaterial({
    side,
    color: tone.clone().multiplyScalar(0.55),
    metalness: 0.9,
    roughness: 0.55,
    clippingPlanes: clip,
  });
  const all = [brushed, brushedRadial, polished, matte];
  all.forEach((m) => withRevealGlint(m, part.u));
  return {
    brushed,
    brushedRadial,
    polished,
    matte,
    veta: { colorGain: veta.colorGain, roughGain: veta.roughGain },
    all,
    dispose() {
      radial.dispose();
      all.forEach((m) => m.dispose());
    },
  };
}

/** Los valores de un acabado (para interpolar sin crear materiales). */
function finishTargets(
  fin: FinishId,
  veta: FinishMaterials["veta"],
): { m: (keyof Omit<FinishMaterials, "all" | "dispose" | "veta">)[]; color: THREE.Color[]; rough: number[] } {
  const tone = new THREE.Color(FINISH_TONE[fin]);
  const r = ROUGH[fin];
  return {
    m: ["brushed", "brushedRadial", "polished", "matte"],
    color: [
      tone.clone().multiplyScalar(veta.colorGain),
      tone,
      tone.clone().lerp(new THREE.Color("#ffffff"), fin === "pvd-negro" ? 0.02 : 0.06),
      tone.clone().multiplyScalar(0.55),
    ],
    rough: [r.brushed * veta.roughGain, r.brushed, r.polished, 0.55],
  };
}

/** Interpola color y rugosidad de varios juegos de materiales hacia un
 *  acabado (250 ms, easeInOutCubic). `step()` devuelve true mientras dura. */
export class FinishTween {
  private from: { c: THREE.Color; r: number }[] = [];
  private to: { c: THREE.Color; r: number }[] = [];
  private mats: THREE.MeshPhysicalMaterial[] = [];
  private t0 = 0;
  private dur = 250;
  private on = false;

  start(sets: readonly FinishMaterials[], fin: FinishId, now: number, dur = 250) {
    this.mats = [];
    this.from = [];
    this.to = [];
    for (const s of sets) {
      const tg = finishTargets(fin, s.veta);
      tg.m.forEach((k, i) => {
        const m = s[k];
        this.mats.push(m);
        this.from.push({ c: m.color.clone(), r: m.roughness });
        this.to.push({ c: tg.color[i].clone(), r: tg.rough[i] });
      });
    }
    this.t0 = now;
    this.dur = dur;
    this.on = true;
    if (dur <= 0) this.step(now + 1);
  }

  step(now: number): boolean {
    if (!this.on) return false;
    const t = Math.min(1, (now - this.t0) / Math.max(1, this.dur));
    const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    this.mats.forEach((m, i) => {
      m.color.copy(this.from[i].c).lerp(this.to[i].c, e);
      m.roughness = this.from[i].r + (this.to[i].r - this.from[i].r) * e;
    });
    if (t >= 1) this.on = false;
    return this.on;
  }
}

/** Interpola un color de material (las correas, 250 ms). */
export class ColorTween {
  private from = new THREE.Color();
  private to = new THREE.Color();
  private t0 = 0;
  private on = false;
  constructor(private mats: () => (THREE.Material & { color: THREE.Color })[], private scale: number[] = []) {}

  start(hex: string, now: number, dur = 250) {
    const ms = this.mats();
    if (!ms.length) return;
    this.from.copy(ms[0].color).multiplyScalar(1 / (this.scale[0] ?? 1));
    this.to.set(hex);
    this.t0 = now;
    this.on = dur > 0;
    if (!this.on) this.apply(1);
    this.dur = dur;
  }
  private dur = 250;
  private apply(e: number) {
    const c = this.from.clone().lerp(this.to, e);
    this.mats().forEach((m, i) => m.color.copy(c).multiplyScalar(this.scale[i] ?? 1));
  }
  step(now: number): boolean {
    if (!this.on) return false;
    const t = Math.min(1, (now - this.t0) / this.dur);
    this.apply(t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    if (t >= 1) this.on = false;
    return this.on;
  }
}

/** Metal pulido de las agujas y de los aros de los índices. */
export function handMetal(hex: string, part: { plane: THREE.Plane; u: PartUniforms }): THREE.MeshPhysicalMaterial {
  return withRevealGlint(
    new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), metalness: 1, roughness: 0.1, clippingPlanes: [part.plane] }),
    part.u,
  );
}

/** Lume: de día, pintura clara mate; de noche brilla (emisivo, sin bloom). */
export function lumeMaterial(day: string, glow: string, part: { plane: THREE.Plane; u: PartUniforms }): THREE.MeshStandardMaterial {
  return withRevealGlint(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(day),
      roughness: 0.5,
      metalness: 0,
      emissive: new THREE.Color(glow),
      emissiveIntensity: 0,
      clippingPlanes: [part.plane],
    }),
    part.u,
  );
}

/** Un material estándar/físico con el plano y el brillo de su pieza. */
export function partMat<T extends THREE.MeshStandardMaterial>(m: T, part: { plane: THREE.Plane; u: PartUniforms }): T {
  m.clippingPlanes = [part.plane];
  return withRevealGlint(m, part.u);
}
