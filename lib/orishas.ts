// Shared Orisha definitions. Products are tagged with these names in mock-data
// (derived from their titles), so the "Comprar por Orisha" showcase and the shop
// filter both reference the same canonical list.

export interface OrishaInfo {
  name: string;
  domain: string;
  /** the two sacred eleke (collar) bead colours */
  a: string;
  b: string;
}

// Featured in the home "Comprar por Orisha" showcase. `name` matches the product tag.
export const SHOWCASE_ORISHAS: OrishaInfo[] = [
  { name: "Elegguá", domain: "Caminos y aperturas", a: "#b5341f", b: "#1c1c1c" },
  { name: "Obatalá", domain: "Pureza y paz", a: "#f4ecd8", b: "#ffffff" },
  { name: "Oshún", domain: "Amor y prosperidad", a: "#e3b23c", b: "#c98a2b" },
  { name: "Yemayá", domain: "El mar y la madre", a: "#2e5e9e", b: "#dfeafb" },
  { name: "Changó", domain: "Fuerza y justicia", a: "#b5341f", b: "#ffffff" },
  { name: "Orula", domain: "Sabiduría e Ifá", a: "#1f6b3c", b: "#e3b23c" },
];

// Every Orisha name that can appear as a product tag — used by the shop filter to
// separate the "Por Orisha" group from the piece-type categories.
export const ORISHA_NAMES = [
  "Elegguá",
  "Obatalá",
  "Oshún",
  "Yemayá",
  "Changó",
  "Orula",
  "Olokun",
  "Oyá",
  "Ogún",
  "Ochosi",
  "Babalú Ayé",
  "Obba",
  "Aggayú",
  "Inle",
  "Yewá",
];

export const isOrishaTag = (tag: string) => ORISHA_NAMES.includes(tag);
