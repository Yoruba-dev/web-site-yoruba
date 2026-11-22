// ---------------------------------------------------------------------------
// EL CRISTAL — cómo se ve una pieza que aún no se ha elegido (SPEC §4.3).
//
// • GhostMaterial: un ShaderMaterial hecho con los trozos de three (así
//   funcionan la instanciación y los planos de recorte): solo el borde brilla
//   (Fresnel), alpha = uOpacity · (0.06 + 0.55 · (1 − |N·V|)^2.4), color
//   #d9dfe4, sin tono (toneMapped:false), sin escribir profundidad.
// • Pasada previa de profundidad (renderOrder 20): la misma geometría sin
//   color, que deja en el z-buffer SOLO la superficie de cristal más cercana;
//   el color (21, depthFunc LessEqual) pinta solo esa: una única cáscara de
//   vidrio limpia, sin capas que se sumen.
// • Aristas (caja y cierre): EdgesGeometry a 32°, #e9eef2, opacidad
//   0.14 · uOpacity, renderOrder 22. Una por geometría (memo).
// • Todo en la CAPA 1: la cámara principal ve 0 y 1; la sombra de contacto y
//   la cámara de la foto de estudio solo la 0 (el cristal no se fotografía ni
//   hace sombra). El raycaster ve todas (el cristal se puede tocar).
// • Cada pieza lleva su plano de recorte NEGADO respecto al de lo real: el
//   cristal y la pieza real se encuentran en la banda del barrido.
// ---------------------------------------------------------------------------
import * as THREE from "three";

/** Capa del cristal. */
export const GHOST_LAYER = 1;
export const GHOST_COLOR = "#d9dfe4";
const EDGE_COLOR = "#e9eef2";
export const RO = { depth: 20, color: 21, edges: 22 } as const;

const VERT = /* glsl */ `
#include <common>
#include <clipping_planes_pars_vertex>
varying vec3 vGhostN;
varying vec3 vGhostV;
void main() {
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <project_vertex>
  #include <clipping_planes_vertex>
  vGhostN = normalize( transformedNormal );
  vGhostV = - mvPosition.xyz;
}
`;

const FRAG = /* glsl */ `
#include <common>
#include <clipping_planes_pars_fragment>
uniform float uOpacity;
uniform vec3 uColor;
varying vec3 vGhostN;
varying vec3 vGhostV;
void main() {
  #include <clipping_planes_fragment>
  float f = pow( 1.0 - abs( dot( normalize( vGhostN ), normalize( vGhostV ) ) ), 2.4 );
  gl_FragColor = vec4( uColor, uOpacity * ( 0.06 + 0.55 * f ) );
  #include <colorspace_fragment>
}
`;

export interface GhostMaterials {
  color: THREE.ShaderMaterial;
  depth: THREE.MeshBasicMaterial;
  edges: THREE.LineBasicMaterial;
  /** Opacidad del cristal de la pieza (compartida por sus materiales). */
  opacity: { value: number };
  /** Aplica `opacity` a las aristas (no es un uniforme: se copia). */
  sync(): void;
  dispose(): void;
}

/** Los materiales del cristal de una pieza, con su plano negado. */
export function ghostMaterials(plane: THREE.Plane): GhostMaterials {
  const opacity = { value: 1 };
  const color = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uOpacity: opacity, uColor: { value: new THREE.Color(GHOST_COLOR) } },
    transparent: true,
    depthWrite: false,
    depthFunc: THREE.LessEqualDepth,
    side: THREE.DoubleSide,
    toneMapped: false,
    clipping: true,
    clippingPlanes: [plane],
  });
  const depth = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: true,
    side: THREE.DoubleSide,
    clippingPlanes: [plane],
  });
  const edges = new THREE.LineBasicMaterial({
    color: EDGE_COLOR,
    transparent: true,
    opacity: 0.14,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    clippingPlanes: [plane],
  });
  return {
    color,
    depth,
    edges,
    opacity,
    sync() {
      edges.opacity = 0.14 * opacity.value;
    },
    dispose() {
      color.dispose();
      depth.dispose();
      edges.dispose();
    },
  };
}

// — Aristas, una vez por geometría ——————————————————————————————————————
const edgeCache = new WeakMap<THREE.BufferGeometry, THREE.EdgesGeometry>();

/** EdgesGeometry a 32° de una geometría (memo; se libera con ella). */
export function edgesOf(geo: THREE.BufferGeometry): THREE.EdgesGeometry {
  const hit = edgeCache.get(geo);
  if (hit) return hit;
  const e = new THREE.EdgesGeometry(geo, 32);
  edgeCache.set(geo, e);
  const free = () => {
    e.dispose();
    edgeCache.delete(geo);
    geo.removeEventListener("dispose", free);
  };
  geo.addEventListener("dispose", free);
  return e;
}
