// Traditional eleke (collar) colors of the main Lucumí / Yoruba Orishas, used to
// generate the ring's gem pattern by the wearer's santo / ángel de la guarda.
// Colors are the widely-accepted canonical ones (researched + cross-checked across
// santería sources). Cultural note: the eleke color code is heritage; we use it to
// honor the wearer's Orisha as identity — the piece is a joya de autor, not a
// consecrated collar. Variations exist between casas de santo.

const HEX: Record<string, string> = {
  rojo: "#c1272d",
  negro: "#1c1c1c",
  blanco: "#efe7d4",
  azul: "#1f4e9e",
  "azul-claro": "#bcd7f0",
  amarillo: "#f2c14e",
  ambar: "#d9962b",
  dorado: "#e3b23c",
  verde: "#1f7a3d",
  morado: "#6a3d8f",
  marron: "#6e3b2b",
  vinotinto: "#7a1f33",
  coral: "#e8836b",
  rosa: "#dd8aa8",
  lila: "#b48ad9",
};

export interface OrishaPalette {
  id: string;
  name: string;
  saint: string;
  /** canonical eleke color names (see HEX) */
  colors: string[];
  note: string;
}

// Ordered roughly by how commonly they're someone's guardian Orisha.
export const ORISHAS: OrishaPalette[] = [
  { id: "yemaya", name: "Yemayá", saint: "Virgen de Regla", colors: ["azul", "blanco"], note: "El mar; azul y blanco." },
  { id: "chango", name: "Changó", saint: "Santa Bárbara", colors: ["rojo", "blanco"], note: "Fuego y justicia; rojo y blanco." },
  { id: "oshun", name: "Oshún", saint: "Caridad del Cobre", colors: ["amarillo", "ambar", "dorado"], note: "El río y el oro; amarillo y ámbar." },
  { id: "obatala", name: "Obatalá", saint: "Virgen de las Mercedes", colors: ["blanco", "dorado"], note: "Pureza; blanco (con toque dorado)." },
  { id: "eleggua", name: "Elegguá", saint: "Niño de Atocha", colors: ["rojo", "negro"], note: "Los caminos; rojo y negro." },
  { id: "ogun", name: "Ogún", saint: "San Pedro", colors: ["verde", "negro"], note: "El hierro; verde y negro." },
  { id: "ochosi", name: "Ochosi", saint: "San Norberto", colors: ["azul", "ambar"], note: "El cazador; azul y ámbar." },
  { id: "oya", name: "Oyá", saint: "Virgen de la Candelaria", colors: ["marron", "vinotinto", "negro"], note: "Los vientos; marrón, vino y sus nueve colores." },
  { id: "orula", name: "Orula", saint: "San Francisco de Asís", colors: ["verde", "amarillo"], note: "Ifá; verde y amarillo." },
  { id: "babalu-aye", name: "Babalú Ayé", saint: "San Lázaro", colors: ["morado", "blanco"], note: "San Lázaro; morado y blanco." },
  { id: "aggayu", name: "Aggayú", saint: "San Cristóbal", colors: ["marron", "rojo", "amarillo"], note: "El volcán; marrón, rojo y varios." },
  { id: "inle", name: "Inle", saint: "San Rafael", colors: ["azul", "verde", "coral"], note: "El médico; azul, verde y coral." },
  { id: "obba", name: "Obba", saint: "Santa Rita", colors: ["rosa", "amarillo", "lila"], note: "La fidelidad; rosa y amarillo." },
  { id: "yewa", name: "Yewá", saint: "Ntra. Sra. de Montserrat", colors: ["rosa", "negro"], note: "Rosa y negro (azabache)." },
  { id: "ibeji", name: "Ibeji (Jimaguas)", saint: "San Cosme y San Damián", colors: ["rojo", "blanco", "azul"], note: "Los gemelos; rojo-blanco y azul-blanco." },
  { id: "olokun", name: "Olokun", saint: "Virgen de Regla", colors: ["azul", "blanco", "coral"], note: "El fondo del mar; azul, blanco y coral." },
  { id: "nana", name: "Naná Burukú", saint: "Santa Ana", colors: ["blanco", "morado", "azul"], note: "Blanco, morado y azul." },
];

export function getOrisha(id: string): OrishaPalette | undefined {
  return ORISHAS.find((o) => o.id === id);
}

/** The hex gem colors to cycle around the piece for a given Orisha. Single-color
 *  Orishas get a gold accent so the pavé still reads as a pattern. Returns
 *  undefined for an unknown/empty id (→ the piece keeps its default gems). */
export function getOrishaGems(id?: string): string[] | undefined {
  const o = id ? getOrisha(id) : undefined;
  if (!o) return undefined;
  const hexes = o.colors.map((c) => HEX[c]).filter(Boolean);
  if (!hexes.length) return undefined;
  return hexes.length === 1 ? [hexes[0], HEX.dorado] : hexes;
}

/** A small swatch list (name + hex) for previewing an Orisha's colors in the UI. */
export function orishaSwatches(id?: string): string[] {
  return getOrishaGems(id) ?? [];
}
