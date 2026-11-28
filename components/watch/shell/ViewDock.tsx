"use client";

// ---------------------------------------------------------------------------
// ViewDock (spec V2 §3.3 / §3.4 / D3 / D11): las vistas del reloj y los
// interruptores, en UN solo sitio (la barra del visor 3D ya no existe).
//   • Escritorio: píldora de cristal abajo al centro: las vistas con su nombre y
//     las herramientas (consultas de contenedor en editor.css: según el ancho
//     del escenario, las herramientas y luego las vistas van solo con icono).
//   • Móvil: columna a la derecha y [⋯] con el resto.
// "Cierre" sale cuando la correa ya es real, con el icono del cierre elegido.
// role=toolbar con tabindex itinerante (flechas, Inicio, Fin) y aria-pressed.
// ---------------------------------------------------------------------------
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { WATCH_RENDER_NOTE } from "@/lib/watch";
import type { View3D } from "../stage3d-contract";
import { Icon, type IconName } from "./icons";

/** Las vistas con botón ('correa' va en el de "Correa entera", en su paso). */
type UserView = Exclude<View3D, "correa">;

interface Vista {
  id: UserView;
  label: string;
  short: string;
  icon: IconName;
}
const VIEWS: readonly Vista[] = [
  { id: "tres4", label: "Perspectiva", short: "Girado", icon: "tres4" },
  { id: "lado", label: "Correa entera", short: "Correa", icon: "lado" },
  { id: "esfera", label: "Esfera", short: "Esfera", icon: "esfera" },
  { id: "tapa", label: "Tapa", short: "Tapa", icon: "tapa" },
];

const FOTO_VISTAS: readonly { id: "frente" | "tapa"; label: string; icon: IconName }[] = [
  { id: "frente", label: "Frente", icon: "frente" },
  { id: "tapa", label: "Tapa", icon: "tapa" },
];

export interface ViewDockProps {
  /** El visor 3D está delante (si no: la foto real). */
  tres: boolean;
  view: View3D;
  onView: (v: View3D) => void;
  fotoVista: "frente" | "tapa";
  onFotoVista: (v: "frente" | "tapa") => void;
  /** Icono del cierre elegido; null = la correa aún está en cristal (sin botón). */
  cierre: IconName | null;
  noche: boolean;
  onNoche: () => void;
  /** [Acercar] (escritorio, solo con 3D); null = el visor aún no está listo. */
  cerca: boolean;
  onCerca: (() => void) | null;
  /** Paso Correa: "Correa entera" vuelve a su encuadre (la cara de la correa, el
   *  que pide el editor al elegir) y, otra vez, la enseña de lado. */
  pasoCorrea: boolean;
  /** "Foto real" (con 3D delante) o "Ver en 3D" (con la foto delante); null =
   *  este dispositivo no pinta 3D: sin botón. */
  onToggleFoto: (() => void) | null;
  /** Hay piezas en cristal: [Ver completo]. */
  hayCristal: boolean;
  verCompleto: boolean;
  onVerCompleto: () => void;
  vertical?: boolean;
}

export default function ViewDock(props: ViewDockProps) {
  return props.vertical ? <DockVertical {...props} /> : <DockHorizontal {...props} />;
}

/** Las vistas que se ofrecen ahora mismo. */
function vistasDe(p: ViewDockProps): readonly Vista[] {
  return p.cierre ? [...VIEWS, { id: "cierre", label: "Cierre", short: "Cierre", icon: p.cierre }] : VIEWS;
}

/** ¿Está puesta esta vista? La cara de la correa cuenta como "Correa entera". */
const puesta = (p: ViewDockProps, v: Vista) => p.view === v.id || (v.id === "lado" && p.view === "correa");

/** La vista que pide un botón. */
const alPulsar = (p: ViewDockProps, v: Vista): View3D =>
  v.id === "lado" && p.pasoCorrea && p.view !== "correa" ? "correa" : v.id;

/** Flechas / Inicio / Fin entre los botones de la barra (tabindex itinerante). */
function useRoving() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const items = () => [...(ref.current?.querySelectorAll<HTMLButtonElement>("[data-dock]") ?? [])];
  useEffect(() => {
    const list = items();
    if (!list.length) return;
    // La barra puede perder botones ("Ver completo" al pasar a la tapa, 4 vistas
    // → 2 con la foto real). Si el índice activo ya no existe, ninguno quedaría
    // en tabindex 0 y Tab se saltaría la barra entera. Manda el botón que tiene
    // el foco; si no, el índice activo; si ya no existe, la vista pulsada o,
    // si no hay, el último botón.
    const foco = list.indexOf(document.activeElement as HTMLButtonElement);
    let a = foco >= 0 ? foco : active;
    if (a >= list.length) {
      const pulsado = list.findIndex((b) => b.getAttribute("aria-pressed") === "true");
      a = pulsado >= 0 ? pulsado : list.length - 1;
    }
    list.forEach((b, i) => (b.tabIndex = i === a ? 0 : -1));
  });
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const n = list.length;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (i + 1) % n
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (i - 1 + n) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    setActive(to);
    list[to].focus();
  };
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const i = items().indexOf(e.target as unknown as HTMLButtonElement);
    if (i >= 0) setActive(i);
  };
  return { ref, onKeyDown, onFocus };
}

/** Un botón de la barra. `pressed` = interruptor (aria-pressed); `expanded` =
 *  botón que abre algo (ⓘ, ⋯): aria-expanded + aria-controls, no "pulsado". */
function DockBtn({
  icon,
  label,
  pressed,
  expanded,
  controls,
  btnRef,
  off,
  onClick,
  className,
  children,
}: {
  icon: IconName;
  label: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  btnRef?: Ref<HTMLButtonElement>;
  /** Aún no hace nada (sin quitarle el foco: la barra es itinerante). */
  off?: boolean;
  onClick: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      ref={btnRef}
      type="button"
      data-dock=""
      className={`rl-dock_btn${pressed || expanded ? " is-on" : ""}${off ? " is-off" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={pressed}
      aria-disabled={off || undefined}
      aria-expanded={expanded}
      aria-controls={expanded ? controls : undefined}
      aria-label={label}
      title={label}
      onClick={off ? undefined : onClick}
    >
      <Icon name={icon} />
      {children}
    </button>
  );
}

function Note({ id, onClose }: { id: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <p id={id} className="rl-dock_note rl-glass" role="note">
      {WATCH_RENDER_NOTE}
    </p>
  );
}

function DockHorizontal(p: ViewDockProps) {
  const { ref, onKeyDown, onFocus } = useRoving();
  const notaId = `${useId()}-nota`;
  const [nota, setNota] = useState(false);
  const vistas = vistasDe(p);
  const segs = p.tres ? vistas : FOTO_VISTAS;
  const i = p.tres ? vistas.findIndex((v) => puesta(p, v)) : FOTO_VISTAS.findIndex((v) => v.id === p.fotoVista);
  return (
    <div
      ref={ref}
      className="rl-dock rl-glass rl-glass--over"
      role="toolbar"
      aria-label="Vistas del reloj"
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <div className="rl-dock_seg" style={{ "--n": segs.length, "--i": Math.max(0, i) } as CSSProperties}>
        <span className={`rl-dock_thumb${i < 0 ? " is-empty" : ""}`} aria-hidden="true" />
        {p.tres
          ? vistas.map((v) => (
              <DockBtn key={v.id} icon={v.icon} label={v.label} pressed={puesta(p, v)} onClick={() => p.onView(alPulsar(p, v))}>
                <span className="rl-dock_label">{v.label}</span>
              </DockBtn>
            ))
          : FOTO_VISTAS.map((v) => (
              <DockBtn key={v.id} icon={v.icon} label={v.label} pressed={p.fotoVista === v.id} onClick={() => p.onFotoVista(v.id)}>
                <span className="rl-dock_label">{v.label}</span>
              </DockBtn>
            ))}
      </div>
      <span className="rl-dock_div" aria-hidden="true" />
      {p.tres && (
        <DockBtn
          icon="zoom"
          label="Acercar"
          pressed={p.cerca}
          off={!p.onCerca}
          onClick={() => p.onCerca?.()}
          className="rl-dock_tool"
        >
          <span className="rl-dock_label">Acercar</span>
        </DockBtn>
      )}
      <DockBtn icon="moon" label="Modo noche" pressed={p.noche} onClick={p.onNoche} className="rl-dock_tool">
        <span className="rl-dock_label">Noche</span>
      </DockBtn>
      {p.onToggleFoto && (
        <DockBtn
          className="rl-dock_tool"
          icon={p.tres ? "photo" : "cube"}
          label={p.tres ? "Foto real" : "Ver en 3D"}
          pressed={p.tres ? false : undefined}
          onClick={p.onToggleFoto}
        >
          <span className="rl-dock_label">{p.tres ? "Foto real" : "Ver en 3D"}</span>
        </DockBtn>
      )}
      {(p.hayCristal || p.verCompleto) && (
        <DockBtn icon="eye" label="Ver completo" pressed={p.verCompleto} onClick={p.onVerCompleto} className="rl-dock_tool">
          <span className="rl-dock_label">Ver completo</span>
        </DockBtn>
      )}
      <span className="rl-dock_info">
        <DockBtn
          icon="info"
          label="Sobre esta vista previa"
          expanded={nota}
          controls={notaId}
          onClick={() => setNota((x) => !x)}
        />
        {nota && <Note id={notaId} onClose={() => setNota(false)} />}
      </span>
    </div>
  );
}

function DockVertical(p: ViewDockProps) {
  const { ref, onKeyDown, onFocus } = useRoving();
  const uid = useId();
  const masId = `${uid}-mas`;
  const notaId = `${uid}-nota`;
  const masRef = useRef<HTMLButtonElement>(null);
  const [mas, setMas] = useState(false);
  const [nota, setNota] = useState(false);
  const vistas = vistasDe(p);
  const segs = p.tres ? vistas : FOTO_VISTAS;
  const i = p.tres ? vistas.findIndex((v) => puesta(p, v)) : FOTO_VISTAS.findIndex((v) => v.id === p.fotoVista);
  useEffect(() => {
    if (!mas) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Si el foco estaba en el menú, vuelve a [⋯] (el menú se desmonta y el
      // foco caería en <body>).
      const dentro = ref.current?.contains(document.activeElement);
      setMas(false);
      if (dentro) masRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setMas(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [mas, ref]);
  return (
    <div
      ref={ref}
      className="rl-vdock"
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Vistas del reloj"
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <div className="rl-vdock_seg rl-glass rl-glass--over" style={{ "--n": segs.length, "--i": Math.max(0, i) } as CSSProperties}>
        <span className={`rl-vdock_thumb${i < 0 ? " is-empty" : ""}`} aria-hidden="true" />
        {p.tres
          ? vistas.map((v) => (
              <DockBtn key={v.id} icon={v.icon} label={v.label} pressed={puesta(p, v)} onClick={() => p.onView(alPulsar(p, v))}>
                <span className="rl-vdock_short" aria-hidden="true">
                  {v.short}
                </span>
              </DockBtn>
            ))
          : FOTO_VISTAS.map((v) => (
              <DockBtn key={v.id} icon={v.icon} label={v.label} pressed={p.fotoVista === v.id} onClick={() => p.onFotoVista(v.id)}>
                <span className="rl-vdock_short" aria-hidden="true">
                  {v.label}
                </span>
              </DockBtn>
            ))}
      </div>
      <DockBtn
        icon="more"
        label="Más opciones de vista"
        expanded={mas}
        controls={masId}
        btnRef={masRef}
        onClick={() => setMas((x) => !x)}
        className="rl-glass rl-glass--over"
      />
      {mas && (
        <div id={masId} className="rl-vdock_more rl-glass rl-glass--over" role="group" aria-label="Más opciones de vista">
          <button type="button" className={`rl-vdock_item${p.noche ? " is-on" : ""}`} aria-pressed={p.noche} onClick={p.onNoche}>
            <Icon name="moon" /> Modo noche
          </button>
          {p.onToggleFoto && (
            <button
              type="button"
              className="rl-vdock_item"
              onClick={() => {
                p.onToggleFoto?.();
                setMas(false);
                // El menú se cierra con el foco dentro: que vuelva a [⋯].
                masRef.current?.focus();
              }}
            >
              <Icon name={p.tres ? "photo" : "cube"} /> {p.tres ? "Foto real" : "Ver en 3D"}
            </button>
          )}
          {(p.hayCristal || p.verCompleto) && (
            <button
              type="button"
              className={`rl-vdock_item${p.verCompleto ? " is-on" : ""}`}
              aria-pressed={p.verCompleto}
              onClick={p.onVerCompleto}
            >
              <Icon name="eye" /> Ver completo
            </button>
          )}
          <button
            type="button"
            className="rl-vdock_item"
            aria-expanded={nota}
            aria-controls={nota ? notaId : undefined}
            onClick={() => setNota((x) => !x)}
          >
            <Icon name="info" /> Sobre esta vista
          </button>
          {nota && (
            <p id={notaId} className="rl-vdock_note">
              {WATCH_RENDER_NOTE}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
