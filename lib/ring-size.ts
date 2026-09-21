// ---------------------------------------------------------------------------
// Tallas de anillo: la escala US, que es la que usa la tienda y la que usan
// Cuba, México, Puerto Rico, República Dominicana y el resto de la clientela.
//
// LA TABLA ES UNA FÓRMULA, NO UNA LISTA
// -------------------------------------
// La escala US se define geométricamente: la talla 0 mide 0.458 pulgadas de
// diámetro interior, y cada talla entera suma 0.032 pulgadas. En milímetros:
//
//     diámetro = 11.6332 + 0.8128 × talla
//
// Por internet circulan tablas que difieren en décimas (18.14 / 18.19 / 18.2
// para la #8). Son redondeos distintos de la misma fórmula, o copias de
// mandriles medidos a mano hace décadas. Ninguna diferencia pasa de 0.15 mm —
// menos de un quinto de talla— así que se usa la fórmula y se acabó la duda.
//
// LO QUE MIDE EL MEDIDOR
// ----------------------
// El diámetro INTERIOR del anillo, por donde entra el dedo. Cada talla entera
// son 0.81 mm; cada media talla, 0.41 mm. Es poco: por eso la calibración de
// la pantalla no es opcional (ver components/sizer/RingSizer.tsx).
// ---------------------------------------------------------------------------

const BASE_MM = 11.6332;
const PASO_MM = 0.8128;

/** Diámetro interior en mm de una talla US (admite medias tallas: 9.5). */
export function diametroDeTalla(talla: number): number {
  return BASE_MM + PASO_MM * talla;
}

/** Talla US exacta (con decimales) de un diámetro interior en mm. */
export function tallaExacta(mm: number): number {
  return (mm - BASE_MM) / PASO_MM;
}

/** La media talla más cercana: 9.44 → 9.5, 9.2 → 9. */
export function mediaTallaCercana(mm: number): number {
  return Math.round(tallaExacta(mm) * 2) / 2;
}

/**
 * La talla ENTERA que se recomienda comprar.
 *
 * Redondea hacia arriba a propósito, con un pequeño margen de tolerancia. Es
 * la regla de los joyeros —"cuando dudes, la más grande"— y tiene una razón
 * de taller: achicar un anillo es cortar y soldar, y en un anillo de Ifá con
 * figuras o grabado alrededor eso destroza el trabajo; agrandarlo es añadir
 * metal, que es más fácil y no toca el dibujo.
 *
 * El margen (0.2 mm, un cuarto de talla) evita que 18.95 mm —que ES la #9
 * exacta— suba a la #10 por una centésima de ruido en la pantalla.
 */
export function tallaRecomendada(mm: number): number {
  const exacta = tallaExacta(mm);
  const entera = Math.floor(exacta);
  const resto = exacta - entera;
  // Hasta un cuarto de talla por encima de la entera, se queda en la entera.
  return resto <= 0.25 ? entera : entera + 1;
}

/** Rango de tallas que tiene sentido medir. Fuera de esto no es un anillo
 *  normal de dedo. Va de la #3 (niña pequeña) a la #15. */
export const TALLA_MIN = 3;
export const TALLA_MAX = 15;
export const MM_MIN = Math.floor(diametroDeTalla(TALLA_MIN) * 10) / 10; // 14.0
export const MM_MAX = Math.ceil(diametroDeTalla(TALLA_MAX) * 10) / 10; // 23.9

/** Formato para enseñar: 9 → "#9", 9.5 → "#9½". */
export function etiquetaTalla(talla: number): string {
  const entera = Math.floor(talla);
  const media = talla - entera >= 0.5;
  return `#${entera}${media ? "½" : ""}`;
}

/**
 * Talla US de un título de variante de Shopify, o null si no lleva ninguna.
 *
 * Los valores de la opción Talla del catálogo NO son uniformes: "#9" en la
 * mayoría, "9" a secas en anillo-ifa, y un "12/5" (errata de 12.5) en el
 * Anillo de Orula. En variantes de dos opciones el título viene como
 * "#9 / Oro 10k". Aquí se normaliza todo eso a un número, para que la
 * preselección desde el medidor funcione con cualquiera de las formas.
 */
export function tallaDeTitulo(titulo: string): number | null {
  for (const trozo of titulo.split(" / ")) {
    const limpio = trozo.trim().replace(/^#/, "").replace("/", ".");
    if (!/^\d+(\.\d+)?$/.test(limpio)) continue;
    const n = Number(limpio);
    if (n >= TALLA_MIN && n <= TALLA_MAX) return n;
  }
  return null;
}

/** Clave de localStorage donde el medidor deja la talla medida, para que
 *  cualquier ficha de anillo la preseleccione sola. */
export const CLAVE_TALLA = "pyj-talla";

/**
 * Los anillos anchos aprietan más: la banda apoya contra el nudillo y roza
 * más piel al pasar. A partir de ~6 mm de ancho de banda los joyeros suben
 * media talla; de 13 mm en adelante, una entera. Se ENSEÑA como consejo, no
 * se aplica en silencio: si el dueño ya lo tiene en cuenta al tallar, aplicarlo
 * dos veces daría un anillo flojo.
 */
export const CONSEJO_ANILLO_ANCHO =
  "Si el anillo que vas a comprar es ancho (los de Ifá lo son), muchos joyeros " +
  "recomiendan media talla más que la de un anillo fino.";

/** Filas para la tabla de referencia de la página: talla y diámetro. */
export function filasTabla(desde = 5, hasta = 14): { talla: string; mm: string }[] {
  const filas: { talla: string; mm: string }[] = [];
  for (let t = desde; t <= hasta; t += 0.5) {
    filas.push({ talla: etiquetaTalla(t), mm: diametroDeTalla(t).toFixed(1) });
  }
  return filas;
}
