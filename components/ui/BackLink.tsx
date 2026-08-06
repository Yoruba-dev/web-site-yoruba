"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Flecha de "volver atrás", usada en TODA la web (va dentro de Breadcrumb, que
// comparten 26 rutas) y también dentro de secciones largas.
//
// Vuelve de verdad a lo anterior cuando el visitante llegó navegando por el
// propio sitio. Si entró directo —desde Google, desde un enlace pegado, o es la
// primera página que abre— el "atrás" del navegador lo sacaría fuera de la web,
// así que en ese caso enlaza al nivel de arriba (`href`). Se decide en el
// cliente, después de montar, porque en el servidor no existe el historial.
export default function BackLink({
  href = "/",
  label = "Volver",
  className = "",
}: {
  /** A dónde ir cuando no hay historial propio del sitio. */
  href?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    try {
      const ref = document.referrer;
      setHasHistory(
        window.history.length > 1 &&
          ref !== "" &&
          new URL(ref).origin === window.location.origin,
      );
    } catch {
      setHasHistory(false);
    }
  }, []);

  const cls = `pyj-back ${className}`.trim();
  const arrow = (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (hasHistory) {
    return (
      <button type="button" className={cls} onClick={() => router.back()}>
        {arrow}
        <span>{label}</span>
      </button>
    );
  }
  return (
    <Link href={href} className={cls}>
      {arrow}
      <span>{label}</span>
    </Link>
  );
}
