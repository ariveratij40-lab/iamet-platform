/**
 * Hook de autenticación local IAMET
 * Usa /api/auth/* en lugar de Manus OAuth
 * Compatible con VPS standalone
 */
import { useState, useEffect, useCallback, useRef } from "react";

export interface LocalAuthUser {
  id: number;
  email: string;
  name: string | null;
  role: "admin" | "manager" | "viewer" | "user";
  lastLoginAt?: string | null;
}

interface AuthState {
  user: LocalAuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const ADMIN_ROLES = ["admin", "manager"] as const;
const LOCAL_STORAGE_KEY = "iamet_local_user";

// ─── Helpers de fetch ─────────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const body = await res.json();
    if (!res.ok) {
      return { data: null, error: body.error ?? "Error desconocido" };
    }
    return { data: body as T, error: null };
  } catch {
    return { data: null, error: "Error de conexión" };
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useLocalAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });
  const initialized = useRef(false);

  // Cargar sesión al montar
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    checkSession();
  }, []);

  const checkSession = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const { data, error } = await apiFetch<LocalAuthUser>("/api/auth/me");

    if (data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      setState({
        user: data,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setState({
        user: null,
        loading: false,
        error: error,
        isAuthenticated: false,
      });
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      setState((s) => ({ ...s, loading: true, error: null }));

      const { data, error } = await apiFetch<{ ok: boolean; user: LocalAuthUser }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );

      if (data?.user) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.user));
        setState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
        return { ok: true };
      }

      setState((s) => ({ ...s, loading: false, error: error }));
      return { ok: false, error: error ?? "Error al iniciar sesión" };
    },
    []
  );

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  }, []);

  const isAdmin = state.user?.role === "admin";
  const isManager = ADMIN_ROLES.includes(state.user?.role as (typeof ADMIN_ROLES)[number]);

  return {
    ...state,
    login,
    logout,
    refresh: checkSession,
    isAdmin,
    isManager,
  };
}

// ─── Hook para guardar admin ──────────────────────────────────────────────────

export function useCreateAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createAdmin = useCallback(
    async (email: string, password: string, name: string) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const { data, error } = await apiFetch<{ ok: boolean }>(
        "/api/auth/create-admin",
        {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        }
      );

      setLoading(false);
      if (data?.ok) {
        setSuccess(true);
        return { ok: true };
      }
      setError(error ?? "Error al crear el administrador");
      return { ok: false, error };
    },
    []
  );

  return { createAdmin, loading, error, success };
}
