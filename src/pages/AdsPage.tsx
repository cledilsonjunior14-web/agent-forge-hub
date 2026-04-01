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

export default function AdsPage() {
  const { adSetId } = useParams();
  const { dateRange } = useFilters();
  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];

  const { data: adSet } = useQuery({
    queryKey: ['adset', adSetId],
    queryFn: async () => {
      const { data } = await supabase.from('ad_sets').select('*, campaigns(name)').eq('id', adSetId!).single();
      return data;
    },
  });

  const { data: ads, isLoading } = useQuery({
    queryKey: ['ads', adSetId],
    queryFn: async () => {
      const { data } = await supabase.from('ads').select('*').eq('ad_set_id', adSetId!).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: metricsMap } = useQuery({
    queryKey: ['ads-metrics', ads?.map((a: any) => a.id), fromStr, toStr],
    enabled: !!ads && ads.length > 0,
    queryFn: async () => {
      const ids = ads!.map((a: any) => a.id);
      const { data } = await supabase
        .from('metrics')
        .select('entity_id, spend, clicks, impressions, ctr')
        .eq('entity_type', 'ad')
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
          <h1 className="text-2xl font-bold">Anúncios</h1>
          {adSet && <p className="text-sm text-muted-foreground">Conjunto: {(adSet as any).name}</p>}
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : ads && ads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Criativo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad: any) => {
                  const m = metricsMap?.[ad.id];
                  const ctr = m && m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
                  return (
                    <TableRow key={ad.id} className="border-border">
                      <TableCell>
                        {ad.creative_url ? (
                          <img src={ad.creative_url} alt={ad.name} className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-secondary" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{ad.name}</TableCell>
                      <TableCell><Badge variant="secondary">{ad.status}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(m?.spend || 0)}</TableCell>
                      <TableCell className="text-right font-mono">{formatPercent(ctr)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhum anúncio encontrado</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
