import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InsightsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [entityType, setEntityType] = useState<string>('campaign');
  const [entityId, setEntityId] = useState<string>('');

  // Buscar entidades para selecionar
  const { data: entities } = useQuery({
    queryKey: ['insight-entities', entityType],
    queryFn: async () => {
      if (entityType === 'campaign') {
        const { data } = await supabase.from('campaigns').select('id, name');
        return data || [];
      }
      if (entityType === 'adset') {
        const { data } = await supabase.from('ad_sets').select('id, name');
        return data || [];
      }
      if (entityType === 'ad') {
        const { data } = await supabase.from('ads').select('id, name');
        return data || [];
      }
      return [];
    },
  });

  // Histórico de insights
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

  // Gerar insight via Edge Function
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error('Selecione uma entidade');

      // Buscar métricas da entidade
      const { data: metrics } = await supabase
        .from('metrics')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('date', { ascending: false })
        .limit(30);

      const { data, error } = await supabase.functions.invoke('generate-insight', {
        body: { entity_type: entityType, entity_id: entityId, metrics: metrics || [], client_name: 'Cliente' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Insight gerado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['insights-history'] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao gerar insight', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Insights IA</h1>

      {/* Controles */}
      <Card className="bg-card border-border">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tipo</label>
            <Select value={entityType} onValueChange={(v) => { setEntityType(v); setEntityId(''); }}>
              <SelectTrigger className="w-[140px] bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="campaign">Campanha</SelectItem>
                <SelectItem value="adset">Conjunto</SelectItem>
                <SelectItem value="ad">Anúncio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Entidade</label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger className="w-[250px] bg-secondary"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {entities?.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => generateMutation.mutate()} disabled={!entityId || generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Gerar Insight
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      {insights && insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight: any) => (
            <Card key={insight.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {insight.entity_type} • {new Date(insight.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-foreground">{insight.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
          Nenhum insight gerado ainda. Selecione uma entidade e clique em "Gerar Insight".
        </div>
      )}
    </div>
  );
}
