import { useState, useEffect } from "react";

const STORE_SESSION_KEY = "iamet_store_session";

export interface StoreVisitor {
  name: string;
  email: string;
  sessionToken: string;
}

export function useStoreAuth() {
  const [visitor, setVisitor] = useState<StoreVisitor | null>(() => {
    try {
      const raw = localStorage.getItem(STORE_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoreVisitor;
      // Validate token is not expired (7 days)
      const payload = JSON.parse(atob(parsed.sessionToken));
      if (Date.now() - payload.ts > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORE_SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const login = (v: StoreVisitor) => {
    localStorage.setItem(STORE_SESSION_KEY, JSON.stringify(v));
    setVisitor(v);
  };

  const logout = () => {
    localStorage.removeItem(STORE_SESSION_KEY);
    setVisitor(null);
  };

  return { visitor, isAuthenticated: !!visitor, login, logout };
}
