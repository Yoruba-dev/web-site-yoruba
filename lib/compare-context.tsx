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

// A lightweight snapshot of a product, enough to render the comparison table
// without re-fetching. Persisted to localStorage so the list survives reloads.
export interface CompareItem {
  id: string;
  handle: string;
  title: string;
  image: string;
  price: number;
  currencyCode: string;
  rating: number;
  category: string;
  available: boolean;
  description: string;
}

interface CompareContextValue {
  items: CompareItem[];
  count: number;
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** true once the max number of compared items is reached */
  full: boolean;
  max: number;
}

const MAX = 4;
const CompareContext = createContext<CompareContextValue | null>(null);
const STORAGE_KEY = "pyj_compare";

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
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
      if (prev.length >= MAX) return prev; // capped — ignore further adds
      const snap: CompareItem = {
        id: product.id,
        handle: product.handle,
        title: product.title,
        image: product.images[0]?.url ?? "",
        price: Number(product.price.amount),
        currencyCode: product.price.currencyCode,
        rating: product.rating ?? 0,
        category: product.tags[0] ?? "—",
        available: product.availableForSale,
        description: product.description ?? "",
      };
      return [...prev, snap];
    });
  }, []);

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      count: items.length,
      has: (id: string) => items.some((i) => i.id === id),
      toggle,
      remove,
      clear,
      full: items.length >= MAX,
      max: MAX,
    }),
    [items, toggle, remove, clear],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
