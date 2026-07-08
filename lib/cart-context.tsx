"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { Product } from "./types";

export interface CartLine {
  /** variant id — unique per cart line */
  id: string;
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
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "hiraola_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

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
      cartOpen,
      setCartOpen,
    };
  }, [lines, cartOpen, addItem, addLine, removeItem, updateQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
