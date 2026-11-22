"use client";

// ---------------------------------------------------------------------------
// Los botones de compartir, los mismos en la tarjeta de "Listo" y en el
// popover del escenario (spec R8): [WhatsApp · Enviar a mi padrino]
// [Copiar enlace] [Más…]. Copiar tiene red de seguridad (share.ts) y, si todo
// falla, deja el enlace en un campo seleccionable.
// ---------------------------------------------------------------------------
import { useState, useSyncExternalStore } from "react";
import type { OrderInfo } from "../order";
import { useAnnouncer } from "./announce";
import { Icon } from "./icons";
import { canNativeShare, copyText, nativeShare } from "./share";

const noop = () => () => undefined;

export function useCanNativeShare(): boolean {
  return useSyncExternalStore(noop, canNativeShare, () => false);
}

export default function ShareButtons({
  order,
  file,
  onDone,
  compact = false,
}: {
  order: OrderInfo;
  /** La foto de estudio para la hoja nativa (si la hay). */
  file?: File | null;
  /** Después de una acción (el popover se cierra). */
  onDone?: () => void;
  compact?: boolean;
}) {
  const { toast } = useAnnouncer();
  const [manual, setManual] = useState(false);
  const puedeMas = useCanNativeShare();

  async function copiar() {
    const r = await copyText(order.creatorUrl);
    if (r === "ok") {
      setManual(false);
      toast("Enlace copiado ✓");
      onDone?.();
    } else {
      setManual(true);
    }
  }

  async function mas() {
    const ok = await nativeShare({
      title: `Mi reloj ${order.code}`,
      text: `Mira el reloj que diseñé (${order.code}). ¿Qué te parece?`,
      url: order.creatorUrl,
      file,
    });
    if (ok) onDone?.();
  }

  return (
    <div className={`rl-share${compact ? " rl-share--compact" : ""}`}>
      <div className="rl-share_btns">
        <a
          className="rl-btn rl-btn--outline rl-share_wa"
          href={order.shareHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onDone?.()}
        >
          <Icon name="whatsapp" />
          <span className="rl-btn_label">Enviar a mi padrino</span>
        </a>
        <button type="button" className="rl-btn rl-btn--ghost rl-share_copy" onClick={copiar}>
          <Icon name="copy" />
          <span className="rl-btn_label">Copiar enlace</span>
        </button>
        {puedeMas && (
          <button
            type="button"
            className="rl-btn rl-btn--ghost rl-share_mas"
            onClick={mas}
            aria-label="Más formas de compartir"
            title="Más formas de compartir"
          >
            <Icon name="share" />
            <span className="rl-btn_label">Más…</span>
          </button>
        )}
      </div>
      {manual && (
        <input
          className="rl-input rl-share_manual"
          readOnly
          value={order.creatorUrl}
          aria-label="Enlace de tu diseño: selecciónalo y cópialo"
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
        />
      )}
      {order.origenLocal && <p className="rl-share_local">Este enlace solo abre en este equipo (vista de prueba).</p>}
    </div>
  );
}
