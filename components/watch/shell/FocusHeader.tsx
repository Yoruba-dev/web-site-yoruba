"use client";

// ---------------------------------------------------------------------------
// La cabecera propia del creador (spec V2 §3.2). La cabecera global de la web
// se oculta en esta ruta con CSS acotado (body:has(.pyj-reloj-app), en
// editor.css): aquí va una barra fina de cristal con la franja del eleke, el
// logo, el h1, "Guardado ✓", "Cómo funciona", [Solicitar] y cerrar.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { ELEKE } from "@/components/layout/ElekeBar";
import { SITE } from "@/lib/site";
import { Icon } from "./icons";

export const GUIA_HREF = "/creador-de-relojes/como-funciona";

export default function FocusHeader({
  saved,
  saveSeq,
  onAyuda,
  ayudaAbierta,
  onSolicitar,
  cart,
}: {
  /** Ya se guardó algo en este navegador ("Guardado ✓"). */
  saved: boolean;
  /** Sube con cada guardado: el ✓ vuelve a aparecer. */
  saveSeq: number;
  /** "Cómo funciona" se abre sobre el editor (el botón que lo pidió). */
  onAyuda: (anchor: HTMLElement) => void;
  ayudaAbierta: boolean;
  /** [Solicitar] (escritorio): solo en los pasos, nunca en la entrada ni en Listo. */
  onSolicitar?: () => void;
  /** El carrito, solo cuando el reloj se puede comprar en la web (hoy no). */
  cart?: { count: number; onOpen: () => void } | null;
}) {
  return (
    <header className="rl-head rl-glass">
      <span className="rl-head_eleke" aria-hidden="true">
        {ELEKE.map((c) => (
          <span key={c} style={{ background: c }} />
        ))}
      </span>
      <div className="rl-head_bar">
        <Link href="/" className="rl-head_logo" aria-label={`${SITE.name}: ir al inicio`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SITE.logo.main} alt="" width={32} height={32} />
        </Link>
        <h1 className="rl-head_title">Crea tu reloj de Orisha</h1>
        <div className="rl-head_actions">
          {saved && (
            <span className="rl-save" aria-hidden="true" title="Tu diseño queda guardado en este equipo">
              <span className="rl-save_word">Guardado </span>
              <span key={saveSeq} className="rl-save_check">
                ✓
              </span>
            </span>
          )}
          {/* Un enlace de verdad a la guía (sin JS, o con Ctrl/⌘, la abre); con un
              clic normal, la ayuda se abre aquí mismo, sin salir del editor. */}
          <Link
            href={GUIA_HREF}
            className="rl-head_link"
            aria-label="Cómo funciona el creador de relojes"
            aria-haspopup="dialog"
            aria-expanded={ayudaAbierta}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              onAyuda(e.currentTarget);
            }}
          >
            <Icon name="help" />
            <span className="rl-head_linklabel">Cómo funciona</span>
          </Link>
          {onSolicitar && (
            <button type="button" className="rl-btn rl-btn--outline rl-head_cta" onClick={onSolicitar}>
              Solicitar
            </button>
          )}
          {cart && (
            <button type="button" className="rl-iconbtn" onClick={cart.onOpen} aria-label={`Carrito (${cart.count})`}>
              <Icon name="bag" />
            </button>
          )}
          <Link href="/" className="rl-iconbtn rl-head_close" aria-label="Cerrar el creador (tu diseño queda guardado)">
            <Icon name="close" />
          </Link>
        </div>
      </div>
    </header>
  );
}
