import Link from "next/link";
import SectionTitle from "@/components/ui/SectionTitle";
import { SHOWCASE_ORISHAS } from "@/lib/orishas";

// "Comprar por Orisha" — each Orisha is shown as its ELEKE (the beaded collar worn in
// the religion), strung in that Orisha's sacred colours. Each card links to the shop
// pre-filtered to that Orisha's pieces (?cat=<Orisha>). `a`/`b` are the bead colours.
const ORISHAS = SHOWCASE_ORISHAS;

// A beaded collar (eleke) drawn as an SVG ring of alternating beads, each with a
// pearl highlight — far more meaningful than a flat gradient disc.
function Eleke({ a, b, label }: { a: string; b: string; label: string }) {
  const cx = 46;
  const cy = 46;
  const ring = 33; // strand radius
  const beadR = 6;
  const count = 18;
  const beads = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      i,
      x: cx + ring * Math.cos(angle),
      y: cy + ring * Math.sin(angle),
      color: i % 2 === 0 ? a : b,
    };
  });
  return (
    <svg className="eleke" viewBox="0 0 92 92" role="img" aria-label={`Eleke de ${label}`}>
      {/* faint plate so beads of any colour read on the dark tile */}
      <circle cx={cx} cy={cy} r={42} fill="rgba(255,255,255,0.025)" />
      {/* the strand */}
      <circle cx={cx} cy={cy} r={ring} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1.4" />
      {beads.map((bd) => (
        <g key={bd.i}>
          <circle
            cx={bd.x}
            cy={bd.y}
            r={beadR}
            fill={bd.color}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="0.6"
          />
          {/* pearl highlight */}
          <circle cx={bd.x - 1.7} cy={bd.y - 1.9} r={beadR * 0.4} fill="rgba(255,255,255,0.55)" />
        </g>
      ))}
    </svg>
  );
}

export default function OrishaShowcase() {
  return (
    <div className="orisha-area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <SectionTitle title="Comprar por Orisha" />
            <p className="orisha-intro">
              Cada eleke lleva los colores sagrados de su Orisha. Elige por el
              camino que te acompaña.
            </p>
          </div>
        </div>
        <div className="orisha-grid">
          {ORISHAS.map((o) => (
            <Link
              key={o.name}
              href={`/shop-left-sidebar?cat=${encodeURIComponent(o.name)}`}
              className="orisha-card"
            >
              <Eleke a={o.a} b={o.b} label={o.name} />
              <h6>{o.name}</h6>
              <span>{o.domain}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
