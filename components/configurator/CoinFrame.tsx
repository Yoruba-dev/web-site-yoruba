// The base of the coin editor: a PHOTO of the real minted piece, cut out on
// transparency, not an illustration. Both faces come from the workshop's own
// render of the struck coin (design-assets/moneda-originales/), so what the
// customer composes on is the actual 36.5 mm piece they will receive — the 16
// Odù Meji already in the rim of the anverso, the polished field and the "PYJ"
// mark on the reverso.
//
// On top of the photo we draw only the engraving guide: a dashed ring at the
// edge of the field the graver can reach (COIN_FACES[].field, measured off that
// same render). Everything else is left to the photo.
import type { CoinFace } from "@/lib/coin";

export default function CoinFrame({
  face,
  gems,
}: {
  face: CoinFace;
  /** Orisha colours — a soft halo around the rim, matching the ring editor. */
  gems?: string[];
}) {
  // field is a fraction of the RADIUS; as a fraction of the box side it's half.
  const fieldPct = face.field * 50;

  return (
    <div className="pyj-coin" aria-hidden="true">
      {gems && gems.length > 0 && (
        <span
          className="pyj-coin_halo"
          style={{
            background: `conic-gradient(${gems
              .concat(gems[0])
              .map((c, i, a) => `${c} ${(i / (a.length - 1)) * 100}%`)
              .join(", ")})`,
          }}
        />
      )}
      <img className="pyj-coin_photo" src={face.image} alt="" width={880} height={880} />
      <span
        className="pyj-coin_field"
        style={{ width: `${fieldPct * 2}%`, height: `${fieldPct * 2}%` }}
      />
    </div>
  );
}
