"use client";

// ---------------------------------------------------------------------------
// LAS PIEZAS en React: cada malla del reloj dice a qué pieza pertenece
// (<PartMesh part="correa" …>). La malla REAL se registra en la Assembly (que
// la enciende y la apaga sin pasar por React); mientras la pieza está en
// cristal o barriendo, se montan a su lado las mallas del CRISTAL (pasada de
// profundidad + color + aristas), con la MISMA geometría y la misma posición
// (son hermanas: heredan la transformación del padre). Se desmontan 100 ms
// después de acabar el barrido.
// ---------------------------------------------------------------------------
import { createContext, useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import type { WatchPart } from "../stage3d-contract";
import { GHOST_LAYER, RO, edgesOf } from "./ghost";
import type { Assembly } from "./reveal";

export interface AssemblyValue {
  asm: Assembly;
  /** Qué cristales están montados (estado de React). */
  ghosts: Readonly<Record<WatchPart, boolean>>;
}

const Ctx = createContext<AssemblyValue | null>(null);

export function AssemblyProvider({ value, children }: { value: AssemblyValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssemblyCtx(): AssemblyValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("Sin Assembly");
  return v;
}

/** Pone un objeto SOLO en la capa del cristal. */
const toGhostLayer = (o: THREE.Object3D | null) => {
  if (o) o.layers.set(GHOST_LAYER);
};

type MeshProps = Omit<ThreeElements["mesh"], "ref" | "geometry" | "material">;

export interface PartMeshProps extends MeshProps {
  part: WatchPart;
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  /** false: esta malla no tiene cristal (el cristal de zafiro, la impresión). */
  ghost?: boolean;
  /** Aristas del cristal (caja y cierre; nunca en geometrías que se posan). */
  edges?: boolean;
}

export function PartMesh({ part, geometry, material, ghost = true, edges = false, ...rest }: PartMeshProps) {
  const { asm, ghosts } = useAssemblyCtx();
  const ref = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    return asm.register(part, m);
  }, [asm, part]);
  const gm = asm.parts[part].ghost;
  const showGhost = ghost && ghosts[part];
  const { renderOrder: _ro, ...transform } = rest;
  void _ro;
  return (
    <>
      <mesh ref={ref} dispose={null} geometry={geometry} material={material} userData={{ part }} {...rest} />
      {showGhost && (
        <>
          <mesh
            ref={toGhostLayer}
            dispose={null}
            geometry={geometry}
            material={gm.depth}
            renderOrder={RO.depth}
            userData={{ part }}
            {...transform}
          />
          <mesh
            ref={toGhostLayer}
            dispose={null}
            geometry={geometry}
            material={gm.color}
            renderOrder={RO.color}
            userData={{ part }}
            {...transform}
          />
          {edges && (
            <lineSegments
              ref={toGhostLayer}
              dispose={null}
              geometry={edgesOf(geometry)}
              material={gm.edges}
              renderOrder={RO.edges}
              raycast={() => null}
              {...(transform as Omit<ThreeElements["lineSegments"], "ref">)}
            />
          )}
        </>
      )}
    </>
  );
}

export interface PartInstancesProps {
  part: WatchPart;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  count: number;
  /** Recibe la malla real (para escribir sus matrices); el cristal comparte
   *  el mismo búfer de matrices. */
  onMesh?: (m: THREE.InstancedMesh | null) => void;
  ghost?: boolean;
}

export function PartInstances({ part, geometry, material, count, onMesh, ghost = true }: PartInstancesProps) {
  const { asm, ghosts } = useAssemblyCtx();
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    m.frustumCulled = false;
    onMesh?.(m);
    const off = asm.register(part, m);
    return () => {
      off();
      onMesh?.(null);
    };
  }, [asm, part, onMesh]);
  // El búfer de matrices de la malla real se libera con ella.
  useLayoutEffect(() => {
    const m = ref.current;
    return () => m?.dispose();
  }, []);
  const gm = asm.parts[part].ghost;
  const share = (g: THREE.InstancedMesh | null) => {
    if (!g || !ref.current) return;
    g.layers.set(GHOST_LAYER);
    g.frustumCulled = false;
    g.instanceMatrix = ref.current.instanceMatrix;
    g.count = ref.current.count;
  };
  return (
    <>
      <instancedMesh ref={ref} dispose={null} args={[geometry, material, count]} userData={{ part }} />
      {ghost && ghosts[part] && (
        <>
          <instancedMesh
            key={`d${count}`}
            ref={share}
            dispose={null}
            args={[geometry, gm.depth, count]}
            renderOrder={RO.depth}
            userData={{ part }}
          />
          <instancedMesh
            key={`c${count}`}
            ref={share}
            dispose={null}
            args={[geometry, gm.color, count]}
            renderOrder={RO.color}
            userData={{ part }}
          />
        </>
      )}
    </>
  );
}
