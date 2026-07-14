"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { whatsappWholesaleUrl } from "@/lib/commerce";

// Slim, dismissible band above the header — highest-visibility surface, shown on
// every page. Announces the wholesale (mayoreo) channel for botánicas/shops.
// Dismissal is remembered in localStorage so a visitor who closes it isn't nagged.
const DISMISS_KEY = "pyj-mayoreo-bar";

export default function AnnouncementBar() {
  const [hidden, setHidden] = useState(false);

  // Read the saved preference after mount (server render always shows the bar,
  // so first-time visitors get it in the SSR HTML; dismissers see it removed).
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") setHidden(true);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore storage errors */
    }
  };

  return (
    <div className="pyj-annbar">
      <div className="pyj-annbar_inner">
        <a
          className="pyj-annbar_msg"
          href={whatsappWholesaleUrl()}
          target="_blank"
          rel="noreferrer"
        >
          <span className="pyj-annbar_tag">Mayorista</span>
          <span>
            Surtimos a <strong>botánicas y tiendas</strong> — escríbenos por
            WhatsApp para catálogo y precios de mayorista
          </span>
        </a>
        <Link className="pyj-annbar_more" href="/mayoreo">
          Más info →
        </Link>
        <button
          type="button"
          className="pyj-annbar_close"
          aria-label="Cerrar aviso"
          onClick={dismiss}
        >
          <i className="ion-android-close" />
        </button>
      </div>
    </div>
  );
}
