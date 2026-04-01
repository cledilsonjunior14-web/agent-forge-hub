import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, Link } from 'react-router-dom';
import { useFilters } from '@/contexts/FilterContext';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdSetsPage() {
  const { campaignId } = useParams();
  const { dateRange } = useFilters();
  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data } = await supabase.from('campaigns').select('*').eq('id', campaignId!).single();
      return data;
    },
  });

  const { data: adSets, isLoading } = useQuery({
    queryKey: ['adsets', campaignId],
    queryFn: async () => {
      const { data } = await supabase.from('ad_sets').select('*').eq('campaign_id', campaignId!).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: metricsMap } = useQuery({
    queryKey: ['adsets-metrics', adSets?.map((a: any) => a.id), fromStr, toStr],
    enabled: !!adSets && adSets.length > 0,
    queryFn: async () => {
      const ids = adSets!.map((a: any) => a.id);
      const { data } = await supabase
        .from('metrics')
        .select('entity_id, spend, clicks, impressions, cpc, ctr')
        .eq('entity_type', 'adset')
        .in('entity_id', ids)
        .gte('date', fromStr)
        .lte('date', toStr);
      const map: Record<string, { spend: number; clicks: number; impressions: number }> = {};
      (data || []).forEach((m: any) => {
        if (!map[m.entity_id]) map[m.entity_id] = { spend: 0, clicks: 0, impressions: 0 };
        map[m.entity_id].spend += Number(m.spend);
        map[m.entity_id].clicks += Number(m.clicks);
        map[m.entity_id].impressions += Number(m.impressions);
      });
      return map;
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link to="/campaigns">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Conjuntos de Anúncios</h1>
          {campaign && <p className="text-sm text-muted-foreground">Campanha: {(campaign as any).name}</p>}
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : adSets && adSets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adSets.map((a: any) => {
                  const m = metricsMap?.[a.id];
                  const ctr = m && m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
                  const cpc = m && m.clicks > 0 ? m.spend / m.clicks : 0;
                  return (
                    <TableRow key={a.id} className="border-border">
                      <TableCell>
                        <Link to={`/adsets/${a.id}/ads`} className="font-medium text-foreground hover:text-primary">{a.name}</Link>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{a.status}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{a.budget ? formatCurrency(Number(a.budget)) : '—'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(m?.spend || 0)}</TableCell>
                      <TableCell className="text-right font-mono">{formatPercent(ctr)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(cpc)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhum conjunto encontrado</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
