import { NextResponse } from "next/server";

// Lightweight error sink: client-side errors (from the error boundaries and the
// global handlers) POST here so they land in the SERVER logs (Netlify function
// logs) — so a broken component is visible to us, not only to the customer who
// hit it. This is the zero-dependency baseline; when a Sentry DSN is added we
// forward from here too. Never throws back at the client.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      stack?: string;
      url?: string;
      context?: unknown;
    };
    // eslint-disable-next-line no-console
    console.error("[client-error]", {
      message: body.message,
      url: body.url,
      context: body.context,
      stack: body.stack?.split("\n").slice(0, 4).join(" | "),
    });
  } catch {
    /* ignore malformed payloads */
  }
  return NextResponse.json({ ok: true });
}
