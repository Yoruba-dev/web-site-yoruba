// Cliente de la Admin API de Shopify para el sistema de etiquetas.
//
// Usa la app "Etiquetas" del Dev Dashboard con el grant client_credentials:
// cada token dura ~24 h y se pide de nuevo solo cuando caduca. Es una app
// APARTE de "Subir productos" a propósito: esta puede comprar etiquetas, y
// mezclar ese permiso con el de editar productos sería darle a cada script
// más poder del que necesita.
//
// Versión 2026-10: shippingLabelPurchase no existe antes de 2026-07, y el
// resto del proyecto sigue en 2024-10 para el Storefront. No mezclar.

export const VERSION_ADMIN = "2026-10";

function dominio(): string {
  const d =
    process.env.SHOPIFY_STORE_DOMAIN ?? process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!d) throw new Error("Falta SHOPIFY_STORE_DOMAIN");
  return d;
}

/** "pedroyorubajewelry" — el nombre que usa admin.shopify.com en sus URLs. */
export function nombreTienda(): string {
  return dominio().replace(/\.myshopify\.com$/, "");
}

let cache: { token: string; vence: number } | null = null;

export async function tokenAdmin(): Promise<string> {
  if (cache && cache.vence > Date.now()) return cache.token;
  const id = process.env.SHOPIFY_LABELS_CLIENT_ID;
  const secreto = process.env.SHOPIFY_LABELS_CLIENT_SECRET;
  if (!id || !secreto) throw new Error("Faltan SHOPIFY_LABELS_CLIENT_ID / _SECRET");

  const r = await fetch(`https://${dominio()}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: id,
      client_secret: secreto,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Token de Shopify rechazado (${r.status})`);
  const j = (await r.json()) as { access_token: string; expires_in?: number };
  // Cinco minutos de margen: un token que caduca a mitad de una compra deja
  // la etiqueta pagada y sin PDF.
  // Tope de una hora aunque Shopify dé 24: si alguien revoca la app, la
  // función (que la consulta de la PC mantiene caliente) no sigue usándolo.
  const vida = Math.min((j.expires_in ?? 86_400) - 300, 3_600);
  cache = { token: j.access_token, vence: Date.now() + vida * 1000 };
  return j.access_token;
}

export class ErrorShopify extends Error {}

export async function adminGraphql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  reintento = true,
): Promise<T> {
  const token = await tokenAdmin();
  const r = await fetch(`https://${dominio()}/admin/api/${VERSION_ADMIN}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  // Token caducado o revocado: se pide uno nuevo y se reintenta una vez.
  if ((r.status === 401 || r.status === 403) && reintento) {
    cache = null;
    return adminGraphql<T>(query, variables, false);
  }
  if (!r.ok) throw new ErrorShopify(`Admin API respondió ${r.status}`);
  const j = (await r.json()) as { data?: T; errors?: { message: string }[] };
  if (j.errors?.length) {
    throw new ErrorShopify(j.errors.map((e) => e.message).join("; "));
  }
  return j.data as T;
}

/** "gid://shopify/Order/123" → "123". Devuelve null si no tiene esa forma. */
export function numeroDeGid(gid: string, tipo: string): string | null {
  const m = new RegExp(`^gid://shopify/${tipo}/(\\d+)$`).exec(gid);
  return m ? m[1] : null;
}

/** La página del pedido en el admin: la que abre la PC en cada aviso. */
export function urlPedidoAdmin(orderId: string): string | undefined {
  const n = numeroDeGid(orderId, "Order");
  return n ? `https://admin.shopify.com/store/${nombreTienda()}/orders/${n}` : undefined;
}
