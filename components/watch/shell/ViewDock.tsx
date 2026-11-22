"use client";

// ---------------------------------------------------------------------------
// ViewDock (spec V2 §3.3 / §3.4 / D3 / D11): las vistas del reloj y los
// interruptores, en UN solo sitio (la barra del visor 3D ya no existe).
//   • Escritorio: píldora de cristal abajo al centro, iconos + etiquetas
//     (consulta de contenedor: < 820 px de escenario → solo iconos).
//   • Móvil: columna a la derecha, 40 × 40, y [⋯] con el resto.
// role=toolbar con tabindex itinerante (flechas, Inicio, Fin) y aria-pressed.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { WATCH_RENDER_NOTE } from "@/lib/watch";
import type { View3D } from "../stage3d-contract";
import { Icon, type IconName } from "./icons";

type UserView = Exclude<View3D, "cierre">;

const VIEWS: readonly { id: UserView; label: string; short: string; icon: IconName }[] = [
  { id: "tres4", label: "Perspectiva", short: "3/4", icon: "tres4" },
  { id: "lado", label: "Correa entera", short: "Lado", icon: "lado" },
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
  onView: (v: UserView) => void;
  fotoVista: "frente" | "tapa";
  onFotoVista: (v: "frente" | "tapa") => void;
  noche: boolean;
  onNoche: () => void;
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

/** Flechas / Inicio / Fin entre los botones de la barra (tabindex itinerante). */
function useRoving() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const items = () => [...(ref.current?.querySelectorAll<HTMLButtonElement>("[data-dock]") ?? [])];
  useEffect(() => {
    items().forEach((b, i) => (b.tabIndex = i === active ? 0 : -1));
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

function DockBtn({
  icon,
  label,
  pressed,
  onClick,
  className,
  children,
}: {
  icon: IconName;
  label: string;
  pressed?: boolean;
  onClick: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      data-dock=""
      className={`rl-dock_btn${pressed ? " is-on" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon name={icon} />
      {children}
    </button>
  );
}

function Note({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <p className="rl-dock_note rl-glass" role="note">
      {WATCH_RENDER_NOTE}
    </p>
  );
}

function DockHorizontal(p: ViewDockProps) {
  const { ref, onKeyDown, onFocus } = useRoving();
  const [nota, setNota] = useState(false);
  const segs = p.tres ? VIEWS : FOTO_VISTAS;
  const i = p.tres ? VIEWS.findIndex((v) => v.id === p.view) : FOTO_VISTAS.findIndex((v) => v.id === p.fotoVista);
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
          ? VIEWS.map((v) => (
              <DockBtn key={v.id} icon={v.icon} label={v.label} pressed={p.view === v.id} onClick={() => p.onView(v.id)}>
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
      <DockBtn icon="moon" label="Modo noche" pressed={p.noche} onClick={p.onNoche}>
        <span className="rl-dock_label">Noche</span>
      </DockBtn>
      {p.onToggleFoto && (
        <DockBtn
          icon={p.tres ? "photo" : "cube"}
          label={p.tres ? "Foto real" : "Ver en 3D"}
          pressed={p.tres ? false : undefined}
          onClick={p.onToggleFoto}
        >
          <span className="rl-dock_label">{p.tres ? "Foto real" : "Ver en 3D"}</span>
        </DockBtn>
      )}
      {(p.hayCristal || p.verCompleto) && (
        <DockBtn icon="eye" label="Ver completo" pressed={p.verCompleto} onClick={p.onVerCompleto}>
          <span className="rl-dock_label">Ver completo</span>
        </DockBtn>
      )}
      <span className="rl-dock_info">
        <DockBtn icon="info" label="Sobre esta vista previa" pressed={nota} onClick={() => setNota((x) => !x)} />
        {nota && <Note onClose={() => setNota(false)} />}
      </span>
    </div>
  );
}

function DockVertical(p: ViewDockProps) {
  const { ref, onKeyDown, onFocus } = useRoving();
  const [mas, setMas] = useState(false);
  const [nota, setNota] = useState(false);
  const segs = p.tres ? VIEWS : FOTO_VISTAS;
  const i = p.tres ? VIEWS.findIndex((v) => v.id === p.view) : FOTO_VISTAS.findIndex((v) => v.id === p.fotoVista);
  useEffect(() => {
    if (!mas) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setMas(false);
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
          ? VIEWS.map((v) => (
              <DockBtn key={v.id} icon={v.icon} label={v.label} pressed={p.view === v.id} onClick={() => p.onView(v.id)}>
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
      <DockBtn icon="more" label="Más opciones de vista" pressed={mas} onClick={() => setMas((x) => !x)} className="rl-glass rl-glass--over" />
      {mas && (
        <div className="rl-vdock_more rl-glass rl-glass--over" role="group" aria-label="Más opciones de vista">
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
          <button type="button" className="rl-vdock_item" aria-expanded={nota} onClick={() => setNota((x) => !x)}>
            <Icon name="info" /> Sobre esta vista
          </button>
          {nota && <p className="rl-vdock_note">{WATCH_RENDER_NOTE}</p>}
        </div>
      )}
    </div>
  );
}
