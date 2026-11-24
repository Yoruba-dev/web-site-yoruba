"use client";

// ---------------------------------------------------------------------------
// SharePopover (spec V2 §3.7): desde [Compartir] del escenario o el chip del
// código, en cualquier paso: el código, los botones de compartir y la nota de
// "solo este equipo". El cristal, el foco y el cierre los pone Popover.
// ---------------------------------------------------------------------------
import type { OrderInfo } from "../order";
import Popover from "./Popover";
import ShareButtons from "./ShareButtons";
import { Icon } from "./icons";

export default function SharePopover({
  order,
  file,
  onClose,
  returnFocus,
}: {
  order: OrderInfo;
  file?: File | null;
  onClose: () => void;
  /** A quién devolver el foco al cerrar. */
  returnFocus?: HTMLElement | null;
}) {
  return (
    <Popover titleId="rl-pop-title" onClose={onClose} returnFocus={returnFocus}>
      <div className="rl-pop_head">
        <div>
          <span id="rl-pop-title" className="rl-pop_title">
            Comparte tu diseño
          </span>
          <strong className="rl-pop_code">{order.code}</strong>
        </div>
        <button type="button" className="rl-iconbtn" onClick={onClose} aria-label="Cerrar">
          <Icon name="close" />
        </button>
      </div>
      <p className="rl-pop_lead">Pide la opinión de tu padrino o madrina antes de pedirlo.</p>
      <ShareButtons order={order} file={file} onDone={onClose} compact />
    </Popover>
  );
}
