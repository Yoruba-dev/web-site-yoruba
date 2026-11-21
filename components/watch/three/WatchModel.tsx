"use client";

// ---------------------------------------------------------------------------
// EL RELOJ EN 3D — la pieza exacta del cliente a partir de su WatchConfig
// (1 unidad = 1 mm; la esfera mira a +z, las 12 en +y, la muñeca detrás).
//
// Todo sale de las mismas fuentes que el compositor de frente:
//   • caja: silueta trazada de la foto (geo/outline.ts) en el acabado elegido;
//   • esfera: la foto del disco sol + dialPrimitives() pintadas en curvas;
//   • índices, aplique, agujas: DIAL_LAYOUT / HANDS / handPose();
//   • tapa: casebackPrimitives() grabadas (derechas mirando por detrás);
//   • correa: el tipo y el color del catálogo, y el CIERRE elegido (hebilla de
//     púa, desplegable o el plegable del brazalete).
// Cada textura y geometría se crea con useMemo según lo que la cambia y se
// libera (dispose) al cambiar o al desmontar.
// ---------------------------------------------------------------------------
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type DependencyList } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { getClasp, getSecondsPart, getStrap, WATCH_COLORS, type WatchConfig } from "@/lib/watch";
import { dialHasDate, handAngles, handMetalHex, handPose, DIAL_LAYOUT } from "@/lib/watch-art";
import { CAPA_MEDIA_600, apliqueUrl, capaUrl, nombresCapas } from "@/lib/watch-capas";
import { lumeTones } from "../front/art";
import { caseGeometries } from "./geo/case";
import { Z, appliedGeometries, dateWellGeometry, dialDiscGeometry, handRotation, secondsHand, swordHand } from "./geo/dialParts";
import {
  STRAP_S,
  bladeGeometry,
  braceletGeometries,
  braceletLayout,
  braceletWidth,
  buckleGeometries,
  chordMatrix,
  claspHeadGeometries,
  frameMatrix,
  holeMatrices,
  strapGeometry,
  strapTop,
  strapWidth,
  tongueGeometry,
  type StrapKind,
} from "./geo/strap";
import { finishMaterials, finishOf, handMetal, lumeMaterial, strapTone, type FinishMaterials } from "./materials";
import {
  DATE_WHEEL,
  appliqueBox,
  brushStreaks,
  casebackTextures,
  crocoMaps,
  dateWheel,
  dialTextures,
  radialAniso,
} from "./tex/maps";
import { loadImage } from "./tex/paint";

/** Parte de la foto de la esfera que se suma como luz propia (ver dialMat). */
const DIAL_FILL = 0.6;

/** useMemo + dispose del valor anterior y al desmontar. (Las mallas llevan
 *  dispose={null}: R3F liberaría al desmontarlas los materiales compartidos.) */
function useDisposable<T extends { dispose(): void } | null>(make: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const v = useMemo(make, deps);
  useEffect(() => () => v?.dispose(), [v]);
  return v;
}

/** Carga las imágenes que pinta la esfera. Una que falle llega como null (la
 *  esfera se pinta igual, con su color base): el reloj nunca se queda a medias.
 *  Mientras llegan las de un color nuevo devuelve las ANTERIORES con
 *  fresh = false: la esfera sigue pintada (nunca un disco gris de un
 *  fotograma) hasta que la nueva está lista. */
function useImages(urls: readonly string[]): { imgs: (HTMLImageElement | null)[]; fresh: boolean } | null {
  const key = urls.join("|");
  const [state, setState] = useState<{ key: string; imgs: (HTMLImageElement | null)[] } | null>(null);
  useEffect(() => {
    let vivo = true;
    Promise.all(key.split("|").map((u) => loadImage(u).catch(() => null))).then((imgs) => {
      if (vivo) setState({ key, imgs });
    });
    return () => {
      vivo = false;
    };
  }, [key]);
  return state ? { imgs: state.imgs, fresh: state.key === key } : null;
}

/** El valor, con `ms` de retraso tras el último cambio (el primero, al momento). */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** La foto de 600 en pantallas pequeñas (la misma media query que el
 *  compositor: el navegador ya la tiene en caché). */
function useCapaSize(): 600 | 1200 {
  return useMemo(() => (typeof window !== "undefined" && window.matchMedia(CAPA_MEDIA_600).matches ? 600 : 1200), []);
}

/** Tamaño de las texturas pintadas: 2048 en escritorio, 1536 en el móvil. */
function useTexSize(): number {
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    const small =
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 767px)").matches);
    return Math.min(small ? 1536 : 2048, gl.capabilities.maxTextureSize);
  }, [gl]);
}

export default function WatchModel({
  config,
  noche,
  onReady,
}: {
  config: WatchConfig;
  noche: boolean;
  onReady?: () => void;
}) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const maxAniso = useMemo(() => Math.min(8, gl.capabilities.getMaxAnisotropy()), [gl]);
  const texSize = useTexSize();
  const fin = finishOf(config);

  const shared = useDisposable(() => {
    const radial = radialAniso(maxAniso);
    const streaks = brushStreaks(maxAniso);
    const date = dateWheel(maxAniso);
    return { radial, streaks, date, dispose: () => [radial, streaks, date].forEach((t) => t.dispose()) };
  }, [maxAniso]);
  const mats = useDisposable(() => finishMaterials(fin, shared), [fin, shared]);
  const geo = useDisposable(() => caseGeometries(), []);

  // — Imágenes de la esfera (la foto del disco sol y el aplique PY) ————————
  const n = nombresCapas(config);
  const capa = useCapaSize();
  const loaded = useImages([capaUrl(n.esfera, capa), apliqueUrl(n.aplique, capa)]);
  const imgs = loaded?.imgs ?? null;
  // La esfera se repinta con la config y las fotos de ESE momento; mientras
  // llega la foto de un color nuevo se queda la anterior (sin destello gris).
  const dialKey = JSON.stringify([config.esfera, config.aplique, config.acabado]);
  const [di, setDi] = useState<{ key: string; imgs: (HTMLImageElement | null)[]; config: WatchConfig } | null>(null);
  if (loaded?.fresh && (di?.key !== dialKey || di.imgs !== loaded.imgs)) {
    // Estado derivado (patrón de React: se ajusta durante el render).
    setDi({ key: dialKey, imgs: loaded.imgs, config });
  }
  const dial = useDisposable(
    () => (di ? dialTextures(di.config, { photo: di.imgs[0], logo: di.imgs[1] }, texSize, maxAniso) : null),
    [di, texSize, maxAniso],
  );
  // La tapa: mientras se escribe el grabado, se repinta 300 ms después de la
  // última tecla (cada pintada son 2 texturas de 2048² y su subida a la GPU).
  const tapa = useDebounced(config.tapa, 300);
  const backKey = JSON.stringify([tapa, fin]);
  const back = useDisposable(
    () => casebackTextures({ ...config, tapa }, fin, texSize, maxAniso),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backKey, texSize, maxAniso],
  );

  // — Listo: la primera vez que todo está pintado, tras un fotograma ——————
  const ready = !!dial && !!back;
  const told = useRef(false);
  useEffect(() => {
    invalidate();
    if (!ready || told.current) return;
    told.current = true;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => onReady?.());
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [ready, dial, back, invalidate, onReady]);

  return (
    <group>
      <CaseMeshes geo={geo} mats={mats} back={back} />
      <DialParts config={config} dial={dial} logo={di?.imgs[1] ?? imgs?.[1] ?? null} date={shared.date} noche={noche} maxAniso={maxAniso} />
      <Strap config={config} mats={mats} maxAniso={maxAniso} />
    </group>
  );
}

// ===========================================================================
// Caja, tapa y cristal
// ===========================================================================
function CaseMeshes({
  geo,
  mats,
  back,
}: {
  geo: ReturnType<typeof caseGeometries>;
  mats: FinishMaterials;
  back: ReturnType<typeof casebackTextures> | null;
}) {
  const field = useDisposable(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 1,
      roughness: 1,
      map: back?.map ?? null,
      roughnessMap: back?.orm ?? null,
      // El relieve va en el canal R de la misma textura (bumpMap lee R).
      bumpMap: back?.orm ?? null,
      bumpScale: 0.35,
    });
    return m;
  }, [back]);
  const crystal = useDisposable(
    () =>
      new THREE.MeshPhysicalMaterial({
        // Solo los reflejos: el cristal suma luz y nunca oscurece la esfera.
        // De frente casi no refleja (zafiro con antirreflejo); el brillo
        // aparece al inclinarlo (Fresnel), sin velar los colores de la esfera.
        color: "#000000",
        metalness: 0,
        roughness: 0.03,
        ior: 1.77,
        specularIntensity: 0.18,
        specularColor: new THREE.Color("#e6eeff"),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  const notch = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: mats.matte.color.clone().multiplyScalar(0.35), roughness: 0.8, metalness: 0.6 }),
    [mats],
  );
  return (
    <group>
      <mesh dispose={null} geometry={geo.bodyWall} material={mats.brushed} />
      <mesh dispose={null} geometry={geo.bodyEdges} material={mats.polished} />
      <mesh dispose={null} geometry={geo.bodyCaps} material={mats.brushed} />
      <mesh dispose={null} geometry={geo.bezelPolished} material={mats.polished} />
      <mesh dispose={null} geometry={geo.bezelTop} material={mats.brushedRadial} />
      <mesh dispose={null} geometry={geo.innerChamfer} material={mats.polished} />
      <mesh dispose={null} geometry={geo.innerWall} material={mats.matte} />
      <mesh dispose={null} geometry={geo.crown} material={mats.polished} />
      <mesh dispose={null} geometry={geo.crownTube} material={mats.brushed} />
      <mesh dispose={null} geometry={geo.casebackRing} material={mats.brushedRadial} />
      <mesh dispose={null} geometry={geo.casebackNotches} material={notch} />
      <mesh dispose={null} geometry={geo.casebackField} material={field} />
      <mesh dispose={null} geometry={geo.crystal} material={crystal} renderOrder={10} />
    </group>
  );
}

// ===========================================================================
// Esfera, índices, aplique y agujas
// ===========================================================================
function DialParts({
  config,
  dial,
  logo,
  date,
  noche,
  maxAniso,
}: {
  config: WatchConfig;
  dial: ReturnType<typeof dialTextures> | null;
  logo: HTMLImageElement | null;
  date: THREE.Texture;
  noche: boolean;
  maxAniso: number;
}) {
  const fecha = dialHasDate(config);
  const disc = useDisposable(() => dialDiscGeometry(config), [fecha]);
  const well = useDisposable(() => (fecha ? dateWellGeometry() : null), [fecha]);
  const appliedKey = JSON.stringify([config.esfera.modelo, fecha]);
  const applied = useDisposable(() => {
    const a = appliedGeometries(config);
    return { ...a, dispose: () => [a.rims, a.lume].forEach((g) => g?.dispose()) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey]);
  const hands = useDisposable(() => {
    const h = swordHand("hour");
    const m = swordHand("minute");
    const s = secondsHand();
    const hub = new THREE.CylinderGeometry(1.15, 1.15, 0.22, 40);
    hub.rotateX(Math.PI / 2);
    const cap = new THREE.CylinderGeometry(0.62, 0.62, 0.16, 32);
    cap.rotateX(Math.PI / 2);
    const pin = new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    pin.rotateX(Math.PI / 2);
    const list = [h.frame, h.lume, m.frame, m.lume, s.body, s.lume, hub, cap, pin];
    return { h, m, s, hub, cap, pin, dispose: () => list.forEach((g) => g.dispose()) };
  }, []);

  const metalHex = handMetalHex(config);
  const metal = useDisposable(() => handMetal(metalHex), [metalHex]);
  const tones = lumeTones(config);
  const lume = useDisposable(() => lumeMaterial(tones.dia, tones.halo), [tones.dia, tones.halo]);
  useEffect(() => {
    lume.emissiveIntensity = noche ? 1.7 : 0;
    lume.color.set(noche ? "#1c2a20" : tones.dia);
  }, [noche, lume, tones.dia]);
  const secHex = WATCH_COLORS[getSecondsPart(config.segundero)?.color ?? "negro"].hex;
  const secMat = useDisposable(
    () => new THREE.MeshPhysicalMaterial({ color: secHex, roughness: 0.32, metalness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.1 }),
    [secHex],
  );

  const dialMat = useDisposable(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      map: dial?.map ?? null,
      roughness: 1,
      metalness: 1,
      roughnessMap: dial?.orm ?? null,
      metalnessMap: dial?.orm ?? null,
      anisotropy: 0.85,
      anisotropyMap: dial?.aniso ?? null,
      // Laca fina: un brillo limpio al inclinar, no un velo blanco de frente.
      clearcoat: 0.2,
      clearcoatRoughness: 0.1,
      // La foto del disco ya lleva la luz del estudio donde se hizo: una parte
      // se suma tal cual (emisiva) para que la esfera tenga el MISMO color y
      // la tinta el mismo contraste que el compositor de frente, sin subir la
      // luz de toda la escena (el acero y la correa se quemarían). De noche,
      // nada: solo brilla el lume.
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: dial?.map ?? null,
      emissiveIntensity: dial && !noche ? DIAL_FILL : 0,
    });
    if (!dial) {
      // Solo antes de la PRIMERA pintada (el visor aún está tapado por el
      // reloj de frente): el color base liso.
      m.map = null;
      m.color.set("#333");
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dial]);
  useEffect(() => {
    dialMat.emissiveIntensity = noche || !dial ? 0 : DIAL_FILL;
  }, [dialMat, dial, noche]);
  const wellMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.9 }), []);
  const dateMat = useDisposable(() => new THREE.MeshStandardMaterial({ map: date, roughness: 0.6 }), [date]);
  const dateGeo = useDisposable(() => new THREE.PlaneGeometry(DATE_WHEEL.w, DATE_WHEEL.h), []);

  // Aplique PY: la imagen recortada por su alfa, un pelo levantada, con un
  // canto más oscuro debajo (se ve de lado como una pieza con grosor).
  const box = appliqueBox(config);
  const logoTex = useDisposable(() => {
    if (!logo) return null;
    const t = new THREE.Texture(logo);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.needsUpdate = true;
    return t;
  }, [logo, maxAniso]);
  const logoMat = useDisposable(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: logoTex,
        alphaTest: 0.5,
        metalness: 0.45,
        roughness: 0.32,
        clearcoat: 0.4,
        clearcoatRoughness: 0.15,
      }),
    [logoTex],
  );
  const logoEdge = useDisposable(
    () => new THREE.MeshStandardMaterial({ map: logoTex, alphaTest: 0.5, color: "#4a3a22", metalness: 0.6, roughness: 0.5 }),
    [logoTex],
  );
  const logoGeo = useDisposable(() => new THREE.PlaneGeometry(1, 1), []);

  const ang = handAngles(handPose(config));
  return (
    <group>
      <mesh dispose={null} geometry={disc} material={dialMat} />
      {well && <mesh dispose={null} geometry={well} material={wellMat} />}
      {fecha && <mesh dispose={null} geometry={dateGeo} material={dateMat} position={[DIAL_LAYOUT.date.cx, 0, -0.4]} />}
      {applied.rims && <mesh dispose={null} geometry={applied.rims} material={metal} />}
      {applied.lume && <mesh dispose={null} geometry={applied.lume} material={lume} />}
      {box && logoTex && (
        <group position={[box.cx, -box.cy, 0]} scale={[box.side, box.side, 1]}>
          <mesh dispose={null} geometry={logoGeo} material={logoEdge} position={[0.004, -0.004, 0.16]} />
          <mesh dispose={null} geometry={logoGeo} material={logoMat} position={[0, 0, 0.32]} />
        </group>
      )}
      <group position={[0, 0, Z.hour]} rotation={[0, 0, handRotation(ang.hour)]}>
        <mesh dispose={null} geometry={hands.h.frame} material={metal} />
        <mesh dispose={null} geometry={hands.h.lume} material={lume} />
      </group>
      <group position={[0, 0, Z.minute]} rotation={[0, 0, handRotation(ang.minute)]}>
        <mesh dispose={null} geometry={hands.m.frame} material={metal} />
        <mesh dispose={null} geometry={hands.m.lume} material={lume} />
      </group>
      <group position={[0, 0, Z.seconds]} rotation={[0, 0, handRotation(ang.seconds)]}>
        <mesh dispose={null} geometry={hands.s.body} material={secMat} />
        <mesh dispose={null} geometry={hands.s.lume} material={lume} />
      </group>
      <mesh dispose={null} geometry={hands.hub} material={metal} position={[0, 0, Z.hour + 0.11]} />
      <mesh dispose={null} geometry={hands.cap} material={secMat} position={[0, 0, Z.seconds + 0.1]} />
      <mesh dispose={null} geometry={hands.pin} material={metal} position={[0, 0, Z.seconds + 0.17]} />
    </group>
  );
}

// ===========================================================================
// Correa / brazalete y su CIERRE
// ===========================================================================
type Cierre = "puas" | "desplegable" | "brazalete";

function Strap({ config, mats, maxAniso }: { config: WatchConfig; mats: FinishMaterials; maxAniso: number }) {
  const kind: StrapKind = getStrap(config.correa)?.tipo ?? "caucho";
  const cierre: Cierre = kind === "brazalete" ? "brazalete" : (getClasp(config.cierre)?.id ?? "puas");
  const tone = strapTone(config);
  // Las 12 siempre acaban en recto (entran en la hebilla o en su ala); las 6
  // acaban en punta con agujeros solo con la hebilla de púa.
  const fin6 = cierre === "puas" ? "punta" : "recto";
  const band12 = useDisposable(() => (kind === "brazalete" ? null : strapGeometry(kind, "recto")), [kind]);
  const band6 = useDisposable(() => (kind === "brazalete" ? null : strapGeometry(kind, fin6)), [kind, fin6]);
  const croco = useDisposable(() => (kind === "piel" ? crocoMaps(maxAniso) : null), [kind, maxAniso]);
  const bandMat = useDisposable(() => {
    if (kind === "piel") {
      return new THREE.MeshPhysicalMaterial({
        color: tone,
        map: croco?.color ?? null,
        normalMap: croco?.normal ?? null,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughness: 0.5,
        clearcoat: 0.2,
        clearcoatRoughness: 0.45,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: tone,
      roughness: 0.58,
      metalness: 0,
      sheen: 0.18,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color("#ffffff"),
    });
  }, [kind, tone, croco]);
  // El forro de la piel: liso (sin escamas), algo más oscuro y mate.
  const liningMat = useDisposable(
    () =>
      kind === "piel"
        ? new THREE.MeshStandardMaterial({ color: new THREE.Color(tone).multiplyScalar(0.78), roughness: 0.78, metalness: 0 })
        : null,
    [kind, tone],
  );
  const bandMats = useMemo(() => [bandMat, liningMat ?? bandMat], [bandMat, liningMat]);
  const tongue = useDisposable(() => tongueGeometry(), []);
  const links = useDisposable(() => {
    if (kind !== "brazalete") return null;
    const g = braceletGeometries();
    return { ...g, layout: braceletLayout(), dispose: () => [g.outer, g.center, g.side].forEach((x) => x.dispose()) };
  }, [kind]);

  // — El cierre ————————————————————————————————————————————————————————
  const clasp = useDisposable(() => {
    const list: THREE.BufferGeometry[] = [];
    const keep = <T extends THREE.BufferGeometry>(g: T) => (list.push(g), g);
    const out: {
      buckle?: { frame: THREE.BufferGeometry; tongue: THREE.BufferGeometry; keeper: THREE.BufferGeometry; at: THREE.Matrix4; keeperAt: THREE.Matrix4 };
      holes?: { geo: THREE.BufferGeometry; at: THREE.Matrix4[] };
      wing12?: THREE.BufferGeometry;
      wing6?: THREE.BufferGeometry;
      head?: { head: THREE.BufferGeometry; buttons: THREE.BufferGeometry; at: THREE.Matrix4 };
      tab?: { geo: THREE.BufferGeometry; at: THREE.Matrix4 };
      dispose(): void;
    } = { dispose: () => list.forEach((g) => g.dispose()) };
    if (kind !== "brazalete" && cierre === "puas") {
      const w = strapWidth(kind, STRAP_S.recto);
      const th = 2 * strapTop(kind, STRAP_S.recto - 6, 999);
      const b = buckleGeometries(w, th);
      out.buckle = {
        frame: keep(b.frame),
        tongue: keep(b.tongue),
        keeper: keep(b.keeper),
        at: chordMatrix(STRAP_S.recto - 1, STRAP_S.recto - 1 + b.length),
        keeperAt: frameMatrix(STRAP_S.recto - 5.5),
      };
      const hole = keep(new THREE.CircleGeometry(0.85, 24));
      out.holes = { geo: hole, at: holeMatrices(kind) };
    } else if (kind !== "brazalete") {
      // Desplegable (mariposa): un ala por correa; la de las 12 con la cabeza.
      out.wing12 = keep(bladeGeometry(STRAP_S.recto - 0.8, STRAP_S.cierreFin, 15, 1.8, 0.6));
      out.wing6 = keep(bladeGeometry(STRAP_S.recto - 0.8, STRAP_S.alaFin, 15, 1.8, 0.6));
      const h = claspHeadGeometries();
      keep(h.tab);
      out.head = { head: keep(h.head), buttons: keep(h.buttons), at: frameMatrix(STRAP_S.cierreFin - 5.5, 0.9 + 1.2) };
    } else {
      // Brazalete: la tapa del cierre plegable (12) y su pieza final (6).
      const s0 = STRAP_S.eslabones - 0.6;
      out.wing12 = keep(bladeGeometry(s0, STRAP_S.cierreFin, braceletWidth(s0) - 0.8, 3.1, 0.9));
      out.wing6 = keep(bladeGeometry(s0, s0 + 6.5, braceletWidth(s0) - 0.8, 3.1, 0.9));
      const h = claspHeadGeometries();
      keep(h.head);
      keep(h.buttons);
      out.tab = { geo: keep(h.tab), at: frameMatrix(STRAP_S.cierreFin - 2.6, 1.55 + 0.65) };
    }
    return out;
  }, [kind, cierre]);
  const holeMat = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: "#080706", roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 }),
    [],
  );

  const side = (mirror: boolean) => {
    const band = mirror ? band6 : band12;
    return (
      <group scale={[1, mirror ? -1 : 1, 1]} key={mirror ? "6" : "12"}>
        <mesh dispose={null} geometry={tongue} material={kind === "caucho" ? bandMat : mats.brushed} />
        {band && <mesh dispose={null} geometry={band} material={bandMats} />}
        {links && (
          <>
            <Instances geometry={links.outer} material={mats.brushed} matrices={links.layout.outer} />
            <Instances geometry={links.side} material={mats.brushed} matrices={links.layout.side} />
            <Instances geometry={links.center} material={mats.polished} matrices={links.layout.center} />
          </>
        )}
        {!mirror && clasp.buckle && (
          <>
            <mesh dispose={null} geometry={clasp.buckle.frame} material={mats.polished} matrixAutoUpdate={false} matrix={clasp.buckle.at} />
            <mesh dispose={null} geometry={clasp.buckle.tongue} material={mats.polished} matrixAutoUpdate={false} matrix={clasp.buckle.at} />
            <mesh dispose={null} geometry={clasp.buckle.keeper} material={bandMat} matrixAutoUpdate={false} matrix={clasp.buckle.keeperAt} />
          </>
        )}
        {mirror && clasp.holes && <Instances geometry={clasp.holes.geo} material={holeMat} matrices={clasp.holes.at} />}
        {!mirror && clasp.wing12 && <mesh dispose={null} geometry={clasp.wing12} material={mats.brushed} />}
        {mirror && clasp.wing6 && <mesh dispose={null} geometry={clasp.wing6} material={mats.brushed} />}
        {!mirror && clasp.head && (
          <>
            <mesh dispose={null} geometry={clasp.head.head} material={mats.polished} matrixAutoUpdate={false} matrix={clasp.head.at} />
            <mesh dispose={null} geometry={clasp.head.buttons} material={mats.polished} matrixAutoUpdate={false} matrix={clasp.head.at} />
          </>
        )}
        {!mirror && clasp.tab && (
          <mesh dispose={null} geometry={clasp.tab.geo} material={mats.polished} matrixAutoUpdate={false} matrix={clasp.tab.at} />
        )}
      </group>
    );
  };
  return (
    <group>
      {side(false)}
      {side(true)}
    </group>
  );
}

function Instances({
  geometry,
  material,
  matrices,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: readonly THREE.Matrix4[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [matrices]);
  // La geometría y el material son compartidos (los libera quien los creó);
  // aquí solo se suelta el búfer de las matrices.
  useEffect(() => () => ref.current?.dispose(), []);
  return <instancedMesh dispose={null} ref={ref} args={[geometry, material, matrices.length]} />;
}

