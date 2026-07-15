"use client";

// Global, reusable page-number control — used by the shop grid today, and by
// any future paginated list (collections, blog, search results) without
// change. Purely presentational: the caller owns the current page and the
// slicing; this component only renders controls and reports clicks.
//
// Renders nothing when there's only one page (or none), so a short result set
// never shows an empty-looking pagination bar.

export interface PaginationProps {
  /** Current page, 1-indexed. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Called with the target 1-indexed page when the shopper picks one. */
  onChange: (page: number) => void;
  className?: string;
}

type PageToken = number | "dots";

/** Builds the windowed page list: first, last, and `delta` pages around the
 *  current one — collapsing a single hidden page into itself (no "…" for
 *  just one skipped page) and using "…" only for a real gap. For catalogues
 *  small enough that every page fits in the window (delta covers the whole
 *  range), this naturally returns every page number with no ellipsis at all —
 *  so the control scales down cleanly for a small shop and up for a large one. */
function pageWindow(current: number, total: number, delta = 1): PageToken[] {
  const show = new Set<number>([1, total]);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= total) show.add(i);
  }
  const sorted = [...show].sort((a, b) => a - b);

  const tokens: PageToken[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev) {
      if (n - prev === 2) tokens.push(prev + 1); // fill a single-page gap directly
      else if (n - prev > 1) tokens.push("dots");
    }
    tokens.push(n);
    prev = n;
  }
  return tokens;
}

export default function Pagination({
  page,
  pageCount,
  onChange,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const goTo = (target: number) => {
    if (target < 1 || target > pageCount || target === page) return;
    onChange(target);
  };

  return (
    <nav
      className={`pyj-pagination${className ? ` ${className}` : ""}`}
      aria-label="Paginación de resultados"
    >
      <ul className="pyj-pagination_list">
        <li>
          <button
            type="button"
            className="pyj-pagination_btn pyj-pagination_arrow"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <i className="ion-ios-arrow-back" aria-hidden="true" />
          </button>
        </li>
        {pageWindow(page, pageCount).map((token, i) =>
          token === "dots" ? (
            <li key={`dots-${i}`} className="pyj-pagination_dots" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={token}>
              <button
                type="button"
                className={`pyj-pagination_btn${token === page ? " is-current" : ""}`}
                onClick={() => goTo(token)}
                aria-current={token === page ? "page" : undefined}
                aria-label={`Ir a la página ${token}`}
              >
                {token}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className="pyj-pagination_btn pyj-pagination_arrow"
            onClick={() => goTo(page + 1)}
            disabled={page >= pageCount}
            aria-label="Página siguiente"
          >
            <i className="ion-ios-arrow-forward" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
