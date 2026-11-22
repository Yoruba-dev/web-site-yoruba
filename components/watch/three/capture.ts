// ---------------------------------------------------------------------------
// LA FOTO DE ESTUDIO (handle.capture, SPEC §4.10 / A8)
//   • TODAS las piezas reales (ignora la máscara: planos aparcados, sin
//     brillo), correa CERRADA salvo en 'tapa' (abierta); la cámara de la foto
//     ve solo la capa 0 (el cristal no sale).
//   • Cada panel: la vista encuadrada en un cuadrado, supermuestreo de N
//     pasadas desplazadas un subpíxel (como SSAARenderPass: 8 en escritorio,
//     4 en táctil) promediadas sobre un fondo de estudio más claro (ahí se ve
//     la sombra de contacto, rehorneada para la foto).
//   • Un panel por tarea (entre paneles se cede el hilo): ninguna tarea
//     bloquea más de lo que cuesta un panel. Dentro de la tarea se restaura el
//     tamaño del lienzo antes de ceder, así que nunca se ve un lienzo a medias.
//   • Todo vuelve a su estado (pose, máscara, sombra, tamaño) aunque falle.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import type { CaptureOptions, View3D } from "../stage3d-contract";
import { FOV, VIEWS, fitDistance } from "./camera";
import type { PoseDriver } from "./pose";
import type { Assembly } from "./reveal";
import type { ShadowHandle } from "./shadow";

/** Desplazamientos de subpíxel (1/16 px) de SSAARenderPass, niveles 2 y 3. */
const JITTER: Readonly<Record<1 | 4 | 8, readonly [number, number][]>> = {
  1: [[0, 0]],
  4: [
    [-2, -6],
    [6, -2],
    [-6, 2],
    [2, 6],
  ],
  8: [
    [1, -3],
    [-1, 3],
    [5, 1],
    [-3, -5],
    [-5, 5],
    [-7, -1],
    [3, 7],
    [7, -7],
  ],
};

/** Fondo de estudio de la foto: cálido, suelo que se oscurece y viñeta. */
function paintBackdrop(ctx: CanvasRenderingContext2D, x: number, w: number, h: number, noche: boolean) {
  if (noche) {
    const g = ctx.createRadialGradient(x + w / 2, h * 0.42, 0, x + w / 2, h * 0.42, Math.max(w, h) * 0.75);
    g.addColorStop(0, "#0d1712");
    g.addColorStop(1, "#020403");
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, h);
    return;
  }
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, "#3b342c");
  v.addColorStop(0.62, "#6f665b");
  v.addColorStop(0.8, "#5d554b");
  v.addColorStop(1, "#2c2620");
  ctx.fillStyle = v;
  ctx.fillRect(x, 0, w, h);
  const r = ctx.createRadialGradient(x + w / 2, h * 0.5, w * 0.25, x + w / 2, h * 0.5, w * 0.78);
  r.addColorStop(0, "rgba(0,0,0,0)");
  r.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = r;
  ctx.fillRect(x, 0, w, h);
}

const nextTask = () => new Promise<void>((res) => setTimeout(res, 0));

export interface CaptureDeps {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  /** Tamaño actual del lienzo (px CSS). */
  size: () => { width: number; height: number };
  asm: Assembly;
  pose: PoseDriver;
  shadow: ShadowHandle | null;
  noche: boolean;
  coarse: boolean;
  invalidate: () => void;
}

/** Margen alrededor de la esfera de encuadre en la foto (algo más holgada que
 *  el visor: el reloj entero con su sombra). */
const MARGIN: Readonly<Record<View3D, number>> = { tres4: 1.08, lado: 1.08, esfera: 1.12, tapa: 1.15, cierre: 1.1 };

export async function captureStudio(d: CaptureDeps, opts: CaptureOptions = {}): Promise<Blob | null> {
  const views = opts.views?.length ? opts.views : (["tres4", "tapa"] as const);
  const max = Math.min(d.gl.capabilities.maxTextureSize, 4096);
  const P = Math.max(64, Math.min(opts.size ?? (d.coarse ? 1200 : 1600), max));
  const jitter = JITTER[opts.ssaa ?? (d.coarse ? 4 : 8)];
  const quality = opts.quality ?? 0.92;
  const out = document.createElement("canvas");
  out.width = P * views.length;
  out.height = P;
  const ctx = out.getContext("2d");
  const tmp = document.createElement("canvas");
  tmp.width = tmp.height = P;
  const tctx = tmp.getContext("2d");
  if (!ctx || !tctx) return null;
  const { gl, scene, pose, asm, shadow } = d;
  const prevRatio = gl.getPixelRatio();
  const poseT = pose.t;
  const cam = new THREE.PerspectiveCamera(FOV, 1, 5, 2000);
  // La cámara de la foto ve SOLO la capa 0 (sin cristal).
  cam.layers.set(0);
  try {
    for (let panel = 0; panel < views.length; panel++) {
      const v = views[panel];
      const restoreMask = asm.forceSolid();
      try {
        const open = v === "tapa";
        pose.applyPose(open ? 1 : 0);
        shadow?.setFade(open ? 0 : 1);
        if (!open) shadow?.bakeNow();
        gl.setPixelRatio(1);
        gl.setSize(P, P, false);
        const def = VIEWS[v];
        const dist = fitDistance(def.R, P, P, { top: 0, right: 0, bottom: 0, left: 0 }) * MARGIN[v];
        const t = new THREE.Vector3(...def.target);
        cam.position.copy(t).add(new THREE.Vector3().setFromSphericalCoords(dist, def.pol, def.az));
        cam.lookAt(t);
        paintBackdrop(ctx, panel * P, P, P, d.noche);
        jitter.forEach(([jx, jy], i) => {
          cam.setViewOffset(P, P, jx / 16, jy / 16, P, P);
          cam.updateProjectionMatrix();
          gl.setRenderTarget(null);
          gl.render(scene, cam);
          tctx.globalAlpha = 1;
          tctx.clearRect(0, 0, P, P);
          paintBackdrop(tctx, 0, P, P, d.noche);
          tctx.drawImage(gl.domElement, 0, 0);
          ctx.globalAlpha = 1 / (i + 1);
          ctx.drawImage(tmp, panel * P, 0);
        });
        ctx.globalAlpha = 1;
      } finally {
        // Estado del visor de vuelta ANTES de ceder el hilo.
        restoreMask();
        pose.applyPose(poseT);
        shadow?.setFade(1 - Math.min(1, poseT / 0.4));
        gl.setPixelRatio(prevRatio);
        gl.setSize(d.size().width, d.size().height, false);
        shadow?.request();
        d.invalidate();
      }
      if (panel + 1 < views.length) await nextTask();
    }
  } catch (err) {
    console.error("[reloj 3D] foto", err);
    return null;
  }
  return new Promise((res) => out.toBlob((b) => res(b), "image/jpeg", quality));
}
