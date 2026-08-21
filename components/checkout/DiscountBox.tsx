"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/utils";
import {
  leerCodigoGuardado,
  guardarCodigo,
  olvidarCodigo,
  validarCodigo,
  type DescuentoAplicado,
} from "@/lib/discount";

/**
 * Casilla de código de descuento del carrito.
 *
 * Valida contra Shopify de verdad antes de decir que sirve — nunca damos por
 * bueno un código sin preguntar, porque las reglas (mínimo de compra, piezas
 * incluidas, fechas, usos restantes) las decide Shopify.
 *
 * Si la clienta llegó por un enlace de campaña (?codigo=OGUN10), el código ya
 * está guardado y aquí se aplica solo al abrir el carrito: no tiene que
 * escribir nada.
 */
export default function DiscountBox({
  onChange,
}: {
  /** Avisa al resumen del pedido para que pinte la línea de ahorro. */
  onChange: (d: DescuentoAplicado | null) => void;
}) {
  const { lines } = useCart();
  const [texto, setTexto] = useState("");
  const [aplicado, setAplicado] = useState<DescuentoAplicado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const aplicar = async (code: string, silencioso = false) => {
    setCargando(true);
    if (!silencioso) setError(null);
    const r = await validarCodigo(code, lines);
    setCargando(false);
    if (r.ok && r.descuento) {
      setAplicado(r.descuento);
      onChange(r.descuento);
      guardarCodigo(r.descuento.code);
      setError(null);
      setAbierto(true);
    } else {
      setAplicado(null);
      onChange(null);
      // NO se borra el código guardado. Shopify devuelve `applicable: false`
      // tanto para un código inexistente como para uno bueno que todavía no
      // llega al mínimo de compra, así que no hay forma de distinguirlos. Y un
      // 429 o un corte de red darían el mismo resultado. Borrarlo aquí hacía
      // que un código válido desapareciera para siempre por un fallo de un
      // segundo. Se queda guardado y se reintenta; lo quita la clienta si
      // quiere (el botón "quitar" sí llama a olvidarCodigo).
      if (!silencioso) setError(r.error ?? "Ese código no funciona.");
    }
  };

  // Firma real del carrito: qué piezas y en qué cantidad. El ahorro que
  // enseñamos es un IMPORTE FIJO calculado para un carrito concreto, así que en
  // cuanto ese carrito cambia hay que volver a preguntarle a Shopify.
  //
  // Antes esto solo miraba `lines.length` y además se bloqueaba tras el primer
  // intento, así que si la clienta quitaba una pieza desde el minicarrito
  // estando ya en el checkout, se le seguía enseñando el descuento viejo y un
  // total que Shopify no iba a cobrar. Se veía el importe bueno en la pantalla
  // siguiente, pero el susto ya estaba dado.
  const firmaCarrito = lines.map((l) => `${l.id}x${l.quantity}`).join("|");

  useEffect(() => {
    if (lines.length === 0) return;
    // El que ya está puesto manda; si no hay, el que dejó el enlace de campaña.
    const code = aplicado?.code ?? leerCodigoGuardado();
    if (!code) return;
    void aplicar(code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaCarrito]);

  const quitar = () => {
    olvidarCodigo();
    setAplicado(null);
    setTexto("");
    setError(null);
    onChange(null);
  };

  if (aplicado) {
    return (
      <div className="pyj-cupon pyj-cupon--ok">
        <div>
          <span className="pyj-cupon_code">{aplicado.code}</span>
          <span className="pyj-cupon_ahorro">
            aplicado — ahorras{" "}
            {formatMoney({
              amount: String(aplicado.ahorro),
              currencyCode: aplicado.currencyCode,
            })}
          </span>
        </div>
        <button type="button" className="pyj-cupon_quitar" onClick={quitar}>
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div className="pyj-cupon">
      {!abierto ? (
        <button
          type="button"
          className="pyj-cupon_abrir"
          onClick={() => setAbierto(true)}
        >
          ¿Tienes un código de descuento?
        </button>
      ) : (
        <form
          className="pyj-cupon_form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!cargando) void aplicar(texto);
          }}
        >
          <label className="pyj-cupon_label" htmlFor="pyj-cupon-input">
            Código de descuento
          </label>
          <div className="pyj-cupon_fila">
            <input
              id="pyj-cupon-input"
              className="pyj-cupon_input"
              value={texto}
              onChange={(e) => setTexto(e.target.value.toUpperCase())}
              placeholder="Escríbelo aquí"
              autoComplete="off"
              spellCheck={false}
              disabled={cargando}
            />
            <button
              type="submit"
              className="pyj-cupon_btn"
              disabled={cargando || !texto.trim()}
            >
              {cargando ? "Comprobando…" : "Aplicar"}
            </button>
          </div>
          {error && (
            <p className="pyj-cupon_error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
