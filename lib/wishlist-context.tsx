"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "./types";

// A saved product. Stores just enough to render the wishlist and move an item to
// the cart without re-fetching. Persisted to localStorage.
export interface WishlistItem {
  id: string; // product id — the toggle/has key
  variantId: string; // used when moving to the cart
  handle: string;
  title: string;
  image: string;
  price: number;
  currencyCode: string;
  available: boolean;
  /** Shopify tags — lets the commerce policy decide made-to-order vs buyable. */
  tags?: string[];
}

interface WishlistContextValue {
  items: WishlistItem[];
  count: number;
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "pyj_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const toggle = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === product.id)) {
        return prev.filter((i) => i.id !== product.id);
      }
      return [
        ...prev,
        {
          id: product.id,
          variantId: product.variants[0]?.id ?? product.id,
          handle: product.handle,
          title: product.title,
          image: product.images[0]?.url ?? "",
          price: Number(product.price.amount),
          currencyCode: product.price.currencyCode,
          available: product.availableForSale,
          tags: product.tags,
        },
      ];
    });
  }, []);

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      has: (id: string) => items.some((i) => i.id === id),
      toggle,
      remove,
      clear,
    }),
    [items, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
