// Compact, URL-safe encoding of a finished ring design so the WHOLE thing can ride
// in an order as a single link. The order carries `…/diseno?d=<code>`; opening it
// re-renders the mockup + the full spec on one printable sheet — no image hosting
// needed, the design is reconstructed from the code. Encode runs client-side (btoa),
// decode server-side (Buffer); both guarded so either environment works.
//
// The watch (piece "reloj") rides in the same envelope: its whole WatchConfig
// goes in `watch`, and `design` is always {} because decodeDesign() rejects a
// payload without that key — so ring and coin links already sent to customers
// decode exactly as before. To READ a watch link use decodeWatchDesign() in
// lib/watch.ts (decode + normalize), never `payload.watch` directly.
import type { PlacedItem } from "./symbols";
import type { WatchConfig } from "./watch";

export interface DesignPayload {
  // Keyed by face id — the ring's left/front/right or the coin's
  // reverso. Kept as a plain string map so one encoder serves every
  // configurator; the reader labels the faces from its own data.
  // A watch payload carries {} here (see `watch`).
  design: Record<string, PlacedItem[]>;
  /** Which kind of piece this design is for. Absent = ring (older links). */
  piece?: "anillo" | "moneda" | "reloj";
  // Historic name: this is the PIECE being designed (ring, coin or watch). Kept
  // as `ring` so order links already sent to customers keep resolving. For a
  // watch it carries the Shopify product: { handle, title, variant }.
  ring?: { handle?: string; title?: string; variant?: string; santo?: string };
  /** Only when piece === "reloj". It comes from a URL, so it is UNTRUSTED and
   *  typed `unknown` on purpose: the only way to get a WatchConfig out of it is
   *  normalize() / normalizeWithReport(), or decodeWatchDesign() (lib/watch.ts),
   *  which does both steps. */
  watch?: unknown;
}

/** A decoded watch payload: piece "reloj" with SOME object in `watch` — its
 *  shape is still unchecked (see `watch` above). */
export type WatchDesignPayload = DesignPayload & { piece: "reloj"; watch: Readonly<Record<string, unknown>> };

export function isWatchPayload(p: DesignPayload | null | undefined): p is WatchDesignPayload {
  return !!p && p.piece === "reloj" && typeof p.watch === "object" && p.watch !== null && !Array.isArray(p.watch);
}

function toBase64Url(s: string): string {
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(s, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return typeof Buffer !== "undefined"
    ? Buffer.from(b64, "base64").toString("utf8")
    : decodeURIComponent(escape(atob(b64)));
}

export function encodeDesign(payload: DesignPayload): string {
  try {
    return toBase64Url(JSON.stringify(payload));
  } catch {
    return "";
  }
}

export function decodeDesign(code: string): DesignPayload | null {
  try {
    const payload = JSON.parse(fromBase64Url(code)) as DesignPayload;
    if (!payload || typeof payload !== "object" || !payload.design) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Encode a watch design for /diseno?d= (and the creator's own ?d=). */
export function encodeWatchDesign(
  watch: WatchConfig,
  ring?: { handle?: string; title?: string; variant?: string },
): string {
  return encodeDesign({ design: {}, piece: "reloj", watch, ...(ring ? { ring } : {}) });
}
