// ---------------------------------------------------------------------------
// MATERIALES DE LA VISTA 3D — tonos medidos en las MISMAS fotos de capa que
// usa el compositor (public/assets/images/reloj/capas/), para que el reloj 3D
// y el de frente sean la misma pieza.
//
// Cómo se midió (una vez, con Pillow sobre las capas de 1200 px):
//   • metal de la caja: mediana del cepillado plano de las asas (x 7.3–10.3
//     mm, y 20.8–22.3 mm) en caja-<acabado>-1200.webp: acero #c2c2c2, negro
//     PVD #5e5e5a, oro rosa #dab9a0. Es el color que refleja el metal (F0).
//   • correas: mediana del centro de la correa (|x| < 8 mm, 26–36 mm del
//     centro) en correa-<id>-1200.webp, un pelo más clara (la foto lleva la
//     sombra del estudio). Una correa sin foto propia (caucho amarillo, vino)
//     usa el color del catálogo (WATCH_COLORS).
// Colores en sRGB (three los pasa a lineal con la gestión de color activada).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { WATCH_COLORS, getStrap, type FinishId, type WatchConfig } from "@/lib/watch";

export const FINISH_TONE: Readonly<Record<FinishId, string>> = {
  acero: "#c6c8ca",
  "pvd-negro": "#5d5f62",
  "oro-rosa": "#e0bfab",
};

/** Rugosidad del cepillado por acabado (el PVD es algo más mate). */
const BRUSHED_ROUGH: Readonly<Record<FinishId, number>> = { acero: 0.34, "pvd-negro": 0.4, "oro-rosa": 0.32 };

/** Correas con foto: mediana medida en su capa (ver cabecera). */
const STRAP_PHOTO_TONE: Readonly<Record<string, string>> = {
  "caucho-negro": "#3c3c3d",
  "caucho-gris": "#767677",
  "caucho-blanco": "#ececea",
  "caucho-azul-marino": "#2f3c52",
  "caucho-azul": "#38598c",
  "caucho-naranja": "#ec7c3c",
  "caucho-verde": "#58624a",
  "caucho-rojo": "#9a3735",
  "caucho-tan": "#b48e66",
  "piel-verde": "#42564c",
  "piel-rojo": "#83302d",
  "piel-azul-marino": "#28374f",
};

export function finishOf(c: Pick<WatchConfig, "acabado">): FinishId {
  return c.acabado in FINISH_TONE ? c.acabado : "acero";
}

/** Tono de la correa (sRGB). */
export function strapTone(c: Pick<WatchConfig, "correa">): string {
  const s = getStrap(c.correa);
  if (!s) return STRAP_PHOTO_TONE["caucho-negro"];
  return STRAP_PHOTO_TONE[s.id] ?? WATCH_COLORS[s.color ?? "negro"].hex;
}

export interface FinishMaterials {
  /** Cepillado lineal (flancos, asas, fondo). */
  brushed: THREE.MeshPhysicalMaterial;
  /** Cepillado radial (cara del bisel). */
  brushedRadial: THREE.MeshPhysicalMaterial;
  /** Pulido espejo (chaflanes, orejas, corona, eslabones centrales). */
  polished: THREE.MeshPhysicalMaterial;
  /** Interior mate (pared de la ventana sobre la esfera). */
  matte: THREE.MeshPhysicalMaterial;
  dispose(): void;
}

/** Los materiales de metal de un acabado. `radial` = mapa de dirección del
 *  cepillado radial (en mm de la tapa del bisel); `streaks` = vetas de
 *  rugosidad del cepillado lineal. */
export function finishMaterials(fin: FinishId, maps: { radial: THREE.Texture; streaks: THREE.Texture }): FinishMaterials {
  const tone = new THREE.Color(FINISH_TONE[fin]);
  const rough = BRUSHED_ROUGH[fin];
  // A dos caras: los tornos (chaflán interior, anillo de la tapa) no tienen
  // un sentido fijo y el shader voltea la normal de la cara de atrás.
  const side = THREE.DoubleSide;
  const brushed = new THREE.MeshPhysicalMaterial({
    side,
    color: tone,
    metalness: 1,
    roughness: rough,
    roughnessMap: maps.streaks,
    anisotropy: 0.65,
    anisotropyRotation: Math.PI / 2,
  });
  const radial = maps.radial.clone();
  // La tapa del bisel lleva UV en mm (−24…24): al rango 0…1 de la textura.
  radial.repeat.set(1 / 48, 1 / 48);
  radial.offset.set(0.5, 0.5);
  radial.needsUpdate = true;
  const brushedRadial = new THREE.MeshPhysicalMaterial({
    side,
    color: tone,
    metalness: 1,
    roughness: rough,
    anisotropy: 0.8,
    anisotropyMap: radial,
  });
  const polished = new THREE.MeshPhysicalMaterial({
    side,
    color: tone.clone().lerp(new THREE.Color("#ffffff"), fin === "pvd-negro" ? 0.02 : 0.08),
    metalness: 1,
    roughness: fin === "pvd-negro" ? 0.12 : 0.07,
  });
  const matte = new THREE.MeshPhysicalMaterial({
    side,
    color: tone.clone().multiplyScalar(0.55),
    metalness: 0.9,
    roughness: 0.55,
  });
  return {
    brushed,
    brushedRadial,
    polished,
    matte,
    dispose() {
      radial.dispose();
      brushed.dispose();
      brushedRadial.dispose();
      polished.dispose();
      matte.dispose();
    },
  };
}

/** Metal pulido de las agujas y de los aros de los índices. */
export function handMetal(hex: string): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), metalness: 1, roughness: 0.1 });
}

/** Lume: de día, pintura clara mate; de noche brilla (emisivo, sin bloom). */
export function lumeMaterial(day: string, glow: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(day),
    roughness: 0.6,
    metalness: 0,
    emissive: new THREE.Color(glow),
    emissiveIntensity: 0,
  });
}
