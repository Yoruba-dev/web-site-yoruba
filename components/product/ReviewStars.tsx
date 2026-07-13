import type { Rating } from "@/lib/judgeme";

// Real review stars (from Judge.me). Renders nothing when there are no reviews,
// so a piece without reviews stays clean instead of showing hollow/fake stars.
export default function ReviewStars({ rating }: { rating: Rating | null }) {
  if (!rating || rating.count < 1) return null;
  const full = Math.round(rating.rating);
  return (
    <div
      className="pyj-stars"
      title={`${rating.rating.toFixed(1)} de 5`}
      aria-label={`${rating.rating.toFixed(1)} de 5 estrellas, ${rating.count} reseñas`}
    >
      <span className="pyj-stars-icons" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} className={`fa fa-star${i < full ? "" : "-o"}`} />
        ))}
      </span>
      <span className="pyj-stars-count">
        {rating.rating.toFixed(1)} · {rating.count}{" "}
        {rating.count === 1 ? "reseña" : "reseñas"}
      </span>
    </div>
  );
}
