import { useCallback, useEffect, useRef, useState } from "react";
import { preloadWatchLayers } from "@/components/watch/WatchFront";
import { isPartId, withPart, type PartCategory, type WatchConfig } from "@/lib/watch";

/** Precarga las fotos del reloj que saldría al elegir `id` (al pasar el ratón o
 *  enfocar la ficha), para que el escenario cambie al instante al pulsar. */
export function previewPart(c: WatchConfig, cat: PartCategory, id: string): Promise<void> {
  return isPartId(cat, id) ? preloadWatchLayers(withPart(c, cat, id)) : Promise.resolve();
}

/** Cuánto se espera antes de enseñar el aro (lo que carga antes no lo lleva). */
const ESPERA_MS = 300;

/** El aro de espera SOBRE la muestra: [opción que aún carga, avisar(opción,
 *  promesa de su foto)]. Solo sale si la foto tarda más de 300 ms, y se va al
 *  llegar (o al elegir otra). */
export function useEspera<T extends string>(): [T | null, (id: T, carga: Promise<void>) => void] {
  const [id, setId] = useState<T | null>(null);
  const turno = useRef(0);
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);
  const avisar = useCallback((x: T, carga: Promise<void>) => {
    const n = ++turno.current;
    const mio = () => vivo.current && turno.current === n;
    setId(null);
    const t = window.setTimeout(() => mio() && setId(x), ESPERA_MS);
    void carga.finally(() => {
      window.clearTimeout(t);
      if (mio()) setId(null);
    });
  }, []);
  return [id, avisar];
}
