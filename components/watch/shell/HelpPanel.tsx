"use client";

// ---------------------------------------------------------------------------
// La ayuda, sobre la pantalla y sin salir del editor (PLAN-REALISMO-V3 6.10). La
// página "Cómo funciona" se queda: desde aquí se abre con un enlace.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { WATCH_PRICE_TBD, WATCH_PROOF_NOTE, watchLeadTimeLabel } from "@/lib/watch";
import { GUIA_HREF } from "./FocusHeader";
import Popover from "./Popover";
import { Icon, type IconName } from "./icons";

export default function HelpPanel({
  onClose,
  returnFocus,
  tres,
  coarse,
}: {
  onClose: () => void;
  returnFocus?: HTMLElement | null;
  /** El visor 3D está delante (si no, la foto: no se gira). */
  tres: boolean;
  coarse: boolean;
}) {
  const filas: { icon: IconName; t: string; d: string }[] = [
    ...(tres
      ? [
          {
            icon: "cube" as const,
            t: "Míralo por todos lados",
            d: coarse
              ? "Desliza para girarlo y pellizca para acercarlo. Toca una pieza para ir a su paso."
              : "Arrastra para girarlo y usa la rueda para acercarlo. Toca una pieza para ir a su paso.",
          },
        ]
      : []),
    {
      icon: "eye",
      t: "Se arma paso a paso",
      d: "Lo que aún no has visto va en cristal. «Siguiente» te lleva por todo; puedes saltar a cualquier paso.",
    },
    {
      icon: "undo",
      t: "Sin miedo a probar",
      d: "Tu diseño se guarda solo en este equipo y «Deshacer» devuelve tus últimos cambios.",
    },
    {
      icon: "listo",
      t: "Aquí no se paga nada",
      d: `${WATCH_PRICE_TBD}. ${WATCH_PROOF_NOTE} Plazo de taller: ${watchLeadTimeLabel()}.`,
    },
  ];
  return (
    <Popover titleId="rl-ayuda-title" className="rl-pop--ayuda" onClose={onClose} returnFocus={returnFocus}>
      <div className="rl-pop_head">
        <h2 id="rl-ayuda-title" className="rl-pop_h">
          Cómo funciona
        </h2>
        <button type="button" className="rl-iconbtn" onClick={onClose} aria-label="Cerrar">
          <Icon name="close" />
        </button>
      </div>
      <ul className="rl-ayuda">
        {filas.map((f) => (
          <li key={f.t}>
            <Icon name={f.icon} size={24} />
            <span>
              <strong>{f.t}</strong>
              {f.d}
            </span>
          </li>
        ))}
      </ul>
      {!coarse && (
        <p className="rl-ayuda_teclas">
          Teclado: ⌘Z o Ctrl+Z para deshacer.
          {tres &&
            " Con el reloj seleccionado (arrástralo o llega con Tab): flechas para girar, + y − para acercar, 1 a 5 para cambiar de vista."}
        </p>
      )}
      <Link className="rl-link" href={GUIA_HREF}>
        La guía completa: precio, plazo y prueba →
      </Link>
    </Popover>
  );
}
