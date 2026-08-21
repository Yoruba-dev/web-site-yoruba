"use client";

import type { CartLine } from "./cart-context";

// ---------------------------------------------------------------------------
// Códigos de descuento en la web.
//
// Hasta ahora los códigos SOLO se podían escribir en el checkout de Shopify, en
// la última pantalla. El cliente recorría toda la tienda viendo el precio
// entero y descubría su descuento al final — o no llegaba. Aquí se adelanta:
// escribe el código en el carrito, lo validamos contra Shopify y ve lo que se
// ahorra ANTES de pagar.
//
// Cómo se valida sin tener carrito en Shopify: el carrito de esta web vive en
// el navegador (ver lib/cart-context.tsx) y el de Shopify solo se crea al ir a
// pagar. Así que para comprobar un código creamos un carrito de prueba con las
// mismas líneas y el código puesto, y leemos lo que Shopify responde. Es la
// única fuente de verdad: las reglas de un descuento (mínimo de compra, qué
// colecciones, fechas, límite de usos) las decide Shopify, no nosotros. Si el
// código no aplica, Shopify lo dice y nosotros lo repetimos tal cual.
//
// Esos carritos de prueba no ensucian nada: un carrito SIN correo no cuenta
// como checkout abandonado (ver registerAbandonedCart en lib/shopify-cart.ts,
// que sí manda el correo a propósito).
// ---------------------------------------------------------------------------

const API_VERSION = "2024-10";
const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const CLAVE = "pyj_codigo_descuento";

/** Los nombres de parámetro que aceptamos en un enlace de campaña. Varios
 *  porque el dueño manda enlaces por WhatsApp e Instagram y no siempre usa el
 *  mismo: ?codigo=, ?descuento= y ?discount= hacen lo mismo. */
const PARAMS = ["codigo", "descuento", "discount", "code"];

export interface DescuentoAplicado {
  code: string;
  /** Cuánto se ahorra, en la moneda de la tienda. */
  ahorro: number;
  currencyCode: string;
}

export interface ResultadoValidacion {
  ok: boolean;
  descuento?: DescuentoAplicado;
  /** Mensaje para la clienta cuando no aplica. */
  error?: string;
}

// --- Memoria del código entre páginas ------------------------------------

export function leerCodigoGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function guardarCodigo(code: string): void {
  try {
    localStorage.setItem(CLAVE, code);
  } catch {
    /* modo privado del navegador: seguimos sin guardar */
  }
}

export function olvidarCodigo(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* ignorar */
  }
}

/** Aviso pendiente de enseñar.
 *
 *  Vive en una variable del MÓDULO, no en localStorage ni en sessionStorage.
 *  Es a propósito y costó averiguarlo: el parámetro se borra de la URL nada más
 *  leerlo, y React vuelve a montar el componente justo después. En ese segundo
 *  montaje ya no hay parámetro que leer, así que hace falta un respaldo — pero
 *  los dos almacenamientos del navegador dieron problemas aquí (el de sesión se
 *  pierde al completar la navegación). Una variable del módulo se conserva
 *  mientras la página esté abierta, que es exactamente lo que dura el aviso, y
 *  se va sola al recargar. Sin claves que limpiar y sin reaparecer días después.
 */
let avisoPendiente: string | null = null;

/**
 * Lee el código de la URL de un enlace de campaña y lo guarda.
 * Devuelve el código a enseñar — el de la URL, o el recién capturado que
 * todavía no se ha llegado a enseñar.
 */
export function capturarCodigoDeLaUrl(): string | null {
  try {
    const p = new URLSearchParams(window.location.search);
    for (const nombre of PARAMS) {
      const v = p.get(nombre);
      if (v && v.trim()) {
        const code = v.trim().toUpperCase();
        guardarCodigo(code);
        avisoPendiente = code;
        return code;
      }
    }
    return avisoPendiente;
  } catch {
    return null;
  }
}

/** El aviso ya se enseñó: que no vuelva a salir al cambiar de página. */
export function avisoMostrado(): void {
  avisoPendiente = null;
}

// --- Validación contra Shopify -------------------------------------------

interface RespuestaCarrito {
  cartCreate: {
    cart: {
      discountCodes: { code: string; applicable: boolean }[];
      discountAllocations: { discountedAmount: { amount: string; currencyCode: string } }[];
      cost: {
        subtotalAmount: { amount: string; currencyCode: string };
        totalAmount: { amount: string; currencyCode: string };
      };
    } | null;
    userErrors: { message: string }[];
  };
}

/**
 * Pregunta a Shopify si el código sirve para ESTE carrito.
 *
 * Importante: no basta con que el código exista. Un descuento puede pedir un
 * mínimo de compra o aplicarse solo a ciertas piezas, y entonces Shopify lo
 * devuelve con `applicable: false`. Por eso se comprueba contra las líneas
 * reales y no contra el código a secas.
 */
export async function validarCodigo(
  code: string,
  lines: CartLine[],
): Promise<ResultadoValidacion> {
  const limpio = code.trim().toUpperCase();
  if (!limpio) return { ok: false, error: "Escribe un código." };
  if (!DOMAIN || !TOKEN) {
    return { ok: false, error: "La tienda no está conectada ahora mismo." };
  }
  if (lines.length === 0) {
    return { ok: false, error: "Añade algo al carrito antes de aplicar un código." };
  }

  const cartLines = lines.map((l) => ({
    merchandiseId: l.merchandiseId ?? l.id,
    quantity: l.quantity,
  }));

  const query = /* GraphQL */ `
    mutation Validar($lines: [CartLineInput!]!, $codes: [String!]) {
      cartCreate(input: { lines: $lines, discountCodes: $codes }) {
        cart {
          discountCodes {
            code
            applicable
          }
          discountAllocations {
            discountedAmount {
              amount
              currencyCode
            }
          }
          cost {
            subtotalAmount {
              amount
              currencyCode
            }
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          message
        }
      }
    }
  `;

  try {
    const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables: { lines: cartLines, codes: [limpio] } }),
    });
    if (!res.ok) return { ok: false, error: "No pudimos comprobar el código." };

    const json = (await res.json()) as { data?: RespuestaCarrito };
    const cart = json.data?.cartCreate?.cart;
    if (!cart) return { ok: false, error: "No pudimos comprobar el código." };

    const aplica = cart.discountCodes.some(
      (d) => d.code.toUpperCase() === limpio && d.applicable,
    );
    if (!aplica) {
      return {
        ok: false,
        error: "Ese código no vale para lo que llevas en el carrito.",
      };
    }

    // El ahorro sale de las asignaciones del carrito. Si Shopify no las
    // desglosa (algunos descuentos van por línea), se deduce restando: lo que
    // suman las piezas menos lo que dice el carrito.
    const porAsignacion = cart.discountAllocations.reduce(
      (s, a) => s + Number(a.discountedAmount.amount),
      0,
    );
    const localSubtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const shopifySubtotal = Number(cart.cost.subtotalAmount.amount);
    const porDiferencia = Math.max(0, localSubtotal - shopifySubtotal);
    const ahorro = porAsignacion > 0 ? porAsignacion : porDiferencia;

    return {
      ok: true,
      descuento: {
        code: limpio,
        ahorro,
        currencyCode: cart.cost.subtotalAmount.currencyCode,
      },
    };
  } catch {
    return { ok: false, error: "No pudimos comprobar el código." };
  }
}
