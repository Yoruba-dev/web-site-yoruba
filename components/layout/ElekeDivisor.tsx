import { ELEKE } from "./ElekeBar";

// Divisor entre dos secciones: un hilo de oro que se abre en el centro en un
// eleke de siete cuentas, con los mismos colores de la barra de arriba
// (ElekeBar), que es el sello de la marca. Es decoración: los lectores de
// pantalla no lo anuncian.
export default function ElekeDivisor() {
  return (
    <div className="pyj-divisor" aria-hidden="true">
      <span className="pyj-divisor_hilo" />
      <span className="pyj-divisor_rombo" />
      <span className="pyj-divisor_cuentas">
        {ELEKE.map((c) => (
          <span key={c} className="pyj-divisor_cuenta" style={{ backgroundColor: c }} />
        ))}
      </span>
      <span className="pyj-divisor_rombo" />
      <span className="pyj-divisor_hilo pyj-divisor_hilo--der" />
    </div>
  );
}
