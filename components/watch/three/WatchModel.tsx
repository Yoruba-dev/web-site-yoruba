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
//   • correa: el tipo y el color del catálogo, CERRADA en una muñeca de
//     17 cm hasta su cierre (hebilla de púa con trabillas y cola, desplegable
//     o el plegable del brazalete), y ABIERTA boca abajo para ver la tapa
//     (pose.ts).
// Cada malla pertenece a una PIEZA (caja, esfera, agujas, correa, cierre,
// tapa: <PartMesh>), con sus propios materiales y su plano de barrido
// (reveal.ts). Cambiar acabado o color interpola; cambiar la forma de una
// pieza real la vuelve a barrer (450 ms). Las texturas y geometrías se crean
// con useMemo según lo que las cambia y se liberan al cambiar o desmontar.
// ---------------------------------------------------------------------------
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type DependencyList, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { getClasp, getSecondsPart, getStrap, WATCH_COLORS, type WatchConfig } from "@/lib/watch";
import { dialHasDate, handAngles, handMetalHex, handPose, rimMetalHex, DIAL_LAYOUT } from "@/lib/watch-art";
import { CAPA_MEDIA_600, apliqueUrl, capaUrl, nombresCapas } from "@/lib/watch-capas";
import { lumeTones, mix } from "../front/art";
import type { WatchPart } from "../stage3d-contract";
import { PartInstances, PartMesh } from "./assembly";
import { caseGeometries, type CaseGeometries } from "./geo/case";
import {
  Z,
  appliedGeometries,
  appliqueGeometry,
  dateWellGeometry,
  dialBackGeometry,
  dialDiscGeometry,
  handRotation,
  secondsHand,
  swordHand,
} from "./geo/dialParts";
import { BUCKLE, buckleGeometries, deployantGeometries, sweptPlate } from "./geo/clasp";
import {
  PIEL,
  STRAP_LEN,
  appendToBand,
  bandGeometry,
  braceletCoreGeometry,
  braceletGeometries,
  braceletSlots,
  holeGeometries,
  keeperGeometry,
  stitchGeometry,
  strapWidth,
  tongueGeometry,
  type ClaspKind,
  type LinkSlot,
  type StrapKind,
} from "./geo/strap";
import {
  ColorTween,
  FinishTween,
  finishMaterials,
  finishOf,
  handMetal,
  lumeMaterial,
  partMat,
  strapTone,
  type FinishMaterials,
} from "./materials";
import { L_BOTTOM, chordMatrix, frameMatrix, type Frames, type PoseDriver, type Side, type TrackId } from "./pose";
import type { Assembly } from "./reveal";
import {
  DATE_WHEEL,
  appliqueBox,
  brushStreaks,
  casebackTextures,
  crocoMaps,
  dateWheel,
  dialTextures,
  logoNormalMap,
  radialAniso,
  rubberGrain,
} from "./tex/maps";
import { loadImage } from "./tex/paint";

/** Parte de la foto de la esfera que se suma como luz propia (ver dialMat).
 *  Con 0.6 el blanco salía a 251 (ΔE 6.2 contra la capa) y los aros y el lume
 *  se perdían; con 0.2, 240 (ΔE 3.3); más abajo el rojo empeora
 *  (PLAN-REALISMO-V3 §2.3). */
const DIAL_FILL = 0.2;

/** useMemo + dispose del valor anterior y al desmontar. (Las mallas llevan
 *  dispose={null}: R3F liberaría al desmontarlas lo compartido.) */
function useDisposable<T extends { dispose(): void } | null>(make: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const v = useMemo(make, deps);
  useEffect(() => () => v?.dispose(), [v]);
  return v;
}

/** Carga las imágenes que pinta la esfera (una que falle llega como null).
 *  Mientras llegan las de un color nuevo devuelve las ANTERIORES con
 *  fresh = false (nunca un disco gris de un fotograma). */
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

/** El valor, con `ms` de retraso tras el último cambio. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

function useCapaSize(): 600 | 1200 {
  return useMemo(() => (typeof window !== "undefined" && window.matchMedia(CAPA_MEDIA_600).matches ? 600 : 1200), []);
}

/** Tamaño de las texturas pintadas: 2048 en escritorio, 1536 en táctil. */
function useTexSize(coarse: boolean): number {
  const gl = useThree((s) => s.gl);
  return useMemo(() => Math.min(coarse ? 1536 : 2048, gl.capabilities.maxTextureSize), [gl, coarse]);
}

const now = () => performance.now();

export interface WatchModelProps {
  config: WatchConfig;
  noche: boolean;
  asm: Assembly;
  pose: PoseDriver;
  coarse: boolean;
  reduced: boolean;
  /** La vista pedida es la tapa (el grabado cambia con un láser). */
  tapaView: boolean;
  /** Todas las texturas pintadas por primera vez. */
  onReady?: () => void;
  /** Cambió la silueta (rehornear la sombra). */
  onShape?: () => void;
}

function WatchModel({ config, noche, asm, pose, coarse, reduced, tapaView, onReady, onShape }: WatchModelProps) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const maxAniso = useMemo(() => Math.min(8, gl.capabilities.getMaxAnisotropy()), [gl]);
  const texSize = useTexSize(coarse);
  const fin = finishOf(config);

  // — Texturas compartidas y metales por pieza (para toda la vida) ———————
  const shared = useDisposable(() => {
    const radial = radialAniso(maxAniso);
    const vetas = brushStreaks(maxAniso);
    const date = dateWheel(maxAniso);
    const grain = rubberGrain(maxAniso);
    return { radial, vetas, date, grain, dispose: () => [radial, vetas, date, grain].forEach((t) => t.dispose()) };
  }, [maxAniso]);
  const fin0 = useRef(fin);
  const metals = useDisposable(() => {
    const mk = (p: WatchPart) =>
      finishMaterials(fin0.current, { radial: shared.radial, veta: p === "caja" ? shared.vetas.caja : shared.vetas.banda }, asm.parts[p]);
    const caja = mk("caja");
    const correa = mk("correa");
    const cierre = mk("cierre");
    return { caja, correa, cierre, dispose: () => [caja, correa, cierre].forEach((m) => m.dispose()) };
  }, [shared, asm]);
  const finTween = useMemo(() => new FinishTween(), []);
  const lastFin = useRef(fin);
  useEffect(() => {
    if (lastFin.current === fin) return;
    lastFin.current = fin;
    finTween.start([metals.caja, metals.correa, metals.cierre], fin, now(), reduced ? 0 : 250);
    invalidate();
  }, [fin, metals, finTween, reduced, invalidate]);
  useFrame(() => {
    if (finTween.step(now())) invalidate();
  });

  const geo = useDisposable(() => caseGeometries(), []);

  // — Esfera: la foto del disco sol y el aplique PY ——————————————————————
  const n = nombresCapas(config);
  const capa = useCapaSize();
  const loaded = useImages([capaUrl(n.esfera, capa), apliqueUrl(n.aplique, capa)]);
  const imgs = loaded?.imgs ?? null;
  const dialKey = JSON.stringify([config.esfera, config.aplique, config.acabado]);
  const [di, setDi] = useState<{ key: string; imgs: (HTMLImageElement | null)[]; config: WatchConfig } | null>(null);
  if (loaded?.fresh && (di?.key !== dialKey || di.imgs !== loaded.imgs)) {
    setDi({ key: dialKey, imgs: loaded.imgs, config });
  }
  const dial = useDisposable(
    () => (di ? dialTextures(di.config, { photo: di.imgs[0], logo: di.imgs[1] }, texSize, maxAniso) : null),
    [di, texSize, maxAniso],
  );
  // La tapa: se repinta 300 ms después de la última tecla. SIN useDisposable:
  // con el láser, el grabado anterior sigue pintándose 500 ms más; lo libera
  // CaseMeshes (dueño de su vida) cuando ya no se ve.
  const tapa = useDebounced(config.tapa, 300);
  const backKey = JSON.stringify([tapa, fin]);
  const back = useMemo(
    () => casebackTextures({ ...config, tapa }, fin, texSize, maxAniso),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backKey, texSize, maxAniso],
  );

  // — Listo: la primera vez que todo está pintado, tras dos fotogramas ——————
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
      <CaseMeshes geo={geo} mats={metals.caja} back={back} asm={asm} tapaView={tapaView} reduced={reduced} />
      <DialParts
        config={config}
        dial={dial}
        logo={di?.imgs[1] ?? imgs?.[1] ?? null}
        date={shared.date}
        noche={noche}
        maxAniso={maxAniso}
        asm={asm}
        reduced={reduced}
      />
      <Strap
        config={config}
        metals={metals}
        grain={shared.grain}
        maxAniso={maxAniso}
        asm={asm}
        pose={pose}
        coarse={coarse}
        reduced={reduced}
        onShape={onShape}
      />
    </group>
  );
}

export default memo(WatchModel);

// ===========================================================================
// Caja, tapa y cristal
// ===========================================================================
type Back = ReturnType<typeof casebackTextures>;

/** Pone un juego de texturas de la tapa en un material del campo. */
function setMaps(m: THREE.MeshPhysicalMaterial, b: Back) {
  m.map = b.map;
  m.roughnessMap = b.orm;
  m.bumpMap = b.orm;
}

function CaseMeshes({
  geo,
  mats,
  back,
  asm,
  tapaView,
  reduced,
}: {
  geo: CaseGeometries;
  mats: FinishMaterials;
  back: Back | null;
  asm: Assembly;
  tapaView: boolean;
  reduced: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const caja = asm.parts.caja;
  const tp = asm.parts.tapa;
  // El campo grabado: dos ranuras; con la vista de la tapa delante, el texto
  // nuevo entra con un láser sobre el anterior (laserPlane) y luego cambian.
  const [laserPlane] = useState(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e5));
  const field = useDisposable(
    () => partMat(new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 1, roughness: 1, bumpScale: 0.35 }), tp),
    [tp],
  );
  // El grabado anterior (solo durante el láser). Lleva mapas desde el
  // principio (el mismo programa siempre: se compila al calentar); en reposo,
  // los del grabado que se ve, nunca los de un juego ya liberado.
  const fieldOld = useDisposable(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 1, roughness: 1, bumpScale: 0.35 });
    m.clippingPlanes = [laserPlane];
    return m;
  }, [laserPlane]);
  const [oldOn, setOldOn] = useState(false);
  // Las texturas de la tapa son de CaseMeshes: `shown` es la que lleva el
  // campo; `old`, la que queda debajo mientras dura el láser. Cada juego se
  // libera cuando deja de pintarse (al cambiar sin láser, al acabar el láser
  // o al desmontar): uno liberado y aún pintado, three lo volvería a subir.
  const shown = useRef<Back | null>(null);
  const old = useRef<Back | null>(null);
  useLayoutEffect(() => {
    if (!back) return;
    const prev = shown.current;
    if (prev === back) return;
    const firstMap = !field.map;
    setMaps(field, back);
    if (firstMap) field.needsUpdate = true;
    shown.current = back;
    // El láser solo si la Assembly lo empieza (no con la tapa en cristal, aún
    // barriendo o con movimiento reducido): si no, cambio al instante.
    if (prev && tapaView && !reduced && asm.laser("tapa", performance.now())) {
      // El grabado anterior debajo (sin recortar) y el nuevo entra barriendo.
      // Si otro láser seguía en marcha, el que tenía debajo ya no se ve.
      setMaps(fieldOld, prev);
      if (old.current && old.current !== prev) old.current.dispose();
      old.current = prev;
      setOldOn(true);
    } else {
      // Con un láser aún en marcha fieldOld conserva su grabado; si no, pasa
      // al nuevo antes de liberar el anterior.
      if (!old.current) {
        const firstOld = !fieldOld.map;
        setMaps(fieldOld, back);
        if (firstOld) fieldOld.needsUpdate = true;
      }
      prev?.dispose();
    }
    invalidate();
  }, [back, field, fieldOld, tapaView, reduced, asm, invalidate]);
  useFrame(() => {
    const o = old.current;
    if (!o) return;
    // El grabado anterior se quita cuando el láser de la Assembly termina (no
    // con un reloj propio: si el barrido se retrasa, nunca se ve un hueco).
    if (asm.parts.tapa.anim) return;
    old.current = null;
    // fieldOld aún se pinta en este fotograma (oldOn cambia en el próximo
    // render): pasa al grabado que se ve ANTES de liberar el viejo.
    if (shown.current) setMaps(fieldOld, shown.current);
    o.dispose();
    setOldOn(false);
    invalidate();
  });
  // Al desmontar, los dos juegos.
  useEffect(
    () => () => {
      shown.current?.dispose();
      old.current?.dispose();
      shown.current = null;
      old.current = null;
    },
    [],
  );

  const crystal = useDisposable(
    () =>
      partMat(
        new THREE.MeshPhysicalMaterial({
          // Solo los reflejos: el cristal suma luz y nunca oscurece la esfera.
          // De frente casi no refleja (zafiro con antirreflejo); al
          // inclinarlo el brillo sube (Fresnel, specular .3).
          color: "#000000",
          metalness: 0,
          roughness: 0.03,
          ior: 1.77,
          specularIntensity: 0.3,
          specularColor: new THREE.Color("#e6eeff"),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
        caja,
      ),
    [caja],
  );
  const notch = useDisposable(
    () => partMat(new THREE.MeshStandardMaterial({ color: "#2b2b2b", roughness: 0.8, metalness: 0.6 }), caja),
    [caja],
  );
  useEffect(() => {
    notch.color.copy(mats.matte.color).multiplyScalar(0.35);
  });
  return (
    <group>
      <PartMesh part="caja" edges geometry={geo.brushed} material={mats.brushed} />
      <PartMesh part="caja" edges geometry={geo.polished} material={mats.polished} />
      <PartMesh part="caja" geometry={geo.matte} material={mats.matte} />
      <PartMesh part="caja" edges geometry={geo.casebackRing} material={mats.brushedRadial} />
      <PartMesh part="caja" ghost={false} geometry={geo.casebackNotches} material={notch} />
      <PartMesh part="tapa" geometry={geo.casebackField} material={field} />
      {/* Montada siempre (se compila al calentar); visible solo con el láser. */}
      <mesh dispose={null} geometry={geo.casebackField} material={fieldOld} position={[0, 0, 0.004]} visible={oldOn} raycast={() => null} />
      <PartMesh part="caja" ghost={false} geometry={geo.crystal} material={crystal} renderOrder={10} />
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
  asm,
  reduced,
}: {
  config: WatchConfig;
  dial: ReturnType<typeof dialTextures> | null;
  logo: HTMLImageElement | null;
  date: THREE.Texture;
  noche: boolean;
  maxAniso: number;
  asm: Assembly;
  reduced: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const es = asm.parts.esfera;
  const ag = asm.parts.agujas;
  const fecha = dialHasDate(config);
  const disc = useDisposable(() => dialDiscGeometry(config), [fecha]);
  const back = useDisposable(() => dialBackGeometry(), []);
  const well = useDisposable(() => (fecha ? dateWellGeometry() : null), [fecha]);
  const appliedKey = JSON.stringify([config.esfera.modelo, fecha]);
  const applied = useDisposable(() => {
    const a = appliedGeometries(config);
    return { ...a, dispose: () => [a.rims, a.lume].forEach((g) => g?.dispose()) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey]);
  // Cambió el modelo de esfera: se vuelve a barrer.
  const lastModel = useRef(config.esfera.modelo);
  useLayoutEffect(() => {
    if (lastModel.current === config.esfera.modelo) return;
    lastModel.current = config.esfera.modelo;
    if (asm.resweep("esfera", performance.now())) invalidate();
  }, [config.esfera.modelo, asm, invalidate]);

  const hands = useDisposable(() => {
    const h = swordHand("hour");
    const m = swordHand("minute");
    const s = secondsHand();
    const cap = new THREE.CylinderGeometry(0.62, 0.62, 0.16, 32);
    cap.rotateX(Math.PI / 2);
    const pin = new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    pin.rotateX(Math.PI / 2);
    const list = [h.frame, h.lume, m.frame, m.lume, s.body, s.lume, cap, pin];
    return { h, m, s, cap, pin, dispose: () => list.forEach((g) => g.dispose()) };
  }, []);

  // Los aros de los índices y el marco de la fecha, en SU tono (el mismo de la
  // capa 2D), no en el de las agujas: sobre blanco se perdían.
  const metalHex = handMetalHex(config);
  const rimHex = rimMetalHex(config);
  const metalE = useDisposable(() => handMetal(rimHex, es), [es]);
  const metalA = useDisposable(() => handMetal(metalHex, ag), [ag]);
  const tones = lumeTones(config);
  // De día el lume aplicado es casi tan claro como una esfera blanca (foto 14:
  // 0.94): el tono de la pintura, aclarado hacia el blanco.
  const lumeDia = mix(tones.dia, "#ffffff", 0.38);
  const lumeE = useDisposable(() => lumeMaterial(lumeDia, tones.halo, es), [es]);
  const lumeA = useDisposable(() => lumeMaterial(lumeDia, tones.halo, ag), [ag]);
  useEffect(() => {
    metalE.color.set(rimHex);
    metalA.color.set(metalHex);
    for (const l of [lumeE, lumeA]) {
      l.emissive.set(tones.halo);
      l.emissiveIntensity = noche ? 1.7 : 0;
      l.color.set(noche ? "#1c2a20" : lumeDia);
    }
    invalidate();
  }, [noche, metalHex, rimHex, lumeDia, tones.halo, metalE, metalA, lumeE, lumeA, invalidate]);
  const secHex = WATCH_COLORS[getSecondsPart(config.segundero)?.color ?? "negro"].hex;
  const secMat = useDisposable(
    () => partMat(new THREE.MeshPhysicalMaterial({ color: secHex, roughness: 0.32, metalness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.1 }), ag),
    [ag],
  );
  const secTween = useMemo(() => new ColorTween(() => [secMat]), [secMat]);
  const lastSec = useRef(secHex);
  useEffect(() => {
    if (lastSec.current === secHex) return;
    lastSec.current = secHex;
    secTween.start(secHex, performance.now(), reduced ? 0 : 250);
    invalidate();
  }, [secHex, secTween, reduced, invalidate]);
  useFrame(() => {
    if (secTween.step(performance.now())) invalidate();
  });

  // La esfera: se crea cuando llega su primera textura; luego solo cambian
  // los mapas (sin recompilar).
  const dialMat = useDisposable(
    () =>
      partMat(
        new THREE.MeshPhysicalMaterial({
          color: "#ffffff",
          roughness: 1,
          metalness: 1,
          anisotropy: 0.85,
          // Laca fina: un brillo limpio al inclinar, no un velo de frente.
          clearcoat: 0.2,
          clearcoatRoughness: 0.1,
          // La foto del disco ya trae la luz del estudio: una parte se suma
          // tal cual (emisiva) para que la esfera tenga el MISMO color que el
          // compositor de frente. De noche, nada: solo brilla el lume.
          emissive: new THREE.Color("#ffffff"),
        }),
        es,
      ),
    [es],
  );
  useLayoutEffect(() => {
    if (!dial) return;
    const first = !dialMat.map;
    dialMat.map = dial.map;
    dialMat.roughnessMap = dial.orm;
    dialMat.metalnessMap = dial.orm;
    dialMat.anisotropyMap = dial.aniso;
    dialMat.emissiveMap = dial.map;
    if (first) dialMat.needsUpdate = true;
    invalidate();
  }, [dial, dialMat, invalidate]);
  useEffect(() => {
    dialMat.emissiveIntensity = noche || !dial ? 0 : DIAL_FILL;
    invalidate();
  }, [dialMat, dial, noche, invalidate]);
  const wellMat = useDisposable(() => partMat(new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.9 }), es), [es]);
  // El reverso: mate y oscuro, a la sombra dentro de la caja.
  const backMat = useDisposable(() => partMat(new THREE.MeshStandardMaterial({ color: "#4a4844", roughness: 0.75, metalness: 0.4 }), es), [es]);
  const dateMat = useDisposable(() => partMat(new THREE.MeshStandardMaterial({ map: date, roughness: 0.6 }), es), [date, es]);
  const dateGeo = useDisposable(() => new THREE.PlaneGeometry(DATE_WHEEL.w, DATE_WHEEL.h), []);

  // Aplique PY en relieve (§4.9 #14): el contorno trazado sin conexión,
  // extruido 0.3 mm; arriba la foto del aplique con las normales de su canto,
  // las paredes en el metal del aplique.
  const box = appliqueBox(config);
  const side = box?.side ?? 0;
  const logoTex = useDisposable(() => {
    if (!logo) return null;
    const t = new THREE.Texture(logo);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.needsUpdate = true;
    return t;
  }, [logo, maxAniso]);
  const logoNormal = useDisposable(() => (logo ? logoNormalMap(logo, maxAniso) : null), [logo, maxAniso]);
  const logoMat = useDisposable(
    () =>
      partMat(
        new THREE.MeshPhysicalMaterial({
          map: logoTex,
          normalMap: logoNormal,
          normalScale: new THREE.Vector2(0.6, 0.6),
          metalness: 0.45,
          roughness: 0.32,
          clearcoat: 0.4,
          clearcoatRoughness: 0.15,
        }),
        es,
      ),
    [logoTex, logoNormal, es],
  );
  const wallHex = config.aplique === "plata" ? "#c9ccd0" : "#c99f55";
  const logoWall = useDisposable(
    () => partMat(new THREE.MeshPhysicalMaterial({ color: wallHex, metalness: 1, roughness: 0.28 }), es),
    [es],
  );
  useEffect(() => {
    logoWall.color.set(wallHex);
    invalidate();
  }, [logoWall, wallHex, invalidate]);
  const logoGeo = useDisposable(() => (side > 0 ? appliqueGeometry(side) : null), [side]);
  const logoMats = useMemo(() => [logoMat, logoWall], [logoMat, logoWall]);

  const ang = handAngles(handPose(config));
  return (
    <group>
      <PartMesh part="esfera" geometry={disc} material={dialMat} />
      <PartMesh part="esfera" ghost={false} geometry={back} material={backMat} />
      {well && <PartMesh part="esfera" ghost={false} geometry={well} material={wellMat} />}
      {fecha && <PartMesh part="esfera" ghost={false} geometry={dateGeo} material={dateMat} position={[DIAL_LAYOUT.date.cx, 0, -0.4]} />}
      {applied.rims && <PartMesh part="esfera" geometry={applied.rims} material={metalE} />}
      {applied.lume && <PartMesh part="esfera" ghost={false} geometry={applied.lume} material={lumeE} />}
      {box && logoTex && logoGeo && (
        <PartMesh part="esfera" geometry={logoGeo} material={logoMats} position={[box.cx, -box.cy, 0]} />
      )}
      <group position={[0, 0, Z.hour]} rotation={[0, 0, handRotation(ang.hour)]}>
        <PartMesh part="agujas" geometry={hands.h.frame} material={metalA} />
        <PartMesh part="agujas" ghost={false} geometry={hands.h.lume} material={lumeA} />
      </group>
      <group position={[0, 0, Z.minute]} rotation={[0, 0, handRotation(ang.minute)]}>
        <PartMesh part="agujas" geometry={hands.m.frame} material={metalA} />
        <PartMesh part="agujas" ghost={false} geometry={hands.m.lume} material={lumeA} />
      </group>
      <group position={[0, 0, Z.seconds]} rotation={[0, 0, handRotation(ang.seconds)]}>
        <PartMesh part="agujas" geometry={hands.s.body} material={secMat} />
        <PartMesh part="agujas" ghost={false} geometry={hands.s.lume} material={lumeA} />
      </group>
      <PartMesh part="agujas" ghost={false} geometry={hands.cap} material={secMat} position={[0, 0, Z.seconds + 0.1]} />
      <PartMesh part="agujas" ghost={false} geometry={hands.pin} material={metalA} position={[0, 0, Z.seconds + 0.17]} />
    </group>
  );
}

// ===========================================================================
// Correa / brazalete y su CIERRE (posados con pose.ts)
// ===========================================================================
interface SideBuild {
  band: THREE.BufferGeometry | null;
  holes: THREE.BufferGeometry | null;
  stitches: THREE.BufferGeometry | null;
  keepers: THREE.BufferGeometry[];
  core: THREE.BufferGeometry | null;
  /** Hojas del desplegable / la hoja doblada del brazalete. */
  blade: THREE.BufferGeometry | null;
  /** Brazalete: la tapa del cierre plegable (12). */
  cover: THREE.BufferGeometry | null;
  track: TrackId;
}

interface StrapBuild {
  kind: StrapKind;
  clasp: ClaspKind;
  sides: Record<Side, SideBuild>;
  tongue: THREE.BufferGeometry;
  links: { outer: THREE.BufferGeometry; side: THREE.BufferGeometry; center: THREE.BufferGeometry; slots: ReturnType<typeof braceletSlots> } | null;
  buckle: ReturnType<typeof buckleGeometries> | null;
  deployant: ReturnType<typeof deployantGeometries> | null;
  dispose(): void;
}

function emptySide(track: TrackId): SideBuild {
  return { band: null, holes: null, stitches: null, keepers: [], core: null, blade: null, cover: null, track };
}

function buildStrap(kind: StrapKind, clasp: ClaspKind, coarse: boolean): StrapBuild {
  const fine = coarse ? 0.16 : 0.12;
  const s12 = emptySide("base");
  const s6 = emptySide("base");
  let links: StrapBuild["links"] = null;
  let buckle: StrapBuild["buckle"] = null;
  let deployant: StrapBuild["deployant"] = null;
  if (kind === "brazalete") {
    const g = braceletGeometries();
    links = { ...g, slots: braceletSlots() };
    s12.core = braceletCoreGeometry();
    s6.core = braceletCoreGeometry();
    // La tapa del cierre plegable, curvada con la muñeca (pista "tapa": se
    // voltea al abrir), y la hoja doblada debajo (en la mitad de las 6).
    s12.cover = sweptPlate(L_BOTTOM - 15, L_BOTTOM + 15, 18.4, 2.8, 0.5, 0.3, { w: 6, l: 2, h: 0.6 });
    s12.track = "tapa";
    s6.blade = sweptPlate(L_BOTTOM - 13, L_BOTTOM + 11, 15.5, 0.9, 0.25, -1.4);
  } else if (clasp === "puas") {
    const end12 = STRAP_LEN.hebilla12;
    s12.band = bandGeometry(kind, end12, "recto", fine);
    const h = holeGeometries(kind);
    s6.band = appendToBand(bandGeometry(kind, STRAP_LEN.hebilla6, "punta", fine), h.bevel);
    s6.holes = h.dark;
    s6.track = "cola";
    s12.keepers = STRAP_LEN.keepers.map((k) => keeperGeometry(kind, k.s, k.len));
    if (kind === "piel") {
      s12.stitches = stitchGeometry(end12, "recto");
      s6.stitches = stitchGeometry(STRAP_LEN.hebilla6, "punta");
    }
    buckle = buckleGeometries(strapWidth(kind, L_BOTTOM));
  } else {
    // Desplegable: las dos acaban en recto sobre su bisagra; cada una lleva
    // su hoja por dentro del aro (las dos se cruzan bajo la cabeza).
    const end = STRAP_LEN.desplegable;
    s12.band = bandGeometry(kind, end, "recto", fine);
    s6.band = bandGeometry(kind, end, "recto", fine);
    s12.track = "alza";
    s6.track = "alza";
    if (kind === "piel") {
      s12.stitches = stitchGeometry(end, "recto");
      s6.stitches = stitchGeometry(end, "recto");
    }
    s12.blade = sweptPlate(L_BOTTOM - 12, L_BOTTOM + 14, 15.5, 1.4, 0.35, -1.1);
    s6.blade = sweptPlate(L_BOTTOM - 12, L_BOTTOM + 14, 15.5, 1.4, 0.35, 0.3);
    deployant = deployantGeometries(strapWidth(kind, end));
  }
  const tongue = tongueGeometry();
  const all = (): THREE.BufferGeometry[] => {
    const out: THREE.BufferGeometry[] = [tongue];
    for (const s of [s12, s6]) {
      for (const g of [s.band, s.holes, s.stitches, s.core, s.blade, s.cover, ...s.keepers]) if (g) out.push(g);
    }
    if (links) out.push(links.outer, links.side, links.center);
    if (buckle) out.push(buckle.frame, buckle.tongue);
    if (deployant) out.push(deployant.head, deployant.pushers, deployant.barrel);
    return out;
  };
  return {
    kind,
    clasp,
    sides: { "12": s12, "6": s6 },
    tongue,
    links,
    buckle,
    deployant,
    dispose: () => all().forEach((g) => g.dispose()),
  };
}

/** Una geometría de correa posada (registrada en el conductor de la pose). */
function Posed({
  pose,
  side,
  track,
  geometry,
  children,
}: {
  pose: PoseDriver;
  side: Side;
  track: TrackId;
  geometry: THREE.BufferGeometry;
  children: ReactNode;
}) {
  useLayoutEffect(() => pose.addGeometry(geometry, side, track), [pose, geometry, side, track]);
  return <>{children}</>;
}

/** Un grupo rígido colocado con los marcos (matrixAutoUpdate = false). */
function Rigid({
  pose,
  side,
  track,
  place,
  children,
}: {
  pose: PoseDriver;
  side: Side;
  track: TrackId;
  place: (fr: Frames, t: number, out: THREE.Matrix4) => THREE.Matrix4;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    return pose.addRigid(g, side, track, place);
  }, [pose, side, track, place]);
  return (
    <group ref={ref} matrixAutoUpdate={false}>
      {children}
    </group>
  );
}

/** Eslabones del brazalete en una pista. */
function Links({
  pose,
  side,
  part,
  geometry,
  material,
  slots,
}: {
  pose: PoseDriver;
  side: Side;
  part: WatchPart;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  slots: readonly LinkSlot[];
}) {
  const place = useMemo(
    () => (fr: Frames, _t: number, i: number, out: THREE.Matrix4) => {
      const sl = slots[i];
      frameMatrix(fr, sl.s, sl.dn, out);
      // Desplazamiento a lo ancho (x) y escala a lo ancho.
      out.elements[12] += sl.dx;
      out.elements[0] *= sl.sx;
      return out;
    },
    [slots],
  );
  const onMesh = useMemo(() => {
    let off: (() => void) | null = null;
    return (m: THREE.InstancedMesh | null) => {
      off?.();
      off = m ? pose.addInstances(m, side, "base", slots.length, place) : null;
    };
  }, [pose, side, slots, place]);
  return <PartInstances part={part} geometry={geometry} material={material} count={slots.length} onMesh={onMesh} />;
}

function Strap({
  config,
  metals,
  grain,
  maxAniso,
  asm,
  pose,
  coarse,
  reduced,
  onShape,
}: {
  config: WatchConfig;
  metals: { caja: FinishMaterials; correa: FinishMaterials; cierre: FinishMaterials };
  grain: THREE.Texture;
  maxAniso: number;
  asm: Assembly;
  pose: PoseDriver;
  coarse: boolean;
  reduced: boolean;
  onShape?: () => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const co = asm.parts.correa;
  const kind: StrapKind = getStrap(config.correa)?.tipo ?? "caucho";
  const clasp: ClaspKind = kind === "brazalete" ? "brazalete" : (getClasp(config.cierre)?.id ?? "puas");
  const tone = strapTone(config);
  const build = useDisposable(() => buildStrap(kind, clasp, coarse), [kind, clasp, coarse]);
  const croco = useDisposable(() => (kind === "piel" ? crocoMaps(maxAniso) : null), [kind, maxAniso]);

  // Cambió la forma: re-barrido de correa y cierre (si ya eran reales) y
  // sombra nueva.
  const lastShape = useRef(`${kind}|${clasp}`);
  useLayoutEffect(() => {
    const key = `${kind}|${clasp}`;
    if (lastShape.current === key) return;
    lastShape.current = key;
    const t = performance.now();
    const a = asm.resweep("correa", t);
    const b = asm.resweep("cierre", t);
    onShape?.();
    if (a || b) invalidate();
  }, [kind, clasp, asm, invalidate, onShape]);

  // — Materiales de la correa (por tipo; el color se interpola) ——————————
  const band = useDisposable(() => {
    if (kind === "piel") {
      const top = partMat(
        new THREE.MeshPhysicalMaterial({
          color: tone,
          map: croco?.color ?? null,
          normalMap: croco?.normal ?? null,
          normalScale: new THREE.Vector2(0.55, 0.55),
          roughnessMap: croco?.rough ?? null,
          roughness: 1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.42,
        }),
        co,
      );
      // Forro liso, algo más oscuro y mate.
      const lining = partMat(new THREE.MeshStandardMaterial({ color: new THREE.Color(tone).multiplyScalar(0.78), roughness: 0.78 }), co);
      // Canto pintado: banda oscura brillante.
      const edge = partMat(
        new THREE.MeshPhysicalMaterial({ color: new THREE.Color(tone).multiplyScalar(0.32), roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
        co,
      );
      const thread = partMat(new THREE.MeshStandardMaterial({ color: new THREE.Color(tone).multiplyScalar(1.25), roughness: 0.55 }), co);
      return { top, lining, edge, thread, scale: [1, 0.78, 0.32, 1.25], dispose: () => [top, lining, edge, thread].forEach((m) => m.dispose()) };
    }
    // Caucho: mate con brillo de terciopelo y micro-grano (§4.9 #18).
    const top = partMat(
      new THREE.MeshPhysicalMaterial({
        color: tone,
        roughness: 0.62,
        metalness: 0,
        specularIntensity: 0.35,
        sheen: 0.22,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color("#ffffff"),
        normalMap: grain,
        normalScale: new THREE.Vector2(0.15, 0.15),
      }),
      co,
    );
    return { top, lining: top, edge: top, thread: top, scale: [1, 1, 1, 1], dispose: () => top.dispose() };
  }, [kind, croco, grain, co]);
  // El micro-grano se repite cada ~6 mm (u va de canto a canto: 0…1).
  useEffect(() => {
    grain.repeat.set(3.5, 32 / 6);
    grain.needsUpdate = true;
  }, [grain]);
  const bandMats = useMemo(() => [band.top, band.lining, band.edge], [band]);
  const colorTween = useMemo(
    () => new ColorTween(() => [band.top, band.lining, band.edge, band.thread], band.scale),
    [band],
  );
  const lastTone = useRef(tone);
  useEffect(() => {
    if (lastTone.current === tone) return;
    lastTone.current = tone;
    colorTween.start(tone, performance.now(), reduced ? 0 : 250);
    invalidate();
  }, [tone, colorTween, reduced, invalidate]);
  useLayoutEffect(() => {
    // Material nuevo (otro tipo): el color actual, sin interpolar.
    colorTween.start(lastTone.current, performance.now(), 0);
  }, [colorTween]);
  useFrame(() => {
    if (colorTween.step(performance.now())) invalidate();
  });
  const holeMat = useDisposable(
    () => partMat(new THREE.MeshStandardMaterial({ color: "#070605", roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 }), co),
    [co],
  );
  const coreMat = useDisposable(() => partMat(new THREE.MeshStandardMaterial({ color: "#1d1d1d", roughness: 0.9, metalness: 0.2 }), co), [co]);

  const cm = metals.correa;
  const km = metals.cierre;
  const b = build;
  // Lo que llena la muesca del asa: el propio caucho; en piel, el terminal de
  // metal (PIEL.final "terminal", refs 5 y 9) o la piel misma ("muesca").
  const tongueMat = kind === "caucho" || (kind === "piel" && PIEL.final === "muesca") ? band.top : cm.brushed;
  const bladeMats = useMemo(() => [km.brushed, km.polished], [km]);

  // — Piezas rígidas ————————————————————————————————————————————————
  const placeBuckle = useMemo(
    () => (fr: Frames, _t: number, out: THREE.Matrix4) => chordMatrix(fr, L_BOTTOM - BUCKLE.length / 2, L_BOTTOM + BUCKLE.length / 2, 1.9, out),
    [],
  );
  const tongueRef = useRef<THREE.Group>(null);
  const placeTongue = useMemo(
    () => (fr: Frames, t: number, out: THREE.Matrix4) => {
      chordMatrix(fr, L_BOTTOM - BUCKLE.length / 2, L_BOTTOM + BUCKLE.length / 2, 1.9, out);
      // La púa se levanta 25° en los primeros 120 ms de los 750 de la
      // apertura: t = easeInOutCubic(k) = 4k³ al principio → k = ∛(t/4).
      const lift = THREE.MathUtils.degToRad(25) * Math.min(1, Math.cbrt(Math.max(0, t) / 4) / (120 / 750));
      if (lift > 0 && b.buckle) {
        const p = b.buckle.tonguePivot;
        _rot.makeTranslation(p.x, p.y, p.z).multiply(_r2.makeRotationX(lift)).multiply(_r3.makeTranslation(-p.x, -p.y, -p.z));
        out.multiply(_rot);
      }
      return out;
    },
    [b],
  );
  const placeHead = useMemo(() => (fr: Frames, _t: number, out: THREE.Matrix4) => frameMatrix(fr, L_BOTTOM, 2.3, out), []);
  const placeBarrel = useMemo(
    () => (fr: Frames, _t: number, out: THREE.Matrix4) => frameMatrix(fr, STRAP_LEN.desplegable + 0.9, 0, out),
    [],
  );

  const side = (sd: Side) => {
    const s = b.sides[sd];
    const mirror = sd === "6";
    return (
      <group scale={[1, mirror ? -1 : 1, 1]} key={sd}>
        <PartMesh part="correa" geometry={b.tongue} material={tongueMat} />
        {s.band && (
          <Posed pose={pose} side={sd} track={s.track} geometry={s.band}>
            <PartMesh part="correa" geometry={s.band} material={bandMats} frustumCulled={false} />
          </Posed>
        )}
        {s.holes && (
          <Posed pose={pose} side={sd} track={s.track} geometry={s.holes}>
            <PartMesh part="correa" ghost={false} geometry={s.holes} material={holeMat} frustumCulled={false} />
          </Posed>
        )}
        {s.stitches && (
          <Posed pose={pose} side={sd} track={s.track} geometry={s.stitches}>
            <PartMesh part="correa" ghost={false} geometry={s.stitches} material={band.thread} frustumCulled={false} />
          </Posed>
        )}
        {s.keepers.map((k, i) => (
          <Posed key={i} pose={pose} side={sd} track="base" geometry={k}>
            <PartMesh part="correa" geometry={k} material={band.top} frustumCulled={false} />
          </Posed>
        ))}
        {s.core && (
          <Posed pose={pose} side={sd} track="base" geometry={s.core}>
            <PartMesh part="correa" ghost={false} geometry={s.core} material={coreMat} frustumCulled={false} />
          </Posed>
        )}
        {b.links && (
          <>
            <Links pose={pose} side={sd} part="correa" geometry={b.links.outer} material={cm.brushed} slots={b.links.slots.outer} />
            <Links pose={pose} side={sd} part="correa" geometry={b.links.side} material={cm.brushed} slots={b.links.slots.side} />
            <Links pose={pose} side={sd} part="correa" geometry={b.links.center} material={cm.polished} slots={b.links.slots.center} />
          </>
        )}
        {s.blade && (
          <Posed pose={pose} side={sd} track={b.clasp === "brazalete" ? "base" : "base"} geometry={s.blade}>
            <PartMesh part="cierre" geometry={s.blade} material={bladeMats} frustumCulled={false} />
          </Posed>
        )}
        {s.cover && (
          <Posed pose={pose} side={sd} track="tapa" geometry={s.cover}>
            <PartMesh part="cierre" geometry={s.cover} material={bladeMats} frustumCulled={false} />
          </Posed>
        )}
        {!mirror && b.buckle && (
          <>
            <Rigid pose={pose} side="12" track="base" place={placeBuckle}>
              <PartMesh part="cierre" edges geometry={b.buckle.frame} material={km.polished} />
            </Rigid>
            <Rigid pose={pose} side="12" track="base" place={placeTongue}>
              <group ref={tongueRef} position={[0, 0, 0.35]}>
                <PartMesh part="cierre" edges geometry={b.buckle.tongue} material={km.polished} />
              </group>
            </Rigid>
          </>
        )}
        {!mirror && b.deployant && (
          <Rigid pose={pose} side="12" track="base" place={placeHead}>
            <PartMesh part="cierre" edges geometry={b.deployant.head} material={km.polished} />
            <PartMesh part="cierre" geometry={b.deployant.pushers} material={km.polished} />
          </Rigid>
        )}
        {b.deployant && (
          <Rigid pose={pose} side={sd} track="alza" place={placeBarrel}>
            <PartMesh part="cierre" geometry={b.deployant.barrel} material={km.polished} />
          </Rigid>
        )}
      </group>
    );
  };
  return (
    <group>
      {side("12")}
      {side("6")}
    </group>
  );
}
const _rot = new THREE.Matrix4();
const _r2 = new THREE.Matrix4();
const _r3 = new THREE.Matrix4();
