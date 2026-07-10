"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account-context";

// The 3D customizer uses WebGL, so it must render on the client only (no SSR).
const PieceCustomizer = dynamic(() => import("./PieceCustomizer"), {
  ssr: false,
  loading: () => <div className="customizer-loading">Cargando el visor 3D…</div>,
});

export default function CustomizerLoader({
  requireAuth = true,
  ...props
}: {
  /** When false, the 3D customizer is open to everyone (no account gate). */
  requireAuth?: boolean;
  pieceName?: string;
  price?: number;
  productHandle?: string;
  image?: string;
  modelUrl?: string;
}) {
  const { isLoggedIn, hydrated } = useAccount();
  const [next, setNext] = useState("/personalizar");

  useEffect(() => {
    setNext(window.location.pathname + window.location.search);
  }, []);

  return (
    <div className="customizer-area">
      <div className="container">
        {requireAuth && !hydrated ? (
          <div className="customizer-loading">Cargando…</div>
        ) : !requireAuth || isLoggedIn ? (
          <PieceCustomizer {...props} />
        ) : (
          // Personalization is exclusive to customers with an account.
          <div className="customizer-gate">
            <span className="cz-gate-badge">✦ Exclusivo para clientes</span>
            <h3>Personalización 3D con grabado</h3>
            <p>
              Crea tu cuenta gratis para diseñar tu pieza en 3D, grabar tu texto donde
              quieras y guardar tus diseños para reordenarlos.
            </p>
            <Link
              href={`/login-register?next=${encodeURIComponent(next)}`}
              className="hiraola-btn"
            >
              Crear cuenta / Iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
