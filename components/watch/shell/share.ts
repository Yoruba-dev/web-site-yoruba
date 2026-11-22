"use client";

// ---------------------------------------------------------------------------
// Compartir el diseño (spec R8): copiar con red de seguridad y la hoja nativa.
//   1. navigator.clipboard (https / localhost);
//   2. si no hay (http en la red local, permisos), execCommand('copy') con un
//      textarea oculto;
//   3. si tampoco, "manual": quien llama muestra un campo seleccionable.
// ---------------------------------------------------------------------------

export type CopyResult = "ok" | "manual";

function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  ta.style.pointerEvents = "none";
  document.body.appendChild(ta);
  const prev = document.activeElement as HTMLElement | null;
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  prev?.focus?.({ preventScroll: true });
  return ok;
}

/** Copia `text`. Nunca rechaza. */
export async function copyText(text: string): Promise<CopyResult> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return "ok";
    }
  } catch {
    /* sin permiso: se prueba el método antiguo */
  }
  return legacyCopy(text) ? "ok" : "manual";
}

/** ¿Hay hoja nativa de compartir? */
export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** La hoja nativa, con la foto de estudio si el navegador acepta archivos.
 *  Devuelve false si no se pudo (o el cliente la cerró). */
export async function nativeShare(data: { title: string; text: string; url: string; file?: File | null }): Promise<boolean> {
  if (!canNativeShare()) return false;
  const base = { title: data.title, text: data.text, url: data.url };
  try {
    if (data.file && typeof navigator.canShare === "function" && navigator.canShare({ files: [data.file] })) {
      await navigator.share({ ...base, files: [data.file] });
    } else {
      await navigator.share(base);
    }
    return true;
  } catch {
    return false;
  }
}

/** Descarga un Blob con un nombre (la foto de estudio). */
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
