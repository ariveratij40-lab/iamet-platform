import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Copy, ExternalLink, TrendingUp, Users, Target, DollarSign, Zap } from "lucide-react";

const SOURCES = ["google", "linkedin", "facebook", "email", "referral", "organic", "twitter"];
const MEDIUMS = ["cpc", "social", "email", "organic", "referral", "display", "video"];

export default function AdminCampaigns() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    source: "google",
    medium: "cpc",
    campaign: "",
    term: "",
    content: "",
    baseUrl: "https://iamet.mx",
  });

  const { data: campaigns, refetch } = trpc.campaigns.list.useQuery();
  const { data: templates } = trpc.campaigns.getTemplates.useQuery();

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: (data) => {
      toast.success("Campaña creada");
      refetch();
      setShowForm(false);
      setForm({ name: "", source: "google", medium: "cpc", campaign: "", term: "", content: "", baseUrl: "https://iamet.mx" });
    },
    onError: (err) => toast.error(err.message),
  });

  const applyTemplate = (tpl: typeof templates extends (infer T)[] | undefined ? T : never) => {
    if (!tpl) return;
    setForm(prev => ({
      ...prev,
      name: (tpl as any).name,
      source: (tpl as any).source,
      medium: (tpl as any).medium,
      campaign: (tpl as any).campaign,
      term: (tpl as any).term ?? "",
      content: (tpl as any).content ?? "",
    }));
    setShowForm(true);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada al portapapeles");
  };

  const totalLeads = (campaigns ?? []).reduce((s, c) => s + c.leads, 0);
  const totalConversions = (campaigns ?? []).reduce((s, c) => s + c.conversions, 0);
  const totalRevenue = (campaigns ?? []).reduce((s, c) => s + c.revenue, 0);
  const totalClicks = (campaigns ?? []).reduce((s, c) => s + c.clicks, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campañas UTM</h1>
          <p className="text-muted-foreground mt-1">Genera URLs de seguimiento y mide el ROI por canal</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Campaña
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Clicks Totales", value: totalClicks, icon: TrendingUp, color: "text-blue-500" },
          { label: "Leads Generados", value: totalLeads, icon: Users, color: "text-green-500" },
          { label: "Conversiones", value: totalConversions, icon: Target, color: "text-orange-500" },
          { label: "Revenue Total", value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-purple-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
              <div>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates */}
      {!showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> Plantillas Predefinidas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(templates ?? []).map((tpl, i) => (
              <Button key={i} variant="outline" size="sm" onClick={() => applyTemplate(tpl)}>
                {tpl.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva Campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nombre de la campaña</label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Google Ads — CCTV Empresas" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">URL de destino</label>
                <Input value={form.baseUrl} onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))} placeholder="https://iamet.mx" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Fuente (utm_source)</label>
                <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Medio (utm_medium)</label>
                <Select value={form.medium} onValueChange={v => setForm(p => ({ ...p, medium: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MEDIUMS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Campaña (utm_campaign)</label>
                <Input value={form.campaign} onChange={e => setForm(p => ({ ...p, campaign: e.target.value }))} placeholder="cctv-empresas-2026" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Término (utm_term) — opcional</label>
                <Input value={form.term} onChange={e => setForm(p => ({ ...p, term: e.target.value }))} placeholder="camaras seguridad empresas" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Contenido (utm_content) — opcional</label>
                <Input value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="ad-v1, carousel, banner-top" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.campaign || createMutation.isPending}>
                Crear Campaña
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{(campaigns ?? []).length} Campañas</CardTitle>
        </CardHeader>
        <CardContent>
          {(campaigns ?? []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No hay campañas aún. Crea la primera usando una plantilla.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(campaigns ?? []).map((c) => (
                <div key={c.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{c.source}</Badge>
                        <Badge variant="outline">{c.medium}</Badge>
                        <span className="text-xs text-muted-foreground">{c.campaign}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyUrl(c.fullUrl)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={c.fullUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      { label: "Clicks", value: c.clicks },
                      { label: "Leads", value: c.leads },
                      { label: "Conversiones", value: c.conversions },
                      { label: "Revenue", value: `$${(c.revenue / 1000).toFixed(0)}K` },
                    ].map(m => (
                      <div key={m.label} className="bg-muted/30 rounded p-2">
                        <div className="text-lg font-bold">{m.value}</div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground truncate font-mono bg-muted/30 rounded px-2 py-1">
                    {c.fullUrl}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
