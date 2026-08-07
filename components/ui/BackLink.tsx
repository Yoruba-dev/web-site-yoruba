"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Flecha de "volver atrás", usada en TODA la web (va dentro de Breadcrumb, que
// comparten 26 rutas) y también al pie de las páginas de servicios.
//
// Vuelve DE VERDAD a la página anterior cuando el visitante ya ha navegado
// dentro del sitio. Si acaba de llegar —desde Google, desde un enlace pegado, o
// es la primera página que abre— el "atrás" del navegador lo sacaría fuera, así
// que en ese caso enlaza al nivel de arriba (`href`).
//
// CÓMO SE DETECTA, y por qué no con `document.referrer`: Next navega por
// cliente, y en una navegación por cliente el referrer NO se actualiza —
// comprobado: yendo de /joyeria-en-miami a /servicios/grabado el referrer se
// quedó apuntando a la página con la que se abrió la pestaña. Lo que sí crece
// en cada navegación es `history.length`. Así que guardamos su valor al entrar
// (una vez por pestaña, en sessionStorage) y comparamos: si ha crecido, hay
// páginas nuestras a las que volver.
const CLAVE_ENTRADA = "pyj:hist-al-entrar";

export default function BackLink({
  href = "/",
  label = "Volver",
  className = "",
}: {
  /** A dónde ir cuando el visitante aún no ha navegado dentro del sitio. */
  href?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [hayHistorial, setHayHistorial] = useState(false);

  useEffect(() => {
    try {
      let entrada = sessionStorage.getItem(CLAVE_ENTRADA);
      if (entrada === null) {
        // Primera página de esta pestaña: aquí empezó el recorrido.
        entrada = String(window.history.length);
        sessionStorage.setItem(CLAVE_ENTRADA, entrada);
      }
      setHayHistorial(window.history.length > Number(entrada));
    } catch {
      // Sin sessionStorage (modo privado antiguo): el enlace de respaldo sirve.
      setHayHistorial(false);
    }
  }, []);

  const cls = `pyj-back ${className}`.trim();
  const flecha = (
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

  if (hayHistorial) {
    return (
      <button type="button" className={cls} onClick={() => router.back()}>
        {flecha}
        <span>{label}</span>
      </button>
    );
  }
  return (
    <Link href={href} className={cls}>
      {flecha}
      <span>{label}</span>
    </Link>
  );
}
