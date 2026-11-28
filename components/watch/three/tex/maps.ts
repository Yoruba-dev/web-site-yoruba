// ---------------------------------------------------------------------------
// TEXTURAS PINTADAS EN EL NAVEGADOR — sin descargas: todo sale de las
// primitivas del reloj (lib/watch-art.ts) y de las capas fotográficas que el
// compositor ya usa.
//
//   dialTextures      esfera: foto del disco sol (capas/esfera-<color>) + la
//                     impresión exacta (texto en curvas) + sombras de los
//                     índices, el aplique y las agujas (la luz principal está
//                     fija arriba a la izquierda, como en el compositor);
//                     rugosidad/metal y dirección del cepillado sol.
//   casebackTextures  tapa: el grabado láser escarchado (color + una textura
//                     con relieve en R y rugosidad en G), derecho y sin
//                     espejo mirando por detrás.
//   radialAniso       dirección del cepillado radial (anillo de la tapa).
//   brushStreaks      veta del cepillado lineal (tinte y rugosidad).
//   dateWheel         el disco de fecha con su "8".
//   crocoMaps         grabado cocodrilo + pespunte de la piel.
//
// Espacios de color: los mapas de color van en sRGB; rugosidad, metal,
// relieve, normales y anisotropía en NoColorSpace (lineal, sin conversión).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import {
  DIAL_LAYOUT,
  HANDS,
  dialPrimitives,
  casebackPrimitives,
  handAngles,
  handOutline,
  handPose,
  polyPath,
  type Primitive,
  type RectPrim,
  type SwordHand,
} from "@/lib/watch-art";
import {
  DIAL_BASES,
  WATCH_COLORS,
  WATCH_SPECS,
  contrastRatio,
  dialColorAt,
  getDialBase,
  type FinishId,
  type WatchConfig,
} from "@/lib/watch";
import { PLANTILLA } from "@/lib/watch-capas";
import { FINISH_TONE, type BrushVeta } from "../materials";
import { castShadow, mmCanvas, paintPrimitives, rng, type MmCanvas, type Paint } from "./paint";

/** Lado (mm) del canvas de la esfera: el disco de Ø30.5. */
export const DIAL_SPAN = DIAL_LAYOUT.r * 2;
/** Radio (mm) del campo de la tapa en 3D (disco liso donde va el grabado). */
export const CASEBACK_FIELD_R = 12.6;

/** Pinta cada primitiva (relleno o trazo, la que tenga) de un solo color. */
function solid(color: string): Paint {
  return (p, kind) => {
    const v = kind === "fill" ? p.fill : p.stroke;
    return v && v !== "none" ? color : null;
  };
}

/** "#rrggbb" → { r, g, b } en sRGB 0…1 (sin pasar a lineal). */
function srgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
}

function canvasTexture(canvas: HTMLCanvasElement, color: boolean, maxAniso: number): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = maxAniso;
  t.needsUpdate = true;
  return t;
}

// ===========================================================================
// Cepillado
// ===========================================================================
/** Dirección TANGENCIAL (estiramiento del brillo) para un cepillado radial,
 *  centrada: RG = dirección en el espacio tangente (u, v), B = intensidad. */
function paintRadialField(m: MmCanvas, strength = 1): void {
  const { ctx, size, k } = m;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const c = size / 2;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5 - c) / k;
      const yDown = (py + 0.5 - c) / k;
      const r = Math.hypot(x, yDown) || 1e-6;
      // Tangente en (x, y_arriba): (−y_arriba, x)/r = (y_abajo, x)/r.
      const i = (py * size + px) * 4;
      d[i] = Math.round(127.5 + 127.5 * (yDown / r));
      d[i + 1] = Math.round(127.5 + 127.5 * (x / r));
      // Cerca del centro el sol no tiene dirección: se apaga suavemente.
      d[i + 2] = Math.round(255 * strength * Math.min(1, r / 0.6));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function radialAniso(maxAniso: number, size = 512): THREE.CanvasTexture {
  const m = mmCanvas(size, 48);
  paintRadialField(m);
  const t = canvasTexture(m.canvas, false, maxAniso);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** La veta del cepillado lineal (PLAN-REALISMO-V3 1.5). Con la de antes
 *  (rugosidad ±11 %, 0.04 mm de ancho) el contraste era de 0.02–0.08 %: no se
 *  veía. La real mide 2–7 % (refs 2, 8, 16, 19 y c03, c12). */
export const VETA = {
  /** mm que cubre el lienzo a través y a lo largo, y sus píxeles. */
  across: 16,
  along: 24,
  w: 1024,
  h: 256,
  /** Octavas: ancho y largo (mm) de la veta, y su peso (suman 1). */
  octavas: [
    [0.05, 4, 0.45],
    [0.15, 7, 0.35],
    [0.35, 12, 0.2],
  ],
  /** Tinte = 1 − A + A·v (v de −1 a 1). Más suave en correa y cierre: con 0.20
   *  el plegable oro rosa parecía madera. */
  tinte: { caja: 0.2, banda: 0.1 },
  /** Rugosidad media (en la caja, 0.88 + 0.22·v). */
  rug: 0.88,
} as const;

export interface Vetas {
  caja: BrushVeta;
  banda: BrushVeta;
  dispose(): void;
}

/** Vetas a lo largo de v (UV en mm): ruido de valor periódico en tres octavas.
 *  UNA textura por juego, para el tinte y la rugosidad: 0.88 + 0.22·v es
 *  1.1 × (0.8 + 0.2·v), o sea el tinte de la caja con la rugosidad del
 *  material × 1.1 (en la banda, × 0.978: su rugosidad varía la mitad, porque
 *  en el plegable la veta salía al 7–11 %; así, 4–7 %, como c03).
 *  El color del material sube 1/(1 − A): la media del tinte es 1 − A y la de
 *  la pieza tiene que seguir siendo FINISH_TONE. */
export function brushStreaks(maxAniso: number): Vetas {
  const { w: W, h: H } = VETA;
  const r = rng(11);
  const f = new Float32Array(W * H);
  for (const [ancho, largo, peso] of VETA.octavas) {
    const cx = Math.round(VETA.across / ancho);
    const ca = Math.max(2, Math.round(VETA.along / largo));
    const g = Float32Array.from({ length: cx * ca }, () => r() * 2 - 1);
    // Cada veta arranca en un punto distinto: las puntas no se alinean.
    const desfase = Float32Array.from({ length: cx }, () => r() * ca);
    const col = new Float32Array(cx);
    for (let y = 0; y < H; y++) {
      for (let i = 0; i < cx; i++) {
        const q = (y / H) * ca + desfase[i];
        const q0 = Math.floor(q);
        const t = q - q0;
        const u = t * t * (3 - 2 * t);
        col[i] = g[(q0 % ca) * cx + i] * (1 - u) + g[((q0 + 1) % ca) * cx + i] * u;
      }
      for (let x = 0; x < W; x++) {
        const fx = (x / W) * cx;
        const x0 = Math.floor(fx);
        const tx = fx - x0;
        f[y * W + x] += peso * (col[x0] * (1 - tx) + col[(x0 + 1) % cx] * tx);
      }
    }
  }
  const tinte = (A: number): THREE.CanvasTexture => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D no disponible");
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < f.length; i++) {
      const v = Math.round(255 * Math.max(0, Math.min(1, 1 - A + A * f[i])));
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = canvasTexture(canvas, false, maxAniso);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / VETA.across, 1 / VETA.along);
    return t;
  };
  const veta = (A: number): BrushVeta => ({ map: tinte(A), colorGain: 1 / (1 - A), roughGain: VETA.rug / (1 - A) });
  const caja = veta(VETA.tinte.caja);
  const banda = veta(VETA.tinte.banda);
  return {
    caja,
    banda,
    dispose() {
      caja.map.dispose();
      banda.map.dispose();
    },
  };
}

// ===========================================================================
// Esfera
// ===========================================================================
/** Mediana medida de cada disco sol (capas/esfera-<id>-1200.webp, r < 13 mm):
 *  se mezcla MUY poco con la foto (8 %), solo para suavizar el brillo
 *  horneado del estudio. Con más (antes 40 %) la esfera perdía saturación y
 *  el verde de Orula se veía salvia. */
const DIAL_PHOTO_TONE: Readonly<Record<string, string>> = {
  blanco: "#edece5",
  negro: "#161618",
  rojo: "#980e16",
  verde: "#10532c",
  azul: "#123078",
  amarillo: "#d8aa1f",
};

/** Rugosidad y metal de la esfera (laca sobre cepillado sol) y de la tinta. */
const DIAL_ROUGH = 0.4;
const DIAL_METAL = 0.22;
const INK_ROUGH = 0.78;
const INK_METAL = 0;

/** Altura (mm) sobre la esfera de lo que proyecta sombra, para hornearla. */
const SHADOW_H = { aplicado: 0.45, marco: 0.3, aplique: 0.35, hora: 0.95, minuto: 1.2, segundo: 1.45 } as const;
/** Hacia dónde cae la sombra (luz arriba a la izquierda). */
const SHADOW_DIR = [0.55, 0.84] as const;

function shadowOf(h: number, alpha: number) {
  return { blur: 0.06 + h * 0.22, dx: SHADOW_DIR[0] * h * 0.4, dy: SHADOW_DIR[1] * h * 0.4, alpha };
}

/** Silueta (mm, y abajo) de una aguja de espada apuntando a las 12: hoja,
 *  cuello y buje, en una sola figura (la sombra no se suma donde se cruzan). */
function handShape(b: SwordHand): Path2D {
  const p = new Path2D(polyPath(handOutline(b)));
  p.moveTo(b.hubR, 0);
  // Antihorario, como el contorno: con "nonzero" el cruce no deja un hueco.
  p.arc(0, 0, b.hubR, 0, Math.PI * 2, true);
  p.closePath();
  return p;
}

/** Proporción del dibujo dentro de logo-py-*.webp (el arte va de x 14 a 498). */
export const LOGO_ART_ASPECT = (498 - 14) / 512;

/** El hueco del aplique PY (mm, y abajo) y el lado del cuadrado de la imagen. */
export function appliqueBox(c: WatchConfig): { cx: number; cy: number; side: number } | null {
  const slot = dialPrimitives(c).find((x): x is RectPrim => x.kind === "rect" && x.id === "aplique");
  if (!slot) return null;
  const side = Math.min(slot.h, slot.w / LOGO_ART_ASPECT);
  return { cx: slot.x + slot.w / 2, cy: slot.y + slot.h / 2, side };
}

export interface DialTextures {
  map: THREE.CanvasTexture;
  orm: THREE.CanvasTexture;
  aniso: THREE.CanvasTexture;
  dispose(): void;
}

export function dialTextures(
  c: WatchConfig,
  imgs: { photo: HTMLImageElement | null; logo: HTMLImageElement | null },
  size: number,
  maxAniso: number,
): DialTextures {
  const prims = dialPrimitives(c);
  const base = getDialBase(c.esfera.base) ?? DIAL_BASES[0];
  const baseHex = WATCH_COLORS[base.color].hex;
  const impresion = prims.filter((p) => p.capa === "impresion");
  const baseExtra = prims.filter((p) => p.capa === "base" && p.id !== "esfera");
  const S = DIAL_SPAN;

  // — Color ———————————————————————————————————————————————————————————
  const m = mmCanvas(size, S);
  const { ctx } = m;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, S / 2, 0, Math.PI * 2);
  ctx.clip();
  if (base.degradado) {
    // Respaldo bajo la foto: el mismo degradado (dialColorAt), por si tarda.
    const R = WATCH_SPECS.dialMm / 2;
    const lg = ctx.createLinearGradient(0, -R, 0, R);
    for (let i = 0; i <= 8; i++) lg.addColorStop(i / 8, dialColorAt(c.esfera, -R + (2 * R * i) / 8));
    ctx.fillStyle = lg;
  } else {
    ctx.fillStyle = baseHex;
  }
  ctx.fillRect(-S / 2, -S / 2, S, S);
  // La foto del disco sol: R_ESFERA px alrededor del centro de la plantilla.
  if (imgs.photo) {
    const k = imgs.photo.naturalWidth / PLANTILLA.W;
    const R = PLANTILLA.R_ESFERA * k;
    ctx.drawImage(imgs.photo, PLANTILLA.CX * k - R, PLANTILLA.CY * k - R, 2 * R, 2 * R, -S / 2, -S / 2, S, S);
  }
  const tone = DIAL_PHOTO_TONE[base.id];
  if (tone && imgs.photo) {
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = tone;
    ctx.fillRect(-S / 2, -S / 2, S, S);
    ctx.globalAlpha = 1;
  }
  paintPrimitives(ctx, baseExtra);
  paintPrimitives(ctx, impresion);

  // Sombras horneadas (la pieza real está encima, en 3D).
  // Sobre una esfera clara la sombra se nota mucho más: más suave.
  // (En un degradado cuenta el color del centro.)
  const dark = base.degradado
    ? contrastRatio(dialColorAt(c.esfera, 0), "#000000") < 6
    : base.id === "negro" || base.id === "verde" || base.id === "azul";
  const lumeAlpha = dark ? 0.5 : 0.3;
  const handAlpha = dark ? 0.42 : 0.24;
  for (const p of prims) {
    // El embudo de la fecha queda dentro de su banda: no proyecta.
    if (p.capa !== "aplicado" || p.id === "aplique" || p.id === "embudo-fecha") continue;
    castShadow(m, shadowOf(p.id === "marco-fecha" ? SHADOW_H.marco : SHADOW_H.aplicado, lumeAlpha), (cx) => shadowShape(cx, p));
  }
  const box = appliqueBox(c);
  const logo = imgs.logo;
  if (box && logo) {
    castShadow(m, shadowOf(SHADOW_H.aplique, lumeAlpha), (cx) => {
      const art = box.side;
      cx.drawImage(logo, box.cx - art / 2, box.cy - art / 2, art, art);
    });
  }
  const ang = handAngles(handPose(c));
  const rot = (deg: number, draw: (cx: CanvasRenderingContext2D) => void) => (cx: CanvasRenderingContext2D) => {
    cx.save();
    cx.rotate((deg * Math.PI) / 180);
    draw(cx);
    cx.restore();
  };
  castShadow(m, shadowOf(SHADOW_H.hora, handAlpha), rot(ang.hour, (cx) => cx.fill(handShape(HANDS.hour))));
  castShadow(m, shadowOf(SHADOW_H.minuto, handAlpha * 0.95), rot(ang.minute, (cx) => cx.fill(handShape(HANDS.minute))));
  const Sx = HANDS.seconds;
  castShadow(
    m,
    shadowOf(SHADOW_H.segundo, handAlpha * 0.85),
    rot(ang.seconds, (cx) => {
      cx.fillRect(-Sx.halfW, -(Sx.tip - Sx.head.len), Sx.halfW * 2, Sx.tip - Sx.head.len + Sx.tail);
      cx.beginPath();
      cx.moveTo(-Sx.head.halfW, -(Sx.tip - Sx.head.len));
      cx.lineTo(0, -Sx.tip);
      cx.lineTo(Sx.head.halfW, -(Sx.tip - Sx.head.len));
      cx.closePath();
      cx.fill();
      cx.beginPath();
      cx.arc(0, -Sx.lume.at, Sx.lume.r + Sx.lume.ring / 2, 0, Math.PI * 2);
      cx.arc(0, Sx.counter.at, Sx.counter.r, 0, Math.PI * 2);
      cx.fill();
    }),
  );
  ctx.restore();

  // — Rugosidad (G) y metal (B) ————————————————————————————————————————
  const ormSize = Math.min(1024, size);
  const o = mmCanvas(ormSize, S);
  o.ctx.fillStyle = `rgb(0,${Math.round(DIAL_ROUGH * 255)},${Math.round(DIAL_METAL * 255)})`;
  o.ctx.fillRect(-S / 2, -S / 2, S, S);
  const ink = `rgb(0,${Math.round(INK_ROUGH * 255)},${Math.round(INK_METAL * 255)})`;
  paintPrimitives(o.ctx, impresion, solid(ink));

  // — Cepillado sol: dirección tangencial; la tinta no tiene cepillado ——————
  const a = mmCanvas(1024, S);
  paintRadialField(a, 1);
  paintPrimitives(a.ctx, impresion, solid("rgb(128,128,0)"));

  const map = canvasTexture(m.canvas, true, maxAniso);
  const orm = canvasTexture(o.canvas, false, maxAniso);
  const aniso = canvasTexture(a.canvas, false, maxAniso);
  return {
    map,
    orm,
    aniso,
    dispose() {
      map.dispose();
      orm.dispose();
      aniso.dispose();
    },
  };
}

/** La silueta que proyecta sombra de una pieza aplicada (con su aro). */
function shadowShape(ctx: CanvasRenderingContext2D, p: Primitive): void {
  const w = p.strokeWidth ?? 0;
  ctx.lineWidth = w;
  ctx.strokeStyle = "#000";
  switch (p.kind) {
    case "circle":
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, p.r + w / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "rect": {
      ctx.beginPath();
      if (p.fill && p.fill !== "none") ctx.rect(p.x - w / 2, p.y - w / 2, p.w + w, p.h + w);
      else ctx.rect(p.x, p.y, p.w, p.h);
      if (p.fill && p.fill !== "none") ctx.fill();
      else ctx.stroke();
      break;
    }
    case "path": {
      const path = new Path2D(p.d);
      ctx.fill(path);
      if (w) {
        ctx.lineJoin = "round";
        ctx.stroke(path);
      }
      break;
    }
    default:
      break;
  }
}

// ===========================================================================
// Tapa — el grabado láser
// ===========================================================================
/** Lo grabado por acabado (mismos tonos que el compositor, components/watch/
 *  front/art.tsx → GRABADO): el láser oscurece el acero y el oro rosa; en el
 *  negro PVD quita la capa y deja ver el acero claro. */
const ENGRAVE: Readonly<Record<FinishId, { ink: string; rough: number }>> = {
  acero: { ink: "#5a5f64", rough: 0.62 },
  "oro-rosa": { ink: "#6e4a3a", rough: 0.6 },
  "pvd-negro": { ink: "#c4c7cb", rough: 0.5 },
};

export interface CasebackTextures {
  map: THREE.CanvasTexture;
  /** R = relieve (bumpMap lee R), G = rugosidad. */
  orm: THREE.CanvasTexture;
  dispose(): void;
}

export function casebackTextures(c: WatchConfig, fin: FinishId, size: number, maxAniso: number): CasebackTextures {
  const S = CASEBACK_FIELD_R * 2;
  const prims = casebackPrimitives(c, { ink: "#ffffff" }).filter((p) => p.capa === "grabado");
  // Máscara del grabado (blanco sobre negro), con el texto en curvas.
  const mask = mmCanvas(size, S);
  mask.ctx.fillStyle = "#000";
  mask.ctx.fillRect(-S / 2, -S / 2, S, S);
  paintPrimitives(mask.ctx, prims, solid("#ffffff"));
  const md = mask.ctx.getImageData(0, 0, size, size).data;

  const e = ENGRAVE[fin];
  const to255 = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  // sRGB de 0 a 1 (los mapas de color se pintan en sRGB).
  const f = srgb(FINISH_TONE[fin]);
  const g = srgb(e.ink);

  const map = mmCanvas(size, S);
  const orm = mmCanvas(size, S);
  const mi = map.ctx.createImageData(size, size);
  const oi = orm.ctx.createImageData(size, size);
  const r = rng(29);
  const center = size / 2;
  const rPx = size / 2;
  for (let i = 0, px = 0; i < md.length; i += 4, px++) {
    const x = (px % size) - center;
    const y = Math.floor(px / size) - center;
    // El campo es casi espejo, con un velo muy suave hacia el borde.
    const edge = Math.min(1, Math.hypot(x, y) / rPx);
    const t = md[i] / 255;
    // Escarcha del láser: grano fino en el color y en la rugosidad.
    const grain = 0.86 + 0.28 * r();
    const shade = 1 - 0.05 * edge * edge;
    mi.data[i] = to255((f.r * (1 - t) + g.r * grain * t) * shade);
    mi.data[i + 1] = to255((f.g * (1 - t) + g.g * grain * t) * shade);
    mi.data[i + 2] = to255((f.b * (1 - t) + g.b * grain * t) * shade);
    mi.data[i + 3] = 255;
    // R: relieve (lo grabado queda hundido); G: rugosidad; B: metal.
    oi.data[i] = to255(1 - 0.55 * t);
    oi.data[i + 1] = to255(0.2 + edge * 0.05 + t * (e.rough - 0.2) * (0.85 + 0.3 * r()));
    oi.data[i + 2] = 255;
    oi.data[i + 3] = 255;
  }
  map.ctx.putImageData(mi, 0, 0);
  orm.ctx.putImageData(oi, 0, 0);

  const tMap = canvasTexture(map.canvas, true, maxAniso);
  const tOrm = canvasTexture(orm.canvas, false, maxAniso);
  return {
    map: tMap,
    orm: tOrm,
    dispose() {
      tMap.dispose();
      tOrm.dispose();
    },
  };
}

// ===========================================================================
// Disco de fecha
// ===========================================================================
/** Lado (mm) del plano del disco de fecha bajo la ventana. */
export const DATE_WHEEL = { w: 3.6, h: 2.7 } as const;

export function dateWheel(maxAniso: number): THREE.CanvasTexture {
  const W = 288;
  const H = Math.round((W * DATE_WHEEL.h) / DATE_WHEEL.w);
  const k = W / DATE_WHEEL.w;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  ctx.fillStyle = "#f3f2ee";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#161616";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${Math.round(1.58 * k)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillText("8", W / 2, H / 2 + 0.56 * k);
  // El canto de la esfera le hace sombra por arriba.
  const g = ctx.createLinearGradient(0, H / 2 - DATE_WHEEL.h * 0.37 * k, 0, H / 2);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(0.35, "rgba(0,0,0,0.08)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  return canvasTexture(canvas, true, maxAniso);
}

// ===========================================================================
// Piel grabado cocodrilo
// ===========================================================================
/** Largo (mm) de correa que cubre una repetición de la textura de piel: cuatro
 *  filas (fotos 5, 9 y 10: filas de 17.2 ± 1.3 mm a todo el ancho). */
export const CROCO_TILE_MM = 69;

export interface CrocoMaps {
  normal: THREE.CanvasTexture;
  color: THREE.CanvasTexture;
  /** G = rugosidad (celda .42, pliegue .70); R = capa de laca. */
  rough: THREE.CanvasTexture;
  dispose(): void;
}

/** Lo claro de la celda en el mapa de color (sRGB): deja sitio al labio del
 *  pliegue (1.08). CROCO_GAIN lo compensa en el color del material: la media
 *  de la celda sigue siendo el tono medido de la correa. */
const CROCO_BASE = 0.92;
export const CROCO_GAIN = 1 / Math.pow(CROCO_BASE, 2.2);

/** Pliegues transversales (mm en la repetición), su panza hacia la caja y su
 *  inclinación; y el pliegue LARGO de la fila que empieza en cada uno (uno por
 *  fila, u entre −3 y +2), más otro fino junto al pespunte en algunas. */
const CROCO_ROWS = [
  { y: 10.2, bulge: 1.2, tilt: 0.5, long: -1.9, fine: 6.1 },
  { y: 27.0, bulge: 0.9, tilt: -0.6, long: 1.5, fine: 99 },
  { y: 44.5, bulge: 1.3, tilt: 0.3, long: -2.7, fine: -6.2 },
  { y: 61.5, bulge: 1.0, tilt: -0.4, long: 0.4, fine: 5.9 },
] as const;

/** Grabado cocodrilo por FILAS a todo el ancho (PLAN-REALISMO-V3 §2.5, medido
 *  en las fotos 5, 9 y 10 y en la capa): cada fila acaba hacia la caja en un
 *  pliegue de tres arrugas arqueadas con su quiebro en V donde la cruza el
 *  pliegue largo; del lado de la caja de cada pliegue, las tablitas cortas; y
 *  el micrograno arrugado de la piel. Nada de columnas (parecían ladrillos).
 *  u = de canto a canto (0…1, 20 mm nominales), v = a lo largo. 512 × 1024. */
export function crocoMaps(maxAniso: number): CrocoMaps {
  const W = 512;
  const H = 1024;
  const T = CROCO_TILE_MM;
  const WMM = 20;
  const kx = W / WMM;
  const ky = H / T;
  const r = rng(11);
  const gauss = (x: number, s: number) => Math.exp(-((x / s) * (x / s)));
  /** Ruido 1D suave y periódico en `cells` celdas. */
  const wave = (cells: number) => {
    const g = new Float32Array(cells);
    for (let i = 0; i < cells; i++) g[i] = r() * 2 - 1;
    return (x: number) => {
      const f = ((x % 1) + 1) % 1;
      const c = f * cells;
      const i = Math.floor(c);
      const t = c - i;
      const s = t * t * (3 - 2 * t);
      return g[i % cells] * (1 - s) + g[(i + 1) % cells] * s;
    };
  };
  const K = CROCO_ROWS.length;
  // Por columna de píxeles: dónde cae cada arruga y cuánto marca.
  const yc: Float32Array[] = [];
  const w2: Float32Array[] = [];
  const w3: Float32Array[] = [];
  const a1: Float32Array[] = [];
  const a2: Float32Array[] = [];
  const a3: Float32Array[] = [];
  const tab: Float32Array[] = [];
  const tabLen: Float32Array[] = [];
  for (let k = 0; k < K; k++) {
    const row = CROCO_ROWS[k];
    const n1 = wave(14);
    const n2 = wave(9);
    const n3 = wave(11);
    const n4 = wave(6);
    const lines: { x: number; len: number; amp: number }[] = [];
    for (let x = -8.2; x < 8.2; x += 0.85 + r() * 0.7) lines.push({ x, len: 0.9 + r() * 1.5, amp: 0.45 + 0.55 * r() });
    yc.push(new Float32Array(W));
    w2.push(new Float32Array(W));
    w3.push(new Float32Array(W));
    a1.push(new Float32Array(W));
    a2.push(new Float32Array(W));
    a3.push(new Float32Array(W));
    tab.push(new Float32Array(W));
    tabLen.push(new Float32Array(W));
    for (let px = 0; px < W; px++) {
      const x = (px + 0.5) / kx - WMM / 2;
      // Las dos celdas de la fila de arriba, cada una con su panza; en el
      // pliegue largo se juntan en una V que mira hacia fuera.
      const L = row.long;
      const c = x < L ? (L - 10) / 2 : (L + 10) / 2;
      const h = x < L ? (L + 10) / 2 : (10 - L) / 2;
      const q = Math.min(1, Math.abs((x - c) / h));
      const t = px / W;
      yc[k][px] = row.y + (row.tilt * x) / 10 - row.bulge * (1 - Math.pow(q, 2.4)) + row.bulge * 0.55 + 0.13 * n1(t);
      w2[k][px] = 0.62 + 0.3 * n2(t) + 0.25 * (1 - q);
      w3[k][px] = 1.3 + 0.4 * n3(t) + 0.2 * (1 - q);
      a1[k][px] = 0.85 + 0.25 * n2(t + 0.4);
      a2[k][px] = Math.max(0.1, 0.62 + 0.45 * n3(t + 0.2));
      a3[k][px] = Math.max(0, 0.34 + 0.5 * n4(t + 0.7));
      let best = 0;
      let len = 1.2;
      for (const l of lines) {
        const v = l.amp * gauss(x - l.x, 0.13);
        if (v > best) {
          best = v;
          len = l.len;
        }
      }
      tab[k][px] = best;
      tabLen[k][px] = len;
    }
  }
  const longW: ((v: number) => number)[] = CROCO_ROWS.map(() => wave(7));
  const longA: ((v: number) => number)[] = CROCO_ROWS.map(() => wave(5));
  // Micrograno: arrugas finas más largas a lo ancho que a lo largo + poro.
  // (Ruido de valor periódico, interpolado por filas: se pide una fila y se lee
  // columna a columna.)
  const grainOct = (cx: number, cy: number) => {
    const g = new Float32Array(cx * cy);
    for (let i = 0; i < g.length; i++) g[i] = r() * 2 - 1;
    const i0 = new Uint16Array(W);
    const i1 = new Uint16Array(W);
    const sx = new Float32Array(W);
    for (let px = 0; px < W; px++) {
      const f = (px / W) * cx;
      const c = Math.floor(f);
      i0[px] = c % cx;
      i1[px] = (c + 1) % cx;
      sx[px] = (f - c) * (f - c) * (3 - 2 * (f - c));
    }
    const line = new Float32Array(cx);
    return {
      row(py: number) {
        const f = (py / H) * cy;
        const c = Math.floor(f);
        const s = (f - c) * (f - c) * (3 - 2 * (f - c));
        const a = (c % cy) * cx;
        const b = ((c + 1) % cy) * cx;
        for (let i = 0; i < cx; i++) line[i] = g[a + i] * (1 - s) + g[b + i] * s;
      },
      at: (px: number) => line[i0[px]] * (1 - sx[px]) + line[i1[px]] * sx[px],
    };
  };
  const g1 = grainOct(26, 170);
  const g2 = grainOct(96, 330);
  const g3 = grainOct(9, 30);
  // El borde (a < 2.4 del canto) es liso: los pliegues casi no lo marcan.
  const edgeOf = new Float32Array(W);
  for (let px = 0; px < W; px++) {
    const x = (px + 0.5) / kx - WMM / 2;
    const eb = Math.max(0, Math.min(1, (Math.abs(x) - 6.9) / 1.5));
    edgeOf[px] = 1 - 0.72 * (eb * eb * (3 - 2 * eb));
  }

  const hgt = new Float32Array(W * H); // mm
  const dark = new Float32Array(W * H); // 0…1: cuánto oscurece
  const lip = new Float32Array(W * H);
  const xl = new Float32Array(K);
  const al = new Float32Array(K);
  const xf = new Float32Array(K);
  for (let py = 0; py < H; py++) {
    const y = (py + 0.5) / ky;
    const yn = py / H;
    g1.row(py);
    g2.row(py);
    g3.row(py);
    for (let k = 0; k < K; k++) {
      xl[k] = CROCO_ROWS[k].long + 0.42 * longW[k](yn) + 0.12 * longW[(k + 1) % K](yn * 3);
      al[k] = 0.78 + 0.3 * longA[k](yn);
      xf[k] = CROCO_ROWS[k].fine + 0.35 * longW[(k + 2) % K](yn);
    }
    for (let px = 0; px < W; px++) {
      const x = (px + 0.5) / kx - WMM / 2;
      const edge = edgeOf[px];
      let h = 0;
      let d = 0;
      let lp = 0;
      // La fila en la que cae el píxel: la del último pliegue por debajo.
      let rowK = K - 1;
      let yRel = 1e9;
      for (let k = 0; k < K; k++) {
        let t = y - yc[k][px];
        if (t > T / 2) t -= T;
        else if (t < -T / 2) t += T;
        if (t >= 0 && t < yRel) {
          yRel = t;
          rowK = k;
        }
        if (t < -5 || t > 2.4) continue;
        const t2 = t + w2[k][px];
        const t3 = t + w3[k][px];
        const m1 = t > -0.6 && t < 0.6 ? a1[k][px] * gauss(t, 0.17) : 0;
        const m2 = t2 > -0.5 && t2 < 0.5 ? a2[k][px] * gauss(t2, 0.15) : 0;
        const m3 = t3 > -0.5 && t3 < 0.5 ? a3[k][px] * gauss(t3, 0.14) : 0;
        // Toda la zona del pliegue se hunde un poco (la celda se redondea).
        h -= edge * (0.28 * m1 + 0.2 * m2 + 0.13 * m3 + 0.3 * gauss(t + 0.6, 1.5));
        d += edge * (1.05 * m1 + 0.75 * m2 + 0.5 * m3 + 0.26 * gauss(t + 0.7, 1.2));
        if (t > -0.8 && t < 1.4) lp += edge * (0.8 * gauss(t - 0.5, 0.28) + 0.45 * gauss(t + w2[k][px] / 2, 0.16));
        // Tablitas: del lado de la caja (t < 0), junto al pliegue.
        const e = -t - 1.5;
        if (e > -0.4) {
          const f = Math.max(0, Math.min(1, (e + 0.4) / 0.4)) * Math.max(0, Math.min(1, (tabLen[k][px] - e) / 0.9));
          const v = tab[k][px] * f * edge;
          h -= 0.085 * v;
          d += 0.46 * v + 0.16 * Math.max(0, 1 - e / 2.4) * edge;
        }
      }
      // El pliegue largo de su fila (y el fino).
      const dl = x - xl[rowK];
      const on = Math.min(1, yRel / 0.4);
      if (dl > -2.6 && dl < 2.6) {
        const ml = on * al[rowK] * gauss(dl, 0.2);
        h -= 0.22 * ml + 0.13 * on * gauss(dl, 1.1);
        d += 0.95 * ml + 0.16 * on * gauss(dl, 0.8);
        lp += on * (0.55 * gauss(dl - 0.42, 0.2) + 0.35 * gauss(dl + 0.42, 0.2));
      }
      const df = x - xf[rowK];
      if (df > -1.2 && df < 1.2) {
        const mf = on * 0.6 * gauss(df, 0.17);
        h -= 0.12 * mf + 0.04 * on * gauss(df, 0.5);
        d += 0.6 * mf;
      }
      // Micrograno.
      const a = g1.at(px);
      const b = g2.at(px);
      const i = py * W + px;
      hgt[i] = h + 0.011 * a + 0.0065 * b;
      dark[i] = d - 0.05 * a - 0.04 * b - 0.05 * g3.at(px);
      lip[i] = lp;
    }
  }
  const at = (x: number, y: number) => hgt[(((y % H) + H) % H) * W + Math.max(0, Math.min(W - 1, x))];
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D no disponible");
    return { c, ctx, img: ctx.createImageData(W, H) };
  };
  const nC = mk();
  const cC = mk();
  const rC = mk();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = -((at(x + 1, y) - at(x - 1, y)) * kx) / 2;
      const ny = -((at(x, y + 1) - at(x, y - 1)) * ky) / 2;
      const l = Math.hypot(nx, ny, 1);
      // La fila 0 del lienzo es v = 1: se escribe del revés (y crece con v).
      const i = ((H - 1 - y) * W + x) * 4;
      const q = y * W + x;
      nC.img.data[i] = Math.round((nx / l) * 127.5 + 127.5);
      nC.img.data[i + 1] = Math.round((ny / l) * 127.5 + 127.5);
      nC.img.data[i + 2] = Math.round((1 / l) * 127.5 + 127.5);
      nC.img.data[i + 3] = 255;
      const d = Math.max(-0.2, Math.min(1, dark[q]));
      const tone = (1 - 0.56 * d) * (1 + 0.08 * Math.min(1, lip[q]) * (1 - Math.max(0, d)));
      const v = Math.round(255 * Math.min(1, CROCO_BASE * tone));
      cC.img.data[i] = cC.img.data[i + 1] = cC.img.data[i + 2] = v;
      cC.img.data[i + 3] = 255;
      const dr = Math.max(0, d);
      rC.img.data[i] = Math.round(255 * (1 - 0.45 * dr));
      rC.img.data[i + 1] = Math.round(255 * (0.42 + 0.28 * dr + 0.03 * Math.max(0, -d)));
      rC.img.data[i + 2] = 255;
      rC.img.data[i + 3] = 255;
    }
  }
  nC.ctx.putImageData(nC.img, 0, 0);
  cC.ctx.putImageData(cC.img, 0, 0);
  rC.ctx.putImageData(rC.img, 0, 0);
  const normal = canvasTexture(nC.c, false, maxAniso);
  const color = canvasTexture(cC.c, true, maxAniso);
  const rough = canvasTexture(rC.c, false, maxAniso);
  for (const t of [normal, color, rough]) {
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
  }
  return {
    normal,
    color,
    rough,
    dispose() {
      normal.dispose();
      color.dispose();
      rough.dispose();
    },
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ===========================================================================
// Caucho: micro-grano (normal, 512², se repite cada 6 mm)
// ===========================================================================
/** Grano fino del caucho vulcanizado (§4.9 #18): ruido de valor suavizado →
 *  normales (Sobel). UV en mm de la correa (u de canto a canto 0…1: la
 *  repetición se ajusta en el material). */
export function rubberGrain(maxAniso: number): THREE.CanvasTexture {
  const N = 512;
  const r = rng(77);
  const h = new Float32Array(N * N);
  // Tres octavas de ruido de valor periódico.
  const oct = (cells: number, amp: number) => {
    const g = new Float32Array(cells * cells);
    for (let i = 0; i < g.length; i++) g[i] = r();
    for (let y = 0; y < N; y++) {
      const fy = (y / N) * cells;
      const y0 = Math.floor(fy);
      const ty = fy - y0;
      const sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < N; x++) {
        const fx = (x / N) * cells;
        const x0 = Math.floor(fx);
        const tx = fx - x0;
        const sx = tx * tx * (3 - 2 * tx);
        const a = g[(y0 % cells) * cells + (x0 % cells)];
        const b = g[(y0 % cells) * cells + ((x0 + 1) % cells)];
        const c = g[((y0 + 1) % cells) * cells + (x0 % cells)];
        const d = g[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
        h[y * N + x] += amp * ((a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy);
      }
    }
  };
  oct(64, 0.5);
  oct(128, 0.3);
  oct(256, 0.2);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const img = ctx.createImageData(N, N);
  const at = (x: number, y: number) => h[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 3;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 3;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * N + x) * 4;
      img.data[i] = Math.round((-dx / l) * 127.5 + 127.5);
      img.data[i + 1] = Math.round((dy / l) * 127.5 + 127.5);
      img.data[i + 2] = Math.round((1 / l) * 127.5 + 127.5);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = canvasTexture(canvas, false, maxAniso);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ===========================================================================
// Aplique: normales de su canto (Sobel del alfa desenfocado, 256 px)
// ===========================================================================
/** Normales del aplique PY a partir del alfa de su foto (desenfoque de caja
 *  dos veces y Sobel): redondea el canto de la cara de arriba. */
export function logoNormalMap(img: HTMLImageElement, maxAniso: number, N = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D no disponible");
  ctx.drawImage(img, 0, 0, N, N);
  const src = ctx.getImageData(0, 0, N, N).data;
  let a = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) a[i] = src[i * 4 + 3] / 255;
  const blur = (inp: Float32Array, r: number) => {
    const tmp = new Float32Array(N * N);
    const out = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let s = 0;
        let n = 0;
        for (let k = -r; k <= r; k++) {
          const xx = x + k;
          if (xx < 0 || xx >= N) continue;
          s += inp[y * N + xx];
          n++;
        }
        tmp[y * N + x] = s / n;
      }
    }
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let s = 0;
        let n = 0;
        for (let k = -r; k <= r; k++) {
          const yy = y + k;
          if (yy < 0 || yy >= N) continue;
          s += tmp[yy * N + x];
          n++;
        }
        out[y * N + x] = s / n;
      }
    }
    return out;
  };
  a = blur(blur(a, 2), 2);
  const at = (x: number, y: number) => a[Math.min(N - 1, Math.max(0, y)) * N + Math.min(N - 1, Math.max(0, x))];
  const img2 = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      const nx = -gx * 1.4;
      const ny = gy * 1.4;
      const l = Math.hypot(nx, ny, 1);
      const i = (y * N + x) * 4;
      img2.data[i] = Math.round((nx / l) * 127.5 + 127.5);
      img2.data[i + 1] = Math.round((ny / l) * 127.5 + 127.5);
      img2.data[i + 2] = Math.round((1 / l) * 127.5 + 127.5);
      img2.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img2, 0, 0);
  return canvasTexture(c, false, maxAniso);
}
