import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Shield, Eye, Settings, Crown, RefreshCw } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const ROLE_CONFIG = {
  admin: {
    label: "Administrador",
    color: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    icon: Crown,
    description: "Acceso total a todos los módulos",
  },
  manager: {
    label: "Gerente",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    icon: Settings,
    description: "CRM, inteligencia y reportes. Sin configuración del sistema.",
  },
  viewer: {
    label: "Observador",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: Eye,
    description: "Solo lectura. Sin acceso a datos sensibles.",
  },
  user: {
    label: "Usuario",
    color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    icon: Users,
    description: "Acceso al portal público y cursos.",
  },
};

const PERMISSIONS_MATRIX = [
  { resource: "CRM / Leads", admin: true, manager: true, viewer: true, user: false },
  { resource: "Inteligencia Comercial", admin: true, manager: true, viewer: true, user: false },
  { resource: "Agente SDR (chat)", admin: true, manager: true, viewer: false, user: true },
  { resource: "Base de Conocimiento", admin: true, manager: true, viewer: false, user: false },
  { resource: "Campañas UTM", admin: true, manager: true, viewer: true, user: false },
  { resource: "Simulador de Lead", admin: true, manager: false, viewer: false, user: false },
  { resource: "QA del Agente", admin: true, manager: false, viewer: false, user: false },
  { resource: "Monitor de Salud", admin: true, manager: true, viewer: false, user: false },
  { resource: "Usuarios y Roles", admin: true, manager: false, viewer: false, user: false },
  { resource: "Briefing Ejecutivo", admin: true, manager: true, viewer: true, user: false },
  { resource: "Exportar PDF", admin: true, manager: true, viewer: true, user: false },
];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const { data: users, refetch } = trpc.adminUsers.list.useQuery();
  const updateRoleMutation = trpc.adminUsers.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Rol actualizado correctamente");
      setUpdatingUserId(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
      setUpdatingUserId(null);
    },
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    if (userId === currentUser?.id) {
      toast.error("No puedes cambiar tu propio rol");
      return;
    }
    setUpdatingUserId(userId);
    updateRoleMutation.mutate({ userId, role: newRole as any });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" /> Usuarios y Roles
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el acceso de los miembros del equipo a los módulos de la plataforma
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const Icon = config.icon;
          const count = (users ?? []).filter((u: any) => u.role === role).length;
          return (
            <Card key={role}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{(users ?? []).length} usuarios registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(users ?? []).map((user: any) => {
              const roleConf = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.user;
              const Icon = roleConf.icon;
              const isCurrentUser = user.id === currentUser?.id;
              const isUpdating = updatingUserId === user.id;

              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{user.name}</span>
                      {isCurrentUser && <Badge variant="outline" className="text-xs">Tú</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleConf.color}`}>
                      {roleConf.label}
                    </span>
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v)}
                      disabled={isCurrentUser || isUpdating}
                    >
                      <SelectTrigger className="w-36 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_CONFIG).map(([role, conf]) => (
                          <SelectItem key={role} value={role} className="text-xs">
                            {conf.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz de Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Módulo</th>
                  {Object.entries(ROLE_CONFIG).map(([role, conf]) => (
                    <th key={role} className="text-center py-2 px-3 font-medium">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${conf.color}`}>{conf.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS_MATRIX.map((row) => (
                  <tr key={row.resource} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-sm">{row.resource}</td>
                    {(["admin", "manager", "viewer", "user"] as const).map((role) => (
                      <td key={role} className="text-center py-2 px-3">
                        {row[role]
                          ? <CheckIcon />
                          : <XIcon />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-950/30">
      <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function XIcon() {
  return (
    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800">
      <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  );
}
