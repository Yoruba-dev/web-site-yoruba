"use client";

import { useEffect, useRef, useState } from "react";
import {
  CLAVE_TALLA,
  CONSEJO_ANILLO_ANCHO,
  MM_MAX,
  MM_MIN,
  etiquetaTalla,
  mediaTallaCercana,
  tallaRecomendada,
} from "@/lib/ring-size";

// ---------------------------------------------------------------------------
// El medidor de talla de anillo.
//
// POR QUÉ HAY QUE CALIBRAR
// ------------------------
// Un círculo de "17 mm" dibujado en CSS no mide 17 mm en ninguna pantalla real:
// el píxel de CSS es 1/96 de pulgada NOMINAL, no física. En un iPhone ese
// círculo mide 10.6 mm; en un Samsung, 11.5; en un monitor, 17.7. Y el navegador
// no expone la densidad física de la pantalla por ninguna API.
//
// Así que se hace lo que hacen todos los medidores serios: la clienta apoya una
// tarjeta bancaria en la pantalla y ajusta una banda hasta que coincide. Todas
// las tarjetas del mundo miden lo mismo (ISO/IEC 7810 ID-1: 85.60 × 53.98 mm),
// así que con eso la web sabe cuántos píxeles mide un milímetro EN ESE aparato.
// Se usa el lado corto porque el largo no cabe en un móvil.
//
// La calibración se guarda ligada a una huella de la pantalla; si cambia (otro
// aparato, otro zoom), se vuelve a pedir. Con 0.5 mm de error de ojo al
// calibrar, el error en un anillo de 20 mm es de 0.19 mm: un cuarto de talla.
//
// POR QUÉ UN DISCO RELLENO Y NO UN ARO
// ------------------------------------
// El anillo es opaco: apoyado en la pantalla, lo único que se ve es lo que
// queda dentro del hueco. Con un disco claro sobre fondo oscuro, "demasiado
// pequeño" se ve como una media luna oscura por un lado, y "demasiado grande"
// como que la línea fina del borde desaparece. Las dos señales se ven desde
// dentro del hueco, sin apartar el anillo. Un aro fino se pierde bajo el metal.
// ---------------------------------------------------------------------------

/** Lado corto de una tarjeta bancaria, ISO/IEC 7810 ID-1. */
const TARJETA_MM = 53.98;
const CLAVE_CALIBRACION = "pyj-medidor-calibracion";

type Pantalla = "calibrar" | "medir" | "resultado";

export interface AnilloObjetivo {
  handle: string;
  title: string;
  /** Tallas que tiene ese anillo, ya normalizadas a número. */
  tallas: number[];
}

/** Huella de la pantalla: si cambia, la calibración guardada no vale. */
function huellaPantalla(): string {
  return `${screen.width}x${screen.height}@${window.devicePixelRatio}`;
}

function leerCalibracion(): number | null {
  try {
    const raw = localStorage.getItem(CLAVE_CALIBRACION);
    if (!raw) return null;
    const d = JSON.parse(raw) as { pxPorMm: number; huella: string };
    if (d.huella !== huellaPantalla()) return null;
    return d.pxPorMm > 0 ? d.pxPorMm : null;
  } catch {
    return null;
  }
}

function guardarCalibracion(pxPorMm: number) {
  try {
    localStorage.setItem(
      CLAVE_CALIBRACION,
      JSON.stringify({ pxPorMm, huella: huellaPantalla() }),
    );
  } catch {
    /* modo privado o almacenamiento bloqueado: se mide igual, sin recordar */
  }
}

export default function RingSizer({ anillo }: { anillo?: AnilloObjetivo | null }) {
  // Todo lo que depende del navegador arranca vacío y se rellena tras montar:
  // así el HTML del servidor no trae nada que dependa de una pantalla que
  // todavía no existe.
  const [pantalla, setPantalla] = useState<Pantalla | null>(null);
  const [pxPorMm, setPxPorMm] = useState<number | null>(null);
  // Ancho de la banda de calibración, en px CSS.
  const [bandaPx, setBandaPx] = useState(320);
  // Diámetro que se está midiendo, en mm.
  const [mm, setMm] = useState(19.0);
  const [conZoom, setConZoom] = useState(false);
  const tituloResultado = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const guardado = leerCalibracion();
    if (guardado) {
      setPxPorMm(guardado);
      setPantalla("medir");
    } else {
      // Arranque razonable: en un móvil típico la tarjeta ocupa ~80% del ancho.
      setBandaPx(Math.round(Math.min(window.innerWidth * 0.8, 520)));
      setPantalla("calibrar");
    }
  }, []);

  // El zoom del navegador descalibra todo. El pellizco en móvil se ve en
  // visualViewport.scale; el zoom de página en escritorio cambia el
  // devicePixelRatio, que ya invalida la huella guardada.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const revisar = () => setConZoom(Math.abs(vv.scale - 1) > 0.01);
    revisar();
    vv.addEventListener("resize", revisar);
    return () => vv.removeEventListener("resize", revisar);
  }, []);

  // Que la pantalla no se apague mientras alinea el anillo con las dos manos.
  useEffect(() => {
    if (pantalla !== "medir") return;
    let lock: { release: () => Promise<void> } | null = null;
    (async () => {
      try {
        lock = await (navigator as Navigator & {
          wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
        }).wakeLock?.request("screen") ?? null;
      } catch {
        /* no soportado o denegado: sin drama */
      }
    })();
    return () => {
      lock?.release().catch(() => {});
    };
  }, [pantalla]);

  // Al llegar al resultado, el foco va al título para que un lector de
  // pantalla lo anuncie y el teclado siga desde ahí.
  useEffect(() => {
    if (pantalla === "resultado") tituloResultado.current?.focus();
  }, [pantalla]);

  function aceptarCalibracion() {
    const ratio = bandaPx / TARJETA_MM;
    guardarCalibracion(ratio);
    setPxPorMm(ratio);
    setPantalla("medir");
  }

  function recalibrar() {
    try {
      localStorage.removeItem(CLAVE_CALIBRACION);
    } catch {
      /* nada */
    }
    setPantalla("calibrar");
  }

  function aceptarMedida() {
    try {
      localStorage.setItem(CLAVE_TALLA, String(tallaRecomendada(mm)));
    } catch {
      /* nada */
    }
    setPantalla("resultado");
  }

  const ajustar = (delta: number) =>
    setMm((v) => Math.min(MM_MAX, Math.max(MM_MIN, Math.round((v + delta) * 10) / 10)));

  if (pantalla === null) {
    return <div className="pyj-sizer pyj-sizer--cargando" aria-busy="true" />;
  }

  const avisoZoom = conZoom && (
    <p className="pyj-sizer_zoom" role="alert">
      Tienes el zoom activado. Quítalo (pellizca hacia dentro) o la medida
      saldrá mal.
    </p>
  );

  // ---------------------------------------------------------------- calibrar
  if (pantalla === "calibrar") {
    return (
      <section className="pyj-sizer" aria-labelledby="sizer-cal-titulo">
        <span className="pyj-sizer_paso">Paso 1 de 2</span>
        <h2 id="sizer-cal-titulo">Calibra tu pantalla</h2>
        <p>
          Cada teléfono dibuja los milímetros de un tamaño distinto. Con una
          tarjeta bancaria —todas miden lo mismo— le enseñamos a tu pantalla
          cuánto es un milímetro. Se hace una vez.
        </p>
        <ol className="pyj-sizer_pasos">
          <li>Pon el teléfono en una mesa, plano.</li>
          <li>
            Apoya tu tarjeta <strong>de pie, por el lado corto</strong>, con el
            borde izquierdo pegado a la línea.
          </li>
          <li>
            Mueve el deslizador hasta que el borde derecho de la banda quede
            justo en el borde derecho de la tarjeta.
          </li>
        </ol>

        {avisoZoom}

        <div className="pyj-sizer_zona pyj-sizer_zona--cal" aria-hidden="true">
          <div className="pyj-sizer_linea" />
          <div className="pyj-sizer_banda" style={{ width: bandaPx }}>
            <span>← tarjeta →</span>
          </div>
        </div>

        <div className="pyj-sizer_control">
          <button
            type="button"
            className="pyj-sizer_btn"
            onClick={() => setBandaPx((v) => Math.max(120, v - 1))}
            aria-label="Un píxel menos"
          >
            −
          </button>
          <input
            type="range"
            className="pyj-sizer_range"
            min={120}
            max={Math.max(600, bandaPx)}
            step={1}
            value={bandaPx}
            onChange={(e) => setBandaPx(Number(e.target.value))}
            aria-label="Ancho de la banda de calibración"
            aria-valuetext={`${bandaPx} píxeles`}
          />
          <button
            type="button"
            className="pyj-sizer_btn"
            onClick={() => setBandaPx((v) => v + 1)}
            aria-label="Un píxel más"
          >
            +
          </button>
        </div>

        <button type="button" className="pyj-btn-gold pyj-sizer_cta" onClick={aceptarCalibracion}>
          Coincide — seguir
        </button>
      </section>
    );
  }

  const diametroPx = pxPorMm ? mm * pxPorMm : 0;
  const media = mediaTallaCercana(mm);
  const recomendada = tallaRecomendada(mm);

  // ------------------------------------------------------------------- medir
  if (pantalla === "medir") {
    return (
      <section className="pyj-sizer" aria-labelledby="sizer-med-titulo">
        <span className="pyj-sizer_paso">Paso 2 de 2</span>
        <h2 id="sizer-med-titulo">Mide tu anillo</h2>
        {anillo && (
          <p className="pyj-sizer_para">
            Midiendo para: <strong>{anillo.title}</strong>
          </p>
        )}
        <p>
          Pon encima del disco un anillo <strong>que ya te quede bien en ese
          dedo</strong>. Ajusta hasta que el disco llene el hueco:{" "}
          <strong>sin sombra oscura y con la línea fina aún visible</strong>.
          Míralo desde arriba, con un ojo cerrado.
        </p>

        {avisoZoom}

        <div className="pyj-sizer_zona" aria-hidden="true">
          <div
            className="pyj-sizer_disco"
            style={{ width: diametroPx, height: diametroPx }}
          >
            <span className="pyj-sizer_disco_valor">
              {mm.toFixed(1)}
              <small>mm · {etiquetaTalla(media)}</small>
            </span>
          </div>
        </div>

        <div className="pyj-sizer_control">
          <button type="button" className="pyj-sizer_btn" onClick={() => ajustar(-0.1)} aria-label="Una décima de milímetro menos">
            −
          </button>
          <input
            type="range"
            className="pyj-sizer_range"
            min={MM_MIN}
            max={MM_MAX}
            step={0.1}
            value={mm}
            onChange={(e) => setMm(Number(e.target.value))}
            aria-label="Diámetro interior del anillo"
            aria-valuetext={`${mm.toFixed(1)} milímetros, talla ${etiquetaTalla(media)}`}
          />
          <button type="button" className="pyj-sizer_btn" onClick={() => ajustar(0.1)} aria-label="Una décima de milímetro más">
            +
          </button>
        </div>
        <output className="pyj-sizer_lectura" aria-live="polite">
          {mm.toFixed(1)} mm — talla {etiquetaTalla(media)}
        </output>

        <button type="button" className="pyj-btn-gold pyj-sizer_cta" onClick={aceptarMedida}>
          Esta es mi talla
        </button>
        <button type="button" className="pyj-sizer_enlace" onClick={recalibrar}>
          Volver a calibrar la pantalla
        </button>
      </section>
    );
  }

  // --------------------------------------------------------------- resultado
  const entreDos = media !== recomendada;
  const laTiene = anillo ? anillo.tallas.includes(recomendada) : null;
  const hrefAnillo = anillo
    ? `/products/${encodeURIComponent(anillo.handle)}?talla=${recomendada}`
    : null;

  return (
    <section className="pyj-sizer pyj-sizer--resultado" aria-labelledby="sizer-res-titulo">
      <span className="pyj-sizer_paso">Tu talla</span>
      <h2 id="sizer-res-titulo" ref={tituloResultado} tabIndex={-1}>
        <span className="pyj-sizer_talla">{etiquetaTalla(recomendada)}</span>
      </h2>
      <p className="pyj-sizer_mm">
        {mm.toFixed(1)} mm de diámetro interior
        {entreDos && <> · mediste {etiquetaTalla(media)}</>}
      </p>

      {entreDos && (
        <p className="pyj-sizer_nota">
          Estás entre dos tallas. Te recomendamos la <strong>{etiquetaTalla(recomendada)}</strong>:
          un anillo grande se achica fácil; uno pequeño hay que cortarlo, y en
          los de Ifá eso toca el dibujo.
        </p>
      )}
      <p className="pyj-sizer_nota">{CONSEJO_ANILLO_ANCHO}</p>

      {anillo && laTiene && hrefAnillo && (
        <a href={hrefAnillo} className="pyj-btn-gold pyj-sizer_cta">
          Ver {anillo.title.split(" — ")[0]} en talla {etiquetaTalla(recomendada)}
        </a>
      )}
      {anillo && laTiene === false && (
        <p className="pyj-sizer_nota pyj-sizer_nota--encargo">
          <strong>{anillo.title.split(" — ")[0]}</strong> no viene en la{" "}
          {etiquetaTalla(recomendada)} de serie — pero se hace a tu medida por
          encargo. Escríbenos por WhatsApp con tu talla y lo preparamos.
        </p>
      )}
      {!anillo && (
        <a href="/collections/anillos" className="pyj-btn-gold pyj-sizer_cta">
          Ver los anillos
        </a>
      )}

      <p className="pyj-sizer_honesto">
        Orientativo, con margen de media talla. Cualquier anillo del taller se
        ajusta a tu dedo sin costo.
      </p>

      <div className="pyj-sizer_otra">
        <button type="button" className="pyj-sizer_enlace" onClick={() => setPantalla("medir")}>
          Medir otra vez
        </button>
        <button type="button" className="pyj-sizer_enlace" onClick={recalibrar}>
          Recalibrar
        </button>
      </div>
    </section>
  );
}
