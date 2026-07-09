import { SITE } from "@/lib/site";

// Reusable Google Maps embed centred on the real shop address (classic embed,
// no API key required). Reads the address from the single site config.
export default function StoreMap({ height = 380 }: { height?: number }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    SITE.contact.mapQuery,
  )}&z=15&output=embed`;
  return (
    <div className="store-map" style={{ width: "100%" }}>
      <iframe
        title={`Ubicación de ${SITE.name} — ${SITE.contact.address}`}
        src={src}
        style={{ width: "100%", height, border: 0, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
