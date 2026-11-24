// Ilustraciones de los CIERRES (decisión 19 del dueño; PLAN-REALISMO-V3 3.4):
// la hebilla de púa (fotos 1, 5, 7 y 9), el desplegable de PUENTE (foto 10) y el
// plegable del brazalete, cerrados y vistos por fuera. Escala única: 5 px = 1 mm.
// El metal sigue el acabado de la caja y la correa, la elegida. SVG puro (sin
// imágenes ni filtros de ruido), con ids propios por instancia (useId).
import { Fragment, useId, type ReactNode } from "react";
import type { ClaspId, FinishId } from "@/lib/watch";

export type ClaspKind = ClaspId | "plegable";

interface Metal {
  /** brillo · claro · medio · sombra · hondo */
  hi: string;
  a: string;
  b: string;
  c: string;
  d: string;
}
const METAL: Readonly<Record<FinishId, Metal>> = {
  acero: { hi: "#ffffff", a: "#e3e7ea", b: "#b3bac0", c: "#79818a", d: "#2c3238" },
  "pvd-negro": { hi: "#b4b9bf", a: "#7a8086", b: "#4c5156", c: "#2d3034", d: "#0c0d0f" },
  "oro-rosa": { hi: "#fff3ea", a: "#f3cfba", b: "#d8a287", c: "#a06c53", d: "#4a2a1d" },
};

/** Aclara (k > 0) u oscurece (k < 0) un hex. */
function tono(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const t = k < 0 ? 0 : 255;
  const f = (v: number) => Math.round(v + (t - v) * Math.abs(k));
  return `#${((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
}

/** Rectángulo con esquinas redondeadas, como trazado (la web anula rx en CSS
 *  heredado; y así se puede componer con otros). */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}q${r} 0 ${r} ${r}v${h - 2 * r}q0 ${r} ${-r} ${r}h${2 * r - w}q${-r} 0 ${-r} ${-r}v${2 * r - h}q0 ${-r} ${r} ${-r}Z`;

type Stop = readonly [number, string, number?];
function Grad({ id, v, stops }: { id: string; v?: boolean; stops: readonly Stop[] }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={v ? 0 : 1} y2={v ? 1 : 0}>
      {stops.map(([o, c, a]) => (
        <stop key={o} offset={o} stopColor={c} stopOpacity={a} />
      ))}
    </linearGradient>
  );
}

export default function ClaspArt({
  kind,
  acabado,
  piel = false,
  color,
}: {
  kind: ClaspKind;
  acabado: FinishId;
  /** Correa de piel (filas de cocodrilo, pespunte); si no, caucho. */
  piel?: boolean;
  /** Color de la correa (hex). */
  color: string;
}) {
  const u = `pyjc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const M = METAL[acabado];
  const ref = (k: string) => `url(#${u}${k})`;

  // — Piezas comunes ————————————————————————————————————————————————————————
  /** La cola de la correa, de x0 a su punta en `x1`. */
  const punta = (x0: number, x1: number, t: number, b: number, largo: number) => {
    const m = (t + b) / 2;
    // Caucho: ojiva redonda (foto 1). Piel: punta más viva (fotos 5 y 10).
    return piel
      ? `M${x0} ${t}H${x1 - largo}Q${x1 - largo * 0.35} ${t + 4} ${x1 - 3} ${m - 4}Q${x1} ${m} ${x1 - 3} ${m + 4}Q${x1 - largo * 0.35} ${b - 4} ${x1 - largo} ${b}H${x0}Z`
      : `M${x0} ${t}H${x1 - largo}Q${x1 - largo * 0.28} ${t + 3} ${x1 - 5} ${m - 9}Q${x1} ${m} ${x1 - 5} ${m + 9}Q${x1 - largo * 0.28} ${b - 3} ${x1 - largo} ${b}H${x0}Z`;
  };
  /** Una tira de correa con su canto, su textura y su luz. */
  const tira = (k: string, d: string, x0: number, x1: number, t: number, b: number, filas: number[], cose: [number, number]) => (
    <>
      <path d={d} transform="translate(0 6)" fill={tono(color, -0.6)} />
      <clipPath id={`${u}${k}`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={ref("cuero")} />
      <g clipPath={ref(k)}>
        {piel ? (
          <>
            {/* Cocodrilo por FILAS a todo lo ancho (≈17 mm), con un pliegue
                largo por fila: nunca una rejilla de ladrillos. */}
            <g fill="none" stroke={tono(color, -0.5)} strokeWidth="2.4">
              {filas.map((x, i) => (
                <Fragment key={x}>
                  <path d={`M${x} ${t - 2}q${i % 2 ? 7 : -7} ${(b - t) / 2} 0 ${b - t + 4}`} />
                  <path d={`M${x + 4} ${t + (b - t) * (i % 2 ? 0.4 : 0.6)}q40 ${i % 2 ? 7 : -7} 82 1`} strokeWidth="1.7" />
                </Fragment>
              ))}
            </g>
            <g fill="none" stroke={tono(color, 0.22)} strokeWidth="1.2" opacity=".7">
              {filas.map((x, i) => (
                <path key={x} d={`M${x + 2.6} ${t - 2}q${i % 2 ? 7 : -7} ${(b - t) / 2} 0 ${b - t + 4}`} />
              ))}
            </g>
            <g stroke={tono(color, 0.3)} strokeWidth="2.2" strokeDasharray="10.5 4.5" strokeLinecap="round">
              <path d={`M${cose[0]} ${t + 9.5}H${cose[1]}M${cose[0]} ${b - 9.5}H${cose[1]}`} />
            </g>
          </>
        ) : (
          // Caucho: la cara plana entre los dos cantos achaflanados.
          <>
            <path d={`M${x0} ${t + 6}H${x1}M${x0} ${b - 6}H${x1}`} stroke={tono(color, -0.32)} strokeWidth="1.6" opacity=".8" />
            <path d={`M${x0} ${t + 3}H${x1}`} stroke={tono(color, 0.35)} strokeWidth="2.4" opacity=".5" />
          </>
        )}
      </g>
      <path d={d} fill="none" stroke={tono(color, 0.4)} strokeOpacity=".45" strokeWidth=".9" />
    </>
  );
  /** Un agujero de la cola: ranura a lo ancho (caucho) o redondo (piel). */
  const agujero = (x: number, m = 100) =>
    piel ? (
      <g key={x}>
        <circle cx={x} cy={m} r="5" fill={tono(color, -0.8)} />
        <path d={`M${x - 4} ${m + 3}a5 5 0 0 0 8 0`} fill="none" stroke={tono(color, 0.3)} strokeWidth="1" />
      </g>
    ) : (
      <g key={x}>
        <path d={rr(x - 4.8, m - 8.8, 9.6, 17.6, 3)} fill={tono(color, -0.78)} />
        <path d={`M${x - 3} ${m + 8.6}h6`} stroke={tono(color, 0.4)} strokeWidth="1.1" />
      </g>
    );
  /** La trabilla: acanalada (caucho, foto 1) o lisa con pespunte (piel). */
  const trabilla = (x: number, w: number, t: number, b: number) => {
    const d = rr(x, t, w, b - t, 5);
    return (
      <g key={x}>
        <path d={d} transform="translate(0 7)" fill={tono(color, -0.66)} />
        <path d={d} fill={ref("cuero")} />
        {piel ? (
          <path
            d={`M${x + 4.5} ${t + 6}V${b - 6}M${x + w - 4.5} ${t + 6}V${b - 6}`}
            stroke={tono(color, 0.3)}
            strokeWidth="1.6"
            strokeDasharray="7 4"
          />
        ) : (
          Array.from({ length: 8 }, (_, i) => (
            <Fragment key={i}>
              <path d={`M${x + 8.5 + i * 4} ${t + 1}V${b - 1}`} stroke={tono(color, -0.55)} strokeWidth="1.5" />
              <path d={`M${x + 10 + i * 4} ${t + 1}V${b - 1}`} stroke={tono(color, 0.25)} strokeWidth=".9" opacity=".7" />
            </Fragment>
          ))
        )}
        <path d={d} fill="none" stroke={tono(color, 0.45)} strokeOpacity=".5" strokeWidth=".9" />
      </g>
    );
  };
  /** Una pieza de metal: canto, cara, bisel claro y filo. */
  const metal = (k: string, d: string, cara: string, { alto = 5, bisel = 4 } = {}) => (
    <>
      <path d={d} transform={`translate(0 ${alto})`} fill={M.d} />
      <clipPath id={`${u}${k}`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={ref(cara)} />
      <path d={d} clipPath={ref(k)} fill="none" stroke={ref("bisel")} strokeWidth={bisel} />
      <path d={d} fill="none" stroke={M.d} strokeOpacity=".55" strokeWidth=".7" />
    </>
  );

  let cuerpo: ReactNode;

  if (kind === "puas") {
    // HEBILLA: U ABIERTA con cabeza de pentágono (fotos 1 y 7): 24.7 mm en los
    // hombros, 19 de alto, vértice de 4.9, pies a 0.88; la cola entra por debajo
    // de la cabeza y la púa descansa sobre ella.
    const X = 46;
    const fuera = `M${X + 1} 97Q${X - 1} 100 ${X + 1} 103L${X + 23} 160Q${X + 24.4} 163 ${X + 28} 162.4L${X + 92} 155Q${X + 95} 154.6 ${X + 95} 151V147.5H${X + 92}L${X + 42} 150.5Q${X + 39} 150.6 ${X + 37.8} 147.8L${X + 26.4} 103Q${X + 25.4} 100 ${X + 26.4} 97L${X + 37.8} 52.2Q${X + 39} 49.4 ${X + 42} 49.5L${X + 92} 52.5H${X + 95}V49Q${X + 95} 45.4 ${X + 92} 45L${X + 28} 37.6Q${X + 24.4} 37 ${X + 23} 40Z`;
    // La faceta bajo el vértice: oscura arriba y clara abajo, como en la foto 1.
    const faceta = (s: 1 | -1) => {
      const y = (v: number) => 100 + s * v;
      return `M${X + 1.5} ${y(1)}L${X + 22.5} ${y(60)}L${X + 29.5} ${y(57.5)}L${X + 10.5} ${y(0.5)}Z`;
    };
    const cola = punta(-12, 300, 55, 145, 52);
    cuerpo = (
      <>
        <path d="M-10 60H330V150H-10Z" fill="#000" opacity=".5" filter={ref("sombra")} transform="translate(4 12)" />
        {tira("baja", "M126 54L340 49V151L126 146Z", 126, 340, 50, 150, [214, 300], [150, 335])}
        {tira("cola", cola, -12, 300, 55, 145, [-34, 52, 138, 224], [-12, piel ? 262 : 250])}
        {(piel ? [14, 154, 226] : [14, 152, 224, 250]).map((x) => agujero(x))}
        {!piel && (
          // La almohadilla en púa de la punta (foto 1).
          <>
            <path d="M262 84q-3 0-3 3v26q0 3 3 3l26-13.4q3.4-2.6 0-5.2Z" fill={tono(color, 0.1)} stroke={tono(color, 0.42)} strokeWidth="1.2" />
            <path d="M260 113q0 3 2.6 3l26-13.4" fill="none" stroke={tono(color, -0.5)} strokeWidth="2" />
          </>
        )}
        {piel ? [trabilla(166, 24, 48, 152), trabilla(198, 20, 48, 152)] : trabilla(164, 45, 47, 153)}
        {/* sombra de la hebilla sobre la correa */}
        <path d={fuera} fill="#000" opacity=".5" transform="translate(4 8)" filter={ref("sombra2")} />
        {metal("marco", fuera, "pulido", { bisel: 5 })}
        <path d={faceta(-1)} fill={ref("facA")} />
        <path d={faceta(1)} fill={ref("facB")} />
        <path d={`M${X + 1.5} 99L${X + 22.5} 40`} stroke={M.hi} strokeWidth="1.2" opacity=".9" />
        {/* la púa, sobre la cabeza y con su ranura */}
        <path d={piel ? "M116 100m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0" : rr(110, 90, 15, 20, 4)} fill={tono(color, -0.8)} />
        <path d={rr(X + 14, 96.5, 66, 11, 5)} fill="#000" opacity=".45" transform="translate(2 5)" filter={ref("sombra2")} />
        {metal("pua", `M${X + 18} 94.5H${X + 70}Q${X + 76} 95 ${X + 76} 100Q${X + 76} 105 ${X + 70} 105.5H${X + 18}Q${X + 12} 104 ${X + 12} 100Q${X + 12} 96 ${X + 18} 94.5Z`, "barra", {
          alto: 4,
          bisel: 2,
        })}
        <path d={`M${X + 18} 97.4H${X + 70}`} stroke={M.hi} strokeWidth="1.3" opacity=".9" />
      </>
    );
  } else if (kind === "desplegable") {
    // DESPLEGABLE DE PUENTE (foto 10): el marco en U cruza por encima de la correa
    // (24 mm entre brazos), con su escalón central y un pulsador por lado; la cola
    // pasa por debajo y conserva agujeros, trabillas y punta.
    const X = 62;
    const marco = `M${X + 4} 39H${X + 86}Q${X + 92} 39 ${X + 92} 45V50Q${X + 92} 55 ${X + 87} 55H${X + 44}Q${X + 36} 55 ${X + 36} 63V137Q${X + 36} 145 ${X + 44} 145H${X + 87}Q${X + 92} 145 ${X + 92} 150V155Q${X + 92} 161 ${X + 86} 161H${X + 4}Q${X} 161 ${X} 157V43Q${X} 39 ${X + 4} 39Z`;
    const puente = rr(X - 3, 60, 42, 80, 6);
    const boton = (y: number) => rr(X + 72, y, 15, 12, 4);
    cuerpo = (
      <>
        <path d="M-10 60H330V150H-10Z" fill="#000" opacity=".5" filter={ref("sombra")} transform="translate(4 12)" />
        {tira("baja", "M90 55L340 50V150L90 145Z", 90, 340, 50, 150, [230, 316], [120, 335])}
        {tira("cola", punta(-12, 304, 56, 144, 54), -12, 304, 56, 144, [-30, 56, 142, 228], [-12, piel ? 264 : 250])}
        {(piel ? [10, 118, 152, 186] : [10, 120, 156, 192]).map((x) => agujero(x))}
        {piel ? [trabilla(206, 22, 48, 152), trabilla(234, 18, 48, 152)] : trabilla(206, 45, 47, 153)}
        {/* los pulsadores asoman por los dos lados */}
        {metal("bt", boton(29), "botonX", { alto: 0, bisel: 2 })}
        {metal("bb", boton(159), "botonX", { alto: 4, bisel: 2 })}
        <path d={marco} fill="#000" opacity=".5" transform="translate(4 9)" filter={ref("sombra2")} />
        {metal("marco", marco, "pulido", { bisel: 4 })}
        <path d={`M${X + 46} 43H${X + 84}M${X + 46} 149H${X + 84}`} stroke={M.hi} strokeWidth="2" strokeLinecap="round" opacity=".75" />
        {metal("puente", puente, "puente", { alto: 4, bisel: 4 })}
        <path d={`M${X + 3} 66V134`} stroke={M.hi} strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
      </>
    );
  } else {
    // PLEGABLE DEL BRAZALETE (cerrado, por fuera): los eslabones H llegan hasta
    // UNA junta; al lado, una barra lisa cepillada, y una media luna en cada
    // flanco. Sin placa ni pestaña.
    const barra: [number, number] = [142, 184];
    const placas: [number, number][] = [];
    for (let x = barra[0] - 33; x > -40; x -= 33) placas.push([x, 31.4]);
    for (let x = barra[1] + 1.6; x < 330; x += 33) placas.push([x, 31.4]);
    const juntas = placas.flatMap(([x]) => [x - 0.8, x + 32.2]).filter((x) => x < barra[0] - 10 || x > barra[1] + 10);
    const bloques = [...new Set(juntas.map((x) => Math.round(x * 10) / 10))].filter((x, i, l) => l.findIndex((y) => Math.abs(y - x) < 4) === i);
    cuerpo = (
      <>
        <path d="M-10 58H330V152H-10Z" fill="#000" opacity=".5" filter={ref("sombra")} transform="translate(4 12)" />
        {/* medias lunas: por detrás de la barra, asoman por los flancos */}
        {metal("ma", "M146 54q2-12 17-12t17 12Z", "pulido", { alto: 0, bisel: 2.5 })}
        {metal("mb", "M146 146q2 12 17 12t17-12Z", "pulido", { alto: 3, bisel: 2.5 })}
        {placas.map(([x, w]) => (
          <Fragment key={x}>
            <path d={rr(x, 53, w, 94, 2.5)} transform="translate(0 6)" fill={M.d} />
            <path d={rr(x, 53, w, 94, 2.5)} fill={ref("placa")} />
            <path d={rr(x, 53, w, 94, 2.5)} fill={ref("cepillo")} />
            <path d={rr(x + 0.5, 53.5, w - 1, 93, 2.2)} fill="none" stroke={M.hi} strokeOpacity=".5" strokeWidth=".9" />
          </Fragment>
        ))}
        <path d={rr(barra[0], 52, barra[1] - barra[0], 96, 2.5)} transform="translate(0 6)" fill={M.d} />
        <path d={rr(barra[0], 52, barra[1] - barra[0], 96, 2.5)} fill={ref("lisa")} />
        <path d={rr(barra[0], 52, barra[1] - barra[0], 96, 2.5)} fill={ref("cepillo")} />
        <path d={rr(barra[0] + 0.5, 52.5, barra[1] - barra[0] - 1, 95, 2.2)} fill="none" stroke={M.hi} strokeOpacity=".6" strokeWidth="1" />
        {/* la junta por donde abre */}
        <path d={`M${barra[0] - 0.4} 52V154`} stroke={M.d} strokeWidth="2.4" />
        {bloques.map((x) => (
          <Fragment key={x}>
            <path d={rr(x - 11.5, 77, 23, 46, 3.5)} fill="#000" opacity=".45" transform="translate(1 3)" />
            <path d={rr(x - 11.5, 77, 23, 46, 3.5)} fill={ref("bloque")} />
            <path d={rr(x - 11.5, 77, 23, 46, 3.5)} fill="none" stroke={M.d} strokeOpacity=".65" strokeWidth="1" />
            <path d={`M${x - 10} 79V121`} stroke={M.hi} strokeWidth="1" opacity=".75" />
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <svg className="rl-claspart" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
      <defs>
        <Grad id={`${u}cuero`} v stops={[[0, tono(color, -0.3)], [0.14, tono(color, 0.16)], [0.45, color], [0.85, tono(color, -0.16)], [1, tono(color, -0.4)]]} />
        <Grad id={`${u}pulido`} v stops={[[0, M.a], [0.1, M.hi], [0.26, M.b], [0.46, M.a], [0.55, M.c], [0.7, M.b], [0.88, M.a], [1, M.c]]} />
        <Grad id={`${u}puente`} v stops={[[0, M.c], [0.12, M.a], [0.28, M.hi], [0.5, M.a], [0.74, M.b], [1, M.c]]} />
        <Grad id={`${u}barra`} v stops={[[0, M.b], [0.28, M.hi], [0.5, M.a], [0.56, M.c], [1, M.d]]} />
        <Grad id={`${u}botonX`} stops={[[0, M.c], [0.3, M.hi], [0.6, M.b], [1, M.d]]} />
        <Grad id={`${u}bisel`} v stops={[[0, M.hi, 0.95], [0.45, M.a, 0.35], [0.6, M.d, 0.35], [1, M.d, 0.8]]} />
        <Grad id={`${u}facA`} v stops={[[0, M.b], [0.55, M.c], [1, M.d]]} />
        <Grad id={`${u}facB`} v stops={[[0, M.c], [0.4, M.a], [1, M.hi]]} />
        <Grad id={`${u}placa`} stops={[[0, M.c], [0.16, M.b], [0.42, M.a], [0.75, M.b], [1, M.c]]} />
        <Grad id={`${u}lisa`} stops={[[0, M.c], [0.14, M.b], [0.4, M.a], [0.62, M.a], [0.88, M.b], [1, M.c]]} />
        <Grad id={`${u}bloque`} stops={[[0, M.b], [0.2, M.hi], [0.42, M.a], [0.6, M.c], [0.86, M.d], [1, M.c]]} />
        {/* cepillado fino a lo largo de la pieza */}
        <pattern id={`${u}cepillo`} width="7" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 .6h7" stroke={M.hi} strokeOpacity=".16" strokeWidth=".7" />
          <path d="M0 2.9h7" stroke={M.d} strokeOpacity=".14" strokeWidth=".8" />
        </pattern>
        <filter id={`${u}sombra`} x="-10%" y="-20%" width="120%" height="150%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${u}sombra2`} x="-20%" y="-20%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <Grad id={`${u}velo`} stops={[[0, "#fff", 0], [0.1, "#fff"], [0.9, "#fff"], [1, "#fff", 0]]} />
        <mask id={`${u}m`}>
          <rect width="320" height="200" fill={ref("velo")} />
        </mask>
      </defs>
      <g mask={ref("m")}>{cuerpo}</g>
    </svg>
  );
}
