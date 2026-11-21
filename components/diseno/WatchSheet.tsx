import Link from "next/link";
import type { ReactNode } from "react";
// El reloj pintado y el CSS de la hoja (reloj.css) llegan con WatchSheetViews,
// en un paquete aparte: las hojas del anillo y la moneda (/diseno también) no
// descargan nada del reloj.
import WatchSheetViews from "./WatchSheetViews";
import { SITE, SITE_URL } from "@/lib/site";
import {
  DIAL_MODELS,
  TRACK_SEQUENCES,
  WATCH_COLORS,
  WATCH_PROOF_NOTE,
  WATCH_SPECS,
  designCode,
  dialInk,
  getAppliquePart,
  getClasp,
  getDialBase,
  getFinish,
  getSecondsPart,
  getStrap,
  lineProperties,
  validate,
  type NormalizeReport,
  type Part,
} from "@/lib/watch";
import { CASEBACK_LAYOUT, DIAL_LAYOUT, dialHasDate } from "@/lib/watch-art";
import { svgDataUrl } from "@/lib/watch-svg";
// Texto en CURVAS (contornos reales de Cinzel / Cormorant): la vista previa de
// la hoja y el archivo que abre el láser o la impresora son idénticos, sin
// depender de las fuentes de ninguna máquina. Solo servidor (~116 KB de tabla).
import { dialPrintSvgCurvas, laserSvgCurvas } from "@/lib/watch-curvas";

// ---------------------------------------------------------------------------
// HOJA DEL TALLER del reloj (/diseno?d=… con piece "reloj"). La abre el dueño
// desde el pedido o desde el WhatsApp: el reloj de frente y de espaldas, la
// impresión de la esfera y el láser de la tapa a 1:1 en mm, la ficha completa
// en lenguaje de taller, las casillas de control y las descargas.
// Componente de servidor (noindex lo pone app/diseno/page.tsx). Todo sale del
// reloj ya NORMALIZADO (decodeWatchDesign): nunca del payload crudo.
// ---------------------------------------------------------------------------

/** SVG → enlace de descarga, tal cual (sin tocar comillas: es el archivo). */
const downloadHref = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "Referencia ABC · nota" de una pieza del catálogo, para el taller. */
function partNote(p: Part | undefined): string | null {
  if (!p) return null;
  const bits = [p.sku ? `Ref. ${p.sku}` : "", p.nota ?? ""].filter(Boolean);
  return bits.length ? bits.join(" · ") : null;
}

export default function WatchSheet({
  report,
  d,
  pieza,
  actions,
}: {
  report: NormalizeReport;
  /** El código ?d= tal como llegó (para "Abrir en el creador"). */
  d: string;
  /** Producto de Shopify, si el diseño se hizo atado a uno. */
  pieza?: { title?: string; variant?: string };
  /** Botón de imprimir (componente de cliente de app/diseno). */
  actions?: ReactNode;
}) {
  const c = report.config;
  const code = designCode(c);
  const dParam = encodeURIComponent(d);
  const sheetUrl = `${SITE_URL}/diseno?d=${dParam}`;
  const fecha = new Intl.DateTimeFormat("es-US", { dateStyle: "long", timeZone: "America/New_York" }).format(new Date());
  const validation = validate(c);
  const bloqueos = validation.issues.filter((i) => i.nivel === "bloqueo");
  const avisos = validation.issues.filter((i) => i.nivel === "aviso");

  const finish = getFinish(c.acabado);
  const base = getDialBase(c.esfera.base);
  const strap = getStrap(c.correa);
  const ink = dialInk(c.esfera.base);
  const seq = c.esfera.pista.orisha ? TRACK_SEQUENCES[c.esfera.pista.orisha] : null;

  // La ficha: las mismas propiedades que lleva el pedido (lineProperties: una
  // sola fuente), sin el enlace, más los datos que solo necesita el taller.
  const props = lineProperties(c, code, sheetUrl).filter((p) => !p.key.startsWith("🔗"));
  const extra: { key: string; value: string }[] = [
    {
      key: "Movimiento",
      value: `${WATCH_SPECS.movement} automático · ventana de fecha a las 3: ${dialHasDate(c) ? "sí" : "no (disco sin ventana)"}`,
    },
    { key: "Modelo de esfera", value: `${DIAL_MODELS[c.esfera.modelo].label} — ${DIAL_MODELS[c.esfera.modelo].nota}` },
    {
      key: "Esfera · acabado y lume",
      value: `${base?.textura === "sol" ? "Sol (rayos)" : (base?.textura ?? "")} · lume ${base?.lume ?? "—"}`,
    },
    ...(seq ? [{ key: "Pista · secuencia", value: seq.nota }] : []),
    {
      key: "Tinta del texto",
      value: `${ink.id === "oro" ? "Dorada clara" : "Dorada oscura"} ${ink.hex} · contraste ${ink.contraste.toFixed(1)}:1 sobre ${lower(
        WATCH_COLORS[base?.color ?? "blanco"].nombre,
      )}`,
    },
    {
      key: "Agujas hora / minuto",
      value: `${finish?.metalAgujas === "oro-rosa" ? "Oro rosa" : "Acero pulido"} con lume (siguen el acabado ${finish?.label ?? ""})`,
    },
  ];
  const notas = [
    ["Acabado", partNote(finish)],
    ["Esfera", partNote(base)],
    ["Aplique", partNote(getAppliquePart(c.aplique))],
    ["Segundero", partNote(getSecondsPart(c.segundero))],
    ["Correa", partNote(strap)],
    ["Cierre", strap?.tipo === "brazalete" ? null : partNote(getClasp(c.cierre))],
  ].filter((n): n is [string, string] => !!n[1]);

  const dialSvg = dialPrintSvgCurvas(c);
  const laser = laserSvgCurvas(c);
  const dialMm = 2 * DIAL_LAYOUT.r;
  const laserMm = 2 * CASEBACK_LAYOUT.fieldR;

  return (
    <section className="pyj-sheet-page">
      <div className="pyj-sheet pyj-reloj_sheet">
        <header className="pyj-sheet_head pyj-reloj_sheethead">
          <span className="pyj-sheet_brand">{SITE.name}</span>
          <h1 className="pyj-sheet_title">Hoja de taller · Reloj</h1>
          <p className="pyj-reloj_sheetcode">
            <strong>{code}</strong> · {fecha}
          </p>
          {pieza?.title && (
            <p className="pyj-sheet_ring">
              {pieza.title}
              {pieza.variant ? ` · ${pieza.variant}` : ""}
            </p>
          )}
        </header>

        {(bloqueos.length > 0 || report.descontinuado.length > 0) && (
          <div className="pyj-reloj_sheetalert" role="alert">
            <strong>Revisar antes de producir</strong>
            <ul>
              {report.descontinuado.map((x) => (
                <li key={`${x.campo}-${x.valor}`}>
                  {x.campo}: el enlace traía «{x.valor}», se usa «{x.usado}».
                </li>
              ))}
              {bloqueos.map((i) => (
                <li key={`${i.regla}-${i.campo}`}>
                  {i.campo}: {i.motivo}
                </li>
              ))}
            </ul>
          </div>
        )}

        <WatchSheetViews config={c} />

        <div className="pyj-reloj_sheetfiles">
          <figure>
            <div className="pyj-reloj_sheetart">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={svgDataUrl(dialSvg)}
                alt={`Impresión de la esfera ${code} a tamaño real`}
                style={{ width: `${dialMm}mm`, height: `${dialMm}mm` }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={svgDataUrl(dialSvg)}
                alt=""
                aria-hidden="true"
                className="pyj-reloj_sheetzoom"
                style={{ width: `${dialMm * 4}mm`, height: `${dialMm * 4}mm` }}
              />
            </div>
            <figcaption>
              Impresión de la esfera · Ø{dialMm} mm · 1:1 y ×4 · 12 arriba · texto en curvas. Las guías cian no se
              imprimen.
            </figcaption>
          </figure>
          <figure>
            <div className="pyj-reloj_sheetart">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={svgDataUrl(laser)}
                alt={`Láser de la tapa ${code} a tamaño real`}
                style={{ width: `${laserMm}mm`, height: `${laserMm}mm` }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={svgDataUrl(laser)}
                alt=""
                aria-hidden="true"
                className="pyj-reloj_sheetzoom"
                style={{ width: `${laserMm * 4}mm`, height: `${laserMm * 4}mm` }}
              />
            </div>
            <figcaption>
              Láser de la tapa · campo Ø{laserMm} mm · 1:1 y ×4 · vista trasera · sin espejo · texto en curvas.
            </figcaption>
          </figure>
        </div>

        <table className="pyj-reloj_spec">
          <caption>Ficha del pedido</caption>
          <tbody>
            {[...props, ...extra].map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.key}</th>
                <td>{r.value}</td>
              </tr>
            ))}
            {notas.map(([k, v]) => (
              <tr key={`nota-${k}`} className="pyj-reloj_specnote">
                <th scope="row">Nota · {k}</th>
                <td>{v}</td>
              </tr>
            ))}
            {avisos.map((i) => (
              <tr key={`aviso-${i.regla}`} className="pyj-reloj_specnote">
                <th scope="row">Aviso</th>
                <td>{i.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <fieldset className="pyj-reloj_checks">
          <legend>Control del taller</legend>
          <label>
            <input type="checkbox" /> Ortografía confirmada (texto de la esfera, nombres y fecha de la tapa)
          </label>
          <label>
            <input type="checkbox" /> Prueba enviada al cliente
          </label>
          <label>
            <input type="checkbox" /> OK del cliente — fecha: ____________
          </label>
        </fieldset>

        <p className="pyj-sheet_foot">
          {WATCH_PROOF_NOTE} Nada se imprime ni se graba sin el OK. Los signos de Ifá son herencia Yoruba/Lucumí:
          se graban derechos respecto a las 12 y nunca en espejo.
        </p>

        <div className="pyj-sheet_actions">
          {actions}
          <a className="pyj-reloj_ghost" href={downloadHref(laser)} download={`${code}-tapa-laser-curvas.svg`}>
            Descargar SVG láser (mm · vista trasera · sin espejo · curvas)
          </a>
          <a className="pyj-reloj_ghost" href={downloadHref(dialSvg)} download={`${code}-esfera-impresion-curvas.svg`}>
            Descargar SVG impresión esfera (curvas)
          </a>
          <Link href={`/creador-de-relojes?d=${dParam}`} className="pyj-sheet_back">
            Abrir en el creador
          </Link>
        </div>
      </div>
    </section>
  );
}
