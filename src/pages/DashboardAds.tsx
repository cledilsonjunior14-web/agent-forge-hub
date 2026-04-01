import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilters } from '@/contexts/FilterContext';
import { useMetaContext } from '@/hooks/useMetaContext';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Eye, MousePointer, Target, TrendingUp, BarChart3, AlertTriangle, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { insights_custom } from '@/services/metaApi';

export default function DashboardPage() {
  const { dateRange } = useFilters();
  const { token, accountId, hasMetaSetup, isLoading: isMetaLoading } = useMetaContext();

  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];

  const timeRangeJSON = JSON.stringify({ since: fromStr, until: toStr });

  // Métricas agregadas reais da Meta API
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['meta-dashboard-metrics', accountId, fromStr, toStr],
    enabled: hasMetaSetup,
    queryFn: async () => {
      // Pedimos clicks, impressões, gasto, e todas as conversões padrão
      const res = await insights_custom(token, accountId, { 
        level: 'account', 
        fields: 'impressions,clicks,spend,cpm,cpc,ctr,actions,purchase_roas', 
        time_range: timeRangeJSON 
      });
      const data = (res as any).data || res;
      if (!data || data.length === 0) return null;
      
      const m = data[0]; // row único pois é agregação da conta inteira
      
      // Meta retorna ações em um Array. Tentamos achar uma conversão ou click link
      const resultsVal = m.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'link_click')?.value || m.clicks || 0;
      const roasVal = m.purchase_roas?.[0]?.value || 0;

      return {
        spend: Number(m.spend || 0),
        impressions: Number(m.impressions || 0),
        clicks: Number(m.clicks || 0),
        results: Number(resultsVal),
        roas: Number(roasVal),
        cpc: Number(m.cpc || 0),
        cpm: Number(m.cpm || 0),
        ctr: Number(m.ctr || 0)
      };
    },
  });

  // Gráfico de investimento diário da Meta API
  const { data: chartData } = useQuery({
    queryKey: ['meta-spend-chart', accountId, fromStr, toStr],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { 
        level: 'account', 
        time_increment: 1, 
        time_range: timeRangeJSON 
      });
      const data = (res as any).data || res;
      if (!data) return [];
      
      return data.map((d: any) => ({
        date: d.date_start,
        spend: Number(d.spend || 0)
      }));
    },
  });

  // Top campanhas (Ordenadas pelo Facebook, geralmente por gasto/performance nativa se não mexermos)
  const { data: topCampaigns } = useQuery({
    queryKey: ['meta-top-campaigns', accountId, fromStr, toStr],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { 
        level: 'campaign', 
        fields: 'campaign_id,campaign_name,objective,spend', 
        time_range: timeRangeJSON 
      });
      const data = (res as any).data || res;
      if (!data) return [];
      
      // Ordenando por Spend
      const sorted = data.sort((a: any, b: any) => Number(b.spend || 0) - Number(a.spend || 0));

      return sorted.slice(0, 5).map((d: any) => ({
        id: d.campaign_id,
        name: d.campaign_name,
        objective: d.objective || '—',
        status: 'live', // insights não trazem effective_status por padrão a menos que configurado, mockamos 'live' para as top atuantes.
        spend: Number(d.spend || 0)
      }));
    },
  });

  // Alertas dinâmicos (por hora mockados do BD para mostrar UI, futuramente Meta)
  const { data: alerts } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const cards = [
    { label: 'Investimento Meta', value: formatCurrency(metrics?.spend || 0), icon: DollarSign },
    { label: 'Impressões Livres', value: formatNumber(metrics?.impressions || 0), icon: Eye },
    { label: 'Cliques (All)', value: formatNumber(metrics?.clicks || 0), icon: MousePointer },
    { label: 'CTR Real', value: formatPercent(metrics?.ctr || 0), icon: Target },
    { label: 'CPC', value: formatCurrency(metrics?.cpc || 0), icon: BarChart3 },
    { label: 'CPM', value: formatCurrency(metrics?.cpm || 0), icon: BarChart3 },
    { label: 'Resultados (Clicks/Purch)', value: formatNumber(metrics?.results || 0), icon: TrendingUp },
    { label: 'ROAS Global', value: (metrics?.roas || 0).toFixed(2) + 'x', icon: TrendingUp },
  ];

  const severityColor: Record<string, string> = {
    critical: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning/20 text-warning',
    positive: 'bg-success/20 text-success',
  };

  if (isMetaLoading) {
    return <div className="p-12 text-center text-muted-foreground">Carregando permissões do Meta...</div>;
  }

  if (!hasMetaSetup) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-secondary p-6 mb-4">
          <SettingsIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-foreground">Configuração Incompleta</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Para ver os insights ao vivo do Facebook, precisamos que você vincule seu Access Token e selecione a conta principal nas configurações.
        </p>
        <Link to="/settings">
          <Button>Configurar Agora</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
         <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-success"></span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Live Meta Data</span>
         </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <c.icon className="h-4 w-4" />
                <span className="text-[11px] uppercase tracking-wider font-semibold">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {isMetricsLoading ? '...' : c.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card border-border lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Investimento por dia (Graph API)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                       dataKey="date" 
                       tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                       tickFormatter={(str) => {
                          const [y, m, d] = str.split('-');
                          return `${d}/${m}`;
                       }}
                       axisLine={false}
                       tickLine={false}
                    />
                    <YAxis 
                       tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                       axisLine={false}
                       tickLine={false}
                       tickFormatter={(val) => `R$${val}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="spend" stroke="hsl(var(--primary))" fill="url(#spendGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nenhum dado trafegado no período
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {alerts && alerts.length > 0 ? alerts.map((a: any) => (
              <div key={a.id} className="flex flex-col gap-1 rounded-lg bg-secondary/50 border border-border p-3">
                <div className="flex justify-between items-start">
                  <Badge className={severityColor[a.severity] || 'bg-secondary'} variant="secondary">
                    {a.severity}
                  </Badge>
                </div>
                <span className="text-xs text-foreground mt-1 leading-relaxed">{a.message}</span>
              </div>
            )) : (
              <div className="py-10 text-center flex flex-col items-center">
                 <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                 </div>
                 <p className="text-sm text-muted-foreground font-medium">Tudo tranquilo!</p>
                 <p className="text-xs text-muted-foreground">Nenhum alerta crítico encontrado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top campanhas */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Campanhas Mais Investidas (Via Graph API)</CardTitle>
        </CardHeader>
        <CardContent>
          {topCampaigns && topCampaigns.length > 0 ? (
            <div className="space-y-2">
              {topCampaigns.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-secondary/30 border border-transparent hover:border-border p-3 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Gasto: {formatCurrency(c.spend)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">{c.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada trafegando grana no período.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

