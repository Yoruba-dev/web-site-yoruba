// ---------------------------------------------------------------------------
// EL RELOJ QUE SE ARMA — cada pieza pasa de cristal a real con un barrido
// (SPEC §4.1–4.4).
//
// • Un plano de recorte POR PIEZA, puesto para siempre en todos sus materiales
//   reales (`material.clippingPlanes = [plano]`). En reposo el plano está
//   "aparcado" (no recorta nada): ningún material cambia nunca su número de
//   planos, así que ningún barrido compila un shader.
// • El cristal lleva el plano NEGADO: los dos se encuentran en la banda.
// • withRevealGlint(): un parche pequeño (onBeforeCompile, misma clave de
//   programa "glint" para todos) que suma un brillo dorado junto al plano
//   mientras barre, y un fundido por tramado (uFade, Bayer 4×4) para los
//   fundidos cruzados sin volver transparente un material opaco.
// • Assembly: la máquina de estados. Compara la máscara pedida con la actual
//   y anima: barrido de 600 ms (escalonado 120 ms en el orden caja → esfera →
//   agujas → correa → cierre → tapa; agujas +120 tras la esfera, cierre +150
//   tras la correa), vuelta a cristal en 300 ms, fundidos de 250 ms en la
//   entrada, 150 ms con movimiento reducido, y el re-barrido de 450 ms cuando
//   cambia la forma de una pieza ya real. Todo en el bucle de fotogramas
//   (invalidate mientras dura; en reposo, 0 fps).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { WATCH_PARTS, type PartMask, type Stage3DMode, type WatchPart } from "../stage3d-contract";
import { ghostMaterials, type GhostMaterials } from "./ghost";

/** Constante de un plano aparcado (mm: nada del reloj está a esa distancia). */
const PARK = 1e5;

export interface PartUniforms {
  uGlint: { value: number };
  uGlintW: { value: number };
  uGlintColor: { value: THREE.Color };
  uFade: { value: number };
}

const GLINT_PARS = /* glsl */ `
uniform float uGlint;
uniform float uGlintW;
uniform vec3 uGlintColor;
uniform float uFade;
const float BAYER4[16] = float[16]( 0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5. );
`;

const FADE = /* glsl */ `
if ( uFade < 0.999 ) {
  ivec2 bq = ivec2( mod( gl_FragCoord.xy, 4.0 ) );
  if ( ( BAYER4[ bq.y * 4 + bq.x ] + 0.5 ) / 16.0 > uFade ) discard;
}
`;

const GLINT = /* glsl */ `
#if NUM_CLIPPING_PLANES > 0
  float dRev = clippingPlanes[ 0 ].w - dot( vClipPosition, clippingPlanes[ 0 ].xyz );
  totalEmissiveRadiance += uGlintColor * uGlint * ( 1.0 - smoothstep( 0.0, uGlintW, dRev ) );
#endif
`;

/** Pone el parche del brillo y el fundido a un material estándar/físico, con
 *  los uniformes de su pieza (compartidos por todos sus materiales). */
export function withRevealGlint<T extends THREE.MeshStandardMaterial>(mat: T, u: PartUniforms): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGlint = u.uGlint;
    shader.uniforms.uGlintW = u.uGlintW;
    shader.uniforms.uGlintColor = u.uGlintColor;
    shader.uniforms.uFade = u.uFade;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <clipping_planes_pars_fragment>", `#include <clipping_planes_pars_fragment>\n${GLINT_PARS}`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>\n${FADE}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${GLINT}`);
  };
  mat.customProgramCacheKey = () => "glint";
  return mat;
}

// ===========================================================================
// Barridos
// ===========================================================================
interface Sweep {
  /** Sentido en que avanza lo real. */
  dir: THREE.Vector3;
  v0: number;
  v1: number;
}

const Y = new THREE.Vector3(0, 1, 0);
const NY = new THREE.Vector3(0, -1, 0);
const NZ = new THREE.Vector3(0, 0, -1);
const X = new THREE.Vector3(1, 0, 0);

/** De abajo arriba la caja; de arriba abajo la esfera y las agujas; de las
 *  asas al cierre la correa (z: con la correa cerrada, z va con el arco); el
 *  láser de la tapa de izquierda a derecha. Con la correa abierta (vista de
 *  la tapa) correa y cierre barren a lo ancho. */
function sweepOf(p: WatchPart, abierta: boolean): Sweep {
  switch (p) {
    case "caja":
      return { dir: Y, v0: -24, v1: 24 };
    case "esfera":
    case "agujas":
      return { dir: NY, v0: -16, v1: 16 };
    case "correa":
      return abierta ? { dir: X, v0: -12, v1: 12 } : { dir: NZ, v0: 0, v1: 62 };
    case "cierre":
      return abierta ? { dir: X, v0: -12, v1: 12 } : { dir: NZ, v0: 40, v1: 63 };
    case "tapa":
      return { dir: X, v0: -16, v1: 16 };
  }
}

const GLINT_GOLD = new THREE.Color("#f2d896");
const GLINT_LASER = new THREE.Color("#ffd9a0");

export const DUR = {
  reveal: 600,
  stagger: 120,
  agujas: 120,
  cierre: 150,
  hide: 300,
  entrada: 250,
  reduced: 150,
  resweep: 450,
  laser: 500,
  unmount: 100,
} as const;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

type AnimKind = "reveal" | "resweep" | "laser" | "hide" | "fadeIn" | "fadeOut";

interface Anim {
  k: AnimKind;
  t0: number;
  dur: number;
  sweep: Sweep;
  glint: boolean;
}

export interface PartRig {
  id: WatchPart;
  /** El plano de lo real: visible donde n·p + c ≥ 0. */
  plane: THREE.Plane;
  /** El plano del cristal (el negado mientras barre). */
  ghostPlane: THREE.Plane;
  u: PartUniforms;
  ghost: GhostMaterials;
  solids: Set<THREE.Object3D>;
  /** Lo que se ve AHORA. */
  solidOn: boolean;
  ghostOn: boolean;
  /** Lo pedido (la máscara). */
  target: boolean;
  anim: Anim | null;
  /** Momento en que se desmonta el cristal (tras acabar un barrido). */
  unmountAt: number;
}

export interface AssemblyEvents {
  /** Cambió qué cristales están montados. */
  onGhosts?: (on: Readonly<Record<WatchPart, boolean>>) => void;
  /** Acabó una transición (rehornear la sombra de contacto). */
  onSettled?: () => void;
  /** Una pieza empieza a verse real (para la región viva del editor). */
  onReveal?: (p: WatchPart) => void;
}

export class Assembly {
  readonly parts: Record<WatchPart, PartRig>;
  events: AssemblyEvents = {};
  /** La correa está abierta (cambia el sentido del barrido de correa/cierre). */
  abierta = false;
  reduced = false;
  private inited = false;
  private forced = false;

  constructor() {
    const parts = {} as Record<WatchPart, PartRig>;
    for (const id of WATCH_PARTS) {
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), PARK);
      const ghostPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), PARK);
      parts[id] = {
        id,
        plane,
        ghostPlane,
        u: {
          uGlint: { value: 0 },
          uGlintW: { value: 0.6 },
          uGlintColor: { value: (id === "tapa" ? GLINT_LASER : GLINT_GOLD).clone() },
          uFade: { value: 1 },
        },
        ghost: ghostMaterials(ghostPlane),
        solids: new Set(),
        solidOn: true,
        ghostOn: false,
        target: true,
        anim: null,
        unmountAt: 0,
      };
    }
    this.parts = parts;
  }

  /** Registra un objeto real de la pieza (aplica ya su visibilidad). */
  register(p: WatchPart, o: THREE.Object3D): () => void {
    const rig = this.parts[p];
    rig.solids.add(o);
    o.visible = this.forced || rig.solidOn;
    return () => {
      rig.solids.delete(o);
    };
  }

  ghostsMounted(): Record<WatchPart, boolean> {
    const out = {} as Record<WatchPart, boolean>;
    for (const id of WATCH_PARTS) out[id] = this.parts[id].ghostOn;
    return out;
  }

  private setSolid(rig: PartRig, on: boolean) {
    rig.solidOn = on;
    if (this.forced) return;
    rig.solids.forEach((o) => (o.visible = on));
  }

  private park(rig: PartRig) {
    rig.plane.normal.set(0, -1, 0);
    rig.plane.constant = PARK;
    rig.ghostPlane.normal.set(0, 1, 0);
    rig.ghostPlane.constant = PARK;
    rig.u.uGlint.value = 0;
    rig.u.uFade.value = 1;
  }

  /** Pone el plano del barrido en `v` (lo real: d·p ≤ v; el cristal: ≥ v). */
  private sweepTo(rig: PartRig, s: Sweep, v: number) {
    rig.plane.normal.copy(s.dir).negate();
    rig.plane.constant = v;
    rig.ghostPlane.normal.copy(s.dir);
    rig.ghostPlane.constant = -v;
  }

  /** La máscara pedida. Devuelve true si empezó alguna animación. */
  apply(mask: PartMask, mode: Stage3DMode, now: number): boolean {
    if (!this.inited) {
      this.inited = true;
      for (const id of WATCH_PARTS) {
        const rig = this.parts[id];
        rig.target = mask[id];
        rig.anim = null;
        this.park(rig);
        this.setSolid(rig, mask[id]);
        rig.ghostOn = !mask[id];
        rig.ghost.opacity.value = 1;
        rig.ghost.sync();
      }
      this.emitGhosts();
      return false;
    }
    const flip = WATCH_PARTS.filter((id) => this.parts[id].target !== mask[id]);
    if (!flip.length) return false;
    const reveals = flip.filter((id) => mask[id]);
    // Retrasos del escalonado (orden canónico).
    const delay: Partial<Record<WatchPart, number>> = {};
    let slot = 0;
    for (const id of reveals) {
      if (id === "agujas" && delay.esfera !== undefined) delay.agujas = delay.esfera + DUR.agujas;
      else if (id === "cierre" && delay.correa !== undefined) delay.cierre = delay.correa + DUR.cierre;
      else delay[id] = slot++ * DUR.stagger;
    }
    for (const id of flip) {
      const rig = this.parts[id];
      rig.target = mask[id];
      const s = sweepOf(id, this.abierta);
      if (this.reduced || mode === "entrada") {
        const dur = this.reduced ? DUR.reduced : DUR.entrada;
        this.start(rig, { k: mask[id] ? "fadeIn" : "fadeOut", t0: now, dur, sweep: s, glint: false });
      } else if (mask[id]) {
        this.start(rig, { k: "reveal", t0: now + (delay[id] ?? 0), dur: DUR.reveal, sweep: s, glint: true });
      } else {
        this.start(rig, { k: "hide", t0: now, dur: DUR.hide, sweep: s, glint: false });
      }
    }
    this.emitGhosts();
    return true;
  }

  /** Re-barrido de una pieza ya real cuya forma cambió (450 ms). */
  resweep(p: WatchPart, now: number): boolean {
    const rig = this.parts[p];
    if (!rig.target || !this.inited) return false;
    const s = sweepOf(p, this.abierta);
    if (this.reduced) this.start(rig, { k: "fadeIn", t0: now, dur: DUR.reduced, sweep: s, glint: false });
    else this.start(rig, { k: "resweep", t0: now, dur: DUR.resweep, sweep: s, glint: true });
    this.emitGhosts();
    return true;
  }

  /** El láser del grabado (la pieza ya real; sin cristal): 500 ms. Devuelve
   *  false si NO empezó: quien lo pide cambia la textura al instante. */
  laser(p: WatchPart, now: number): boolean {
    const rig = this.parts[p];
    if (!rig.target || this.reduced || !this.inited) return false;
    // Un barrido, re-barrido o fundido en marcha ya enseña la textura nueva
    // (el campo cambió sus mapas antes de pedir el láser). Pisarlo dejaría la
    // pieza sin encender (aún en su retraso) o el cristal montado para siempre.
    if (rig.anim && rig.anim.k !== "laser") return false;
    if (!rig.solidOn) return false;
    this.start(rig, { k: "laser", t0: now, dur: DUR.laser, sweep: sweepOf(p, this.abierta), glint: true });
    return true;
  }

  private start(rig: PartRig, a: Anim) {
    rig.anim = a;
    rig.unmountAt = 0;
    switch (a.k) {
      case "laser":
        this.sweepTo(rig, a.sweep, a.sweep.v0);
        break;
      case "reveal":
      case "resweep":
        // El cristal entero hasta que el plano llegue; lo real recortado.
        rig.ghostOn = true;
        rig.ghost.opacity.value = 1;
        this.sweepTo(rig, a.sweep, a.sweep.v0);
        rig.u.uFade.value = 1;
        // Lo real se enciende cuando el barrido empieza (ver tick).
        if (a.k === "resweep") this.setSolid(rig, true);
        break;
      case "hide":
        rig.ghostOn = true;
        rig.ghost.opacity.value = 0;
        this.park(rig);
        break;
      case "fadeIn":
        rig.ghostOn = true;
        this.park(rig);
        rig.u.uFade.value = 0;
        this.setSolid(rig, true);
        break;
      case "fadeOut":
        rig.ghostOn = true;
        rig.ghost.opacity.value = 0;
        this.park(rig);
        break;
    }
    rig.ghost.sync();
  }

  /** Avanza las animaciones. true = hay que pintar otro fotograma. */
  tick(now: number): boolean {
    let active = false;
    let settled = false;
    let ghostsChanged = false;
    for (const id of WATCH_PARTS) {
      const rig = this.parts[id];
      const a = rig.anim;
      if (!a) {
        if (rig.unmountAt && now >= rig.unmountAt) {
          rig.unmountAt = 0;
          if (rig.target && rig.ghostOn) {
            rig.ghostOn = false;
            ghostsChanged = true;
          }
        } else if (rig.unmountAt) active = true;
        continue;
      }
      active = true;
      if (now < a.t0) continue;
      const t = clamp01((now - a.t0) / a.dur);
      switch (a.k) {
        case "reveal":
        case "resweep": {
          if (!rig.solidOn) {
            this.setSolid(rig, true);
            this.events.onReveal?.(id);
          }
          const e = easeOutCubic(t);
          this.sweepTo(rig, a.sweep, a.sweep.v0 + (a.sweep.v1 - a.sweep.v0) * e);
          rig.u.uGlint.value = a.glint ? 1.6 * (1 - t * t) : 0;
          rig.ghost.opacity.value = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
          break;
        }
        case "laser": {
          const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
          this.sweepTo(rig, a.sweep, a.sweep.v0 + (a.sweep.v1 - a.sweep.v0) * e);
          rig.u.uGlint.value = 1.6 * Math.sin(Math.PI * Math.min(1, t * 1.1));
          break;
        }
        case "hide":
          rig.ghost.opacity.value = easeInOutCubic(t);
          if (t >= 1) this.setSolid(rig, false);
          break;
        case "fadeIn":
          rig.u.uFade.value = t;
          rig.ghost.opacity.value = 1 - t;
          break;
        case "fadeOut":
          rig.u.uFade.value = 1 - t;
          rig.ghost.opacity.value = t;
          if (t >= 1) this.setSolid(rig, false);
          break;
      }
      rig.ghost.sync();
      if (t >= 1) {
        rig.anim = null;
        if (a.k === "laser") {
          this.park(rig);
          // Si el láser entró en los 100 ms de desmontaje de un barrido (start
          // pone unmountAt a 0), el cristal se desmonta ahora.
          if (rig.target && rig.ghostOn) rig.unmountAt = now + DUR.unmount;
        } else if (rig.target) {
          this.park(rig);
          rig.unmountAt = now + DUR.unmount;
        } else {
          this.park(rig);
          rig.u.uFade.value = 1;
          rig.ghost.opacity.value = 1;
          rig.ghost.sync();
        }
        settled = true;
      }
    }
    if (ghostsChanged) this.emitGhosts();
    if (settled) this.events.onSettled?.();
    return active;
  }

  /** ¿Hay algo en marcha (barridos o desmontajes pendientes)? */
  busy(): boolean {
    return WATCH_PARTS.some((id) => this.parts[id].anim || this.parts[id].unmountAt);
  }

  /** Para la foto de estudio: todo real (planos aparcados, sin brillo). Lo
   *  devuelve a su estado al llamar a la función que entrega. */
  forceSolid(): () => void {
    const saved = WATCH_PARTS.map((id) => {
      const r = this.parts[id];
      return {
        r,
        p: r.plane.clone(),
        g: r.ghostPlane.clone(),
        glint: r.u.uGlint.value,
        fade: r.u.uFade.value,
      };
    });
    this.forced = true;
    for (const { r } of saved) {
      r.plane.normal.set(0, -1, 0);
      r.plane.constant = PARK;
      r.u.uGlint.value = 0;
      r.u.uFade.value = 1;
      r.solids.forEach((o) => (o.visible = true));
    }
    return () => {
      this.forced = false;
      for (const s of saved) {
        s.r.plane.copy(s.p);
        s.r.ghostPlane.copy(s.g);
        s.r.u.uGlint.value = s.glint;
        s.r.u.uFade.value = s.fade;
        s.r.solids.forEach((o) => (o.visible = s.r.solidOn));
      }
    };
  }

  /** Para compilar todos los programas una vez: todo visible. */
  showAllForWarmup(): () => void {
    const saved = WATCH_PARTS.map((id) => this.parts[id].solidOn);
    this.forced = true;
    for (const id of WATCH_PARTS) this.parts[id].solids.forEach((o) => (o.visible = true));
    return () => {
      this.forced = false;
      WATCH_PARTS.forEach((id, i) => this.parts[id].solids.forEach((o) => (o.visible = saved[i])));
    };
  }

  private emitGhosts() {
    this.events.onGhosts?.(this.ghostsMounted());
  }

  dispose() {
    for (const id of WATCH_PARTS) this.parts[id].ghost.dispose();
  }
}
