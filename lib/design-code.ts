// Compact, URL-safe encoding of a finished ring design so the WHOLE thing can ride
// in an order as a single link. The order carries `…/diseno?d=<code>`; opening it
// re-renders the mockup + the full spec on one printable sheet — no image hosting
// needed, the design is reconstructed from the code. Encode runs client-side (btoa),
// decode server-side (Buffer); both guarded so either environment works.
import type { PlacedItem } from "./symbols";

export interface DesignPayload {
  // Keyed by face id — the ring's left/front/right or the coin's
  // reverso. Kept as a plain string map so one encoder serves every
  // configurator; the reader labels the faces from its own data.
  design: Record<string, PlacedItem[]>;
  /** Which kind of piece this design is for. Absent = ring (older links). */
  piece?: "anillo" | "moneda";
  // Historic name: this is the PIECE being designed (ring or coin). Kept as
  // `ring` so order links already sent to customers keep resolving.
  ring?: { handle?: string; title?: string; variant?: string; santo?: string };
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
