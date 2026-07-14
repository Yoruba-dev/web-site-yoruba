// Fire-and-forget: subscribe an email to Shopify's marketing list via our
// server route. Best-effort — never blocks or breaks the newsletter UI.
export function subscribeToMarketing(email: string): void {
  const clean = email.trim();
  if (!clean) return;
  try {
    void fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: clean }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
