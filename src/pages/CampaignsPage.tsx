import { useQuery } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { useMetaContext } from '@/hooks/useMetaContext';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { insights_custom } from '@/services/metaApi';
import { Settings as SettingsIcon } from 'lucide-react';

export default function CampaignsPage() {
  const { dateRange } = useFilters();
  const { token, accountId, hasMetaSetup, isLoading: isMetaLoading } = useMetaContext();

  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];
  const timeRangeJSON = JSON.stringify({ since: fromStr, until: toStr });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['meta-campaigns-list', accountId, fromStr, toStr],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, {
        level: 'campaign',
        fields: 'campaign_id,campaign_name,objective,spend,clicks,impressions,cpc,ctr,actions,purchase_roas',
        time_range: timeRangeJSON,
        limit: 100,
      });
      const data = (res as any).data || res;
      if (!data) return [];
      
      return data.map((d: any) => {
        const resultsVal = d.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'link_click')?.value || d.clicks || 0;
        const roasVal = d.purchase_roas?.[0]?.value || 0;
        
        return {
          id: d.campaign_id,
          name: d.campaign_name,
          objective: d.objective || '—',
          status: 'live', // insights data means it had traffic.
          spend: Number(d.spend || 0),
          ctr: Number(d.ctr || 0),
          roas: Number(roasVal),
          results: Number(resultsVal),
        };
      });
    },
  });

  const statusColor: Record<string, string> = {
    live: 'bg-success/20 text-success border-success/30',
    paused: 'bg-warning/20 text-warning border-warning/30',
    archived: 'bg-muted text-muted-foreground border-border',
  };

  if (isMetaLoading) {
    return <div className="p-12 text-center text-muted-foreground">Carregando conexões...</div>;
  }

  if (!hasMetaSetup) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-secondary p-6 mb-4">
          <SettingsIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-foreground">Acesso Necessário</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Precisamos que você informe a conta anunciante nas configurações para puxar o relatório de campanhas do Facebook.
        </p>
        <Link to="/settings">
          <Button>Configurar Agora</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-foreground">Relatório de Campanhas</h1>
         <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary/80 animate-pulse"></span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sync Ativo</span>
         </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Campanha (Via Meta)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c: any) => (
                  <TableRow key={c.id} className="border-border transition-colors hover:bg-secondary/40">
                    <TableCell>
                      <Link to={`/campaigns/${c.id}/adsets`} className="font-semibold text-foreground hover:text-primary transition-colors">
                        {c.name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{c.id}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor[c.status] || ''} variant="outline">{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground uppercase">{c.objective}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatCurrency(c.spend)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatPercent(c.ctr)}</TableCell>
                    <TableCell className="text-right font-mono font-medium text-success">{c.roas.toFixed(2)}x</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatNumber(c.results)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
               Nenhuma campanha gerou tráfego no período selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
