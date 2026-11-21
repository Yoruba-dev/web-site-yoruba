// ---------------------------------------------------------------------------
// PRECARGA DE CAPAS — para que una opción ya esté descargada (y decodificada)
// cuando el cliente la elige: el editor llama preloadWatchLayers(candidato) al
// pasar el ratón o el dedo por una ficha.
//
//   onPointerEnter={() => preloadWatchLayers(withPart(config, "correa", id))}
//
// Pide exactamente las URLs que elegirá el <picture> del escenario (la de 600
// en pantallas pequeñas, CAPA_MEDIA_600; la de 1200 en el resto), así que no
// hay descargas dobles. Cada URL se pide una sola vez por página. En el
// servidor no hace nada.
// ---------------------------------------------------------------------------
import type { WatchConfig } from "@/lib/watch";
import { CAPA_MEDIA_600, apliqueUrl, capaUrl, nombresCapas, tapaUrl, type CapaSize } from "@/lib/watch-capas";

type LayerConfig = Pick<WatchConfig, "acabado" | "correa" | "esfera" | "aplique">;

const cache = new Map<string, Promise<void>>();

/** El tamaño de capa que usa el escenario en esta pantalla. */
export function preferredCapaSize(): CapaSize {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return 1200;
  return window.matchMedia(CAPA_MEDIA_600).matches ? 600 : 1200;
}

/** Descarga y decodifica una imagen (una vez por URL). Nunca rechaza. */
export function preloadImage(url: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  let p = cache.get(url);
  if (!p) {
    p = new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        (typeof img.decode === "function" ? img.decode() : Promise.resolve()).catch(() => undefined).then(() => resolve());
      };
      img.onerror = () => {
        cache.delete(url); // un fallo de red no se queda en caché
        resolve();
      };
      img.src = url;
    });
    cache.set(url, p);
  }
  return p;
}

/** Las URLs que pinta el escenario para este reloj (frente; con `tapa`, también
 *  la foto de la tapa). */
export function watchLayerUrls(c: LayerConfig, opts: { size?: CapaSize; tapa?: boolean } = {}): string[] {
  const size = opts.size ?? preferredCapaSize();
  const n = nombresCapas(c);
  // El aplique va siempre en 256 px (mide ~87 px en la plantilla de 1200).
  const urls = [capaUrl(n.correa, size), capaUrl(n.esfera, size), capaUrl(n.caja, size), apliqueUrl(n.aplique, 600)];
  if (opts.tapa) urls.push(tapaUrl(1024));
  return urls;
}

/** Precarga las capas de un reloj (p. ej. el que resultaría de la opción bajo
 *  el cursor). Resuelve cuando todas están listas o han fallado. */
export function preloadWatchLayers(c: LayerConfig, opts: { size?: CapaSize; tapa?: boolean } = {}): Promise<void> {
  return Promise.all(watchLayerUrls(c, opts).map(preloadImage)).then(() => undefined);
}
