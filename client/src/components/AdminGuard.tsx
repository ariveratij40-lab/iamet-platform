/**
 * AdminGuard — protege rutas /admin con auth local
 * Redirige a /admin/login si no hay sesión activa
 */
import { useEffect } from "react";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { Loader2, Shield } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
  /** Roles permitidos. Default: admin y manager */
  allowedRoles?: string[];
}

export function AdminGuard({
  children,
  allowedRoles = ["admin", "manager"],
}: AdminGuardProps) {
  const { user, loading, isAuthenticated } = useLocalAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/admin/login?returnTo=${returnTo}`;
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      window.location.href = "/admin/login?error=forbidden";
    }
  }, [loading, isAuthenticated, user, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #0066cc, #00d4ff)",
              boxShadow: "0 4px 20px rgba(0,212,255,0.3)",
            }}
          >
            <Shield className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null; // El useEffect redirige
  }

  return <>{children}</>;
}
