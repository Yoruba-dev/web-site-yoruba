"use client";

// ---------------------------------------------------------------------------
// LA ESCENA 3D DEL RELOJ — el trozo DIFERIDO: three, fiber y drei solo se
// descargan cuando alguien pide la vista 3D (components/watch/WatchStage3D.tsx
// lo importa bajo demanda, sin SSR).
//
//   • Luz: un <Environment> hecho en el navegador (CSP: nada de HDRI ni presets
//     de CDN). Una CÚPULA de estudio con degradado vertical (techo claro, pared
//     media, suelo gris) que llena todos los huecos —ningún pulido refleja un
//     agujero negro— y encima tiras <Lightformer> NEUTRAS para las bandas de
//     los chaflanes. Sin difusor gigante delante: la esfera y el cristal no
//     reflejan un velo blanco.
//   • Color: NeutralToneMapping, exposición 1 y salida sRGB (los colores de los
//     Orishas no se tuercen); las texturas de color en sRGB, el resto lineal.
//   • Rendimiento: frameloop="demand" (solo se pinta cuando algo cambia),
//     dpr [1, 1.75] (1.5 en táctil) que PerformanceMonitor baja a 1 si el
//     equipo no llega. Con frameloop="demand" los fotogramas llegan sueltos y
//     el monitor los leería como "pocos fps": por eso solo se monta mientras
//     hay movimiento seguido (el giro inicial o un gesto). Sin posproceso ni
//     transmisión en la vista en vivo.
//   • Sombra de contacto: UNA sola (sin remontarla: drei no libera sus
//     render targets) que se vuelve a hornear cuando cambia la pieza.
//   • Cámara: OrbitControls sin desplazamiento, con inercia; abre en
//     perspectiva (3/4) con un giro corto que se para al primer gesto (nada con
//     prefers-reduced-motion). Encuadres: Perspectiva, Frente, Perfil, Tapa.
//     La rueda del ratón DESPLAZA LA PÁGINA (no atrapa el scroll): se acerca
//     con Ctrl/⌘ + rueda o pellizcando el trackpad. En táctil el dedo gira de
//     lado (el gesto vertical es del navegador: touch-action pan-y en el CSS)
//     y se acerca pellizcando.
//   • Foto de estudio ("Descargar foto", render_pipeline §8): la perspectiva y
//     la tapa, cada una supermuestreada (8 pasadas desplazadas en escritorio, 4
//     en el móvil, como SSAARenderPass) a 1600 px (1200 en el móvil), sobre un
//     fondo de estudio más claro donde SÍ se ve la sombra; un JPEG con las dos.
//   • Si el navegador pierde el contexto WebGL, avisa (onContextLost) y el
//     envoltorio vuelve a la vista de frente con "Recargar vista 3D".
// ---------------------------------------------------------------------------
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import WatchModel from "./WatchModel";
import { FLOOR_Y } from "./geo/strap";
import type { Vista3D, WatchSceneProps } from "./types";

// fiber 9.8 crea un THREE.Clock (obsoleto desde r183) en cada <Canvas>: three
// lo avisa en la consola de producción. Se calla SOLO ese aviso (el resto de
// mensajes de three pasan igual). Quitar cuando fiber use THREE.Timer.
if (typeof window !== "undefined" && !THREE.getConsoleFunction()) {
  THREE.setConsoleFunction((type, message, ...params) => {
    if (type === "warn" && typeof message === "string" && message.startsWith("THREE.Clock:")) return;
    const out = type === "error" ? console.error : type === "warn" ? console.warn : console.log;
    out(message, ...params);
  });
}

const FOV = 25;
/** Donde mira la cámara: el centro de la cabeza del reloj. */
const TARGET = new THREE.Vector3(0, 4, -11);
/** Donde mira en el encuadre compacto (el escenario del móvil): la esfera. */
const TARGET_COMPACTO = new THREE.Vector3(0, 0, -4);

/** Encuadres: acimut (desde +z hacia +x, la corona), ángulo polar desde +y y
 *  distancia relativa a la que encuadra el reloj entero. */
const PRESETS: Readonly<Record<Vista3D, { az: number; pol: number; k: number }>> = {
  tres4: { az: 0.58, pol: 1.3, k: 1 },
  frente: { az: 0, pol: 1.52, k: 0.9 },
  perfil: { az: Math.PI / 2, pol: 1.47, k: 0.95 },
  tapa: { az: Math.PI, pol: 1.53, k: 0.74 },
};

/** Distancia que encuadra el reloj con su correa (±45 mm de alto, ±34 de
 *  ancho en 3/4) en un lienzo de proporción `aspect`. El encuadre compacto
 *  (escenario del móvil, ~360 × 260 px) encuadra la CABEZA (±27 mm): ahí la
 *  correa entera dejaría la esfera en ~115 px y el nombre ilegible. */
function fitDistance(aspect: number, compacto = false): number {
  const t = Math.tan(((FOV / 2) * Math.PI) / 180);
  const [h, w] = compacto ? [27, 27] : [45, 34];
  return Math.max(h / t, w / (t * Math.max(0.3, aspect)));
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isCoarse(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export default function WatchScene(props: WatchSceneProps) {
  const { config, noche } = props;
  const coarse = useMemo(isCoarse, []);
  const maxDpr = coarse ? 1.5 : 1.75;
  const [dpr, setDpr] = useState<number | [number, number]>([1, maxDpr]);
  // Se mide el rendimiento solo con movimiento continuo (ver cabecera).
  const [medir, setMedir] = useState(false);
  const cambios = useRef(0);
  const ajustar = (v: number) => {
    cambios.current++;
    setDpr(v);
  };
  // Lo que cambia la silueta (y por tanto la sombra de contacto).
  const forma = `${config.correa}|${config.cierre}`;
  return (
    <Canvas
      className="pyj-reloj3d_canvas"
      dpr={dpr}
      frameloop="demand"
      camera={{ fov: FOV, near: 5, far: 2000, position: [0, 0, 220] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      aria-hidden
    >
      {medir && cambios.current < 3 && (
        <PerformanceMonitor onDecline={() => ajustar(1)} onIncline={() => ajustar(maxDpr)} />
      )}
      <Studio noche={noche} />
      <WatchModel config={config} noche={noche} onReady={props.onReady} />
      <Sombra forma={forma} noche={noche} />
      <CameraRig
        vista={props.vista}
        vistaSeq={props.vistaSeq}
        nudge={props.nudge}
        intro={props.intro ?? true}
        compacto={props.compacto ?? false}
        coarse={coarse}
        onInteract={props.onInteract}
        onActive={setMedir}
      />
      <Capture seq={props.fotoSeq} noche={noche} coarse={coarse} onFoto={props.onFoto} />
      <ContextWatch onLost={props.onContextLost} />
    </Canvas>
  );
}

// ===========================================================================
// Sombra de contacto: UNA instancia para toda la vida del lienzo. drei crea
// dos render targets de 512² en useMemo y nunca los libera, así que NO se
// remonta (antes, key={correa} filtraba ~2 MB de GPU por cada correa). Con
// frames={1}, ContactShadows vuelve a hornear en el siguiente fotograma cada
// vez que se vuelve a pintar (su contador vive en el cuerpo del componente):
// este envoltorio memo se repinta SOLO cuando cambia la silueta o la noche.
// ===========================================================================
const Sombra = memo(function Sombra({ forma, noche }: { forma: string; noche: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [forma, noche, invalidate]);
  return (
    <ContactShadows
      name="sombra"
      userData={{ forma }}
      position={[0, FLOOR_Y, -18]}
      scale={150}
      // Alcance corto y poco desenfoque: una sombra de CONTACTO de verdad,
      // oscura donde la correa toca el suelo (con 90 mm y blur 2.6 no pasaba
      // del 30 % y no se veía ni sobre el fondo claro de la foto).
      far={45}
      blur={1.8}
      opacity={noche ? 0.2 : 0.6}
      resolution={512}
      frames={1}
      color="#000000"
    />
  );
});

// ===========================================================================
// Estudio: cúpula con degradado + tiras neutras (sin archivos externos).
// ===========================================================================
/** Radiancia (lineal) de la cúpula según la altura del punto: suelo gris,
 *  pared media que se aclara hacia el techo. Neutra: el acero se ve acero. */
function domeRadiance(y: number): number {
  // y = seno de la elevación (−1 suelo … 1 techo).
  const suelo = 0.12;
  const horizonte = 0.34;
  const techo = 0.7;
  return y < 0 ? horizonte + (suelo - horizonte) * Math.min(1, -y * 1.6) : horizonte + (techo - horizonte) * Math.pow(y, 0.8);
}

function useDome(): THREE.BufferGeometry {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(600, 64, 40);
    const p = g.getAttribute("position");
    const col = new Float32Array(p.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      const r = domeRadiance(v.y);
      col[i * 3] = r;
      col[i * 3 + 1] = r;
      col[i * 3 + 2] = r * 1.01;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

function Studio({ noche }: { noche: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [noche, invalidate]);
  const dome = useDome();
  const domeMat = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false, fog: false }),
    [],
  );
  useEffect(() => () => domeMat.dispose(), [domeMat]);
  return (
    <Environment resolution={256} frames={1} far={2000} environmentIntensity={noche ? 0.035 : 1}>
      <color attach="background" args={["#3a3a3a"]} />
      <mesh geometry={dome} material={domeMat} />
      {/* Caja de luz principal: arriba a la izquierda y delante (como el
          compositor: las sombras caen abajo a la derecha). */}
      <Lightformer form="rect" intensity={2.4} position={[-110, 150, 120]} scale={[200, 130, 1]} target={[0, 0, 0]} />
      {/* Techo: luz suave que baña las caras cepilladas. */}
      <Lightformer form="rect" intensity={1.1} position={[0, 220, -10]} scale={[260, 220, 1]} target={[0, 0, 0]} />
      {/* Tiras de contorno: bandas limpias en los chaflanes pulidos. */}
      <Lightformer form="rect" intensity={3} position={[190, 30, 50]} scale={[26, 300, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2.2} position={[-190, -10, -10]} scale={[26, 300, 1]} target={[0, 0, 0]} />
      {/* Caja frontal POR ENCIMA de la cámara (de ~7° a ~25° de altura, no un
          difusor centrado en ella): las caras planas la reflejan en degradado
          y de frente la esfera refleja la cúpula, no un velo blanco. */}
      <Lightformer form="rect" intensity={1.3} position={[0, 70, 250]} scale={[300, 80, 1]} target={[0, 0, 0]} />
      {/* Aro de arriba y luz de atrás (la tapa también se ve iluminada). */}
      <Lightformer form="ring" intensity={1.4} position={[0, 200, 40]} scale={60} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.8} position={[80, 110, -190]} scale={[200, 110, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.7} position={[-30, 20, -280]} scale={[260, 160, 1]} target={[0, 0, 0]} />
    </Environment>
  );
}

// ===========================================================================
// Cámara: encuadres, giro de presentación, teclado y controles.
// ===========================================================================
interface Sph {
  az: number;
  pol: number;
  r: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const POL_MIN = 0.2;
const POL_MAX = Math.PI - 0.2;

function CameraRig({
  vista,
  vistaSeq,
  nudge,
  intro,
  compacto,
  coarse,
  onInteract,
  onActive,
}: {
  vista: Vista3D;
  vistaSeq: number;
  nudge?: WatchSceneProps["nudge"];
  intro: boolean;
  compacto: boolean;
  coarse: boolean;
  onInteract?: () => void;
  /** Hay movimiento continuo (giro automático o gesto en curso). */
  onActive?: (on: boolean) => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const arrastre = useRef(false);
  const activo = useRef(false);
  const setActivo = (on: boolean) => {
    if (activo.current === on) return;
    activo.current = on;
    onActive?.(on);
  };
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<OrbitControlsImpl>(null);
  const anim = useRef<{ from: Sph; to: Sph; t0: number; dur: number; ease: (t: number) => number } | null>(null);
  const D = fitDistance(size.width / Math.max(1, size.height), compacto);
  const target = compacto ? TARGET_COMPACTO : TARGET;
  const minD = D * 0.42;
  const maxD = D * 1.3;

  const place = (s: Sph) => {
    // En táctil el ángulo polar queda fijo en el del encuadre: el dedo solo
    // gira de lado y el gesto vertical sigue siendo desplazar la página.
    const c = controls.current;
    if (c && coarse) c.minPolarAngle = c.maxPolarAngle = s.pol;
    camera.position.copy(target).add(new THREE.Vector3().setFromSphericalCoords(s.r, s.pol, s.az));
    camera.lookAt(target);
    c?.update();
  };
  const current = (): Sph => {
    const sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
    return { az: sph.theta, pol: sph.phi, r: sph.radius };
  };
  const goal = (v: Vista3D): Sph => ({ az: PRESETS[v].az, pol: PRESETS[v].pol, r: D * PRESETS[v].k });
  const animate = (to: Sph, dur: number) => {
    const from = current();
    // Por el camino corto.
    let d = to.az - from.az;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    to.az = from.az + d;
    if (reducedMotion()) {
      anim.current = null;
      place(to);
    } else {
      anim.current = { from, to, t0: performance.now(), dur, ease: easeInOut };
    }
    invalidate();
  };

  // Primer encuadre (y el giro de presentación).
  const first = useRef(true);
  useLayoutEffect(() => {
    if (!first.current) return;
    first.current = false;
    const to = goal(vista);
    if (intro && !reducedMotion()) {
      const from = { az: to.az + 1.05, pol: coarse ? to.pol : to.pol - 0.12, r: to.r * 1.08 };
      place(from);
      anim.current = { from, to, t0: performance.now() + 250, dur: 2600, ease: easeOut };
      setActivo(true);
    } else {
      place(to);
    }
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un encuadre pedido con los botones.
  const lastSeq = useRef(vistaSeq);
  useEffect(() => {
    if (vistaSeq === lastSeq.current) return;
    lastSeq.current = vistaSeq;
    animate(goal(vista), 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaSeq, vista]);

  // Teclado (flechas sobre el visor): un paso de giro.
  const lastNudge = useRef(nudge?.seq ?? 0);
  useEffect(() => {
    if (!nudge || nudge.seq === lastNudge.current) return;
    lastNudge.current = nudge.seq;
    const base = anim.current ? anim.current.to : current();
    const pol = coarse ? base.pol : Math.max(POL_MIN, Math.min(POL_MAX, base.pol + nudge.pol));
    animate({ az: base.az + nudge.az, pol, r: base.r }, 260);
    onInteract?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nudge?.seq]);

  // El primer gesto del cliente manda: se para cualquier giro automático.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    let t = 0;
    const start = () => {
      anim.current = null;
      arrastre.current = true;
      window.clearTimeout(t);
      setActivo(true);
      onInteract?.();
    };
    const end = () => {
      arrastre.current = false;
      // La inercia sigue un momento después de soltar.
      t = window.setTimeout(() => !arrastre.current && !anim.current && setActivo(false), 900);
    };
    c.addEventListener("start", start);
    c.addEventListener("end", end);
    return () => {
      window.clearTimeout(t);
      c.removeEventListener("start", start);
      c.removeEventListener("end", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onInteract]);

  // Escritorio: la rueda sola desplaza la página; Ctrl/⌘ + rueda (o pellizcar
  // el trackpad, que llega como rueda con Ctrl) acerca o aleja el reloj.
  useEffect(() => {
    if (coarse) return;
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      anim.current = null;
      const now = current();
      const k = Math.exp(Math.max(-0.4, Math.min(0.4, e.deltaY * 0.0025)));
      place({ ...now, r: Math.max(minD, Math.min(maxD, now.r * k)) });
      invalidate();
      onInteract?.();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, coarse, minD, maxD]);

  useFrame(() => {
    const a = anim.current;
    if (!a) return;
    const t = Math.max(0, Math.min(1, (performance.now() - a.t0) / a.dur));
    const e = a.ease(t);
    place({
      az: a.from.az + (a.to.az - a.from.az) * e,
      pol: a.from.pol + (a.to.pol - a.from.pol) * e,
      r: a.from.r + (a.to.r - a.from.r) * e,
    });
    if (t < 1) invalidate();
    else {
      anim.current = null;
      if (!arrastre.current) setActivo(false);
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={target}
      enablePan={false}
      // Rueda: no (desplaza la página; ver arriba). Pellizco en táctil: sí.
      enableZoom={coarse}
      enableDamping
      dampingFactor={0.09}
      rotateSpeed={0.7}
      zoomSpeed={0.6}
      minDistance={minD}
      maxDistance={maxD}
      {...(coarse ? {} : { minPolarAngle: POL_MIN, maxPolarAngle: POL_MAX })}
    />
  );
}

// ===========================================================================
// "Descargar foto" = FOTO DE ESTUDIO: perspectiva + tapa, supermuestreadas.
// ===========================================================================
/** Desplazamientos de subpíxel (1/16 px) de SSAARenderPass, niveles 2 y 3. */
const JITTER_4: readonly [number, number][] = [
  [-2, -6],
  [6, -2],
  [-6, 2],
  [2, 6],
];
const JITTER_8: readonly [number, number][] = [
  [1, -3],
  [-1, 3],
  [5, 1],
  [-3, -5],
  [-5, 5],
  [-7, -1],
  [3, 7],
  [7, -7],
];

/** Fondo de estudio de la foto: más claro que el escenario (ahí la sombra de
 *  contacto SÍ se ve), cálido y con un suelo que se oscurece hacia delante. */
function paintBackdrop(ctx: CanvasRenderingContext2D, x: number, w: number, h: number, noche: boolean) {
  if (noche) {
    const g = ctx.createRadialGradient(x + w / 2, h * 0.42, 0, x + w / 2, h * 0.42, Math.max(w, h) * 0.75);
    g.addColorStop(0, "#0d1712");
    g.addColorStop(1, "#020403");
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, h);
    return;
  }
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, "#3b342c");
  v.addColorStop(0.62, "#6f665b");
  v.addColorStop(0.8, "#5d554b");
  v.addColorStop(1, "#2c2620");
  ctx.fillStyle = v;
  ctx.fillRect(x, 0, w, h);
  // Viñeta suave.
  const r = ctx.createRadialGradient(x + w / 2, h * 0.5, w * 0.25, x + w / 2, h * 0.5, w * 0.78);
  r.addColorStop(0, "rgba(0,0,0,0)");
  r.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = r;
  ctx.fillRect(x, 0, w, h);
}

function Capture({
  seq,
  noche,
  coarse,
  onFoto,
}: {
  seq: number;
  noche: boolean;
  coarse: boolean;
  onFoto?: (img: Blob | null) => void;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const last = useRef(seq);
  useEffect(() => {
    if (seq === last.current) return;
    last.current = seq;
    const prevRatio = gl.getPixelRatio();
    const sombra = scene.getObjectByName("sombra");
    const sombraMats: { m: THREE.Material & { opacity: number }; o: number }[] = [];
    sombra?.traverse((o) => {
      const m = (o as THREE.Mesh).material as (THREE.Material & { opacity: number }) | undefined;
      if (m && "opacity" in m) sombraMats.push({ m, o: m.opacity });
    });
    const restore = () => {
      sombraMats.forEach(({ m, o }) => (m.opacity = o));
      gl.setPixelRatio(prevRatio);
      gl.setSize(size.width, size.height, false);
      invalidate();
    };
    try {
      const max = Math.min(gl.capabilities.maxTextureSize, 4096);
      const P = Math.min(coarse ? 1200 : 1600, max);
      const jitter = coarse ? JITTER_4 : JITTER_8;
      const out = document.createElement("canvas");
      out.width = P * 2;
      out.height = P;
      const ctx = out.getContext("2d");
      const tmp = document.createElement("canvas");
      tmp.width = tmp.height = P;
      const tctx = tmp.getContext("2d");
      if (!ctx || !tctx) throw new Error("sin canvas 2D");
      // La sombra de contacto, más marcada sobre el fondo claro de la foto.
      if (!noche) sombraMats.forEach(({ m }) => (m.opacity = 0.9));
      gl.setPixelRatio(1);
      gl.setSize(P, P, false);
      const cam = new THREE.PerspectiveCamera(FOV, 1, 5, 2000);
      const D = fitDistance(1);
      // Algo más lejos que en el visor: el reloj entero, con la correa, la
      // hebilla y la sombra en el suelo, dentro de cada cuadro.
      const vistas: [Vista3D, number][] = [
        ["tres4", 1.14],
        ["tapa", 1.1],
      ];
      vistas.forEach(([v, k], panel) => {
        const p = PRESETS[v];
        cam.position.copy(TARGET).add(new THREE.Vector3().setFromSphericalCoords(D * k, p.pol, p.az));
        cam.lookAt(TARGET);
        paintBackdrop(ctx, panel * P, P, P, noche);
        // Supermuestreo: N fotogramas con la cámara desplazada un subpíxel,
        // promediados (cada uno ya compuesto sobre el fondo, opaco).
        jitter.forEach(([jx, jy], i) => {
          cam.setViewOffset(P, P, jx / 16, jy / 16, P, P);
          gl.render(scene, cam);
          tctx.globalAlpha = 1;
          tctx.clearRect(0, 0, P, P);
          paintBackdrop(tctx, 0, P, P, noche);
          tctx.drawImage(gl.domElement, 0, 0);
          ctx.globalAlpha = 1 / (i + 1);
          ctx.drawImage(tmp, panel * P, 0);
        });
        ctx.globalAlpha = 1;
      });
      restore();
      out.toBlob(
        (b) => {
          if (!b) console.error("[reloj 3D] foto: toBlob sin datos");
          onFoto?.(b);
        },
        "image/jpeg",
        0.92,
      );
    } catch (err) {
      console.error("[reloj 3D] foto", err);
      restore();
      onFoto?.(null);
    }
  }, [seq, gl, scene, size, invalidate, noche, coarse, onFoto]);
  return null;
}

// ===========================================================================
// Contexto WebGL perdido (el sistema lo reclama en móviles con poca memoria).
// ===========================================================================
function ContextWatch({ onLost }: { onLost?: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const h = (e: Event) => {
      e.preventDefault();
      onLost?.();
    };
    el.addEventListener("webglcontextlost", h);
    return () => el.removeEventListener("webglcontextlost", h);
  }, [gl, onLost]);
  return null;
}
