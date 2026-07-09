import { SITE } from "@/lib/site";

// Store-location map. Uses OpenStreetMap's keyless embed (which always renders —
// unlike Google's now-deprecated keyless embed, which shows a blank box) with a
// marker on the shop, plus a link that opens Google Maps for directions.
export default function StoreMap({ height = 380 }: { height?: number }) {
  const { lat, lng } = SITE.contact.geo;
  const bbox = `${lng - 0.006},${lat - 0.004},${lng + 0.006},${lat + 0.004}`;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    SITE.contact.mapQuery,
  )}`;

  return (
    <div className="store-map" style={{ width: "100%" }}>
      <iframe
        title={`Ubicación de ${SITE.name} — ${SITE.contact.address}`}
        src={osmSrc}
        style={{
          width: "100%",
          height,
          border: "1px solid var(--dk-border)",
          borderRadius: 8,
          display: "block",
        }}
        loading="lazy"
      />
      <a
        href={gmaps}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          marginTop: 10,
          color: "var(--pyj-gold)",
          fontWeight: 500,
        }}
      >
        📍 Ver en Google Maps · Cómo llegar
      </a>
    </div>
  );
}
