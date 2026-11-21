import { preloadWatchLayers } from "@/components/watch/WatchFront";
import { isPartId, withPart, type PartCategory, type WatchConfig } from "@/lib/watch";

/** Precarga las fotos del reloj que saldría al elegir `id` (al pasar el ratón o
 *  enfocar la ficha), para que el escenario cambie al instante al pulsar. */
export function previewPart(c: WatchConfig, cat: PartCategory, id: string): void {
  if (isPartId(cat, id)) void preloadWatchLayers(withPart(c, cat, id));
}
