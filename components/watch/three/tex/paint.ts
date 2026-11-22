// ---------------------------------------------------------------------------
// PRIMITIVAS EN MM → CANVAS 2D (las texturas de la esfera y de la tapa).
//
// Pinta exactamente lo que dialPrimitives() / casebackPrimitives() describen
// (lib/watch-art.ts). El texto NO se pinta con fillText: pasa antes por
// outlinePrimitives() (lib/watch-curvas.ts + lib/watch-glyphs.ts), que lo
// convierte en los contornos reales de Cinzel / Cormorant con la misma
// colocación que el archivo de impresión y el láser. Así las letras son
// idénticas a la producción y no dependen de las fuentes del teléfono. Las
// tablas de contornos pesan ~124 KB (~46 KB gzip): solo viajan en este trozo
// diferido de la 3D.
//
// Convención: el canvas está en mm con el origen en el centro y y HACIA ABAJO
// (como las primitivas y como SVG). Con flipY de three por defecto, la fila de
// arriba del canvas queda en v = 1: las 12 arriba (+Y del modelo) y el texto
// se lee derecho, sin espejo.
// ---------------------------------------------------------------------------
import { outlinePrimitives } from "@/lib/watch-curvas";
import type { Primitive } from "@/lib/watch-art";

export interface MmCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** px por mm. */
  k: number;
  size: number;
  /** Lado en mm que cubre el canvas (centrado en 0). */
  span: number;
}

/** Un canvas cuadrado de `size` px que cubre `span` mm, con el origen en el
 *  centro y las unidades en mm. */
export function mmCanvas(size: number, span: number): MmCanvas {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const k = size / span;
  ctx.setTransform(k, 0, 0, k, size / 2, size / 2);
  return { canvas, ctx, k, size, span };
}

/** Color de cada primitiva al pintar (null = no se pinta). Por defecto, el
 *  suyo. Sirve para las máscaras (rugosidad, anisotropía, grabado). */
export type Paint = (p: Primitive, kind: "fill" | "stroke") => string | null;

const own: Paint = (p, kind) => {
  const c = kind === "fill" ? p.fill : p.stroke;
  return c && c !== "none" ? c : null;
};

/** Pinta las primitivas (el texto, ya en curvas). */
export function paintPrimitives(ctx: CanvasRenderingContext2D, prims: readonly Primitive[], paint: Paint = own): void {
  for (const p of outlinePrimitives(prims)) {
    const fill = paint(p, "fill");
    const stroke = p.stroke ? paint(p, "stroke") : null;
    if (!fill && !stroke) continue;
    ctx.save();
    ctx.lineJoin = p.strokeLinejoin ?? "miter";
    ctx.lineWidth = p.strokeWidth ?? 0.1;
    switch (p.kind) {
      case "circle": {
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.stroke();
        }
        break;
      }
      case "rect": {
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        if (p.rotate) ctx.rotate((p.rotate * Math.PI) / 180);
        ctx.beginPath();
        roundRectPath(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.rx ?? 0);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.stroke();
        }
        break;
      }
      case "path": {
        const path = new Path2D(p.d);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill(path, p.fillRule ?? "nonzero");
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.stroke(path);
        }
        break;
      }
      default:
        // text / arcText ya no llegan aquí (outlinePrimitives los convierte).
        break;
    }
    ctx.restore();
  }
}

/** Rectángulo redondeado en el trazo actual (sin depender de ctx.roundRect). */
export function roundRectPath(ctx: CanvasRenderingContext2D | Path2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/** Sombra suave de lo que dibuja `draw` (en mm), desplazada (dx, dy) mm y
 *  desenfocada `blur` mm. Truco del desplazamiento de la sombra (que no sigue
 *  la transformación): la figura se pinta lejos del canvas y solo su sombra
 *  cae en su sitio. Funciona en todos los navegadores (sin ctx.filter). */
export function castShadow(
  m: MmCanvas,
  opts: { blur: number; dx: number; dy: number; alpha: number },
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  const { ctx, k } = m;
  const FAR = m.size * 4;
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${opts.alpha})`;
  ctx.shadowBlur = opts.blur * k;
  ctx.shadowOffsetX = FAR + opts.dx * k;
  ctx.shadowOffsetY = opts.dy * k;
  ctx.translate(-FAR / k, 0);
  ctx.fillStyle = "#000";
  draw(ctx);
  ctx.restore();
}

/** Carga una imagen del mismo origen (las capas de /public). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

/** Ruido de valor reproducible (para el grano del grabado y del cepillado). */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}
