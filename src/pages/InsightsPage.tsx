import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMetaContext } from '@/hooks/useMetaContext';
import { useFilters } from '@/contexts/FilterContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { listar_campanhas, listar_conjuntos, listar_anuncios, insights_custom } from '@/services/metaApi';

export default function InsightsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { dateRange } = useFilters();
  const { token, accountId, hasMetaSetup } = useMetaContext();

  const [entityType, setEntityType] = useState<string>('campaign');
  const [entityId, setEntityId] = useState<string>('');

  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];
  const timeRangeJSON = JSON.stringify({ since: fromStr, until: toStr });

  // Buscar entidades reais da Meta API para selecionar
  const { data: entities, isLoading: isLoadingEntities } = useQuery({
    queryKey: ['insight-meta-entities', entityType, accountId],
    enabled: hasMetaSetup,
    queryFn: async () => {
      let res: any;
      if (entityType === 'campaign') {
        res = await listar_campanhas(token, accountId, 100);
      } else if (entityType === 'adset') {
        res = await listar_conjuntos(token, accountId, undefined, 100);
      } else if (entityType === 'ad') {
        res = await listar_anuncios(token, accountId, undefined, 100);
      } else {
         return [];
      }
      return (res as any).data || res || [];
    },
  });

  // Histórico de insights salvo localmente
  const { data: insights } = useQuery({
    queryKey: ['insights-history', entityType, entityId],
    queryFn: async () => {
      let query = supabase.from('insights').select('*').order('generated_at', { ascending: false }).limit(20);
      if (entityId) {
        query = query.eq('entity_type', entityType).eq('entity_id', entityId);
      }
      const { data } = await query;
      return data || [];
    },
  });

  // Gerar insight consumindo API do Facebook e repassando pro Edge Function
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error('Selecione uma entidade primeiro.');

      // 1. Busca os insights diários dessa entidade do Facebook na data selecionada
      const params: any = {
         level: entityType,
         time_increment: 1, // Diário para a IA ver a evolução
         time_range: timeRangeJSON,
         fields: 'impressions,clicks,spend,ctr,cpc,cpm,actions,purchase_roas'
      };
      
      if (entityType === 'campaign') params.campaign_id = entityId;
      else if (entityType === 'adset') params.adset_id = entityId;
      
      const res = await insights_custom(token, accountId, params);
      const metricsData = (res as any).data || res || [];

      if (!metricsData.length) {
         throw new Error("A API da Meta retornou 0 dados trafegados nesse período para esta campanha/anúncio. Não há o que analisar.");
      }

      // 2. Chama o OpenRouter pela Deno Function com os MÉTODOS REAIS
      const { data, error } = await supabase.functions.invoke('generate-insight', {
        body: { 
           entity_type: entityType, 
           entity_id: entityId, 
           metrics: metricsData, 
           client_name: 'Meta Ads Viewer' 
        },
      });

      if (error) {
         console.error(error);
         throw new Error('Falha na Engine OpenRouter. Checou se a OPENROUTER_API_KEY no .env tá certa?');
      }

      return data;
    },
    onSuccess: () => {
      toast({ title: 'Análise de Mestre pronta!' });
      queryClient.invalidateQueries({ queryKey: ['insights-history'] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro de Análise', description: err.message, variant: 'destructive' });
    },
  });


  if (!hasMetaSetup) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[80vh]">
        <SettingsIcon className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Configure a Integração Meta</h2>
        <p className="text-muted-foreground mb-4 max-w-md">O cérebro de IA precisa ler os dados da sua agência no Facebook para gerar conselhos e análises precisas.</p>
        <Link to="/settings"><Button>Ir para Configurações</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-foreground">Insights de IA sobre Meta Ads</h1>
         <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary/80 animate-pulse"></span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Claude / OpenRouter Conectado</span>
         </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-4 p-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível</label>
            <Select value={entityType} onValueChange={(v) => { setEntityType(v); setEntityId(''); }}>
              <SelectTrigger className="w-[150px] bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="campaign">Campanha</SelectItem>
                <SelectItem value="adset">Conjunto</SelectItem>
                <SelectItem value="ad">Anúncio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-grow max-w-md">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selecione o Alvo</label>
            <Select value={entityId} onValueChange={setEntityId} disabled={isLoadingEntities || !entities?.length}>
              <SelectTrigger className="w-full bg-secondary">
                <SelectValue placeholder={isLoadingEntities ? "Carregando Meta..." : entities?.length ? "Escolha a Entidade..." : "Sem entidades ativas"} />
              </SelectTrigger>
              <SelectContent>
                {entities?.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.name} <span className="opacity-50 text-xs ml-2">({e.id})</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="h-10 px-6 font-semibold shadow-md active:scale-95 transition-transform" 
            onClick={() => generateMutation.mutate()} 
            disabled={!entityId || generateMutation.isPending}
          >
            {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Gerar Diagnóstico Vital
          </Button>
        </CardContent>
      </Card>

      {insights && insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight: any) => (
            <Card key={insight.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2 bg-secondary/20">
                <CardTitle className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                     <Sparkles className="h-4 w-4 text-primary" />
                     <span className="uppercase tracking-wider text-xs font-bold text-foreground">Relatório de {insight.entity_type}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">{new Date(insight.generated_at).toLocaleString('pt-BR')}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{insight.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-24 flex flex-col items-center justify-center text-center">
           <div className="bg-secondary/50 p-4 rounded-full mb-4">
               <Sparkles className="h-8 w-8 text-muted-foreground" />
           </div>
           <p className="text-lg font-bold text-foreground mb-1">IA Aguardando Comandos</p>
           <p className="text-sm text-muted-foreground max-w-sm">
             Selecione uma campanha ou anúncio com dados fluindo e dispare o cérebro mágico do sistema.
           </p>
        </div>
      )}
    </div>
  );
}
