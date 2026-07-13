import Link from "next/link";
import type { ReactNode } from "react";
import type { Block } from "@/lib/blog-data";

// Renders article inline text safely as React nodes — no raw HTML. Supports a
// tiny markdown subset: **bold** and [label](/href) links. Everything else is
// plain text (React escapes it automatically).
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) nodes.push(text.slice(last, at));
    if (m[1] !== undefined) {
      nodes.push(<strong key={`${keyBase}-${i}`}>{m[1]}</strong>);
    } else {
      const label = m[2];
      const href = m[3];
      nodes.push(
        href.startsWith("/") ? (
          <Link key={`${keyBase}-${i}`} href={href}>
            {label}
          </Link>
        ) : (
          <a key={`${keyBase}-${i}`} href={href} target="_blank" rel="noreferrer">
            {label}
          </a>
        ),
      );
    }
    last = at + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="pyj-article-body">
      {blocks.map((b, i) => {
        if ("h2" in b) return <h2 key={i}>{renderInline(b.h2, `h${i}`)}</h2>;
        if ("ul" in b)
          return (
            <ul key={i}>
              {b.ul.map((item, j) => (
                <li key={j}>{renderInline(item, `l${i}-${j}`)}</li>
              ))}
            </ul>
          );
        return <p key={i}>{renderInline(b.p, `p${i}`)}</p>;
      })}
    </div>
  );
}
