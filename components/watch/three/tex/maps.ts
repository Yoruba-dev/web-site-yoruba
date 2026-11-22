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

/** Vetas del cepillado lineal: rugosidad (canal G). dir "u": vetas a lo
 *  largo de u (la cara del bisel, paralelas a 3–9); dir "v": a lo largo de v
 *  (flancos verticales, eslabones y hojas a lo largo). UV en mm. */
export function brushStreaks(maxAniso: number, dir: "u" | "v" = "u"): THREE.CanvasTexture {
  const t = streaksU(maxAniso);
  if (dir === "u") return t;
  // Las mismas vetas giradas: se cambia el orden de los ejes en la textura.
  const src = t.image as HTMLCanvasElement;
  const c = document.createElement("canvas");
  c.width = src.height;
  c.height = src.width;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  ctx.translate(c.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  t.dispose();
  const out = canvasTexture(c, false, maxAniso);
  out.wrapS = out.wrapT = THREE.RepeatWrapping;
  out.repeat.set(1 / 4, 1 / 20);
  return out;
}

function streaksU(maxAniso: number): THREE.CanvasTexture {
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
  /** G = rugosidad (surco .78, cresta .42); R = capa de laca (surco .71 de la
   *  de la cresta: .25 / .35 con clearcoat .35). */
  rough: THREE.CanvasTexture;
  dispose(): void;
}

/** Grabado cocodrilo por COLUMNAS (§4.9 #19, sin Voronoi): una columna
 *  central de 0.36·ancho con escamas de 7–10 mm, dos laterales de 0.22·ancho
 *  con escamas de 4–7 mm y dos de canto de 0.10·ancho (escamas menudas, y la
 *  vía del pespunte lisa a 1.3 mm del canto). Celdas rectangulares de
 *  esquinas redondeadas (r 0.6 mm), surcos de 0.35 mm, juego de ±12 %. Se
 *  repite sin costura a lo largo. u = de canto a canto (0…1), v = a lo largo
 *  (CROCO_TILE_MM por repetición). 1024². */
export function crocoMaps(maxAniso: number, widthMm = 20): CrocoMaps {
  const W = 1024;
  const H = 1024;
  const T = CROCO_TILE_MM;
  const kx = W / widthMm;
  const ky = H / T;
  const r = rng(5);
  // Columnas (fracción del ancho) y rango del largo de sus escamas (mm).
  const COLS: [number, [number, number]][] = [
    [0.1, [2.4, 3.6]],
    [0.22, [4, 7]],
    [0.36, [7, 10]],
    [0.22, [4, 7]],
    [0.1, [2.4, 3.6]],
  ];
  interface Cell {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    tone: number;
    dome: number;
  }
  const cells: Cell[][] = [];
  let acc = 0;
  for (const [frac, [lo, hi]] of COLS) {
    const x0 = acc * widthMm;
    acc += frac;
    const x1 = acc * widthMm;
    const lens: number[] = [];
    let sum = 0;
    while (sum < T) {
      const l = lo + (hi - lo) * r();
      lens.push(l);
      sum += l;
    }
    const k = T / sum;
    const col: Cell[] = [];
    // Arranque desfasado por columna (las juntas no se alinean).
    let y = r() * lens[0] * k;
    for (const l of lens) {
      const h = l * k;
      // Juego ±12 % en los bordes laterales de cada celda.
      const jx = (x1 - x0) * 0.12;
      col.push({
        x0: x0 + (r() - 0.5) * jx,
        x1: x1 + (r() - 0.5) * jx,
        y0: y,
        y1: y + h * (1 + (r() - 0.5) * 0.24),
        tone: 1 + (r() - 0.5) * 0.12,
        dome: 0.75 + 0.25 * r(),
      });
      y += h;
    }
    cells.push(col);
  }
  const R = 0.6;
  const G = 0.35;
  const hgt = new Float32Array(W * H);
  const tone = new Float32Array(W * H);
  const colStart: number[] = [];
  acc = 0;
  for (const [frac] of COLS) {
    colStart.push(acc * widthMm);
    acc += frac;
  }
  for (let py = 0; py < H; py++) {
    const ym = (py + 0.5) / ky;
    for (let px = 0; px < W; px++) {
      const xm = (px + 0.5) / kx;
      let ci = 0;
      while (ci + 1 < COLS.length && xm >= colStart[ci + 1]) ci++;
      let best = -1e9;
      let bt = 1;
      let bd = 1;
      // La celda dueña: la de mayor distancia interior (con su vecina).
      for (const cc of [ci - 1, ci, ci + 1]) {
        if (cc < 0 || cc >= COLS.length) continue;
        for (const c of cells[cc]) {
          for (const shift of [-T, 0, T]) {
            const y0 = c.y0 + shift;
            const y1 = c.y1 + shift;
            if (ym < y0 - 2 || ym > y1 + 2) continue;
            const hx = (c.x1 - c.x0) / 2 - G / 2;
            const hy = (y1 - y0) / 2 - G / 2;
            const dx = Math.abs(xm - (c.x0 + c.x1) / 2) - (hx - R);
            const dy = Math.abs(ym - (y0 + y1) / 2) - (hy - R);
            const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
            const sdf = outside + Math.min(Math.max(dx, dy), 0) - R;
            const inside = -sdf;
            if (inside > best) {
              best = inside;
              bt = c.tone;
              bd = c.dome;
            }
          }
        }
      }
      // Surco → 0; cresta abombada hacia el centro de la escama.
      const e = Math.max(0, Math.min(1, best / 0.22));
      const crest = e * e * (3 - 2 * e);
      const domeH = Math.min(1, Math.max(0, best) / 1.6);
      let h = crest * (0.72 + 0.28 * domeH * bd);
      // La vía del pespunte: lisa y algo hundida a 1.3 mm de cada canto.
      const ds = Math.min(Math.abs(xm - 1.3), Math.abs(xm - (widthMm - 1.3)));
      if (ds < 0.55) h = 0.55 + 0.1 * (ds / 0.55);
      hgt[py * W + px] = h;
      tone[py * W + px] = bt;
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
  // Gradiente en mm: alto del surco 0.35 mm.
  const DEPTH = 0.35;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dhx = ((at(x + 1, y) - at(x - 1, y)) * DEPTH) / (2 / kx);
      const dhy = ((at(x, y + 1) - at(x, y - 1)) * DEPTH) / (2 / ky);
      const s = 0.55;
      const nx = -dhx * s;
      const ny = dhy * s;
      const l = Math.hypot(nx, ny, 1);
      const i = (y * W + x) * 4;
      nC.img.data[i] = Math.round((nx / l) * 127.5 + 127.5);
      nC.img.data[i + 1] = Math.round((ny / l) * 127.5 + 127.5);
      nC.img.data[i + 2] = Math.round((1 / l) * 127.5 + 127.5);
      nC.img.data[i + 3] = 255;
      const h = hgt[y * W + x];
      // Color: ±6 % por escama; surcos más oscuros.
      const v = Math.round(255 * Math.min(1, (0.6 + 0.4 * h) * tone[y * W + x]));
      cC.img.data[i] = cC.img.data[i + 1] = cC.img.data[i + 2] = v;
      cC.img.data[i + 3] = 255;
      rC.img.data[i] = Math.round(255 * (0.714 + 0.286 * h));
      rC.img.data[i + 1] = Math.round(255 * (0.78 - 0.36 * h));
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
