import type { Rating } from "@/lib/judgeme";

// Real review stars (from Judge.me). Renders nothing when there are no reviews,
// so a piece without reviews stays clean instead of showing hollow/fake stars.
//
// The stars are drawn as two overlaid Unicode ★ rows (a muted base + a gold fill
// clipped to the rating %). This is font-independent — it always renders, unlike
// the Font Awesome glyphs which silently showed nothing — and gives an accurate
// fractional fill (e.g. 4.5 → four-and-a-half gold stars).
export default function ReviewStars({
  rating,
  compact = false,
}: {
  rating: Rating | null;
  compact?: boolean;
}) {
  if (!rating || rating.count < 1) return null;
  const pct = Math.max(0, Math.min(100, (rating.rating / 5) * 100));
  return (
    <div
      className={`pyj-stars${compact ? " pyj-stars--compact" : ""}`}
      title={`${rating.rating.toFixed(1)} de 5`}
      aria-label={`${rating.rating.toFixed(1)} de 5 estrellas, ${rating.count} ${
        rating.count === 1 ? "reseña" : "reseñas"
      }`}
    >
      <span className="pyj-stars-icons" aria-hidden="true">
        <span className="pyj-stars-base">★★★★★</span>
        <span className="pyj-stars-fill" style={{ width: `${pct}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="pyj-stars-count">
        {compact
          ? `${rating.rating.toFixed(1)} (${rating.count})`
          : `${rating.rating.toFixed(1)} · ${rating.count} ${
              rating.count === 1 ? "reseña" : "reseñas"
            }`}
      </span>
    </div>
  );
}
