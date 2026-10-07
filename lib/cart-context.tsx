"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import type { Product } from "./types";
import { isShopifyCartGone, registerAbandonedCart } from "./shopify-cart";

export interface CartLine {
  /** local unique id for this cart line (may be synthetic for custom pieces) */
  id: string;
  /** real Shopify ProductVariant GID sent at checkout; falls back to `id`. */
  merchandiseId?: string;
  productHandle: string;
  title: string;
  image: string;
  price: number;
  currencyCode: string;
  quantity: number;
  /** Personalised engraving attached from the 3D customizer (sent to the workshop). */
  customization?: {
    text: string;
    font: string;
    metal?: string;
    shape?: string;
    /** base64 PNG preview of the 3D piece */
    preview?: string;
  };
  /** Custom line-item properties (e.g. the made-to-order Orisha colour). Sent to
   *  the workshop as Shopify line-item attributes so they show in the order. */
  properties?: { key: string; value: string }[];
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  currencyCode: string;
  addItem: (product: Product, quantity?: number) => void;
  /** Add a pre-built line (used to move a saved wishlist item into the cart). */
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clear: () => void;
  /** Note the Shopify cart a checkout was started with and which lines went
   *  into it, so those lines leave the local cart once that order is placed. */
  rememberCheckout: (cartId: string, lines: CartLine[]) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  /** Shopper email captured from the newsletter form — used to hand the cart to
   *  Shopify for abandoned-cart recovery. */
  email: string;
  setEmail: (email: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "hiraola_cart";
const EMAIL_KEY = "pyj_email";
const CHECKOUT_KEY = "pyj_checkout";
// Shopify borra el carrito al crearse el pedido, pero los abandonados también
// caducan solos (hasta 30 días). Dentro de esta ventana, que haya desaparecido
// solo puede ser porque se pagó; pasada, ya no se sabe y el carrito no se toca.
const CHECKOUT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** The checkout this browser last left for: which Shopify cart, when, and how
 *  many of each local line went into it. */
interface PendingCheckout {
  cartId: string;
  at: number;
  lines: { id: string; quantity: number }[];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmailState] = useState("");
  const pathname = usePathname();

  // Navigating away (e.g. tapping a tab) must close the minicart — otherwise it
  // stays open over the new page.
  useEffect(() => {
    setCartOpen(false);
  }, [pathname]);

  // Load persisted cart + email after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
      const savedEmail = localStorage.getItem(EMAIL_KEY);
      if (savedEmail) setEmailState(savedEmail);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setEmail = useCallback((value: string) => {
    const v = value.trim();
    setEmailState(v);
    try {
      localStorage.setItem(EMAIL_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  // Abandoned-cart recovery: once we have the shopper's email AND items, hand the
  // cart to Shopify (with the email) so its recovery emails can fire even if the
  // shopper never reaches checkout. Debounced so we register the SETTLED cart once.
  useEffect(() => {
    if (!hydrated || !email || lines.length === 0) return;
    const t = setTimeout(() => {
      void registerAbandonedCart(lines, email);
    }, 12000);
    return () => clearTimeout(t);
  }, [lines, email, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  // Después de pagar en Shopify la clienta volvía a la web con el carrito igual
  // (vive en este navegador; Shopify no lo ve) y podía pagar lo mismo otra vez.
  // Al volver se pregunta por el carrito con el que se fue a pagar: si ya no
  // existe, el pedido se hizo y esas piezas salen del carrito — solo esas, por
  // si añadió algo después.
  const checking = useRef(false);
  const settleCheckout = useCallback(async () => {
    if (checking.current) return;
    let pending: PendingCheckout | null = null;
    try {
      const raw = localStorage.getItem(CHECKOUT_KEY);
      pending = raw ? (JSON.parse(raw) as PendingCheckout) : null;
    } catch {
      return;
    }
    if (!pending?.cartId) return;
    const forget = () => {
      try {
        localStorage.removeItem(CHECKOUT_KEY);
      } catch {
        /* ignore */
      }
    };
    if (Date.now() - pending.at > CHECKOUT_WINDOW_MS) return forget();

    checking.current = true;
    const gone = await isShopifyCartGone(pending.cartId);
    checking.current = false;
    if (gone !== true) return; // sigue abierto, o no se pudo saber: se mira la próxima vez

    forget();
    const bought = new Map(pending.lines.map((l) => [l.id, l.quantity]));
    setLines((prev) =>
      prev
        .map((l) => ({ ...l, quantity: l.quantity - (bought.get(l.id) ?? 0) }))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  // Al cargar, al volver a la pestaña y al regresar con «Atrás» desde Shopify
  // (el navegador restaura la página tal cual, sin volver a montarla).
  useEffect(() => {
    if (!hydrated) return;
    void settleCheckout();
    const onVisible = () => {
      if (document.visibilityState === "visible") void settleCheckout();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void settleCheckout();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [hydrated, settleCheckout]);

  const rememberCheckout = useCallback((cartId: string, checkoutLines: CartLine[]) => {
    const quantities = new Map<string, number>();
    for (const l of checkoutLines) {
      quantities.set(l.id, (quantities.get(l.id) ?? 0) + l.quantity);
    }
    const pending: PendingCheckout = {
      cartId: cartId.split("?")[0], // sin la clave: para saber si existe no hace falta
      at: Date.now(),
      lines: [...quantities].map(([id, quantity]) => ({ id, quantity })),
    };
    try {
      localStorage.setItem(CHECKOUT_KEY, JSON.stringify(pending));
    } catch {
      /* ignore */
    }
  }, []);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const variant = product.variants[0];
    const id = variant?.id ?? product.id;
    setLines((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) {
        return prev.map((l) =>
          l.id === id ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [
        ...prev,
        {
          id,
          productHandle: product.handle,
          title: product.title,
          image: product.images[0]?.url ?? "",
          price: Number(product.price.amount),
          currencyCode: product.price.currencyCode,
          quantity,
        },
      ];
    });
    setCartOpen(true);
  }, []);

  const addLine = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.id === line.id);
        if (existing) {
          return prev.map((l) =>
            l.id === line.id ? { ...l, quantity: l.quantity + quantity } : l,
          );
        }
        return [...prev, { ...line, quantity }];
      });
      setCartOpen(true);
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const updateQty = useCallback((id: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, quantity: Math.max(0, quantity) } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      currencyCode: lines[0]?.currencyCode ?? "USD",
      addItem,
      addLine,
      removeItem,
      updateQty,
      clear,
      rememberCheckout,
      cartOpen,
      setCartOpen,
      email,
      setEmail,
    };
  }, [lines, cartOpen, addItem, addLine, removeItem, updateQty, clear, rememberCheckout, email, setEmail]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
