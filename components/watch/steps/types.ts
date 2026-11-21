import type { WatchConfig } from "@/lib/watch";
import type { CreatorAction, StepId } from "../creator-state";

/** Lo que recibe cada paso del creador. */
export interface StepProps {
  config: WatchConfig;
  dispatch: (a: CreatorAction) => void;
  goTo: (s: StepId) => void;
}

/** "Pendiente / agotado / bloqueado" → los estados que pinta OptionGroup. */
export type OptionStateLike = {
  estado: "disponible" | "aviso" | "agotado" | "bloqueado" | "oculto";
  motivo?: string;
};

/** optionState() sin el 'oculto' (las fichas ocultas ya se filtraron). */
export function tileState(s: OptionStateLike): {
  estado: "disponible" | "aviso" | "agotado" | "bloqueado";
  motivo?: string;
} {
  return { estado: s.estado === "oculto" ? "bloqueado" : s.estado, motivo: s.motivo };
}

/** true si al limpiar el texto se perdió algún carácter (no solo por largo). */
export function lostChars(raw: string, cleaned: string, max: number): boolean {
  const tidy = raw.normalize("NFC").replace(/[‘’´`]/g, "'").replace(/\s+/g, " ");
  return [...cleaned].length < Math.min([...tidy].length, max);
}
