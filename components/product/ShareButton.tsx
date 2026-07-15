"use client";

import { useRef, useState } from "react";

// Global "share this product" control, used on the product page and inside the
// card ⋯ options menu. On phones it opens the NATIVE share sheet
// (navigator.share → WhatsApp/Instagram/SMS/…); elsewhere it copies the product
// link to the clipboard and shows a brief "¡Enlace copiado!" confirmation.
export default function ShareButton({
  handle,
  title,
  className,
}: {
  handle: string;
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function share() {
    const url = `${window.location.origin}/products/${handle}`;
    // Native share sheet when the device offers one (phones/tablets).
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} — Pedro Yoruba Jewelry`, url });
        return;
      } catch {
        // user dismissed the sheet — nothing to do
        return;
      }
    }
    // Desktop fallback: copy the link + confirm. Legacy execCommand path covers
    // old browsers / in-app webviews where the async clipboard is unavailable.
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch {
        /* no clipboard at all — ignore */
      }
    }
    if (ok) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }
  }

  // An <a role="button"> (not <button>) so it inherits the template's icon-button
  // styling in every context — same pattern as WishlistButton / CompareButton.
  return (
    <a
      role="button"
      className={`${className ?? ""}${copied ? " is-copied" : ""}`}
      style={{ cursor: "pointer" }}
      title={copied ? "¡Enlace copiado!" : "Compartir esta pieza"}
      aria-label="Compartir esta pieza"
      onClick={share}
    >
      <i
        className={copied ? "ion-checkmark" : "ion-android-share-alt"}
        aria-hidden="true"
      />
    </a>
  );
}
