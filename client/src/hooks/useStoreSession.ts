import { useState, useEffect, useCallback } from "react";

const STORE_TOKEN_KEY = "iamet_store_token";
const STORE_USER_KEY = "iamet_store_user";

export interface StoreSessionUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}

export function saveStoreSession(token: string, user: StoreSessionUser) {
  localStorage.setItem(STORE_TOKEN_KEY, token);
  localStorage.setItem(STORE_USER_KEY, JSON.stringify(user));
  // Dispatch event so other components can react
  window.dispatchEvent(new Event("store-session-change"));
}

export function clearStoreSession() {
  localStorage.removeItem(STORE_TOKEN_KEY);
  localStorage.removeItem(STORE_USER_KEY);
  window.dispatchEvent(new Event("store-session-change"));
}

export function getStoreToken(): string | null {
  return localStorage.getItem(STORE_TOKEN_KEY);
}

export function useStoreSession() {
  const [user, setUser] = useState<StoreSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const token = localStorage.getItem(STORE_TOKEN_KEY);
    const raw = localStorage.getItem(STORE_USER_KEY);
    if (token && raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("store-session-change", refresh);
    return () => window.removeEventListener("store-session-change", refresh);
  }, [refresh]);

  const logout = useCallback(() => {
    clearStoreSession();
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    logout,
  };
}
