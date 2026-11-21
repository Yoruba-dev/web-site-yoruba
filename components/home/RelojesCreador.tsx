import "@/app/relojes-creador.css";
import { SECCION_RELOJES, rutaCreadorRelojes } from "@/lib/site";
import {
  DEFAULT_TAPA,
  DIAL_MODELS,
  ORISHA_WATCH_PRESETS,
  PRESET_ORDER,
  TRACK_SEQUENCES,
  WATCH_COLORS,
  WATCH_IFA_NOTE,
  WATCH_ODU_NOTE,
  WATCH_ORIGIN,
  WATCH_PROOF_NOTE,
  beadAt,
  resolvePreset,
  type OrishaId,
  type PresetId,
  type WatchConfig,
} from "@/lib/watch";
import { CASEBACK_LAYOUT, polar, signPrimitives } from "@/lib/watch-art";
import { laserSvg } from "@/lib/watch-svg";
import { ODU_MEJI } from "@/lib/odu";

// ---------------------------------------------------------------------------
// LA BANDA DEL CREADOR DE RELOJES — lo primero de la portada bajo el carrusel.
//
// Componente de SERVIDOR y solo imágenes estáticas: nada de WebGL ni de three,
// ni una línea de JS en el cliente (el LCP de la portada no cambia). Las fichas
// son <a> normales, no <Link>: así la portada no precarga el creador (que sí es
// pesado) por cada ficha que entra en pantalla.
//
// Las fotos son renders ilustrativos (Meshy), rotulados como tales. No hay
// render de Ifá: su ficha es tipográfica — los 16 Meyis en oro, dibujados con
// la MISMA geometría que imprime la esfera (signPrimitives de lib/watch-art).
// La tapa lleva encima el grabado real de Baba Ejiogbe (laserSvg, el archivo
// que recibe el láser), encajado una vez sobre el campo liso de la foto.
//
// Se apaga con SECCION_RELOJES.activo (lib/site.ts). No lee Shopify: todavía no
// hay producto ni precios (DECISIONES-DUENO §1 y §11).
// ---------------------------------------------------------------------------

const DIR = "/assets/images/reloj";
const ANCHOS = [480, 720, 1024] as const;

function srcSet(base: string, ext: "avif" | "webp") {
  return ANCHOS.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");
}

/** Un render cuadrado en AVIF/WebP a 480/720/1024. `eager` = de los dos
 *  primeros: se pide ya, pero con prioridad baja para no competir con el
 *  banner del carrusel (el LCP). */
function Render({
  base,
  alt,
  sizes,
  eager = false,
}: {
  base: string;
  alt: string;
  sizes: string;
  eager?: boolean;
}) {
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(base, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(base, "webp")} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}-720.webp`}
        alt={alt}
        width={1024}
        height={1024}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "low" : undefined}
        decoding="async"
      />
    </picture>
  );
}

// --- Las cuentas de la pista, en pequeño ------------------------------------
/** Una fila de cuentas con la secuencia real de la pista del Orisha
 *  (TRACK_SEQUENCES + beadAt: la misma que imprime la esfera). SVG, porque el
 *  reset global `* { border-radius: 0 !important }` cuadra los círculos CSS. */
function Cuentas({ orisha, n = 7 }: { orisha: OrishaId; n?: number }) {
  const seq = TRACK_SEQUENCES[orisha];
  const paso = 7;
  return (
    <svg
      className="pyj-rc_cuentas"
      viewBox={`0 0 ${n * paso} ${paso}`}
      width={n * paso}
      height={paso}
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: n }, (_, i) => {
        const b = beadAt(seq, i);
        return (
          <circle
            key={i}
            cx={paso / 2 + i * paso}
            cy={paso / 2}
            r={b.acento ? 3.1 : 2.6}
            fill={WATCH_COLORS[b.color].hex}
            stroke={b.raya ? WATCH_COLORS[b.raya].hex : "rgba(255,255,255,0.28)"}
            strokeWidth={b.raya ? 1.3 : 0.6}
          />
        );
      })}
    </svg>
  );
}

// --- La ficha de Ifá: el emblema ----------------------------------------------
/** Los 16 Meyis en su orden tradicional (Baba Ejiogbe a las 12 y en sentido
 *  horario), cada uno DERECHO — solo se traslada, nunca se gira ni se refleja —,
 *  con la pista de Orula alrededor e IFÁ al centro. Unidades: el disco mide
 *  100 de lado. */
const EMBLEMA = { anilloR: 31, tintaH: 9.6, barras: 1.8, pistaR: 43.2, cuentaR: 1.05 } as const;

function EmblemaIfa() {
  const oro = "url(#pyj-rc-oro)";
  const f = (n: number) => n.toFixed(2);
  const signos = ODU_MEJI.flatMap((odu, k) => {
    const p = polar(EMBLEMA.anilloR, k * (360 / ODU_MEJI.length));
    return signPrimitives({ tipo: "meyi", oduId: odu.id }, p.x, p.y, EMBLEMA.tintaH, oro, "impresion", "barras", {
      barScale: EMBLEMA.barras,
    });
  })
    .map((s) => (s.kind === "rect" ? `M${f(s.x)} ${f(s.y)}h${f(s.w)}v${f(s.h)}h${f(-s.w)}z` : ""))
    .join("");
  // Las 60 cuentas, un trazo por color (cada una, un círculo hecho con dos arcos).
  const pista = TRACK_SEQUENCES.orula;
  const r = EMBLEMA.cuentaR;
  const cuentas: Record<string, string> = {};
  for (let i = 0; i < 60; i++) {
    const q = polar(EMBLEMA.pistaR, i * 6);
    const hex = WATCH_COLORS[beadAt(pista, i).color].hex;
    cuentas[hex] = (cuentas[hex] ?? "") + `M${f(q.x - r)} ${f(q.y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
  }
  return (
    <svg className="pyj-rc_emblema" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pyj-rc-oro" gradientUnits="userSpaceOnUse" x1="0" y1="-46" x2="0" y2="46">
          <stop offset="0" stopColor="#fff1c9" />
          <stop offset="0.3" stopColor="#f0cf78" />
          <stop offset="0.55" stopColor="#d9a93a" />
          <stop offset="0.75" stopColor="#a8781f" />
          <stop offset="1" stopColor="#f2d48a" />
        </linearGradient>
        <radialGradient id="pyj-rc-verde" cx="0" cy="-8" r="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1c6a44" />
          <stop offset="0.55" stopColor="#0f4229" />
          <stop offset="1" stopColor="#05170e" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="48.6" fill="none" stroke={oro} strokeWidth="0.7" />
      <circle cx="0" cy="0" r="47.2" fill="url(#pyj-rc-verde)" />
      {/* la pista de cuentas de Orula: verde y amarillo alternos */}
      <g stroke="rgba(255,240,200,0.35)" strokeWidth="0.25">
        {Object.entries(cuentas).map(([hex, d]) => (
          <path key={hex} d={d} fill={hex} />
        ))}
      </g>
      <circle cx="0" cy="0" r="40.2" fill="none" stroke={oro} strokeWidth="0.25" opacity="0.55" />
      {/* todas las barras en un solo trazo (≈190 rectángulos: un <rect> por
          barra pesaba 3× más en el HTML de la portada) */}
      <path d={signos} fill={oro} />
      <circle cx="0" cy="0" r="20" fill="none" stroke={oro} strokeWidth="0.25" opacity="0.55" />
      <text
        x="1"
        y="5"
        textAnchor="middle"
        fontFamily="Cinzel, Georgia, serif"
        fontWeight="600"
        fontSize="14"
        letterSpacing="2"
        fill={oro}
      >
        IFÁ
      </text>
    </svg>
  );
}

// --- La tapa: el grabado real sobre la foto -------------------------------------
/** El reloj de muestra de la tapa: Baba Ejiogbe con su nombre y "TU NOMBRE". */
const TAPA_MUESTRA: WatchConfig = {
  ...resolvePreset("ifa"),
  acabado: "acero",
  tapa: { ...DEFAULT_TAPA, signo: { tipo: "meyi", oduId: "eji-ogbe" }, linea1: "TU NOMBRE" },
};

/** Medido UNA vez sobre home/tapa-1024 (perfiles de luminancia a lo largo de
 *  los dos ejes): el campo liso de la tapa tiene su centro en (511.5, 511.3) px
 *  y su borde pulido a 244 px. Ese borde es el filo del campo de casebackSvg
 *  (r 12.25 mm), así que 1 mm = 244 / 12.25 px. Si cambia la foto, se vuelve a
 *  medir y se cambian estas cuatro cifras. */
const TAPA_FOTO = { lado: 1024, cx: 511.5, cy: 511.3, campoPx: 244, campoMm: 12.25 } as const;

function encajeGrabado(): React.CSSProperties {
  const pxPorMm = TAPA_FOTO.campoPx / TAPA_FOTO.campoMm;
  // laserSvg dibuja el campo grabable entero: ±fieldR mm alrededor del centro.
  const medio = CASEBACK_LAYOUT.fieldR * pxPorMm;
  const pct = (v: number) => `${((v / TAPA_FOTO.lado) * 100).toFixed(3)}%`;
  return {
    left: pct(TAPA_FOTO.cx - medio),
    top: pct(TAPA_FOTO.cy - medio),
    width: pct(2 * medio),
  };
}

/** El archivo láser (negro, sin espejo, 12 arriba) sin su <title> técnico, que
 *  saldría como globo de ayuda. Se pinta en línea para que use la Cinzel de la
 *  página (un <img> SVG no puede cargar fuentes). */
const GRABADO_SVG = laserSvg(TAPA_MUESTRA).replace(/<title>[\s\S]*?<\/title>/, "");

// --- Las fichas -------------------------------------------------------------------
const FICHAS = PRESET_ORDER.filter((id): id is Exclude<PresetId, "cero"> => id !== "cero");

const RENDER_SIZES_FICHA = "(max-width: 767px) 62vw, 240px";

export default function RelojesCreador() {
  if (!SECCION_RELOJES.activo) return null;

  const ifa = ORISHA_WATCH_PRESETS.ifa;

  return (
    <section className="pyj-rc" aria-labelledby="pyj-rc-tit">
      <div className="container">
        <div className="pyj-rc_intro">
          <div className="pyj-rc_hero">
            <Render
              base={`${DIR}/home/trio`}
              alt="Render ilustrativo: tres relojes en los colores de Elegguá, Changó y Yemayá — esfera roja con correa negra, esfera blanca con correa roja y esfera blanca con correa azul"
              sizes="(max-width: 991px) 100vw, 560px"
              eager
            />
            <span className="pyj-rc_tag">Render ilustrativo</span>
          </div>

          <div className="pyj-rc_copy">
            <span className="pyj-eyebrow pyj-rc_eyebrow">
              <span aria-hidden="true">✦ </span>Nuevo · Creador de relojes<span aria-hidden="true"> ✦</span>
            </span>
            <h2 id="pyj-rc-tit" className="pyj-rc_tit">
              Crea tu reloj en los colores de tu Orisha
            </h2>
            <p className="pyj-rc_sub">
              Elige tu Orisha, tu correa y tu signo — y míralo armarse frente a ti.
            </p>
            <ol className="pyj-rc_pasos">
              <li>
                <b>Tu Orisha</b>
                <span>la esfera y la pista en sus colores</span>
              </li>
              <li>
                <b>Tu correa</b>
                <span>caucho, piel o brazalete</span>
              </li>
              <li>
                <b>Tu signo</b>
                <span>grabado en la tapa</span>
              </li>
            </ol>
            <div className="pyj-rc_ctas">
              <a href={SECCION_RELOJES.ruta} className="pyj-btn-gold">
                Diseñar mi reloj
              </a>
              <a href={`${SECCION_RELOJES.ruta}#como-funciona`} className="pyj-rc_link">
                Cómo funciona <span aria-hidden="true">→</span>
              </a>
            </div>
            <p className="pyj-rc_letra">
              {WATCH_ORIGIN}. El precio se confirma con tu diseño. {WATCH_PROOF_NOTE}
            </p>
          </div>
        </div>

        <div className="pyj-rc_railhead">
          <h3>Empieza con tu Orisha</h3>
          <p>Toca uno y ajústalo a tu gusto: acabado, correa, texto y signo.</p>
        </div>
        <ul className="pyj-rc_rail" aria-label="Diseños de inicio por Orisha">
          {FICHAS.map((id, i) => {
            const p = ORISHA_WATCH_PRESETS[id];
            const href = rutaCreadorRelojes(id);
            if (id === "ifa") {
              return (
                <li key={id} className="pyj-rc_card pyj-rc_card--ifa">
                  <a href={href} title={WATCH_IFA_NOTE}>
                    <span className="pyj-rc_media pyj-rc_media--ifa">
                      <EmblemaIfa />
                    </span>
                    <span className="pyj-rc_label">
                      <span className="pyj-rc_name">
                        {ifa.label}
                        <span className="pyj-rc_estrella">Pieza estrella</span>
                      </span>
                      <span className="pyj-rc_nota">{DIAL_MODELS.ifa.label} · los 16 Meyis</span>
                    </span>
                  </a>
                </li>
              );
            }
            return (
              <li key={id} className="pyj-rc_card">
                <a href={href}>
                  <span className="pyj-rc_media">
                    <Render
                      base={`${DIR}/presets/${id}`}
                      alt={`Render ilustrativo: reloj en los colores de ${p.label}`}
                      sizes={RENDER_SIZES_FICHA}
                      eager={i === 1}
                    />
                  </span>
                  <span className="pyj-rc_label">
                    <span className="pyj-rc_name">{p.label}</span>
                    {p.orisha && <Cuentas orisha={p.orisha} />}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <p className="pyj-rc_micro">Render ilustrativo · en el creador lo ves armarse pieza por pieza.</p>

        <ul className="pyj-rc_feats">
          <li className="pyj-rc_feat">
            <div className="pyj-rc_featmedia">
              <span className="pyj-rc_sq">
                <Render
                  base={`${DIR}/home/pista-de-cuentas`}
                  alt="Render ilustrativo: detalle de la esfera verde con la pista de cuentas verdes y amarillas"
                  sizes="(max-width: 767px) 128px, 360px"
                />
              </span>
            </div>
            <div className="pyj-rc_feattxt">
              <h3>Pista de cuentas</h3>
              <p>
                Los minutos, marcados con cuentas en los colores de tu Orisha —
                como las de su eleke.
              </p>
            </div>
          </li>
          <li className="pyj-rc_feat">
            <div className="pyj-rc_featmedia">
              <span className="pyj-rc_sq">
                <Render
                  base={`${DIR}/home/tapa`}
                  alt="Render ilustrativo: la tapa del reloj con el signo Baba Ejiogbe y TU NOMBRE grabados"
                  sizes="(max-width: 767px) 128px, 360px"
                />
                <span
                  className="pyj-rc_grabado"
                  style={encajeGrabado()}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: GRABADO_SVG }}
                />
              </span>
            </div>
            <div className="pyj-rc_feattxt">
              <h3>Tu signo al dorso</h3>
              <p>
                Tu Odù grabado a láser en la tapa, con tu nombre o una fecha —
                siempre derecho, como en tu libreta.
              </p>
              <small>{WATCH_ODU_NOTE}</small>
            </div>
          </li>
          <li className="pyj-rc_feat">
            <div className="pyj-rc_featmedia">
              <span className="pyj-rc_sq">
                <Render
                  base={`${DIR}/home/modo-noche`}
                  alt="Render ilustrativo: el reloj a oscuras, con agujas e índices luminosos"
                  sizes="(max-width: 767px) 128px, 360px"
                />
              </span>
            </div>
            <div className="pyj-rc_feattxt">
              <h3>Modo noche</h3>
              <p>
                En la esfera clásica, agujas e índices luminosos: la hora se lee
                también a oscuras.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
