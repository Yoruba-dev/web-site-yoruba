"use client";

// ---------------------------------------------------------------------------
// LA CÁMARA (SPEC §4.5)
//   • FOV 25°. Cada vista encuadra una esfera de radio R alrededor de su
//     objetivo: d = R / sin(min(fovV, fovH)/2) medido en el rectángulo que la
//     interfaz deja LIBRE; la proyección se desplaza (setViewOffset) para que
//     el objetivo caiga en el centro de ese rectángulo. Cambiar los recuadros
//     solo toca la proyección (nada se reconstruye).
//   • Muelles críticamente amortiguados (ω = 7.5 rad/s, ≈ 800 ms) en el
//     acimut (por el camino corto), el ángulo polar, log(distancia) y el
//     objetivo: interrumpibles, conservan la velocidad al cambiar de meta.
//     Con movimiento reducido, corte.
//   • El dedo/ratón: OrbitControls sin desplazamiento, con inercia; la rueda
//     y el pellizco acercan (0.45–1.4 × la distancia de la vista).
//   • Modos: "entrada" gira a 0.15 rad/s (para con un gesto, vuelve tras 6 s
//     quieto; en pausa con la pestaña oculta o el lienzo fuera de pantalla);
//     "editor" quieto; "final" UNA vuelta de 360° en 7 s cuando la cámara y
//     los barridos han terminado (un gesto la cancela).
//   • El primer fotograma usa el encuadre de la esfera a R 30 (casa con el
//     poster de frente) y de ahí va a la vista pedida.
//   • Tocar (< 5 px, < 300 ms) una pieza la elige (real o en cristal); en
//     escritorio, el cursor es una mano sobre una pieza (y el editor enseña
//     su nombre: onPartHover).
// ---------------------------------------------------------------------------
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Stage3DMode, View3D, WatchPart } from "../stage3d-contract";
import type { InsetsSource, Nudge } from "./types";

export const FOV = 25;

export interface ViewDef {
  az: number;
  pol: number;
  target: readonly [number, number, number];
  R: number;
}

/** Tabla de vistas (§4.5): az desde +z hacia +x (la corona), pol desde +y. */
export const VIEWS: Readonly<Record<View3D, ViewDef>> = {
  tres4: { az: 0.62, pol: 1.16, target: [0, -3, -20], R: 46 },
  lado: { az: 1.4, pol: 1.4, target: [0, -1, -27], R: 44 },
  esfera: { az: 0.1, pol: 1.47, target: [0, 0, 1], R: 21 },
  // R 22 como máximo; ver viewRadius (el grabado legible, R1.3).
  tapa: { az: Math.PI, pol: 1.55, target: [0, 0, -7.2], R: 22 },
  cierre: { az: 2.55, pol: 2.05, target: [0, -6, -54], R: 22 },
  // La cara de la correa (PLAN-REALISMO-V3 2.5). R 34 corta la caja por abajo
  // a 1000 × 800; 38 es un punto de partida.
  correa: { az: 0.45, pol: 0.95, target: [0, 8, -12], R: 38 },
};

const W_MUELLE = 7.5;
const POL_MIN = 0.15;
const POL_MAX = Math.PI - 0.15;
const TURNTABLE = 0.15;
const SHOWCASE_MS = 7000;

/** Distancia que encuadra una esfera de radio R en el rectángulo libre. */
export function fitDistance(R: number, W: number, H: number, ins: { top: number; right: number; bottom: number; left: number }): number {
  const wu = Math.max(40, W - ins.left - ins.right);
  const hu = Math.max(40, H - ins.top - ins.bottom);
  const t = Math.tan(((FOV / 2) * Math.PI) / 180) * (Math.min(wu, hu) / Math.max(1, H));
  return R / Math.sin(Math.atan(t));
}

/** Altura de una mayúscula del grabado de la tapa (mm) y lo que debe medir
 *  en pantalla (SPEC §2 R1.3: ≥ 24 px en escritorio, ≥ 16 px en el móvil). */
const CAP_MM = 1.4;
const CAP_PX = { fino: 24, tactil: 16 } as const;
/** El campo grabado (Ø25.2) con aire: el radio mínimo del encuadre de la tapa. */
const TAPA_R_MIN = 13.5;

/** Radio de encuadre de una vista. La tapa se acerca lo justo para que el
 *  grabado se lea (R1.3) sin cortar el campo: R = clamp(R_letra, 13.5, 22).
 *  El resto, el de la tabla. */
export function viewRadius(
  v: View3D,
  W: number,
  H: number,
  ins: { top: number; right: number; bottom: number; left: number },
  coarse: boolean,
): number {
  const R = VIEWS[v].R;
  if (v !== "tapa") return R;
  const pxmm = (coarse ? CAP_PX.tactil : CAP_PX.fino) / CAP_MM;
  const tan = Math.tan(((FOV / 2) * Math.PI) / 180);
  const d = Math.max(1, H) / (2 * pxmm * tan);
  const m = Math.min(Math.max(40, W - ins.left - ins.right), Math.max(40, H - ins.top - ins.bottom));
  const Rl = d * Math.sin(Math.atan((tan * m) / Math.max(1, H)));
  return Math.max(TAPA_R_MIN, Math.min(R, Rl));
}

/** Muelle críticamente amortiguado (solución cerrada: estable con cualquier dt). */
class Spring {
  x = 0;
  v = 0;
  g = 0;
  step(dt: number) {
    const e = this.x - this.g;
    const c = this.v + W_MUELLE * e;
    const k = Math.exp(-W_MUELLE * dt);
    this.x = this.g + (e + c * dt) * k;
    this.v = (c - W_MUELLE * (e + c * dt)) * k;
  }
  settled(eps: number) {
    return Math.abs(this.x - this.g) < eps && Math.abs(this.v) < eps * 4;
  }
  snap() {
    this.x = this.g;
    this.v = 0;
  }
}

const wrap = (a: number) => {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export interface CameraRigProps {
  view: View3D;
  viewSeq: number;
  mode: Stage3DMode;
  active: boolean;
  insets: InsetsSource;
  nudge: Nudge;
  reduced: boolean;
  coarse: boolean;
  /** ¿Algo del reloj sigue animándose? (la vuelta de "Listo" espera). */
  busy: () => boolean;
  /** Raíz del modelo (para tocar piezas). */
  model: React.RefObject<THREE.Object3D | null>;
  onInteract?: () => void;
  onPartPick?: (p: WatchPart) => void;
  onPartHover?: (p: WatchPart | null, x: number, y: number) => void;
  /** Hay movimiento seguido (para medir el rendimiento). */
  onActive?: (on: boolean) => void;
}

export function CameraRig({
  view,
  viewSeq,
  mode,
  active,
  insets,
  nudge,
  reduced,
  coarse,
  busy,
  model,
  onInteract,
  onPartPick,
  onPartHover,
  onActive,
}: CameraRigProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<OrbitControlsImpl>(null);

  const st = useRef({
    az: new Spring(),
    pol: new Spring(),
    logD: new Spring(),
    tx: new Spring(),
    ty: new Spring(),
    tz: new Spring(),
    springing: false,
    /** Distancia de encaje de la vista actual (para el zoom 0.45–1.4×). */
    fit: 100,
    view: view as View3D,
    gesture: false,
    lastGesture: -1e9,
    turning: false,
    showcase: null as null | { t0: number; az0: number },
    pendingShowcase: false,
    visible: true,
    moving: false,
  }).current;
  const springs = [st.az, st.pol, st.logD, st.tx, st.ty, st.tz];

  const setMoving = (on: boolean) => {
    if (st.moving === on) return;
    st.moving = on;
    onActive?.(on);
  };

  // — Leer / escribir la cámara en esféricas ————————————————————————————
  const target = () => (controls.current ? controls.current.target : new THREE.Vector3(...VIEWS[st.view].target));
  const readCamera = () => {
    const t = target();
    const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(t));
    return { az: s.theta, pol: s.phi, d: s.radius, t: t.clone() };
  };
  const writeCamera = (az: number, pol: number, d: number, tx: number, ty: number, tz: number) => {
    const t = target();
    t.set(tx, ty, tz);
    camera.position.set(tx, ty, tz).add(new THREE.Vector3().setFromSphericalCoords(d, Math.max(POL_MIN, Math.min(POL_MAX, pol)), az));
    camera.lookAt(t);
    camera.updateMatrixWorld();
  };
  const fromSprings = () => writeCamera(st.az.x, st.pol.x, Math.exp(st.logD.x), st.tx.x, st.ty.x, st.tz.x);

  /** Carga el estado actual de la cámara en los muelles (velocidad 0 si no
   *  venían moviéndose). */
  const loadSprings = () => {
    if (st.springing) return;
    const c = readCamera();
    st.az.x = c.az;
    st.pol.x = c.pol;
    st.logD.x = Math.log(c.d);
    st.tx.x = c.t.x;
    st.ty.x = c.t.y;
    st.tz.x = c.t.z;
    springs.forEach((s) => (s.v = 0));
  };

  const limits = () => {
    const c = controls.current;
    if (!c) return;
    const d = camera.position.distanceTo(c.target);
    c.minDistance = Math.min(st.fit * 0.45, d);
    c.maxDistance = Math.max(st.fit * 1.4, d);
  };

  /** Cortar la inercia de OrbitControls antes de que mande un muelle. */
  const killInertia = () => {
    const c = controls.current;
    if (!c) return;
    const damp = c.enableDamping;
    c.enableDamping = false;
    c.update();
    c.enableDamping = damp;
  };

  /** El encaje con el que se midió el último reencuadre (ver refit). */
  const lastFit = useRef<number | null>(null);

  const goTo = (v: View3D, opts: { cut?: boolean; fromR?: number } = {}) => {
    const def = VIEWS[v];
    const ins = insets.get();
    st.view = v;
    st.fit = fitDistance(viewRadius(v, size.width, size.height, ins, coarse), size.width, size.height, ins);
    // refit escala por nf/prev: prev tiene que ser el encaje de ESTA vista.
    // Con el de la anterior, el siguiente cambio de recuadros o de tamaño
    // multiplicaría la distancia por R_nueva/R_vieja (la esfera desbordada,
    // la correa diminuta).
    lastFit.current = st.fit;
    killInertia();
    loadSprings();
    st.az.g = st.az.x + wrap(def.az - st.az.x);
    st.pol.g = def.pol;
    st.logD.g = Math.log(st.fit);
    [st.tx.g, st.ty.g, st.tz.g] = def.target;
    st.showcase = null;
    if (opts.cut || reduced) {
      springs.forEach((s) => s.snap());
      st.springing = false;
      fromSprings();
    } else {
      st.springing = true;
      setMoving(true);
    }
    limits();
    invalidate();
  };

  // — Proyección desplazada al rectángulo libre ————————————————————————
  const applyOffset = () => {
    const ins = insets.get();
    const W = Math.max(1, size.width);
    const H = Math.max(1, size.height);
    camera.setViewOffset(W, H, (ins.right - ins.left) / 2, (ins.bottom - ins.top) / 2, W, H);
    camera.updateProjectionMatrix();
  };
  useLayoutEffect(() => {
    const refit = () => {
      applyOffset();
      const ins = insets.get();
      const nf = fitDistance(viewRadius(st.view, size.width, size.height, ins, coarse), size.width, size.height, ins);
      const prev = lastFit.current;
      lastFit.current = nf;
      if (prev && Math.abs(nf - prev) > 1e-3) {
        // Mismo zoom relativo con el nuevo rectángulo (sin animación).
        const k = nf / prev;
        st.fit = nf;
        if (st.springing) {
          st.logD.g += Math.log(k);
          st.logD.x += Math.log(k);
        } else {
          const c = readCamera();
          writeCamera(c.az, c.pol, c.d * k, c.t.x, c.t.y, c.t.z);
        }
        limits();
      }
      invalidate();
    };
    refit();
    return insets.subscribe(refit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insets, size.width, size.height]);

  // — Primer encuadre: la esfera a R 30, luego la vista pedida ———————————
  const first = useRef(true);
  useLayoutEffect(() => {
    if (!first.current) return;
    first.current = false;
    const e = VIEWS.esfera;
    const d0 = fitDistance(30, size.width, size.height, insets.get());
    writeCamera(e.az, e.pol, d0, ...e.target);
    if (controls.current) controls.current.target.set(...e.target);
    goTo(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // — Vista pedida (cada viewSeq, aunque se repita) ——————————————————————
  const lastSeq = useRef(viewSeq);
  useEffect(() => {
    if (viewSeq === lastSeq.current) return;
    lastSeq.current = viewSeq;
    goTo(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewSeq, view]);

  // — Modo ————————————————————————————————————————————————————————————
  useEffect(() => {
    st.pendingShowcase = mode === "final" && !reduced;
    if (mode !== "final") st.showcase = null;
    st.lastGesture = -1e9;
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reduced]);

  // — Teclado: un paso por el muelle ————————————————————————————————————
  const lastNudge = useRef(nudge.seq);
  useEffect(() => {
    if (nudge.seq === lastNudge.current) return;
    lastNudge.current = nudge.seq;
    killInertia();
    loadSprings();
    st.az.g = (st.springing ? st.az.g : st.az.x) + nudge.az;
    st.pol.g = Math.max(POL_MIN, Math.min(POL_MAX, (st.springing ? st.pol.g : st.pol.x) + nudge.pol));
    const d = Math.exp(st.springing ? st.logD.g : st.logD.x) * nudge.zoom;
    st.logD.g = Math.log(Math.max(st.fit * 0.45, Math.min(st.fit * 1.4, d)));
    if (!st.springing) [st.tx.g, st.ty.g, st.tz.g] = [st.tx.x, st.ty.x, st.tz.x];
    st.showcase = null;
    st.lastGesture = performance.now();
    if (reduced) {
      springs.forEach((s) => s.snap());
      fromSprings();
    } else {
      st.springing = true;
      setMoving(true);
    }
    limits();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nudge.seq]);

  // — Gestos (OrbitControls) ————————————————————————————————————————————
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    let t = 0;
    const start = () => {
      st.springing = false;
      st.showcase = null;
      st.pendingShowcase = false;
      st.gesture = true;
      st.lastGesture = performance.now();
      window.clearTimeout(t);
      setMoving(true);
      onInteract?.();
    };
    const end = () => {
      st.gesture = false;
      st.lastGesture = performance.now();
      t = window.setTimeout(() => !st.gesture && !st.springing && setMoving(false), 900);
    };
    c.addEventListener("start", start);
    c.addEventListener("end", end);
    return () => {
      window.clearTimeout(t);
      c.removeEventListener("start", start);
      c.removeEventListener("end", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onInteract]);

  // — Pausa del giro: pestaña oculta o lienzo fuera de pantalla ——————————
  useEffect(() => {
    const el = gl.domElement;
    const vis = () => {
      st.visible = !document.hidden;
      invalidate();
    };
    document.addEventListener("visibilitychange", vis);
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((es) => {
        st.visible = !document.hidden && es.some((e) => e.isIntersecting);
        invalidate();
      });
      io.observe(el);
    }
    return () => {
      document.removeEventListener("visibilitychange", vis);
      io?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  // — Tocar una pieza (y la mano sobre ella en escritorio) ————————————————
  useEffect(() => {
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    ray.layers.enableAll();
    const ndc = new THREE.Vector2();
    const pick = (cx: number, cy: number): WatchPart | null => {
      const root = model.current;
      if (!root) return null;
      const r = el.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObject(root, true);
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object;
        while (o && !o.userData.part) o = o.parent;
        if (o && (o.visible || o.layers.isEnabled(1))) return o.userData.part as WatchPart;
      }
      return null;
    };
    let down: { x: number; y: number; t: number } | null = null;
    // La última pieza avisada: "ninguna" se avisa una sola vez.
    let sobre: WatchPart | null = null;
    const avisar = (p: WatchPart | null, x = 0, y = 0) => {
      if (!p && !sobre) return;
      sobre = p;
      onPartHover?.(p, x, y);
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      avisar(null);
    };
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d || !onPartPick) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) >= 5 || performance.now() - d.t >= 300) return;
      const p = pick(e.clientX, e.clientY);
      if (p) onPartPick(p);
    };
    let last = 0;
    const onMove = (e: PointerEvent) => {
      if (coarse || e.buttons || e.pointerType !== "mouse" || !onPartPick) return;
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      const p = pick(e.clientX, e.clientY);
      el.style.cursor = p ? "pointer" : "";
      avisar(p, e.clientX, e.clientY);
    };
    const onLeave = () => {
      el.style.cursor = "";
      avisar(null);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      avisar(null);
    };
  }, [gl, camera, model, coarse, onPartPick, onPartHover]);

  // — El bucle ————————————————————————————————————————————————————————
  useFrame((_, delta) => {
    if (!active) return;
    const dt = Math.min(0.05, delta);
    const now = performance.now();
    let more = false;
    if (st.springing) {
      springs.forEach((s) => s.step(dt));
      fromSprings();
      const done = st.az.settled(1e-4) && st.pol.settled(1e-4) && st.logD.settled(1e-4) && st.tx.settled(1e-3) && st.ty.settled(1e-3) && st.tz.settled(1e-3);
      if (done) {
        springs.forEach((s) => s.snap());
        fromSprings();
        st.springing = false;
        if (!st.gesture) setMoving(false);
      } else more = true;
      limits();
    }
    // Giro de la entrada.
    const idle = !st.gesture && now - st.lastGesture > 6000;
    const turn = mode === "entrada" && !reduced && st.visible && idle && !st.springing;
    if (turn) {
      const c = readCamera();
      writeCamera(c.az + TURNTABLE * dt, c.pol, c.d, c.t.x, c.t.y, c.t.z);
      more = true;
    }
    if (turn !== st.turning) {
      st.turning = turn;
      setMoving(turn || st.springing || st.gesture);
    }
    // La vuelta de "Listo": cuando todo ha parado.
    if (st.pendingShowcase && !st.springing && !st.gesture && !busy() && st.visible) {
      st.pendingShowcase = false;
      st.showcase = { t0: now, az0: readCamera().az };
      setMoving(true);
    }
    if (st.showcase) {
      const k = Math.min(1, (now - st.showcase.t0) / SHOWCASE_MS);
      const c = readCamera();
      writeCamera(st.showcase.az0 + Math.PI * 2 * easeInOutSine(k), c.pol, c.d, c.t.x, c.t.y, c.t.z);
      if (k >= 1) {
        st.showcase = null;
        setMoving(false);
      } else more = true;
    }
    if (st.pendingShowcase) more = true;
    if (more) invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableZoom
      enableDamping
      dampingFactor={0.09}
      rotateSpeed={coarse ? 0.9 : 0.7}
      zoomSpeed={0.6}
      minPolarAngle={POL_MIN}
      maxPolarAngle={POL_MAX}
    />
  );
}
