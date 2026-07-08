"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Lightweight demo "account" persisted to localStorage. This is NOT real auth — when
// you wire Shopify Customer Accounts (or Supabase), replace the body of register/login
// with the real call and keep the same API so the gated features keep working.
export interface Account {
  name: string;
  email: string;
}

interface AccountContextValue {
  account: Account | null;
  isLoggedIn: boolean;
  /** false until localStorage has been read (avoids gating flicker) */
  hydrated: boolean;
  register: (name: string, email: string) => void;
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);
const KEY = "pyj_account";

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setAccount(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (account) localStorage.setItem(KEY, JSON.stringify(account));
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, [account, hydrated]);

  const register = useCallback(
    (name: string, email: string) => setAccount({ name: name.trim() || email, email }),
    [],
  );
  const login = useCallback(
    (email: string, name?: string) =>
      setAccount({ name: name?.trim() || email.split("@")[0], email }),
    [],
  );
  const logout = useCallback(() => setAccount(null), []);

  const value = useMemo<AccountContextValue>(
    () => ({
      account,
      isLoggedIn: !!account,
      hydrated,
      register,
      login,
      logout,
    }),
    [account, hydrated, register, login, logout],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
