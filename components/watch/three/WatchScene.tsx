"use client";

// ---------------------------------------------------------------------------
// LA ESCENA 3D DEL RELOJ — el trozo DIFERIDO: three, fiber y drei solo se
// descargan cuando el escenario 3D lo pide (components/watch/WatchStage3D.tsx
// lo importa bajo demanda, sin SSR). Spec: SPEC-EDITOR-V2 §4.
//
//   • Luz: HDRI de estudio (Poly Haven "studio_small_09", CC0 — autorizado por
//     el dueño; reducido sin conexión a 512×256 RGBE en
//     public/assets/3d/estudio-512.hdr, ≈ 410 KB, mismo origen) + dos tiras
//     <Lightformer> verticales para bandas limpias en los chaflanes. Mientras
//     baja, la cúpula de estudio hecha en el navegador (Suspense). El fondo
//     sigue transparente (el degradado de estudio es CSS).
//   • Color: NeutralToneMapping, exposición 1, salida sRGB.
//   • Rendimiento: frameloop="demand" (en reposo, 0 fps; "never" con la foto
//     real delante), dpr [1, 1.75] (1.5 en táctil) que PerformanceMonitor baja
//     a 1 si el equipo no llega (solo se mide con movimiento seguido).
//   • El reloj se ARMA: la máscara `confirmed` dice qué piezas son reales y
//     cuáles cristal (reveal.ts, ghost.ts); la correa se ABRE cuando la última
//     vista pedida es la tapa (pose.ts); la cámara va con muelles
//     (camera.tsx); la sombra de contacto se hornea a petición (shadow.tsx).
//   • Antes de mostrarse compila todos los programas (reales y de cristal) con
//     compileAsync: ningún barrido compila después.
//   • La foto de estudio (capture.ts) se ofrece por onApi.
//   • Si el navegador pierde el contexto WebGL, avisa (onContextLost).
//   • ?qa3d (solo en desarrollo): window.__pyjR3D con gl.info, llamadas de
//     dibujo y la caja proyectada del reloj real (el control de encuadre).
// ---------------------------------------------------------------------------
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { maskKey, type WatchPart } from "../stage3d-contract";
import { AssemblyProvider } from "./assembly";
import { CameraRig, FOV } from "./camera";
import { captureStudio } from "./capture";
import { FLOOR_Y } from "./geo/strap";
import { PoseDriver } from "./pose";
import { Assembly } from "./reveal";
import { ContactShadow, type ShadowHandle } from "./shadow";
import WatchModel from "./WatchModel";
import type { WatchSceneProps } from "./types";

// fiber 9.8 crea un THREE.Clock (obsoleto desde r183) en cada <Canvas>: three
// lo avisa en la consola. Se calla SOLO ese aviso.
if (typeof window !== "undefined" && !THREE.getConsoleFunction()) {
  THREE.setConsoleFunction((type, message, ...params) => {
    if (type === "warn" && typeof message === "string" && message.startsWith("THREE.Clock:")) return;
    const out = type === "error" ? console.error : type === "warn" ? console.warn : console.log;
    out(message, ...params);
  });
}

const HDRI = "/assets/3d/estudio-512.hdr";

function isCoarse(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

function useReducedMotion(): boolean {
  const [r, setR] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

const qa3d = () =>
  process.env.NODE_ENV !== "production" && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("qa3d");

export default function WatchScene(props: WatchSceneProps) {
  const coarse = useMemo(isCoarse, []);
  const reduced = useReducedMotion();
  const maxDpr = coarse ? 1.5 : 1.75;
  const [dpr, setDpr] = useState<number | [number, number]>([1, maxDpr]);
  const [medir, setMedir] = useState(false);
  const cambios = useRef(0);
  const ajustar = (v: number) => {
    cambios.current++;
    setDpr(v);
  };
  return (
    <Canvas
      className="pyj-r3d_canvas"
      dpr={dpr}
      frameloop={props.active ? "demand" : "never"}
      camera={{ fov: FOV, near: 5, far: 2000, position: [0, 0, 220] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onCreated={({ gl, camera, raycaster }) => {
        gl.setClearColor(0x000000, 0);
        // Un plano de recorte por pieza (los barridos).
        gl.localClippingEnabled = true;
        // La cámara principal ve lo real (0) y el cristal (1).
        camera.layers.enable(1);
        raycaster.layers.enableAll();
      }}
      aria-hidden
    >
      {medir && cambios.current < 3 && <PerformanceMonitor onDecline={() => ajustar(1)} onIncline={() => ajustar(maxDpr)} />}
      <Studio noche={props.noche} coarse={coarse} />
      <Content {...props} coarse={coarse} reduced={reduced} onActive={setMedir} />
    </Canvas>
  );
}

// ===========================================================================
// Estudio: HDRI + tiras; mientras baja, la cúpula hecha en el navegador.
// ===========================================================================
function domeRadiance(y: number): number {
  const suelo = 0.12;
  const horizonte = 0.34;
  const techo = 0.7;
  return y < 0 ? horizonte + (suelo - horizonte) * Math.min(1, -y * 1.6) : horizonte + (techo - horizonte) * Math.pow(y, 0.8);
}

function Dome() {
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
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false, fog: false }), []);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  return <mesh geometry={geo} material={mat} />;
}

/** Las dos tiras verticales (bandas limpias en los chaflanes pulidos) y una
 *  caja suave grande DETRÁS de la cámara de la tapa (el campo pulido de la
 *  tapa refleja justo la dirección de la cámara, que en el HDRI girado es el
 *  lado oscuro del estudio: sin ella la tapa se ve negra). */
function Strips() {
  return (
    <>
      <Lightformer form="rect" intensity={1.6} position={[190, 20, 60]} scale={[22, 300, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.6} position={[-170, 10, 90]} scale={[22, 300, 1]} target={[0, 0, 0]} />
      {/* OJO: environmentRotation gira también estas cajas (se hornean con el
          HDRI). La búsqueda en el mapa es R_y(−3.5)·dirección, así que "detrás
          de la cámara de la tapa" (mundo −z) es (−88, 35, 234) aquí. */}
      <Lightformer form="rect" intensity={1.25} position={[-88, 35, 234]} scale={[240, 170, 1]} target={[0, 0, 0]} />
      {/* Techo suave: lo pulido que mira arriba (los centrales del brazalete,
          el chaflán del bisel) no refleja el techo negro del HDRI. */}
      <Lightformer form="rect" intensity={0.45} position={[0, 230, 30]} scale={[260, 170, 1]} target={[0, 0, 0]} />
    </>
  );
}

function ProceduralStudio({ noche, res }: { noche: boolean; res: number }) {
  return (
    <Environment resolution={res} frames={1} far={2000} environmentIntensity={noche ? 0.035 : 1}>
      <color attach="background" args={["#3a3a3a"]} />
      <Dome />
      <Lightformer form="rect" intensity={2.4} position={[-110, 150, 120]} scale={[200, 130, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.1} position={[0, 220, -10]} scale={[260, 220, 1]} target={[0, 0, 0]} />
      <Strips />
      <Lightformer form="rect" intensity={1.8} position={[80, 110, -190]} scale={[200, 110, 1]} target={[0, 0, 0]} />
    </Environment>
  );
}

function Studio({ noche, coarse }: { noche: boolean; coarse: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [noche, invalidate]);
  const res = coarse ? 128 : 256;
  return (
    <Suspense fallback={<ProceduralStudio noche={noche} res={res} />}>
      <Environment
        files={HDRI}
        resolution={res}
        frames={2}
        far={2000}
        environmentIntensity={noche ? 0.035 : 0.85}
        environmentRotation={[0, 3.5, 0]}
      >
        <Strips />
      </Environment>
      <EnvReady />
    </Suspense>
  );
}

/** Repinta cuando llega el HDRI (con frameloop "demand" no hay más
 *  fotogramas) y rehornea lo que dependa de él. */
function EnvReady() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    const t = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(t);
  }, [invalidate]);
  return null;
}

// ===========================================================================
// El contenido: el reloj, su armado, la pose, la cámara, la sombra y la foto
// ===========================================================================
const ALL_GHOSTS: Readonly<Record<WatchPart, boolean>> = { caja: true, esfera: true, agujas: true, correa: true, cierre: true, tapa: true };

function Content(p: WatchSceneProps & { coarse: boolean; reduced: boolean; onActive: (on: boolean) => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const [asm] = useState(() => new Assembly());
  const [pose] = useState(() => new PoseDriver());
  useEffect(() => () => asm.dispose(), [asm]);
  asm.reduced = p.reduced;
  const shadow = useRef<ShadowHandle>(null);
  const model = useRef<THREE.Group>(null);
  const [ghosts, setGhosts] = useState<Readonly<Record<WatchPart, boolean>>>(() => asm.ghostsMounted());
  useLayoutEffect(() => {
    asm.events = {
      onGhosts: (g) => setGhosts(g),
      onSettled: () => shadow.current?.request(),
    };
    pose.onSettled = () => shadow.current?.request();
  }, [asm, pose]);

  // — La máscara —————————————————————————————————————————————————————
  const key = maskKey(p.confirmed);
  const modeRef = useRef(p.mode);
  modeRef.current = p.mode;
  useLayoutEffect(() => {
    if (asm.apply(p.confirmed, modeRef.current, performance.now())) invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, asm, invalidate]);

  // — La pose: abierta si la última vista pedida es la tapa ———————————————
  const open = p.view === "tapa";
  const canvasEl = gl.domElement;
  const firstPose = useRef(true);
  useEffect(() => {
    asm.abierta = open;
    if (firstPose.current) {
      // Al montar, la pose de la vista pedida sin animar.
      firstPose.current = false;
      pose.setOpen(open, performance.now(), true);
      invalidate();
      return;
    }
    if (p.reduced && open !== pose.open) {
      // Corte con un parpadeo de 150 ms del lienzo.
      canvasEl.style.transition = "opacity 75ms linear";
      canvasEl.style.opacity = "0";
      const t = window.setTimeout(() => {
        pose.setOpen(open, performance.now(), true);
        canvasEl.style.opacity = "1";
        invalidate();
      }, 75);
      // Interrumpido (otra vista antes de 75 ms, o desmontado): la pose no
      // cambió, así que el lienzo vuelve a verse; la siguiente pasada decide
      // con la pose real (si hace falta, otro parpadeo). Sin esto, ida y
      // vuelta rápidas dejaban el lienzo a opacidad 0.
      return () => {
        window.clearTimeout(t);
        canvasEl.style.opacity = "1";
      };
    }
    pose.setOpen(open, performance.now(), false);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (p.active) invalidate();
  }, [p.active, invalidate]);

  useFrame(() => {
    const now = performance.now();
    const a = asm.tick(now);
    const b = pose.tick(now);
    // La sombra se va en el primer 40 % de la apertura y vuelve al cerrar.
    shadow.current?.setFade(1 - Math.min(1, pose.t / 0.4));
    if (a || b) invalidate();
  });

  // — Calentar los programas y avisar de que está listo ———————————————————
  const [warm, setWarm] = useState<"no" | "go" | "done">("no");
  const onModelReady = useCallback(() => setWarm((w) => (w === "no" ? "go" : w)), []);
  const programs = useRef(0);
  useEffect(() => {
    if (warm !== "go") return;
    let vivo = true;
    const r = requestAnimationFrame(() => {
      const done = () => {
        if (!vivo) return;
        // La sombra también (su material de profundidad solo se compila
        // cuando hay algo real que pintar): un horneado con todo visible.
        const restore = asm.showAllForWarmup();
        shadow.current?.bakeNow();
        restore();
        setWarm("done");
        invalidate();
      };
      try {
        gl.compileAsync(scene, camera).then(done, done);
      } catch {
        gl.compile(scene, camera);
        done();
      }
    });
    return () => {
      vivo = false;
      cancelAnimationFrame(r);
    };
  }, [warm, gl, scene, camera, invalidate, asm]);
  // Un cambio del reloj (un preset, otro color, otra correa) crea materiales
  // nuevos. Las piezas aún en cristal tienen lo real oculto, y three solo
  // compila un material al pintarlo: sin esto, el programa se compilaría en el
  // primer fotograma del barrido de esa pieza (un tirón, R2.4). compile()
  // recorre también lo oculto; los programas ya hechos se reutilizan.
  const firstConfig = useRef(true);
  useEffect(() => {
    if (warm !== "done") return;
    if (firstConfig.current) {
      firstConfig.current = false;
      return;
    }
    let vivo = true;
    const r = requestAnimationFrame(() => {
      if (!vivo) return;
      try {
        gl.compileAsync(scene, camera).catch(() => {});
      } catch {
        gl.compile(scene, camera);
      }
    });
    return () => {
      vivo = false;
      cancelAnimationFrame(r);
    };
  }, [p.config, warm, gl, scene, camera]);
  const readyCb = useRef(p.onReady);
  useLayoutEffect(() => {
    readyCb.current = p.onReady;
  });
  useEffect(() => {
    if (warm !== "done") return;
    programs.current = gl.info.programs?.length ?? 0;
    shadow.current?.request();
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => readyCb.current?.());
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [warm, gl]);

  // — La foto de estudio ———————————————————————————————————————————————
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const nocheRef = useRef(p.noche);
  nocheRef.current = p.noche;
  const coarse = p.coarse;
  useEffect(() => {
    p.onApi?.({
      capture: (opts) =>
        warm === "done"
          ? captureStudio(
              {
                gl,
                scene,
                size: () => sizeRef.current,
                asm,
                pose,
                shadow: shadow.current,
                noche: nocheRef.current,
                coarse,
                invalidate,
              },
              opts,
            )
          : Promise.resolve(null),
    });
    return () => p.onApi?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warm, gl, scene, asm, pose, coarse, invalidate]);

  // — Contexto perdido ——————————————————————————————————————————————————
  const lostCb = useRef(p.onContextLost);
  useLayoutEffect(() => {
    lostCb.current = p.onContextLost;
  });
  useEffect(() => {
    const el = gl.domElement;
    const h = (e: Event) => {
      e.preventDefault();
      lostCb.current?.();
    };
    el.addEventListener("webglcontextlost", h);
    return () => el.removeEventListener("webglcontextlost", h);
  }, [gl]);

  // — QA (solo desarrollo, ?qa3d) ————————————————————————————————————————
  useEffect(() => {
    if (!qa3d()) return;
    const w = window as unknown as Record<string, unknown>;
    w.__pyjR3D = {
      programNames: () => (gl.info.programs ?? []).map((pr) => (pr as unknown as { name: string; cacheKey: string }).name + " " + (pr as unknown as { cacheKey: string }).cacheKey),
      info: () => ({
        programs: gl.info.programs?.length ?? 0,
        programsAfterWarmup: programs.current,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        ghosts: asm.ghostsMounted(),
        poseT: pose.t,
      }),
      /** Caja proyectada (px CSS) del reloj REAL (capa 0, lo visible). */
      aabb: () => {
        const box = new THREE.Box3();
        const v = new THREE.Vector3();
        model.current?.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh || !o.visible || !o.layers.isEnabled(0) || o.layers.isEnabled(1)) return;
          const g = m.geometry;
          const pos = g.getAttribute("position");
          if (!pos) return;
          const inst = (m as unknown as THREE.InstancedMesh).isInstancedMesh ? (m as unknown as THREE.InstancedMesh) : null;
          const im = new THREE.Matrix4();
          const step = Math.max(1, Math.floor(pos.count / 4000));
          const n = inst ? inst.count : 1;
          for (let k = 0; k < n; k++) {
            if (inst) inst.getMatrixAt(k, im);
            for (let i = 0; i < pos.count; i += step) {
              v.fromBufferAttribute(pos, i);
              if (inst) v.applyMatrix4(im);
              v.applyMatrix4(m.matrixWorld).project(camera);
              box.expandByPoint(v);
            }
          }
        });
        const W = sizeRef.current.width;
        const H = sizeRef.current.height;
        return {
          left: ((box.min.x + 1) / 2) * W,
          right: ((box.max.x + 1) / 2) * W,
          top: ((1 - box.max.y) / 2) * H,
          bottom: ((1 - box.min.y) / 2) * H,
          W,
          H,
        };
      },
      capture: (o?: Parameters<typeof captureStudio>[1]) =>
        captureStudio(
          { gl, scene, size: () => sizeRef.current, asm, pose, shadow: shadow.current, noche: nocheRef.current, coarse, invalidate },
          o,
        ),
      envRot: (y: number, x = 0) => {
        scene.environmentRotation.set(x, y, 0);
        invalidate();
      },
      scene,
      gl,
      /** Llamadas de dibujo y triángulos de UN fotograma del visor. */
      frame: () => {
        const auto = gl.info.autoReset;
        gl.info.autoReset = false;
        gl.info.reset();
        gl.render(scene, camera);
        const r = { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
        gl.info.autoReset = auto;
        invalidate();
        return r;
      },
      envIntensity: (k: number) => {
        scene.environmentIntensity = k;
        invalidate();
      },
      asm,
      pose,
      shadow: () => shadow.current,
    };
    return () => {
      delete w.__pyjR3D;
    };
  }, [gl, camera, asm, pose, coarse, scene, invalidate]);

  const shownGhosts = warm === "go" ? ALL_GHOSTS : ghosts;
  const busy = useCallback(() => asm.busy() || pose.busy(), [asm, pose]);
  return (
    <AssemblyProvider value={{ asm, ghosts: shownGhosts }}>
      <group ref={model}>
        <WatchModel
          config={p.config}
          noche={p.noche}
          asm={asm}
          pose={pose}
          coarse={p.coarse}
          reduced={p.reduced}
          tapaView={open}
          onReady={onModelReady}
          onShape={() => shadow.current?.request()}
        />
      </group>
      <ContactShadow
        ref={shadow}
        y={FLOOR_Y}
        z={-27}
        scale={140}
        far={40}
        blur={2.2}
        opacity={p.noche ? 0.2 : 0.55}
        resolution={p.coarse ? 256 : 512}
      />
      <CameraRig
        view={p.view}
        viewSeq={p.viewSeq}
        mode={p.mode}
        active={p.active}
        insets={p.insets}
        nudge={p.nudge}
        reduced={p.reduced}
        coarse={p.coarse}
        busy={busy}
        model={model}
        onInteract={p.onInteract}
        onPartPick={p.onPartPick}
        onActive={p.onActive}
      />
    </AssemblyProvider>
  );
}
