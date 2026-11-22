// ---------------------------------------------------------------------------
// Contornos de las letras del reloj (unidades de la fuente, y hacia ARRIBA) y
// el interletraje de cada pareja, para convertir el texto a curvas
// (lib/watch-curvas.ts): los archivos de producción, la vista previa y la 3D
// pintan exactamente estos trazos. Barril escrito a mano; las tablas viven en:
//
//   py-dial      → lib/watch-glyphs-clasica.ts · Cinzel Regular (Version 2.000).
//                  Movida byte a byte del archivo antiguo; su fuente no está en
//                  el repo: NO se regenera.
//   py-dial-fina → lib/watch-glyphs-fina.ts · Cormorant Garamond Italic 500
//                  (cursiva de verdad), GENERADA con scripts/gen-watch-glyphs.mjs
//                  --solo fina --wght 500.
//
// Ambas SIL Open Font License 1.1 (permite incrustar y convertir a curvas).
// Lo importa solo lib/watch-curvas.ts, que usan el servidor (la hoja del
// taller) y los trozos diferidos (la vista previa en curvas y la 3D); nunca la
// carga inicial. Lo único de la letra fina que llega a la carga inicial son
// sus avances (lib/watch-glyph-metrics.ts, para estimateTextWidth).
// ---------------------------------------------------------------------------
import { GLYPH_PY_DIAL, type GlyphFont } from "./watch-glyphs-clasica";
import { GLYPH_PY_DIAL_FINA } from "./watch-glyphs-fina";

export type { GlyphFont };

export const GLYPH_FONTS: Readonly<Record<"py-dial" | "py-dial-fina", GlyphFont>> = {
  "py-dial": GLYPH_PY_DIAL,
  "py-dial-fina": GLYPH_PY_DIAL_FINA,
};
