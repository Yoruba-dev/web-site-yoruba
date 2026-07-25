import type { Metadata } from "next";
import Link from "next/link";
import { decodeDesign } from "@/lib/design-code";
import { getPlaceable, MOTIFS, type PlacedItem } from "@/lib/symbols";
import { getOdu, type RingSlotId } from "@/lib/odu";
import { designToPreviewDataUrl } from "@/lib/glyph-svg";
import { SITE } from "@/lib/site";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Hoja de diseño — Anillo de Ifá",
  robots: { index: false, follow: false },
};

const FACES: { id: RingSlotId; label: string }[] = [
  { id: "front", label: "Frente" },
  { id: "right", label: "Lateral derecho" },
  { id: "left", label: "Lateral izquierdo" },
];

const towerLabel = (t?: string) =>
  t === "left" ? "torre izquierda" : t === "right" ? "torre derecha" : "ambas torres";

function describe(it: PlacedItem): { name: string; meta?: string; note?: string } {
  const p = getPlaceable(it.ref);
  if (!p) return { name: "—" };
  if (p.kind === "tower" && p.oduId) {
    const o = getOdu(p.oduId);
    if (o)
      return {
        name: o.name,
        meta: `Odù Nº ${o.number} · ${towerLabel(it.tower)}`,
        note: o.note,
      };
  }
  const m = MOTIFS.find((x) => x.id === p.motif);
  return { name: p.name, meta: "Símbolo (opcional)", note: m?.note };
}

// The order-delivered DESIGN SHEET: reconstructs the whole piece from the ?d= code
// so the workshop gets the mockup + the full, readable spec on one printable page.
export default async function DisenoPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const payload = d ? decodeDesign(d) : null;

  if (!payload) {
    return (
      <section className="pyj-sheet-page">
        <div className="pyj-sheet">
          <p className="pyj-sheet_none">
            No pudimos leer este diseño — el enlace puede estar incompleto.
          </p>
          <Link href="/configurador" className="pyj-btn-gold">
            Ir al configurador
          </Link>
        </div>
      </section>
    );
  }

  const design = payload.design;
  const mockup = designToPreviewDataUrl(design);
  const total = FACES.reduce((n, f) => n + (design[f.id]?.length ?? 0), 0);

  return (
    <section className="pyj-sheet-page">
      <div className="pyj-sheet">
        <header className="pyj-sheet_head">
          <span className="pyj-sheet_brand">{SITE.name}</span>
          <h1 className="pyj-sheet_title">Hoja de diseño · Anillo de Ifá</h1>
          {payload.ring?.title && (
            <p className="pyj-sheet_ring">
              {payload.ring.title}
              {payload.ring.variant ? ` · ${payload.ring.variant}` : ""}
            </p>
          )}
          {payload.ring?.santo && (
            <p className="pyj-sheet_santo">Santo / Ángel de la guarda: {payload.ring.santo}</p>
          )}
        </header>

        {mockup && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="pyj-sheet_mockup"
            src={mockup}
            alt="Mockup del diseño en las tres caras del anillo"
          />
        )}

        <div className="pyj-sheet_faces">
          {FACES.map((f) => {
            const items = design[f.id] ?? [];
            return (
              <section key={f.id} className="pyj-sheet_face">
                <h2 className="pyj-sheet_facetitle">{f.label}</h2>
                {items.length ? (
                  <ul className="pyj-sheet_list">
                    {items.map((it, i) => {
                      const dd = describe(it);
                      return (
                        <li key={`${f.id}-${i}`} className="pyj-sheet_li">
                          <span className="pyj-sheet_name">{dd.name}</span>
                          {dd.meta && <span className="pyj-sheet_meta"> — {dd.meta}</span>}
                          {dd.note && <p className="pyj-sheet_note">{dd.note}</p>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="pyj-sheet_none">Sin grabado en esta cara.</p>
                )}
              </section>
            );
          })}
        </div>

        <p className="pyj-sheet_foot">
          {total} elemento{total === 1 ? "" : "s"} en total · Hoja de diseño para el
          taller. Los signos de Ifá son herencia sagrada Yoruba/Lucumí; su
          significado pertenece a la tradición.
        </p>

        <div className="pyj-sheet_actions">
          <PrintButton />
          <Link href="/configurador" className="pyj-sheet_back">
            Abrir el configurador
          </Link>
        </div>
      </div>
    </section>
  );
}
