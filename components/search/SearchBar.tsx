"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/ui/SafeImage";
import { CONSULT_PRICE_LABEL } from "@/lib/commerce";
import { formatMoney } from "@/lib/utils";
import type { Money } from "@/lib/types";

interface SearchHit {
  handle: string;
  title: string;
  image: string;
  price: Money;
  consult: boolean;
}

// THE global search bar — one component reused everywhere a search input
// appears (desktop offcanvas search, mobile menu, …). Search-as-you-type: it
// debounces the query against /api/search and shows live results with image
// previews; Enter opens the full shop filtered by the query (?q=).
export default function SearchBar({
  placeholder = "Buscar piezas… ej: Idde, Oshún, anillo",
  onNavigate,
}: {
  placeholder?: string;
  /** Called when the user navigates away (result click / submit) — lets the
   *  host panel (offcanvas, mobile menu) close itself. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const ctrl = useRef<AbortController | null>(null);

  // Debounced live search (250 ms), aborting stale requests.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setHits([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.current.signal,
        });
        const json = (await res.json()) as { results: SearchHit[] };
        setHits(json.results);
        setOpen(true);
      } catch {
        /* aborted or offline — keep whatever we had */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Click/tap outside closes the results.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/shop-left-sidebar?q=${encodeURIComponent(query)}`);
  }

  function pick() {
    setOpen(false);
    onNavigate?.();
  }

  return (
    <div className="pyj-search" ref={boxRef}>
      <form className="hm-searchbox" onSubmit={submit} role="search">
        <input
          type="search"
          name="q"
          value={q}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Buscar productos"
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        />
        <button className="search_btn" type="submit" aria-label="Buscar">
          <i className="ion-ios-search-strong" />
        </button>
      </form>

      {open && (
        <div className="pyj-search-results" role="listbox">
          {hits.length === 0 && !loading ? (
            <p className="pyj-search-empty">
              Nada para “{q.trim()}” — intenta con otra palabra.
            </p>
          ) : (
            <ul>
              {hits.map((h) => (
                <li key={h.handle}>
                  <Link
                    href={`/products/${h.handle}`}
                    className="pyj-search-hit"
                    onClick={pick}
                  >
                    <span className="pyj-search-thumb">
                      <SafeImage src={h.image || undefined} alt={h.title} />
                    </span>
                    <span className="pyj-search-info">
                      <span className="pyj-search-title">{h.title}</span>
                      <span className="pyj-search-price">
                        {h.consult ? CONSULT_PRICE_LABEL : formatMoney(h.price)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {hits.length > 0 && (
            <button type="button" className="pyj-search-all" onClick={submit}>
              Ver todos los resultados →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
