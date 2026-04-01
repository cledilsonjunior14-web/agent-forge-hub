import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilters } from '@/contexts/FilterContext';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Eye, MousePointer, Target, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { selectedClientId, dateRange } = useFilters();
  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];

  // Métricas agregadas
  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics', selectedClientId, fromStr, toStr],
    queryFn: async () => {
      let query = supabase
        .from('metrics')
        .select('*')
        .eq('entity_type', 'campaign')
        .gte('date', fromStr)
        .lte('date', toStr);

      if (selectedClientId) {
        const { data: camps } = await supabase.from('campaigns').select('id').eq('client_id', selectedClientId);
        const ids = camps?.map((c: any) => c.id) || [];
        if (ids.length === 0) return null;
        query = query.in('entity_id', ids);
      }

      const { data } = await query;
      if (!data || data.length === 0) return null;

      const agg = {
        spend: data.reduce((s, m) => s + Number(m.spend), 0),
        impressions: data.reduce((s, m) => s + Number(m.impressions), 0),
        clicks: data.reduce((s, m) => s + Number(m.clicks), 0),
        results: data.reduce((s, m) => s + Number(m.results), 0),
        reach: data.reduce((s, m) => s + Number(m.reach), 0),
      };

      return {
        ...agg,
        ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
        cpc: agg.clicks > 0 ? agg.spend / agg.clicks : 0,
        cpm: agg.impressions > 0 ? (agg.spend / agg.impressions) * 1000 : 0,
        roas: agg.spend > 0 ? (agg.results * 100) / agg.spend : 0,
      };
    },
  });

  // Gráfico de investimento por dia
  const { data: chartData } = useQuery({
    queryKey: ['spend-chart', selectedClientId, fromStr, toStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('metrics')
        .select('date, spend')
        .eq('entity_type', 'campaign')
        .gte('date', fromStr)
        .lte('date', toStr)
        .order('date');
      if (!data) return [];
      const grouped: Record<string, number> = {};
      data.forEach((m) => { grouped[m.date] = (grouped[m.date] || 0) + Number(m.spend); });
      return Object.entries(grouped).map(([date, spend]) => ({ date, spend }));
    },
  });

  // Alertas ativos
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

  // Top campanhas
  const { data: topCampaigns } = useQuery({
    queryKey: ['top-campaigns', selectedClientId],
    queryFn: async () => {
      let query = supabase.from('campaigns').select('*').eq('status', 'active').limit(5);
      if (selectedClientId) query = query.eq('client_id', selectedClientId);
      const { data } = await query;
      return data || [];
    },
  });

  const cards = [
    { label: 'Investimento', value: formatCurrency(metrics?.spend || 0), icon: DollarSign },
    { label: 'Impressões', value: formatNumber(metrics?.impressions || 0), icon: Eye },
    { label: 'Cliques', value: formatNumber(metrics?.clicks || 0), icon: MousePointer },
    { label: 'CTR', value: formatPercent(metrics?.ctr || 0), icon: Target },
    { label: 'CPC', value: formatCurrency(metrics?.cpc || 0), icon: BarChart3 },
    { label: 'CPM', value: formatCurrency(metrics?.cpm || 0), icon: BarChart3 },
    { label: 'Resultados', value: formatNumber(metrics?.results || 0), icon: TrendingUp },
    { label: 'ROAS', value: (metrics?.roas || 0).toFixed(2) + 'x', icon: TrendingUp },
  ];

  const severityColor: Record<string, string> = {
    critical: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning/20 text-warning',
    positive: 'bg-success/20 text-success',
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <c.icon className="h-4 w-4" />
                <span className="text-xs">{c.label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Investimento por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0, 0%, 55%)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(0, 0%, 55%)' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(0, 0%, 10%)', border: '1px solid hsl(0, 0%, 16%)', borderRadius: 8 }}
                      labelStyle={{ color: 'hsl(0, 0%, 95%)' }}
                    />
                    <Area type="monotone" dataKey="spend" stroke="hsl(224, 76%, 48%)" fill="url(#spendGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts && alerts.length > 0 ? alerts.map((a: any) => (
              <div key={a.id} className="flex items-start gap-2 rounded-lg bg-secondary p-2">
                <Badge className={severityColor[a.severity] || 'bg-secondary'} variant="secondary">
                  {a.severity}
                </Badge>
                <span className="text-xs text-foreground">{a.message}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top campanhas */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {topCampaigns && topCampaigns.length > 0 ? (
            <div className="space-y-2">
              {topCampaigns.map((c: any) => (
                <Link
                  key={c.id}
                  to={`/campaigns/${c.id}/adsets`}
                  className="flex items-center justify-between rounded-lg bg-secondary p-3 transition-colors hover:bg-secondary/80"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.objective || 'Sem objetivo'}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{c.status}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
