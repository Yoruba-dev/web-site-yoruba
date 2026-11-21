// ===========================================================================
// COPY DEL RELOJ — una sola fuente para cada texto. Solo herencia e identidad.
//
// Módulo hoja SIN imports: lib/watch.ts lo reexporta tal cual (la API no
// cambia), y las páginas que solo necesitan una frase —/faq, cuyo acordeón se
// ejecuta en el navegador— la importan de aquí para no arrastrar al cliente el
// catálogo, los presets y los signos de lib/watch.ts.
// ===========================================================================
/** El texto de la política: el mismo en la casilla del resumen, la ficha del
 *  producto, las preguntas frecuentes y /garantia-y-devoluciones. */
export const WATCH_CUSTOM_POLICY =
  "Cada reloj se ensambla y se personaliza a mano solo para ti, así que es una venta final: no admite devoluciones, reembolsos ni cambios. Antes de producirlo te enviamos una prueba para tu OK; nada se imprime ni se graba sin tu aprobación.";

export const WATCH_RENDER_NOTE = "Vista previa digital: el brillo y el tono reales varían con la luz.";

export const WATCH_ODU_NOTE = "Elige tu signo como identidad; su lectura la da tu babaláwo.";

export const WATCH_PROOF_NOTE = "Antes de producir te enviamos una prueba para tu OK.";

/** La ficha de Ifá (no hay render ilustrativo de Ifá: la ficha es tipográfica
 *  o el compositor en vivo). */
export const WATCH_IFA_NOTE =
  "Los 16 Meyis en su orden tradicional alrededor de la esfera, de Baba Ejiogbe a Ofun Meyi, e IFÁ a las 6. Tu signo personal va grabado en la tapa.";

/** Días de taller. null = todavía sin fijar → se muestra "a confirmar". */
export const WATCH_LEAD_TIME_DAYS: number | null = null;

export function watchLeadTimeLabel(days: number | null = WATCH_LEAD_TIME_DAYS): string {
  return days === null ? "a confirmar" : `${days} días hábiles`;
}

export const WATCH_ORIGIN = "Ensamblado y personalizado a mano en Miami con componentes importados";

/** Mientras no haya producto ni precios en Shopify (decisión del dueño §1). */
export const WATCH_PRICE_TBD = "Precio por confirmar";
