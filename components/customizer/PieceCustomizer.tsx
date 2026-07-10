"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Lightformer,
  RoundedBox,
  Decal,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { useCart } from "@/lib/cart-context";
import { PIECE_MODELS, type PieceModel } from "@/lib/customizer-models";

const FONTS = [
  { label: "Clásica", css: "700 #px 'Cinzel', serif", probe: "700 64px 'Cinzel'" },
  { label: "Cursiva", css: "400 #px 'Great Vibes', cursive", probe: "400 64px 'Great Vibes'" },
  { label: "Elegante", css: "600 #px 'Cormorant Garamond', serif", probe: "600 64px 'Cormorant Garamond'" },
  { label: "Moderna", css: "700 #px 'Lato', sans-serif", probe: "700 64px 'Lato'" },
];

const METALS = [
  { label: "Oro", color: "#caa23a", rough: 0.3 },
  { label: "Plata", color: "#cfd2d6", rough: 0.22 },
];

interface Design {
  text: string;
  fontIdx: number;
  size: number;
  posX: number;
  posY: number;
}

interface SavedDesign {
  id: number;
  preview: string;
  d: { design: Design; modelIdx: number; metalIdx: number; piece: string };
}

const CV = 1024;

// Engraving texture. fillColor !== null → opaque metal plate with dark recessed text
// (procedural shapes). fillColor === null → transparent with bright text (a decal that
// sits on a loaded .glb model).
function useEngraving(design: Design, fontsReady: boolean, fillColor: string | null) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = CV;
    c.height = CV;
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.userData.canvas = c;
    return t;
  }, []);

  useEffect(() => {
    const c = texture.userData.canvas as HTMLCanvasElement;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, CV, CV);
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, CV, CV);
    }
    const f = FONTS[design.fontIdx];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = f.css.replace("#", String(design.size));
    const lines = (design.text || "").split("\n").slice(0, 3);
    const lh = design.size * 1.18;
    const px = fillColor ? design.posX : CV / 2;
    const baseY = fillColor ? design.posY : CV / 2;
    lines.forEach((ln, i) => {
      const y = baseY + (i - (lines.length - 1) / 2) * lh;
      if (fillColor) {
        ctx.fillStyle = "rgba(255,250,235,0.5)";
        ctx.fillText(ln, px - 2, y - 2);
        ctx.fillStyle = "rgba(26,18,4,0.62)";
        ctx.fillText(ln, px, y);
      } else {
        ctx.fillStyle = "rgba(20,14,4,0.55)";
        ctx.fillText(ln, px + 2, y + 2);
        ctx.fillStyle = "#f6e3a8";
        ctx.fillText(ln, px, y);
      }
    });
    texture.needsUpdate = true;
  }, [design, fontsReady, fillColor, texture]);

  return texture;
}

function ProcPiece({
  model,
  bump,
  metal,
  placing,
  onPlace,
}: {
  model: PieceModel;
  bump: THREE.Texture;
  metal: (typeof METALS)[number];
  placing: boolean;
  onPlace: (uv: THREE.Vector2) => void;
}) {
  const isDisc = model.procShape === "disc";
  const face: [number, number] =
    model.procShape === "plate" ? [1.5, 1.0] : isDisc ? [0.95, 0.95] : [0.66, 1.5];
  const mat = { color: metal.color, metalness: 1, roughness: metal.rough };
  const place = (e: ThreeEvent<PointerEvent>) => {
    if (!placing) return;
    e.stopPropagation();
    if (e.uv) onPlace(e.uv);
  };

  return (
    <group>
      {isDisc ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, 0.14, 96]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ) : (
        <RoundedBox
          args={model.procShape === "plate" ? [1.7, 1.15, 0.14] : [0.82, 1.7, 0.13]}
          radius={0.08}
          smoothness={6}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...mat} />
        </RoundedBox>
      )}

      <mesh position={[0, 0, 0.075]} onPointerDown={place} onPointerMove={place}>
        {isDisc ? (
          <circleGeometry args={[face[0], 96]} />
        ) : (
          <planeGeometry args={face} />
        )}
        <meshStandardMaterial
          color="#ffffff"
          metalness={1}
          roughness={metal.rough + 0.12}
          map={bump}
          bumpMap={bump}
          bumpScale={0.45}
        />
      </mesh>

      {model.procShape !== "plate" && (
        <mesh
          position={[0, isDisc ? 1.08 : 0.95, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[0.13, 0.045, 24, 48]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      )}
    </group>
  );
}

function GLBPiece({
  model,
  decalTex,
  size,
}: {
  model: PieceModel;
  decalTex: THREE.Texture;
  size: number;
}) {
  const { scene } = useGLTF(model.url!);
  // Auto-fit ANY model: centre it and scale so its largest dimension fills the view,
  // and place the engraving decal on the front face — so a Meshy/Tripo .glb just works
  // without per-model tuning (they can still override scale/decalPos in the registry).
  const data = useMemo(() => {
    let mesh: THREE.Mesh | null = null;
    scene.traverse((o) => {
      if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
    });
    if (!mesh) return null;
    const geo = (mesh as THREE.Mesh).geometry;
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const sz = new THREE.Vector3();
    bb.getSize(sz);
    const ctr = new THREE.Vector3();
    bb.getCenter(ctr);
    const maxDim = Math.max(sz.x, sz.y, sz.z) || 1;
    return {
      geometry: geo,
      material: (mesh as THREE.Mesh).material as THREE.Material,
      groupScale: (model.scale ?? 1) * (1.9 / maxDim),
      meshPos: [-ctr.x, -ctr.y, -ctr.z] as [number, number, number],
      decalPos: (model.decalPos ?? [ctr.x, ctr.y, bb.max.z]) as [number, number, number],
      decalBase: maxDim * 0.42,
    };
  }, [scene, model.scale, model.decalPos]);

  if (!data) return null;
  const s = data.decalBase * (size / 150) * (model.decalScale ?? 1);

  return (
    <group scale={data.groupScale}>
      <mesh geometry={data.geometry} material={data.material} position={data.meshPos}>
        <Decal position={data.decalPos} rotation={[0, 0, 0]} scale={[s, s, s]}>
          <meshStandardMaterial
            map={decalTex}
            transparent
            polygonOffset
            polygonOffsetFactor={-10}
            roughness={0.45}
            metalness={0.4}
          />
        </Decal>
      </mesh>
    </group>
  );
}

export default function PieceCustomizer({
  pieceName = "Medalla",
  price = 380,
  productHandle = "pieza-personalizada",
  image = "",
  modelUrl,
  variantId,
}: {
  pieceName?: string;
  price?: number;
  productHandle?: string;
  image?: string;
  /** When set, the product's own generated .glb loads as the default piece. */
  modelUrl?: string;
  /** Real Shopify ProductVariant GID — so the customized piece checks out correctly. */
  variantId?: string;
}) {
  // If this product has a real generated model, make it the first/default piece.
  const models: PieceModel[] = useMemo(
    () =>
      modelUrl
        ? [
            { id: "tu-pieza", label: "Tu pieza", kind: "glb", url: modelUrl },
            ...PIECE_MODELS,
          ]
        : PIECE_MODELS,
    [modelUrl],
  );
  const { addLine } = useCart();
  const [design, setDesign] = useState<Design>({
    text: "Oshún",
    fontIdx: 0,
    size: 150,
    posX: CV / 2,
    posY: CV / 2,
  });
  const [modelIdx, setModelIdx] = useState(0);
  const [metalIdx, setMetalIdx] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [saved, setSaved] = useState<SavedDesign[]>([]);
  const [done, setDone] = useState<null | string>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const model = models[modelIdx] ?? models[0];
  const metal = METALS[metalIdx];

  useEffect(() => {
    Promise.all(FONTS.map((f) => document.fonts.load(f.probe).catch(() => null)))
      .then(() => setFontsReady(true))
      .catch(() => setFontsReady(true));
    try {
      const raw = localStorage.getItem("pyj_designs");
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function set<K extends keyof Design>(k: K, v: Design[K]) {
    setDesign((d) => ({ ...d, [k]: v }));
  }
  function capture() {
    try {
      return glRef.current?.domElement.toDataURL("image/png") ?? "";
    } catch {
      return "";
    }
  }
  function onPlace(uv: THREE.Vector2) {
    set("posX", uv.x * CV);
    set("posY", (1 - uv.y) * CV);
  }
  function saveDesign() {
    const preview = capture();
    const next = [
      { id: Date.now(), preview, d: { design, modelIdx, metalIdx, piece: pieceName } },
      ...saved,
    ].slice(0, 8);
    setSaved(next);
    try {
      localStorage.setItem("pyj_designs", JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setDone("Diseño guardado en «Mis diseños».");
  }
  function loadDesign(entry: SavedDesign) {
    setDesign(entry.d.design);
    setModelIdx(entry.d.modelIdx);
    setMetalIdx(entry.d.metalIdx);
  }
  function addToCart() {
    const preview = capture();
    addLine({
      id: `${productHandle}-custom-${Date.now()}`,
      merchandiseId: variantId,
      productHandle,
      title: `${pieceName} (personalizada)`,
      image: image || preview,
      price,
      currencyCode: "USD",
      customization: {
        text: design.text,
        font: FONTS[design.fontIdx].label,
        metal: metal.label,
        shape: model.label,
        preview,
      },
    });
    setDone("Añadida al carrito con tu grabado. El taller la recibirá.");
  }

  // Two engraving textures: opaque (procedural plate) and transparent (glb decal).
  const procTex = useEngraving(design, fontsReady, metal.color);
  const decalTex = useEngraving(design, fontsReady, null);

  return (
    <div className="customizer">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" />

      <div className="customizer-stage">
        <Canvas
          dpr={[1, 1.6]}
          camera={{ position: [0, 0, 4], fov: 42 }}
          gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            glRef.current = gl;
          }}
        >
          <color attach="background" args={["#14100a"]} />
          <ambientLight intensity={0.45} />
          <directionalLight position={[3, 4, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-4, 2, -2]} intensity={0.5} />

          <Suspense fallback={null}>
            {model.kind === "glb" ? (
              <GLBPiece model={model} decalTex={decalTex} size={design.size} />
            ) : (
              <ProcPiece
                model={model}
                bump={procTex}
                metal={metal}
                placing={placing}
                onPlace={onPlace}
              />
            )}
          </Suspense>

          <ContactShadows position={[0, -1.4, 0]} opacity={0.5} scale={6} blur={2.4} far={3} />
          <Environment resolution={128}>
            <Lightformer intensity={2.4} form="rect" position={[0, 0, 5]} scale={[10, 10, 1]} />
            <Lightformer intensity={1.3} form="rect" position={[0, 4, -5]} scale={[8, 6, 1]} color="#fff1d0" />
            <Lightformer intensity={1.6} form="circle" position={[-5, 2, 2]} scale={[4, 4, 1]} color="#ffe6b0" />
            <Lightformer intensity={1.0} form="rect" position={[5, -2, 2]} scale={[4, 4, 1]} />
          </Environment>
          <OrbitControls
            enabled={!placing}
            enablePan={false}
            minDistance={2.6}
            maxDistance={6}
            autoRotate={!placing}
            autoRotateSpeed={0.5}
          />
        </Canvas>
        <span className="customizer-hint">
          {placing ? "Toca la pieza para colocar el grabado" : "Arrastra para girar · 360°"}
        </span>
      </div>

      <div className="customizer-panel">
        <h4>Personaliza tu pieza</h4>
        <p className="customizer-sub">Diséñala en 3D y míralo grabado en tiempo real.</p>

        <label className="cz-label">Pieza</label>
        <div className="cz-fonts">
          {models.map((m, i) => (
            <button key={m.id} type="button" className={`cz-font${i === modelIdx ? " active" : ""}`} onClick={() => setModelIdx(i)}>
              {m.label}
            </button>
          ))}
        </div>
        {model.note && <p className="cz-note">{model.note}</p>}

        {model.kind !== "glb" && (
          <>
            <label className="cz-label">Metal</label>
            <div className="cz-fonts">
              {METALS.map((m, i) => (
                <button key={m.label} type="button" className={`cz-font${i === metalIdx ? " active" : ""}`} onClick={() => setMetalIdx(i)}>
                  {m.label}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="cz-label">Texto del grabado</label>
        <textarea
          className="cz-input"
          rows={2}
          maxLength={42}
          value={design.text}
          onChange={(e) => set("text", e.target.value)}
          placeholder="Nombre, fecha, Orisha…"
        />

        <label className="cz-label">Tipografía</label>
        <div className="cz-fonts">
          {FONTS.map((f, i) => (
            <button key={f.label} type="button" className={`cz-font${i === design.fontIdx ? " active" : ""}`} onClick={() => set("fontIdx", i)}>
              {f.label}
            </button>
          ))}
        </div>

        <label className="cz-label">Tamaño</label>
        <input type="range" min={70} max={240} value={design.size} onChange={(e) => set("size", Number(e.target.value))} />

        {model.kind !== "glb" && (
          <>
            <label className="cz-label">Posición</label>
            <button
              type="button"
              className={`cz-place${placing ? " active" : ""}`}
              onClick={() => setPlacing((p) => !p)}
            >
              {placing ? "✓ Tocando para colocar (terminar)" : "✋ Mover grabado — colócalo donde quieras"}
            </button>
          </>
        )}

        <div className="cz-actions">
          <button type="button" className="hiraola-btn cz-save" onClick={addToCart}>
            Añadir al carrito
          </button>
          <button type="button" className="cz-secondary" onClick={saveDesign}>
            Guardar diseño
          </button>
        </div>

        {done && <div className="cz-confirm"><strong>✓ {done}</strong></div>}

        {saved.length > 0 && (
          <>
            <label className="cz-label">Mis diseños</label>
            <div className="cz-saved">
              {saved.map((e) => (
                <button key={e.id} type="button" className="cz-thumb" onClick={() => loadDesign(e)} title="Cargar diseño">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {e.preview ? <img src={e.preview} alt="Diseño guardado" /> : <span>◇</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Preload the example real model so it's ready when selected.
const realModel = PIECE_MODELS.find((m) => m.kind === "glb");
if (realModel?.url) useGLTF.preload(realModel.url);
