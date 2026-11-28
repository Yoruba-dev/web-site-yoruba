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
import { BAR_HALF, braceletGeometries, type Bracelet, type LinkSlot } from "./geo/bracelet";
import {
  BAR_HINGE,
  bridgeOffset,
  buckleGeometries,
  deployantGeometries,
  foldoverBlades,
  foldoverPushers,
  mirrored,
  type Buckle,
  type Deployant,
} from "./geo/clasp";
import {
  PIEL,
  STRAP_HOLES,
  STRAP_LEN,
  bandGeometry,
  endLinkGeometry,
  keeperGeometry,
  pinGeometry,
  stitchGeometry,
  type ClaspKind,
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
  CROCO_GAIN,
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
  /** Montar lo que hace falta para compilar lo que aún no se ha elegido. */
  precompila: boolean;
  /** Todas las texturas pintadas por primera vez. */
  onReady?: () => void;
  /** Cambió la silueta (rehornear la sombra). */
  onShape?: () => void;
}

function WatchModel({ config, noche, asm, pose, coarse, reduced, tapaView, precompila, onReady, onShape }: WatchModelProps) {
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
        reduced={reduced}
        precompila={precompila}
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
  const dateMat = useDisposable(() => dateFace(es, date), [date, es]);
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
    () => logoFace(es, logoTex, logoNormal),
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

/** La rueda de la fecha y la cara del aplique PY (también las usa Precompila:
 *  un diseño puede llegar a ellas después del calentamiento). */
function dateFace(part: Part3D, map: THREE.Texture) {
  return partMat(new THREE.MeshStandardMaterial({ map, roughness: 0.6 }), part);
}
function logoFace(part: Part3D, map: THREE.Texture | null, normalMap: THREE.Texture | null) {
  return partMat(
    new THREE.MeshPhysicalMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      metalness: 0.45,
      roughness: 0.32,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
    }),
    part,
  );
}

// ===========================================================================
// Correa / brazalete y su CIERRE (posados con pose.ts)
// ===========================================================================
/** Cuánto se corre el grabado de la piel en la correa de las 6 (mm): que las
 *  dos no sean copia una de otra. */
const CROCO_SHIFT_6 = 23;

interface SideBuild {
  band: THREE.BufferGeometry | null;
  /** Los pasadores que asoman en los cantos junto a la caja. */
  pins: THREE.BufferGeometry | null;
  stitches: THREE.BufferGeometry | null;
  keepers: THREE.BufferGeometry[];
  /** Hojas del desplegable (12) / del plegable del brazalete (6). */
  blade: THREE.BufferGeometry | null;
  track: TrackId;
}

interface StrapBuild {
  kind: StrapKind;
  clasp: ClaspKind;
  sides: Record<Side, SideBuild>;
  /** El bloque de metal que llena la muesca del asa. */
  endLink: THREE.BufferGeometry;
  links: Bracelet | null;
  /** Plegable del brazalete: las medias lunas bajo la barra lisa. */
  pushers: THREE.BufferGeometry | null;
  buckle: Buckle | null;
  deployant: Deployant | null;
  dispose(): void;
}

function emptySide(track: TrackId): SideBuild {
  return { band: null, pins: null, stitches: null, keepers: [], blade: null, track };
}

function buildStrap(kind: StrapKind, clasp: ClaspKind): StrapBuild {
  const s12 = emptySide("base");
  const s6 = emptySide("base");
  let links: StrapBuild["links"] = null;
  let pushers: StrapBuild["pushers"] = null;
  let buckle: StrapBuild["buckle"] = null;
  let deployant: StrapBuild["deployant"] = null;
  if (kind === "brazalete") {
    links = braceletGeometries();
    pushers = foldoverPushers();
    s6.blade = foldoverBlades();
  } else {
    // Hebilla y desplegable llevan LA MISMA correa (foto 10): la de las 12
    // acaba en su barra y la de las 6 conserva punta, agujeros y trabillas.
    const end12 = STRAP_LEN.hebilla12;
    const { len6, keepers } = STRAP_HOLES[kind];
    s12.band = bandGeometry(kind, end12, "recto");
    s6.band = bandGeometry(kind, len6, "punta", CROCO_SHIFT_6);
    s6.track = "cola";
    s12.keepers = keepers.map((k) => keeperGeometry(kind, k.s, k.len));
    if (kind === "piel") {
      s12.stitches = stitchGeometry(end12, "recto");
      s6.stitches = stitchGeometry(len6, "punta");
    }
    if (clasp === "puas") buckle = buckleGeometries(kind);
    else {
      deployant = deployantGeometries(kind);
      s12.blade = deployant.blades;
    }
  }
  if (kind !== "brazalete") {
    s12.pins = pinGeometry(kind);
    s6.pins = pinGeometry(kind);
  }
  const endLink = endLinkGeometry();
  const all = (): THREE.BufferGeometry[] => {
    const out: THREE.BufferGeometry[] = [endLink];
    for (const s of [s12, s6]) {
      for (const g of [s.band, s.pins, s.stitches, s.blade, ...s.keepers]) if (g) out.push(g);
    }
    if (pushers) out.push(pushers);
    if (buckle) out.push(buckle.frame, buckle.tongue);
    if (deployant) out.push(deployant.bridge);
    return out;
  };
  return {
    kind,
    clasp,
    sides: { "12": s12, "6": s6 },
    endLink,
    links,
    pushers,
    buckle,
    deployant,
    dispose: () => {
      all().forEach((g) => g.dispose());
      links?.dispose();
    },
  };
}

/** El brillo de terciopelo del caucho: su tono con un 25 % de blanco. */
const sheenOf = (tone: string) => new THREE.Color(tone).lerp(new THREE.Color("#ffffff"), 0.25);

type Part3D = Assembly["parts"][WatchPart];

/** La luz del estudio devuelve cerca del 75 % del color propio (blanco y gris,
 *  medidos en la vista Correa): con el tono de la capa tal cual, las 12 correas
 *  salían ~12 puntos de L más oscuras que su muestra (ΔE medio 13.4). Con esto
 *  quedan en 6. */
const LUZ = { caucho: 1.3, piel: 1.6, pielLisa: 1.15 } as const;

// Las recetas de la correa, UNA vez: las usan la correa puesta y el
// calentamiento (Precompila), que así compila exactamente los mismos programas.
/** Caucho: mate con micro-grano y un pelo de terciopelo de su propio color
 *  (con 0.22 blanco, el interior de la roja salía rosa: PLAN V3 2.6). La cara
 *  lleva el reflejo entero de un dieléctrico (4 %): es el que descuenta el
 *  tono NeutralToneMapping; con 0.35 los oscuros se hundían en negro. */
function rubberMat(part: Part3D, tone: string, grain: THREE.Texture, k: number, roughness: number, spec = 1, sheen = 0.06) {
  return partMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tone).multiplyScalar(k),
      vertexColors: true,
      roughness,
      metalness: 0,
      specularIntensity: spec,
      sheen,
      sheenRoughness: 0.6,
      sheenColor: sheenOf(tone),
      normalMap: grain,
      normalScale: new THREE.Vector2(0.15, 0.15),
    }),
    part,
  );
}

/** Piel: la cara, con su grabado (color, normales y rugosidad). */
function crocoTop(part: Part3D, tone: string, maps: { color: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture } | null) {
  return partMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tone).multiplyScalar(CROCO_GAIN * LUZ.piel),
      vertexColors: true,
      map: maps?.color ?? null,
      normalMap: maps?.normal ?? null,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: maps?.rough ?? null,
      roughness: 1,
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
    }),
    part,
  );
}

/** Piel lisa: forro, canto, pared de los agujeros e hilo, en el mismo programa
 *  (la capa de laca de los que no la llevan es simbólica). */
function crocoPlain(part: Part3D, tone: string, k: number, roughness: number, clearcoat = 1e-3, specularIntensity = 1) {
  return partMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tone).multiplyScalar(k),
      vertexColors: true,
      roughness,
      specularIntensity,
      clearcoat,
      clearcoatRoughness: 0.4,
    }),
    part,
  );
}

/** Lo que el cliente aún puede elegir: el caucho, la piel, los eslabones del
 *  brazalete (instancias, reales y en cristal), la fecha y el aplique. Mallas ocultas de un triángulo
 *  que nadie pinta ni toca: WatchScene las monta con el reloj ya a la vista y
 *  compila sus programas (compileAsync recorre también lo oculto); al seguir
 *  montadas, ninguno se suelta: cambiar de correa no vuelve a compilar (puerta
 *  del grupo 7). */
function Precompila({ metal, core, part, grain }: { metal: FinishMaterials; core: THREE.Material; part: Part3D; grain: THREE.Texture }) {
  const w = useDisposable(() => {
    const px = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
    px.needsUpdate = true;
    const tone = "#808080";
    const mats = [
      rubberMat(part, tone, grain, 1, 1),
      crocoTop(part, tone, { color: px, normal: px, rough: px }),
      crocoPlain(part, tone, 1, 1),
      dateFace(part, px),
      logoFace(part, px, px),
    ];
    const geo = new THREE.BufferGeometry();
    for (const [name, size] of [["position", 3], ["normal", 3], ["uv", 2], ["color", 3]] as const)
      geo.setAttribute(name, new THREE.BufferAttribute(new Float32Array(3 * size), size));
    return {
      mats,
      geo,
      dispose: () => {
        mats.forEach((m) => m.dispose());
        geo.dispose();
        px.dispose();
      },
    };
  }, [part, grain]);
  const inst = [metal.brushed, metal.polished, part.ghost.depth, part.ghost.color];
  return (
    <group name={PRECOMPILA} visible={false}>
      {[...w.mats, core].map((m, i) => (
        <mesh key={`m${i}`} raycast={noTocar} dispose={null} geometry={w.geo} material={m} />
      ))}
      {inst.map((m, i) => (
        <instancedMesh key={`i${i}`} raycast={noTocar} dispose={null} frustumCulled={false} args={[w.geo, m, 1]} />
      ))}
    </group>
  );
}
/** Nombre del grupo (WatchScene lo busca para hornear la sombra una vez). */
export const PRECOMPILA = "precompila";
const noTocar = () => null;

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

/** Piezas iguales del brazalete en una pista: las placas, por la cuerda entre
 *  sus dos juntas (s, s1); los bloques, sobre su junta (s). */
function Links({
  pose,
  side,
  part,
  geometry,
  material,
  slots,
  ghost,
}: {
  pose: PoseDriver;
  side: Side;
  part: WatchPart;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  slots: readonly LinkSlot[];
  ghost?: boolean;
}) {
  const place = useMemo(
    () => (fr: Frames, _t: number, i: number, out: THREE.Matrix4) => {
      const sl = slots[i];
      if (sl.s1 !== undefined) chordMatrix(fr, sl.s, sl.s1, 0, out);
      else frameMatrix(fr, sl.s, 0, out);
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
  return <PartInstances part={part} geometry={geometry} material={material} count={slots.length} onMesh={onMesh} ghost={ghost} />;
}

function Strap({
  config,
  metals,
  grain,
  maxAniso,
  asm,
  pose,
  reduced,
  precompila,
  onShape,
}: {
  config: WatchConfig;
  metals: { caja: FinishMaterials; correa: FinishMaterials; cierre: FinishMaterials };
  grain: THREE.Texture;
  maxAniso: number;
  asm: Assembly;
  pose: PoseDriver;
  reduced: boolean;
  precompila: boolean;
  onShape?: () => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const co = asm.parts.correa;
  const kind: StrapKind = getStrap(config.correa)?.tipo ?? "caucho";
  const clasp: ClaspKind = kind === "brazalete" ? "brazalete" : (getClasp(config.cierre)?.id ?? "puas");
  const tone = strapTone(config);
  const build = useDisposable(() => buildStrap(kind, clasp), [kind, clasp]);
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
  // Todos llevan la sombra propia en el color de vértice (geo/strap.ts).
  const band = useDisposable(() => {
    if (kind === "piel") {
      const top = crocoTop(co, tone, croco);
      const L = LUZ.pielLisa;
      // Forro liso, algo más oscuro y mate.
      const lining = crocoPlain(co, tone, 0.78 * L, 0.78, 1e-3, 0.5);
      // Canto pintado, mate (fotos 5 y 9: 0.5–0.8 del tono, sin brillo).
      const edge = crocoPlain(co, tone, 0.62 * L, 0.6, 0.08);
      // Pared de los agujeros: sin reflejos (dentro no llega el cuarto).
      const wall = crocoPlain(co, tone, 0.62, 1, 1e-3, 0);
      // Hilo tono sobre tono.
      const thread = crocoPlain(co, tone, 0.96 * L, 0.72);
      return {
        top,
        lining,
        edge,
        wall,
        thread,
        sheen: [] as THREE.MeshPhysicalMaterial[],
        scale: [CROCO_GAIN * LUZ.piel, 0.78 * L, 0.62 * L, 0.62, 0.96 * L],
        dispose: () => [top, lining, edge, wall, thread].forEach((m) => m.dispose()),
      };
    }
    const K = LUZ.caucho;
    const rubber = (k: number, roughness: number, spec?: number, sheen?: number) => rubberMat(co, tone, grain, k, roughness, spec, sheen);
    const top = rubber(K, 0.62);
    // El forro se ve de refilón: con el reflejo entero se volvía rosado.
    const lining = rubber(0.92 * K, 0.75, 0.35);
    const wall = rubber(K, 1, 0, 1e-3);
    return {
      top,
      lining,
      edge: top,
      wall,
      thread: top,
      sheen: [top, lining, wall],
      scale: [K, 0.92 * K, K, K, K],
      dispose: () => [top, lining, wall].forEach((m) => m.dispose()),
    };
  }, [kind, croco, grain, co]);
  const bandMats = useMemo(() => [band.top, band.lining, band.edge, band.wall], [band]);
  const colorTween = useMemo(
    () => new ColorTween(() => [band.top, band.lining, band.edge, band.wall, band.thread], band.scale),
    [band],
  );
  const lastTone = useRef(tone);
  useEffect(() => {
    if (lastTone.current === tone) return;
    lastTone.current = tone;
    colorTween.start(tone, performance.now(), reduced ? 0 : 250);
    band.sheen.forEach((m) => m.sheenColor.copy(sheenOf(tone)));
    invalidate();
  }, [tone, band, colorTween, reduced, invalidate]);
  useLayoutEffect(() => {
    // Material nuevo (otro tipo): el color actual, sin interpolar.
    colorTween.start(lastTone.current, performance.now(), 0);
  }, [colorTween]);
  useFrame(() => {
    if (colorTween.step(performance.now())) invalidate();
  });
  const coreMat = useDisposable(() => partMat(new THREE.MeshStandardMaterial({ color: "#1d1d1d", roughness: 0.9, metalness: 0.2 }), co), [co]);

  const cm = metals.correa;
  const km = metals.cierre;
  const b = build;
  // Lo que llena la muesca del asa: el bloque de metal en el acabado de la caja
  // (fotos 5 y 9, renders 13 y 19), pulido por fuera y cepillado por detrás.
  const endLinkMats = useMemo(() => [cm.polished, cm.brushed], [cm]);

  // — Piezas rígidas del cierre ————————————————————————————————————————
  // La hebilla gira sobre su barra al abrir (deja salir la cola) y la púa,
  // además, se levanta 25° en los primeros 120 ms de los 750: t =
  // easeInOutCubic(k) = 4k³ al principio → k = ∛(t/4).
  const placeBuckle = useMemo(
    () => (fr: Frames, t: number, out: THREE.Matrix4) => {
      frameMatrix(fr, L_BOTTOM, 0, out);
      return b.buckle ? swivel(out, b.buckle.pivot, buckleSwing(t)) : out;
    },
    [b],
  );
  const placeTongue = useMemo(
    () => (fr: Frames, t: number, out: THREE.Matrix4) => {
      frameMatrix(fr, L_BOTTOM, 0, out);
      if (!b.buckle) return out;
      const lift = THREE.MathUtils.degToRad(25) * Math.min(1, Math.cbrt(Math.max(0, t) / 4) / (120 / 750));
      return swivel(out, b.buckle.pivot, buckleSwing(t) + lift);
    },
    [b],
  );
  // El puente va prendido a la cola (la lengüeta en su agujero): al abrir se
  // va con ella.
  const placeBridge = useMemo(() => {
    const s6 = b.deployant?.s6 ?? L_BOTTOM;
    const off = bridgeOffset(s6);
    return (fr: Frames, _t: number, out: THREE.Matrix4) => mirrored(frameMatrix(fr, s6, 0, out)).multiply(off);
  }, [b]);
  // La barra del plegable se voltea hacia el forro por su bisagra.
  const placeBar = useMemo(
    () => (fr: Frames, t: number, out: THREE.Matrix4) => {
      chordMatrix(fr, L_BOTTOM - BAR_HALF, L_BOTTOM + BAR_HALF, 0, out);
      return swivel(out, BAR_HINGE, -THREE.MathUtils.degToRad(160) * THREE.MathUtils.smoothstep(t, 0.1, 0.8));
    },
    [],
  );

  const side = (sd: Side) => {
    const s = b.sides[sd];
    const mirror = sd === "6";
    return (
      <group scale={[1, mirror ? -1 : 1, 1]} key={sd}>
        {(kind !== "piel" || PIEL.final === "terminal") && <PartMesh part="correa" geometry={b.endLink} material={endLinkMats} />}
        {s.band && (
          <Posed pose={pose} side={sd} track={s.track} geometry={s.band}>
            <PartMesh part="correa" geometry={s.band} material={bandMats} frustumCulled={false} />
          </Posed>
        )}
        {s.pins && (
          <Posed pose={pose} side={sd} track={s.track} geometry={s.pins}>
            <PartMesh part="correa" ghost={false} geometry={s.pins} material={cm.polished} frustumCulled={false} />
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
        {b.links && (
          <>
            <Posed pose={pose} side={sd} track="base" geometry={b.links.sides[sd].core}>
              <PartMesh part="correa" ghost={false} geometry={b.links.sides[sd].core} material={coreMat} frustumCulled={false} />
            </Posed>
            <Links pose={pose} side={sd} part="correa" geometry={b.links.plate} material={cm.brushed} slots={b.links.sides[sd].slots.plates} />
            <Links pose={pose} side={sd} part="correa" ghost={false} geometry={b.links.moon} material={cm.polished} slots={b.links.sides[sd].slots.plates} />
            <Links pose={pose} side={sd} part="correa" geometry={b.links.sides[sd].first} material={cm.brushed} slots={b.links.sides[sd].slots.first} />
            <Links pose={pose} side={sd} part="correa" geometry={b.links.sides[sd].last} material={cm.brushed} slots={b.links.sides[sd].slots.last} />
            <Links pose={pose} side={sd} part="correa" geometry={b.links.block} material={cm.polished} slots={b.links.sides[sd].slots.blocks} />
            <Links pose={pose} side={sd} part="correa" ghost={false} geometry={b.links.blockBase} material={cm.brushed} slots={b.links.sides[sd].slots.blocks} />
          </>
        )}
        {s.blade && (
          <Posed pose={pose} side={sd} track="base" geometry={s.blade}>
            <PartMesh part="cierre" geometry={s.blade} material={km.brushed} frustumCulled={false} />
          </Posed>
        )}
        {!mirror && b.links && b.pushers && (
          <Rigid pose={pose} side="12" track="base" place={placeBar}>
            <PartMesh part="cierre" edges geometry={b.links.bar} material={km.brushed} />
            <PartMesh part="cierre" edges geometry={b.pushers} material={km.polished} />
          </Rigid>
        )}
        {!mirror && b.buckle && (
          <>
            <Rigid pose={pose} side="12" track="base" place={placeBuckle}>
              <PartMesh part="cierre" edges geometry={b.buckle.frame} material={km.polished} />
            </Rigid>
            <Rigid pose={pose} side="12" track="base" place={placeTongue}>
              <PartMesh part="cierre" edges geometry={b.buckle.tongue} material={km.polished} />
            </Rigid>
          </>
        )}
        {!mirror && b.deployant && (
          <Rigid pose={pose} side="6" track="cola" place={placeBridge}>
            <PartMesh part="cierre" edges geometry={b.deployant.bridge} material={km.polished} />
          </Rigid>
        )}
      </group>
    );
  };
  return (
    <group>
      {side("12")}
      {side("6")}
      {precompila && <Precompila metal={cm} core={coreMat} part={co} grain={grain} />}
    </group>
  );
}
const _rot = new THREE.Matrix4();
const _r2 = new THREE.Matrix4();
const _r3 = new THREE.Matrix4();

/** Gira `m` (en su propio marco) `a` radianes alrededor de x por `p`. */
function swivel(m: THREE.Matrix4, p: THREE.Vector3, a: number): THREE.Matrix4 {
  if (a === 0) return m;
  _rot.makeTranslation(p.x, p.y, p.z).multiply(_r2.makeRotationX(a)).multiply(_r3.makeTranslation(-p.x, -p.y, -p.z));
  return m.multiply(_rot);
}

/** Lo que se levanta la hebilla mientras sale la cola (y cómo vuelve). */
const buckleSwing = (t: number) =>
  THREE.MathUtils.degToRad(62) * THREE.MathUtils.smoothstep(t, 0, 0.3) * (1 - 0.85 * THREE.MathUtils.smoothstep(t, 0.7, 1));
