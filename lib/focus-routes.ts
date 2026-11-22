// ---------------------------------------------------------------------------
// RUTAS DE ENFOQUE — páginas que son una herramienta a pantalla completa (el
// creador de relojes). En ellas:
//   • la barra de pestañas del móvil (MobileTabBar) NO se pinta: la página trae
//     su propio pie fijo con el botón principal;
//   • los popups de bienvenida (NewsletterPopup) y de oferta (PromoPopup) NO
//     salen: interrumpir a alguien a mitad de diseñar es perder el diseño.
// Añadir una herramienta nueva = añadir su ruta aquí, nada más.
// ---------------------------------------------------------------------------

/** Rutas EXACTAS que se muestran en modo enfoque. Sus subrutas no: la guía
 *  "/creador-de-relojes/como-funciona" es una página normal, con su cabecera,
 *  su pie y la barra de pestañas. */
export const FOCUS_ROUTES: readonly string[] = ["/creador-de-relojes"];

/** true solo si `pathname` ES una ruta de enfoque ("/creador-de-relojes", con
 *  o sin barra final, ?búsqueda o #ancla); ni sus subrutas ni un prefijo
 *  suelto ("/creador-de-relojes-viejo") cuentan. */
export function isFocusRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return FOCUS_ROUTES.includes(path);
}
