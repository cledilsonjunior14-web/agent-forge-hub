import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilters } from '@/contexts/FilterContext';
import { formatPercent } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { ScoreBar } from '@/components/shared/ScoreBar';

export default function CreativesPage() {
  const { dateRange } = useFilters();
  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];

  const { data: creatives, isLoading } = useQuery({
    queryKey: ['creatives-ranking', fromStr, toStr],
    queryFn: async () => {
      // Buscar todos os anúncios
      const { data: ads } = await supabase.from('ads').select('id, name, creative_url');
      if (!ads || ads.length === 0) return [];

      // Buscar métricas dos anúncios
      const { data: metrics } = await supabase
        .from('metrics')
        .select('entity_id, hook_rate, hold_rate, ctr')
        .eq('entity_type', 'ad')
        .in('entity_id', ads.map((a: any) => a.id))
        .gte('date', fromStr)
        .lte('date', toStr);

      // Agregar métricas por anúncio
      const metricsMap: Record<string, { hookRate: number; holdRate: number; ctr: number; count: number }> = {};
      (metrics || []).forEach((m: any) => {
        if (!metricsMap[m.entity_id]) metricsMap[m.entity_id] = { hookRate: 0, holdRate: 0, ctr: 0, count: 0 };
        metricsMap[m.entity_id].hookRate += Number(m.hook_rate);
        metricsMap[m.entity_id].holdRate += Number(m.hold_rate);
        metricsMap[m.entity_id].ctr += Number(m.ctr);
        metricsMap[m.entity_id].count += 1;
      });

      // Calcular score: (hook_rate * 0.4) + (hold_rate * 0.3) + (ctr * 0.3)
      return ads.map((ad: any) => {
        const m = metricsMap[ad.id];
        const hookRate = m ? m.hookRate / m.count : 0;
        const holdRate = m ? m.holdRate / m.count : 0;
        const ctr = m ? m.ctr / m.count : 0;
        const score = (hookRate * 0.4) + (holdRate * 0.3) + (ctr * 0.3);
        return { ...ad, hookRate, holdRate, ctr, score };
      }).sort((a: any, b: any) => b.score - a.score);
    },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Ranking de Criativos</h1>
      <p className="text-sm text-muted-foreground">Score = Hook Rate (40%) + Hold Rate (30%) + CTR (30%)</p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : creatives && creatives.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {creatives.map((c: any, i: number) => (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="mb-3 flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  {c.creative_url ? (
                    <img src={c.creative_url} alt={c.name} className="h-16 w-16 rounded-md object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-secondary" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                  </div>
                </div>

                <ScoreBar score={c.score} className="mb-3" />

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Hook Rate</p>
                    <p className="text-sm font-mono font-medium">{formatPercent(c.hookRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hold Rate</p>
                    <p className="text-sm font-mono font-medium">{formatPercent(c.holdRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className="text-sm font-mono font-medium">{formatPercent(c.ctr)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
          Nenhum criativo encontrado
        </div>
      )}
    </div>
  );
}
