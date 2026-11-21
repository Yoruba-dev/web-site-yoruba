// ---------------------------------------------------------------------------
// RUTAS DE ENFOQUE — páginas que son una herramienta a pantalla completa (el
// creador de relojes). En ellas:
//   • la barra de pestañas del móvil (MobileTabBar) NO se pinta: la página trae
//     su propio pie fijo con el botón principal;
//   • los popups de bienvenida (NewsletterPopup) y de oferta (PromoPopup) NO
//     salen: interrumpir a alguien a mitad de diseñar es perder el diseño.
// Añadir una herramienta nueva = añadir su ruta aquí, nada más.
// ---------------------------------------------------------------------------

/** Rutas (prefijos exactos de segmento) que se muestran en modo enfoque. */
export const FOCUS_ROUTES: readonly string[] = ["/creador-de-relojes"];

/** true si `pathname` es una ruta de enfoque o una subruta suya
 *  ("/creador-de-relojes", "/creador-de-relojes/…"), nunca un prefijo suelto
 *  ("/creador-de-relojes-viejo" no cuenta). */
export function isFocusRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return FOCUS_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));
}
