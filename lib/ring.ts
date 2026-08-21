import type { CoinFace } from "./coin";

// ---------------------------------------------------------------------------
// El frente del anillo de Ifá, medido sobre el render real de la pieza.
//
// Hasta ahora el frente se DIBUJABA con líneas (components/configurator/
// RingFrame.tsx): un medallón inventado con cruz, sol, luna y calavera. Servía
// mientras no hubiera render, pero el cliente no veía su anillo, veía una
// ilustración. La moneda ya se había pasado a foto real hace tiempo — ver
// lib/coin.ts y CoinFrame.tsx — y el anillo se quedó atrás.
//
// Ahora se monta sobre el medallón de verdad: cara coronada arriba, cuatro
// caras en los puntos cardinales, ocho figuras de santeros entre ellas y el
// borde granulado. El campo central va VACÍO a propósito: es donde el cliente
// coloca su Odù. Si viniera con un signo grabado, el del cliente se dibujaría
// encima de otro distinto y no tendría sentido.
//
// De dónde salen los números (design-assets/anillo-originales/COMO-SE-HIZO.txt):
//   · El render se sacó del .glb del taller, de frente y sin perspectiva, a
//     2800x2800. La pieza mide ahí 2632 px de diámetro, centrada en (1400,1400).
//   · El campo interior liso llega hasta un radio de 735 px.
//   · 735 / 1316 = 0,5585 del radio de la pieza. Ese es `field`, y el lienzo lo
//     usa para que un símbolo soltado en el editor caiga donde el grabador
//     puede cortar de verdad.
// ---------------------------------------------------------------------------

export const RING_FRONT_FACE: CoinFace = {
  id: "frente",
  label: "Frente · tu signo",
  short: "Frente",
  image: "/assets/images/configurador/anillo-frente.webp",
  alt: "Frente del anillo de Ifá: medallón con la cara coronada, cuatro caras y ocho figuras de santeros alrededor de un campo liso",
  field: 0.5585,
  hint: "El borde ya viene fundido con las caras y las figuras. Este es el campo que se graba: coloca aquí tu signo.",
};

/** Medidas reales del sello, las mismas que la moneda del taller. */
export const RING_SPECS = {
  diameterMm: 36.5,
  metal: "Oro",
} as const;
