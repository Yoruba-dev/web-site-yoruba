// Registry that maps a customizable piece to either a procedural shape (built in
// code) or a REAL 3D model file (.glb). To add a real piece: drop its .glb in
// /public/models/, add an entry here with kind:"glb", and (optionally) map a product
// handle to it in PRODUCT_MODEL. The customizer loads the model and engraves on it.
//
// Getting .glb files for your pieces (you have photos, not models):
//   • AI photo→3D (fastest for a 150-piece catalogue): Meshy / Tripo / Rodin — upload
//     a product photo, export .glb.
//   • Blender modelling or 3D scanning your physical pieces (highest quality).

export interface PieceModel {
  id: string;
  label: string;
  kind: "proc" | "glb";
  /** procedural shape key */
  procShape?: "disc" | "plate" | "bar";
  /** path to the .glb under /public */
  url?: string;
  /** scale to fit the model in view */
  scale?: number;
  /** engraving decal size + where it sits on the model's front */
  decalScale?: number;
  decalPos?: [number, number, number];
  note?: string;
}

export const PIECE_MODELS: PieceModel[] = [
  { id: "disc", label: "Medalla", kind: "proc", procShape: "disc" },
  { id: "plate", label: "Placa", kind: "proc", procShape: "plate" },
  { id: "bar", label: "Barra", kind: "proc", procShape: "bar" },
  {
    id: "real",
    label: "Modelo 3D",
    kind: "glb",
    url: "/models/ejemplo-helmet.glb",
    scale: 1.35,
    decalScale: 0.9,
    decalPos: [0, 0.05, 1.25],
    note: "Modelo real de ejemplo — reemplázalo por el .glb de tu pieza.",
  },
];

// Optional: map a product handle to a specific piece model so the right piece opens
// from the product page. Falls back to the procedural medallion when unmapped.
export const PRODUCT_MODEL: Record<string, string> = {
  // "anillo-de-ifa": "real",
};
