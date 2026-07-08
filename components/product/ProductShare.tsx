"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { SITE } from "@/lib/site";

// Real product sharing — builds share intents for the *current* product (its URL,
// title and image) instead of linking to generic social home pages. Adds a native
// share sheet on mobile and a copy-link button.
export default function ProductShare({ product }: { product: Product }) {
  const [url, setUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const text = `${product.title} — ${SITE.name}`;
  const e = encodeURIComponent;
  const img = product.images[0]?.url ?? "";

  const links = [
    {
      key: "whatsapp",
      title: "Compartir por WhatsApp",
      icon: "fab fa-whatsapp",
      href: `https://wa.me/?text=${e(`${text} ${url}`)}`,
    },
    {
      key: "facebook",
      title: "Compartir en Facebook",
      icon: "fab fa-facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
    },
    {
      key: "twitter",
      title: "Compartir en X",
      icon: "fab fa-twitter",
      href: `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(text)}`,
    },
    {
      key: "pinterest",
      title: "Guardar en Pinterest",
      icon: "fab fa-pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${e(url)}&media=${e(img)}&description=${e(text)}`,
    },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: product.title, text, url });
    } catch {
      /* user cancelled — ignore */
    }
  }

  return (
    <div className="hiraola-social_link product-share">
      <h6 className="product-share_label">Compartir:</h6>
      <ul>
        {links.map((l) => (
          <li key={l.key} className={l.key}>
            <a href={l.href} target="_blank" rel="noreferrer" title={l.title}>
              <i className={l.icon} />
            </a>
          </li>
        ))}
        <li className="copy-link">
          <button type="button" onClick={copy} title="Copiar enlace">
            <i className={copied ? "fa fa-check" : "fa fa-link"} />
          </button>
        </li>
        {canNativeShare && (
          <li className="native-share">
            <button type="button" onClick={nativeShare} title="Compartir…">
              <i className="fa fa-share-alt" />
            </button>
          </li>
        )}
      </ul>
      {copied && <span className="share-copied">¡Enlace copiado!</span>}
    </div>
  );
}
