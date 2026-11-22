"use client";

// ---------------------------------------------------------------------------
// Puente hacia el escenario 3D (components/watch/WatchStage3D.tsx, del
// constructor A). El editor SOLO habla el contrato congelado
// (stage3d-contract.ts): el componente, `use3DSupport()` y `preload3D()`. Un
// único punto de entrada: si el escenario cambia de sitio, cambia aquí.
// three, fiber y drei viven en el trozo diferido que WatchStage3D importa con
// next/dynamic; nada de eso entra por este módulo.
// ---------------------------------------------------------------------------
import type { ComponentType } from "react";
import Escenario, { preload3D, use3DSupport } from "../WatchStage3D";
import type { WatchStage3DProps } from "../stage3d-contract";

/** El visor 3D (llena su caja: position:absolute; inset:0). */
export const WatchStage3D: ComponentType<WatchStage3DProps> = Escenario;

export { preload3D, use3DSupport };

/** El escenario del árbol habla el contrato v2 (ya integrado). */
export const STAGE3D_V2 = true;
