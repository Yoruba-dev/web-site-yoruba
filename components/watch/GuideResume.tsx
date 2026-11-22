"use client";

// "Volver a mi diseño · PY-R-…" en la guía (spec V2 §3.10): solo si este
// navegador tiene un borrador del creador. Isla de cliente mínima: lee el
// borrador (try/catch) y enlaza al diseño exacto (?d=), que al abrir en el
// mismo equipo recupera el paso y la sub-pestaña.
import Link from "next/link";
import { useEffect, useState } from "react";
import { DRAFT_KEY, parseDraft } from "./creator-state";
import { encodeWatchDesign } from "@/lib/design-code";
import { SECCION_RELOJES } from "@/lib/site";
import { designCode } from "@/lib/watch";

export default function GuideResume() {
  const [d, setD] = useState<{ code: string; href: string } | null>(null);
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(DRAFT_KEY);
    } catch {
      raw = null;
    }
    const draft = parseDraft(raw);
    if (!draft) return;
    setD({
      code: designCode(draft.config),
      href: `${SECCION_RELOJES.ruta}?d=${encodeWatchDesign(draft.config)}`,
    });
  }, []);
  if (!d) return null;
  return (
    <Link href={d.href} className="pyj-guia_resume">
      Volver a mi diseño · <strong>{d.code}</strong> <span aria-hidden="true">→</span>
    </Link>
  );
}
