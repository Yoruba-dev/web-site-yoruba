import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { isPlaceholderPriced } from "@/lib/commerce";

// Live product search for the global SearchBar. Reads the cached catalogue
// (getProducts is memoised + held in Next's data cache), scores matches and
// returns the top hits with an image preview each. Accent-insensitive so
// "oshun" finds "Oshún".
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = norm((searchParams.get("q") ?? "").trim());
  if (q.length < 2) return NextResponse.json({ results: [] });

  const products = await getProducts(500);
  const results = products
    .map((p) => {
      const title = norm(p.title);
      let score = 0;
      if (title.startsWith(q)) score = 3;
      else if (title.includes(q)) score = 2;
      else if (p.tags.some((t) => norm(t).includes(q))) score = 1;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ p }) => ({
      handle: p.handle,
      title: p.title,
      image: p.images[0]?.url ?? "",
      price: p.price,
      // $0/$1 placeholder prices are never shown as numbers (consult instead).
      consult: isPlaceholderPriced(p.price),
    }));

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
