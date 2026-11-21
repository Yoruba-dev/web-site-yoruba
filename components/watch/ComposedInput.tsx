"use client";

import { useState, type InputHTMLAttributes } from "react";

// ---------------------------------------------------------------------------
// Campo de texto del creador que NO limpia a mitad de una composición (IME).
//
// Los textos del reloj se limpian en cada pulsación (lib/watch.ts: tidy() pasa
// "´" a "'", la esfera va en mayúsculas…). Con el teclado español del Mac, la
// tilde es una tecla muerta: mientras se compone "Í" el campo contiene "´"; si
// en ese instante se limpia y React reescribe el valor, la composición se rompe
// y "MARÍA" sale "MAR'IA". Aquí, mientras dura la composición el campo muestra
// lo que el cliente está tecleando tal cual, y el texto se entrega a onValue
// (que limpia y guarda) solo al terminar (compositionend). Fuera de una
// composición se entrega en cada cambio, como un campo normal.
// ---------------------------------------------------------------------------

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue"> & {
  /** El valor ya limpio (el del reloj). */
  value: string;
  /** Recibe el texto CRUDO; quien llama lo limpia y lo guarda. */
  onValue: (raw: string) => void;
};

export default function ComposedInput({ value, onValue, onCompositionStart, onCompositionEnd, ...rest }: Props) {
  /** El texto en composición (null = no se está componiendo). */
  const [composing, setComposing] = useState<string | null>(null);

  return (
    <input
      {...rest}
      value={composing ?? value}
      onCompositionStart={(e) => {
        setComposing(e.currentTarget.value);
        onCompositionStart?.(e);
      }}
      onCompositionEnd={(e) => {
        const raw = e.currentTarget.value;
        setComposing(null);
        onValue(raw);
        onCompositionEnd?.(e);
      }}
      onChange={(e) => {
        const native = e.nativeEvent as Event & { isComposing?: boolean };
        if (composing !== null || native.isComposing) {
          // A mitad de la tilde: se muestra tal cual, sin limpiar ni guardar.
          setComposing(e.target.value);
          return;
        }
        onValue(e.target.value);
      }}
    />
  );
}
