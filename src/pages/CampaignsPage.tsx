import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilters } from '@/contexts/FilterContext';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';

export default function CampaignsPage() {
  const { selectedClientId, dateRange } = useFilters();
  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns-list', selectedClientId],
    queryFn: async () => {
      let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (selectedClientId) query = query.eq('client_id', selectedClientId);
      const { data } = await query;
      return data || [];
    },
  });

  // Buscar métricas agregadas por campanha
  const { data: metricsMap } = useQuery({
    queryKey: ['campaigns-metrics', campaigns?.map((c: any) => c.id), fromStr, toStr],
    enabled: !!campaigns && campaigns.length > 0,
    queryFn: async () => {
      const ids = campaigns!.map((c: any) => c.id);
      const { data } = await supabase
        .from('metrics')
        .select('entity_id, spend, clicks, impressions, results, ctr, roas')
        .eq('entity_type', 'campaign')
        .in('entity_id', ids)
        .gte('date', fromStr)
        .lte('date', toStr);

      const map: Record<string, { spend: number; clicks: number; impressions: number; results: number; ctr: number; roas: number }> = {};
      (data || []).forEach((m: any) => {
        if (!map[m.entity_id]) map[m.entity_id] = { spend: 0, clicks: 0, impressions: 0, results: 0, ctr: 0, roas: 0 };
        map[m.entity_id].spend += Number(m.spend);
        map[m.entity_id].clicks += Number(m.clicks);
        map[m.entity_id].impressions += Number(m.impressions);
        map[m.entity_id].results += Number(m.results);
      });
      // Calcular CTR e ROAS agregados
      Object.values(map).forEach((v) => {
        v.ctr = v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0;
        v.roas = v.spend > 0 ? (v.results * 100) / v.spend : 0;
      });
      return map;
    },
  });

  const statusColor: Record<string, string> = {
    active: 'bg-success/20 text-success',
    paused: 'bg-warning/20 text-warning',
    archived: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Campanhas</h1>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Resultados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c: any) => {
                  const m = metricsMap?.[c.id];
                  return (
                    <TableRow key={c.id} className="border-border">
                      <TableCell>
                        <Link to={`/campaigns/${c.id}/adsets`} className="font-medium text-foreground hover:text-primary">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor[c.status] || ''} variant="secondary">{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.objective || '—'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(m?.spend || 0)}</TableCell>
                      <TableCell className="text-right font-mono">{formatPercent(m?.ctr || 0)}</TableCell>
                      <TableCell className="text-right font-mono">{(m?.roas || 0).toFixed(2)}x</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(m?.results || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma campanha encontrada</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
