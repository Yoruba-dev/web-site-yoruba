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
//   radialAniso       dirección del cepillado radial (cara del bisel).
//   brushStreaks      vetas del cepillado lineal (rugosidad).
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
  handPose,
  type Primitive,
  type RectPrim,
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
import { FINISH_TONE } from "../materials";
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

/** Vetas del cepillado lineal: rugosidad (canal G) que cambia a lo largo de v
 *  y casi nada a lo largo de u. UV en mm (repetición 20 × 4 mm). */
export function brushStreaks(maxAniso: number): THREE.CanvasTexture {
  const W = 256;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const img = ctx.createImageData(W, H);
  const r = rng(11);
  const rows = Array.from({ length: H }, () => 0.78 + 0.22 * r());
  for (let y = 0; y < H; y++) {
    const a = (rows[y] + rows[(y + 1) % H] + rows[(y + H - 1) % H]) / 3;
    for (let x = 0; x < W; x++) {
      const v = Math.max(0, Math.min(1, a + (r() - 0.5) * 0.05));
      const i = (y * W + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = Math.round(v * 255);
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = canvasTexture(canvas, false, maxAniso);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 20, 1 / 4);
  return t;
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
const SHADOW_H = { aplicado: 0.3, aplique: 0.35, hora: 0.95, minuto: 1.2, segundo: 1.45 } as const;
/** Hacia dónde cae la sombra (luz arriba a la izquierda). */
const SHADOW_DIR = [0.55, 0.84] as const;

function shadowOf(h: number, alpha: number) {
  return { blur: 0.06 + h * 0.22, dx: SHADOW_DIR[0] * h * 0.4, dy: SHADOW_DIR[1] * h * 0.4, alpha };
}

/** Contorno (mm, y abajo) de una aguja de espada apuntando a las 12. */
function bladePath(b: { tail: number; tip: number; shoulder: number; halfW: number }): Path2D {
  const p = new Path2D();
  p.moveTo(-b.halfW, b.tail);
  p.lineTo(-b.halfW, -b.shoulder);
  p.lineTo(0, -b.tip);
  p.lineTo(b.halfW, -b.shoulder);
  p.lineTo(b.halfW, b.tail);
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
    if (p.capa !== "aplicado" || p.id === "aplique") continue;
    castShadow(m, shadowOf(SHADOW_H.aplicado, lumeAlpha), (cx) => shadowShape(cx, p));
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
  castShadow(m, shadowOf(SHADOW_H.hora, handAlpha), rot(ang.hour, (cx) => cx.fill(bladePath(HANDS.hour))));
  castShadow(m, shadowOf(SHADOW_H.minuto, handAlpha * 0.95), rot(ang.minute, (cx) => cx.fill(bladePath(HANDS.minute))));
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
/** Largo (mm) de correa que cubre una repetición de la textura de piel. */
export const CROCO_TILE_MM = 32;

export interface CrocoMaps {
  normal: THREE.CanvasTexture;
  color: THREE.CanvasTexture;
  dispose(): void;
}

/** Escamas de cocodrilo: celdas de Voronoi sobre una rejilla con jitter
 *  (grandes y casi rectangulares en el centro, menudas hacia los cantos; cada
 *  fila de alto distinto), con el surco entre escamas, y el pespunte a 1.1 mm
 *  del canto. Se repite sin costura a lo largo. u = de canto a canto (0…1),
 *  v = a lo largo (CROCO_TILE_MM por repetición). */
export function crocoMaps(maxAniso: number, widthMm = 20): CrocoMaps {
  const W = 512;
  const H = Math.round((W * CROCO_TILE_MM) / widthMm);
  const kx = W / widthMm;
  const ky = H / CROCO_TILE_MM;
  const height = document.createElement("canvas");
  height.width = W;
  height.height = H;
  const hc = height.getContext("2d");
  if (!hc) throw new Error("Canvas 2D no disponible");
  const r = rng(5);
  // Columnas (mm desde el canto izquierdo): menudas, medianas, grandes al centro.
  const cols = [0, 1.5, 3.2, 5.5, 10, 14.5, 16.8, 18.5, 20];
  const rowsH: number[] = [];
  let y = 0;
  while (y < CROCO_TILE_MM - 0.1) {
    const h = Math.min(CROCO_TILE_MM - y, 2.6 + r() * 1.8);
    rowsH.push(h);
    y += h;
  }
  // Si la última fila queda muy corta, se reparte en la anterior.
  if (rowsH.length > 1 && rowsH[rowsH.length - 1] < 1.6) rowsH[rowsH.length - 2] += rowsH.pop() ?? 0;
  // Semillas (mm): una por celda, desplazada al azar dentro de ella.
  const seeds: { x: number; y: number; row: number }[] = [];
  y = 0;
  rowsH.forEach((h, ri) => {
    for (let ci = 0; ci + 1 < cols.length; ci++) {
      const central = ci === 3 || ci === 4;
      const parts = central ? 1 : ci === 0 || ci === cols.length - 2 ? 3 : 2;
      const cw = cols[ci + 1] - cols[ci];
      for (let pi = 0; pi < parts; pi++) {
        const ph = h / parts;
        seeds.push({
          x: cols[ci] + cw * (0.5 + (r() - 0.5) * 0.45),
          y: y + ph * (pi + 0.5 + (r() - 0.5) * 0.5),
          row: ri,
        });
      }
    }
    y += h;
  });
  // Distancia con métrica algo aplastada a lo largo (escamas más anchas que
  // altas en el centro) y periódica en y (la textura se repite).
  const T = CROCO_TILE_MM;
  const img = hc.createImageData(W, H);
  const hgt = new Float32Array(W * H);
  for (let py = 0; py < H; py++) {
    const ym = (py + 0.5) / ky;
    // Solo las semillas a ±5 mm de esta fila de píxeles (con su dy ya hecho).
    const near: { x: number; dy: number }[] = [];
    for (const sd of seeds) {
      let dy = ym - sd.y;
      if (dy > T / 2) dy -= T;
      else if (dy < -T / 2) dy += T;
      if (dy <= 5 && dy >= -5) near.push({ x: sd.x, dy });
    }
    for (let px = 0; px < W; px++) {
      const xm = (px + 0.5) / kx;
      let d1 = 1e9;
      let d2 = 1e9;
      for (const sd of near) {
        const dy = sd.dy;
        const dx = xm - sd.x;
        const d = Math.sqrt(dx * dx * 1.0 + dy * dy * 1.35);
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) d2 = d;
      }
      // Surco: donde las dos semillas más cercanas están casi a la par.
      const edge = d2 - d1;
      const groove = Math.min(1, edge / 0.32);
      const dome = 1 - Math.min(1, d1 / 3.2) * 0.35;
      hgt[py * W + px] = 0.18 + 0.82 * groove * groove * (3 - 2 * groove) * dome;
    }
  }
  for (let i = 0; i < W * H; i++) {
    const v = Math.round(255 * hgt[i]);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  hc.putImageData(img, 0, 0);
  // Pespunte: puntadas de 1.1 mm cada 1.6 mm, a 1.1 mm de cada canto.
  const stitch: [number, number][] = [];
  for (const xs of [1.1, widthMm - 1.1]) {
    hc.save();
    hc.fillStyle = "#0e0e0e";
    hc.fillRect((xs - 0.32) * kx, 0, 0.64 * kx, H);
    hc.restore();
    for (let s = 0.3; s < CROCO_TILE_MM; s += 1.6) stitch.push([xs, s]);
  }
  for (const [xs, s] of stitch) {
    const g = hc.createLinearGradient((xs - 0.2) * kx, 0, (xs + 0.2) * kx, 0);
    g.addColorStop(0, "rgb(170,170,170)");
    g.addColorStop(0.5, "rgb(250,250,250)");
    g.addColorStop(1, "rgb(170,170,170)");
    hc.fillStyle = g;
    hc.beginPath();
    roundRect(hc, (xs - 0.2) * kx, s * ky, 0.4 * kx, 1.1 * ky, 0.2 * kx);
    hc.fill();
  }

  // Normales a partir de la altura (Sobel), con flipY: v = −y del canvas.
  const hd = hc.getImageData(0, 0, W, H).data;
  const nCanvas = document.createElement("canvas");
  nCanvas.width = W;
  nCanvas.height = H;
  const nc = nCanvas.getContext("2d");
  const cCanvas = document.createElement("canvas");
  cCanvas.width = W;
  cCanvas.height = H;
  const cc = cCanvas.getContext("2d");
  if (!nc || !cc) throw new Error("Canvas 2D no disponible");
  const ni = nc.createImageData(W, H);
  const ci = cc.createImageData(W, H);
  const hAt = (x: number, yy: number) => hd[(((yy + H) % H) * W + ((x + W) % W)) * 4] / 255;
  const strength = 2.2;
  for (let yy = 0; yy < H; yy++) {
    for (let x = 0; x < W; x++) {
      const dx = (hAt(x + 1, yy) - hAt(x - 1, yy)) * strength;
      const dy = (hAt(x, yy + 1) - hAt(x, yy - 1)) * strength;
      // n = (−dh/du, −dh/dv, 1); dh/dv = −dh/dy (el canvas va hacia abajo).
      const nx = -dx;
      const ny = dy;
      const len = Math.hypot(nx, ny, 1);
      const i = (yy * W + x) * 4;
      ni.data[i] = Math.round((nx / len) * 127.5 + 127.5);
      ni.data[i + 1] = Math.round((ny / len) * 127.5 + 127.5);
      ni.data[i + 2] = Math.round((1 / len) * 127.5 + 127.5);
      ni.data[i + 3] = 255;
      // Color: las ranuras más oscuras, la cresta de cada escama más clara.
      const h = hAt(x, yy);
      const v = Math.round(255 * Math.min(1, 0.62 + h * 0.42));
      ci.data[i] = ci.data[i + 1] = ci.data[i + 2] = v;
      ci.data[i + 3] = 255;
    }
  }
  nc.putImageData(ni, 0, 0);
  cc.putImageData(ci, 0, 0);
  const normal = canvasTexture(nCanvas, false, maxAniso);
  const color = canvasTexture(cCanvas, true, maxAniso);
  for (const t of [normal, color]) {
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
  }
  return {
    normal,
    color,
    dispose() {
      normal.dispose();
      color.dispose();
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
