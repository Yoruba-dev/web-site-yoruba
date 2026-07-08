// Static 5-star rating box, identical markup to the template's .rating-box.
export default function RatingStars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="rating-box">
      <ul>
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className={i < rating ? undefined : "silver-color"}>
            <i className="fa fa-star-of-david" />
          </li>
        ))}
      </ul>
    </div>
  );
}
