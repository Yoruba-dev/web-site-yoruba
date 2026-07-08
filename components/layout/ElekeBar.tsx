// "Eleke" bar — a thin band of the Orisha bead colours (white, gold, red, blue,
// green, maroon, black). The elekes (sacred beaded necklaces) are the signature
// symbol of Santería / the Lucumí tradition, so this is the brand's visual seal.
const ELEKE = [
  "#f3ead7", // Obatalá — blanco/crema
  "#d8a72c", // Oshún — oro/amarillo
  "#b5341f", // Changó / Elegguá — rojo
  "#2e5e9e", // Yemayá — azul
  "#1f6b3c", // Orula / Oggún — verde
  "#7b3f2e", // Oyá — vino/marrón
  "#111111", // Elegguá — negro
];

export default function ElekeBar() {
  return (
    <div aria-hidden="true" style={{ display: "flex", height: 6, width: "100%" }}>
      {ELEKE.map((c, i) => (
        <span key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </div>
  );
}
