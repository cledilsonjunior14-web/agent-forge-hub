import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const severityConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  critical: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Crítico' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Atenção' },
  positive: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Positivo' },
};

export default function AlertsPage() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['all-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Alertas</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert: any) => {
            const config = severityConfig[alert.severity] || severityConfig.warning;
            const Icon = config.icon;
            const isResolved = !!alert.resolved_at;

            return (
              <Card key={alert.id} className={`border-border ${isResolved ? 'opacity-50' : ''}`}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`rounded-lg p-2 ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${config.bg} ${config.color} text-xs`}>
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{alert.alert_type}</span>
                      {isResolved && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" /> Resolvido
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground">{alert.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {alert.entity_type} • {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
          Nenhum alerta encontrado
        </div>
      )}
    </div>
  );
}
