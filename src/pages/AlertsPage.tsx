import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMetaContext } from '@/hooks/useMetaContext';
import { info_conta, insights_custom } from '@/services/metaApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, AlertCircle, CheckCircle2, DollarSign, Settings as SettingsIcon, ShieldCheck, Activity, Target, ShieldAlert, ArrowRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/formatters';

const ACCOUNT_STATUS_MAP: Record<number, { label: string, color: string, isCritical: boolean }> = {
  1: { label: 'Ativa e Operacional', color: 'text-success', isCritical: false },
  2: { label: 'Conta Desativada (Bloqueio)', color: 'text-destructive', isCritical: true },
  3: { label: 'Pagamento Pendente/Falhou', color: 'text-warning', isCritical: true },
  7: { label: 'Em Revisão de Risco', color: 'text-warning', isCritical: true },
  8: { label: 'Em Análise de Pagamento', color: 'text-warning', isCritical: true },
  9: { label: 'Período de Carência', color: 'text-warning', isCritical: true },
  100: { label: 'Fechamento Pendente', color: 'text-muted-foreground', isCritical: false },
  101: { label: 'Conta Encerrada', color: 'text-destructive', isCritical: true },
  201: { label: 'Conta Restrita (Política)', color: 'text-destructive', isCritical: true },
  202: { label: 'Conta Suspensa (Política)', color: 'text-destructive', isCritical: true }
};

export default function AlertsPage() {
  const { token, accountId, hasMetaSetup } = useMetaContext();

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [configs, setConfigs] = useState({
     balanceThreshold: 100, // R$
     cpaThresholdPct: 20, // %
     cpmThresholdPct: 30, // %
     ctrDropPct: 15 // %
  });

  useEffect(() => {
     const saved = localStorage.getItem('aib_alerts_settings');
     if (saved) {
        try { setConfigs(JSON.parse(saved)); } catch (e) {}
     }
  }, []);

  const updateConfig = (key: keyof typeof configs, value: string) => {
     const numArg = parseFloat(value) || 0;
     const newC = { ...configs, [key]: numArg };
     setConfigs(newC);
     localStorage.setItem('aib_alerts_settings', JSON.stringify(newC));
  };

  // 1. ACCOUNT HEALTH & BALANCE
  const { data: accInfo, isLoading: isAccLoading } = useQuery({
     queryKey: ['meta-alerts-account', accountId],
     enabled: hasMetaSetup,
     queryFn: async () => {
        try {
           return await info_conta(token, accountId);
        } catch(e) { return null; }
     }
  });

  // 2. DAILY METRICS DRIFT (D0 vs D-1) -> Puxamos os últimos 2 dias separados
  const d0DateStr = new Date().toISOString().split('T')[0];
  const d1DateStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const driftParams = { fields: 'spend,impressions,clicks,actions', time_increment: 1, limit: 14 };

  const { data: driftData, isLoading: isDriftLoading } = useQuery({
     queryKey: ['meta-alerts-drift', accountId, d1DateStr, d0DateStr],
     enabled: hasMetaSetup,
     queryFn: async () => {
        const timeRangeJSON = JSON.stringify({ since: d1DateStr, until: d0DateStr });
        const res = await insights_custom(token, accountId, { ...driftParams, time_range: timeRangeJSON, level: 'campaign' });
        const data = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
        
        // Agrupar por campanha para comparar os dias
        const cmap: Record<string, { name: string; d0: any; d1: any }> = {};
        data.forEach(d => {
           const id = d.campaign_id;
           if (!cmap[id]) cmap[id] = { name: d.campaign_name, d0: null, d1: null };
           
           const results = d.actions?.reduce((acc: number, a:any) => {
              if (['offsite_conversion.fb_pixel_purchase', 'lead', 'onsite_conversion.messaging_conversation_started_7d'].includes(a.action_type)) return acc + Number(a.value);
              return acc;
           }, 0) || 0;
           
           const parsed = {
               spend: Number(d.spend || 0),
               impressions: Number(d.impressions || 0),
               clicks: Number(d.clicks || 0),
               results,
               cpa: results > 0 ? Number(d.spend) / results : Number(d.spend || 0),
               cpm: Number(d.impressions) > 0 ? (Number(d.spend) / Number(d.impressions)) * 1000 : 0,
               ctr: Number(d.impressions) > 0 ? (Number(d.clicks) / Number(d.impressions)) * 100 : 0,
           };
           
           if (d.date_start === d0DateStr) cmap[id].d0 = parsed;
           else cmap[id].d1 = parsed;
        });
        return Object.values(cmap);
     }
  });

  const generateAlerts = useMemo(() => {
     if (!accInfo && !driftData) return [];
     const alerts: any[] = [];
     let idCounter = 1;

     // 1. STATUS DE CONTA (Critico Master)
     if (accInfo) {
        const s = ACCOUNT_STATUS_MAP[accInfo.account_status] || { label: 'Status Desconhecido', color: 'text-warning', isCritical: true };
        if (s.isCritical) {
           alerts.push({
             id: idCounter++, severity: 'critical', type: 'Conta Bloqueada ou Restrita',
             message: `Esta conta de anúncios está desativada ou com pagamentos retidos. Status da Meta: ${s.label}.`,
             action: { label: 'Ver Suporte Meta', url: 'https://business.facebook.com/business/help' },
             icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10'
           });
        }
        
        // 2. SALDO/PAGAMENTO
        // 'balance' retornado pela Graph API muitas vezes é o valor devedor (Current Balance a pagar) ou negativo se o cliente tem créditos rodando em pré-pago sem faturar (nao tao confiavel para PIX mas para Threshold serve).
        // Se `balance` for maior que 0 e próximo ao Limiar do Usuário.
        const balance = Math.abs(Number(accInfo.balance || 0) / 100); // Meta retorna balance em centavos
        if (balance >= configs.balanceThreshold) {
           alerts.push({
             id: idCounter++, severity: 'warning', type: `Aviso Tático Mensal / Faturamento (Tolerância R$ ${configs.balanceThreshold})`,
             message: `O limite contábil de sua conta (${accInfo.currency || 'BRL'} ${formatCurrency(balance)}) está acionando o nosso gatilho tático configurado de R$ ${formatCurrency(configs.balanceThreshold)}. Pode ser um momento recomendado para faturar boleto/pix.`,
             action: { label: 'Gerar Faturamento (1-Click na Meta Billing)', url: `https://business.facebook.com/ads/manager/billing_history/summary/?act=${accountId}` },
             icon: DollarSign, color: 'text-warning', bg: 'bg-warning/10'
           });
        }
     }

     // 3. FADIGA ESTRATÉGICA E ANOMALIAS (Drifts de CPA/CPM/CTR)
     if (driftData) {
        driftData.forEach(camp => {
           if (!camp.d0 || !camp.d1) return; // Precisa de 2 dias de histórico para base
           const spend = camp.d0.spend + camp.d1.spend;
           if (spend < 5) return; // Filtro de lixo (Campanha sem tração)

           const cpaVar = camp.d1.cpa > 0 ? ((camp.d0.cpa - camp.d1.cpa) / camp.d1.cpa) * 100 : 0;
           const cpmVar = camp.d1.cpm > 0 ? ((camp.d0.cpm - camp.d1.cpm) / camp.d1.cpm) * 100 : 0;
           const ctrDrop = camp.d1.ctr > 0 ? ((camp.d1.ctr - camp.d0.ctr) / camp.d1.ctr) * 100 : 0; // Se d0 for menor, o drop é positivo

           if (cpaVar > configs.cpaThresholdPct && camp.d0.results > 0) {
              alerts.push({
                 id: idCounter++, severity: 'warning', type: 'Sangria Orçamentária no C.P.A',
                 message: `A campanha "${camp.name}" sofreu um aumento abruto de CPA hoje (+${cpaVar.toFixed(1)}%). Subiu de R$ ${camp.d1.cpa.toFixed(2)} para R$ ${camp.d0.cpa.toFixed(2)}.`,
                 icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10'
              });
           }
           if (cpmVar > configs.cpmThresholdPct) {
              alerts.push({
                 id: idCounter++, severity: 'warning', type: 'Fadiga de Algoritmo / Oportunidade Piora (C.P.M)',
                 message: `O piso do Custo Por Mil picos em "${camp.name}". Alta de +${cpmVar.toFixed(1)}% nas últimas 24 hrs. O público saturou o criativo, sugerimos injetar novos visuais amanhã cedinho.`,
                 icon: Target, color: 'text-warning', bg: 'bg-warning/10'
              });
           }
           if (ctrDrop > configs.ctrDropPct) {
               alerts.push({
                 id: idCounter++, severity: 'critical', type: 'Fuga em Massa da Audiência (CTR Oculto)',
                 message: `Queda pesada (-${ctrDrop.toFixed(1)}%) na taxa de Click-Through Rate em "${camp.name}". Suas peças gráficas perderam o poder de "Stop Scroll".`,
                 icon: Activity, color: 'text-destructive', bg: 'bg-destructive/10'
              });
           }
        });
     }

     return alerts.sort((a, b) => (SERVERITY_WEIGHT[b.severity as keyof typeof SERVERITY_WEIGHT] || 0) - (SERVERITY_WEIGHT[a.severity as keyof typeof SERVERITY_WEIGHT] || 0));
  }, [accInfo, driftData, configs, accountId]);

  const SERVERITY_WEIGHT = { critical: 2, warning: 1, positive: 0 };
  const okStatus = accInfo && (accInfo.account_status === 1 || accInfo.account_status === 100);

  if (!hasMetaSetup) return (
     <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
       <div className="rounded-full bg-secondary p-6 mb-4"><ShieldAlert className="h-10 w-10 text-muted-foreground" /></div>
       <h2 className="text-xl font-bold mb-2">Vigília Offline</h2>
       <p className="text-sm text-muted-foreground max-w-[400px]">Conecte a conta do Facebook Ads nas Configurações para ativar a patrulha e vigília automática dos alertas e bloqueios.</p>
     </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 space-y-6">
       
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
         <div>
            <h1 className="text-[14px] font-black tracking-widest uppercase flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Centro de Operações Preventivo (C.O.P)</h1>
            <p className="text-xs text-muted-foreground mt-1">Patrulhamento automático de limiares financeiros, bloqueios Meta e fadiga algoritmica 24hrs.</p>
         </div>
         <Button variant={showSettings ? "default" : "outline"} size="sm" onClick={() => setShowSettings(!showSettings)} className="shadow-sm font-bold uppercase tracking-widest text-[10px] gap-2"><SettingsIcon className="w-3.5 h-3.5" /> Ajustar Limiares C.O.P</Button>
       </div>

       {showSettings && (
          <Card className="bg-secondary/10 border-border animate-in fade-in slide-in-from-top-4 relative overflow-hidden ring-1 ring-border/50">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
             <CardHeader className="pb-4">
                <CardTitle className="text-xs uppercase font-black tracking-wider text-primary">Algoritmos Reguladores</CardTitle>
                <CardDescription className="text-xs">Defina onde a sirene vermelha da AIB deve buzinar para você prever o caos.</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-background rounded-lg border shadow-sm">
                     <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">💰 Teto Mensal Fatura (Sempre Alertar em R$)</label>
                     <Input type="number" value={configs.balanceThreshold} onChange={(e) => updateConfig('balanceThreshold', e.target.value)} className="font-mono" />
                  </div>
                  <div className="p-4 bg-background rounded-lg border shadow-sm border-warning/30">
                     <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">🛡️ Alarme C.P.A (+%) [Hoje contra Ontem]</label>
                     <Input type="number" value={configs.cpaThresholdPct} onChange={(e) => updateConfig('cpaThresholdPct', e.target.value)} className="font-mono text-warning" />
                  </div>
                  <div className="p-4 bg-background rounded-lg border shadow-sm border-warning/30">
                     <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">⏱️ Teto de Leilão C.P.M (+%)</label>
                     <Input type="number" value={configs.cpmThresholdPct} onChange={(e) => updateConfig('cpmThresholdPct', e.target.value)} className="font-mono text-warning" />
                  </div>
                  <div className="p-4 bg-background rounded-lg border shadow-sm border-destructive/30">
                     <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">🛑 Colapso Tático CTR Queda Pior Que (-%)</label>
                     <Input type="number" value={configs.ctrDropPct} onChange={(e) => updateConfig('ctrDropPct', e.target.value)} className="font-mono text-destructive" />
                  </div>
               </div>
             </CardContent>
          </Card>
       )}

       {/* STATUS BOARD HEALTH */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`border-border ${okStatus ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/30'}`}>
             <CardContent className="p-5 flex items-center justify-between">
                <div>
                   <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Coração Central da Conta (Meta API)</p>
                   {isAccLoading ? <div className="h-5 w-24 bg-secondary/50 animate-pulse rounded"></div> : (
                      <h3 className={`text-sm font-black ${okStatus ? 'text-success' : 'text-destructive'}`}>
                         {okStatus ? (ACCOUNT_STATUS_MAP[accInfo.account_status]?.label || 'Livre Operação') : (ACCOUNT_STATUS_MAP[accInfo?.account_status]?.label || 'Extremamente Crítico (Bloqueio ou Checagem Manual Pendente).')}
                      </h3>
                   )}
                </div>
                {okStatus ? <CheckCircle2 className="w-8 h-8 text-success opacity-80" /> : <ShieldAlert className="w-8 h-8 text-destructive animate-pulse" />}
             </CardContent>
          </Card>

          <Card className="border-border">
             <CardContent className="p-5 flex items-center justify-between">
                <div>
                   <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Última Leitura de Saldo / Threshold</p>
                   {isAccLoading ? <div className="h-5 w-24 bg-secondary/50 animate-pulse rounded"></div> : (
                      <h3 className="text-sm font-black font-mono">
                         R$ {formatCurrency(Math.abs(Number(accInfo?.balance || 0) / 100))} <span className="text-[10px] uppercase text-muted-foreground font-sans">vs Limiar de {configs.balanceThreshold}</span>
                      </h3>
                   )}
                </div>
                <DollarSign className="w-8 h-8 text-primary opacity-50" />
             </CardContent>
          </Card>

          <Card className="border-border bg-primary/5">
             <CardContent className="p-5 flex items-center justify-between">
                <div>
                   <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Processos Diários</p>
                   {isDriftLoading ? <div className="h-5 w-24 bg-secondary/50 animate-pulse rounded"></div> : (
                      <h3 className="text-sm font-black">
                         {driftData?.length || 0} Campanhas Monitoradas pelo COP
                      </h3>
                   )}
                </div>
                <Activity className="w-8 h-8 text-primary opacity-50" />
             </CardContent>
          </Card>
       </div>

       {/* ALERTS FEED LIST */}
       <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2 flex items-center gap-2"><Target className="w-4 h-4" /> Relatório Oficial Tático {d0DateStr}</h2>
          
          {isAccLoading || isDriftLoading ? (
             <div className="flex justify-center py-12">
               <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
             </div>
          ) : generateAlerts.length > 0 ? (
             <div className="space-y-3">
               {generateAlerts.map((alert) => {
                  const Icon = alert.icon;
                  return (
                     <Card key={alert.id} className="border-none shadow-md overflow-hidden bg-card ring-1 ring-border group hover:ring-primary/50 transition-all hover:-translate-y-0.5 max-w-[900px]">
                       <div className="flex flex-col sm:flex-row">
                          <div className={`sm:w-[150px] shrink-0 flex flex-col items-center justify-center p-4 sm:border-r border-b sm:border-b-0 border-border/50 text-center ${alert.bg}`}>
                             <Icon className={`w-8 h-8 mb-2 ${alert.color}`} />
                             <Badge className={`${alert.bg} ${alert.color} border-none shadow-sm uppercase tracking-wider text-[9px] font-black`}>{alert.severity}</Badge>
                          </div>
                          <div className="p-5 flex-1 w-full min-w-0">
                             <h4 className="text-xs uppercase font-black tracking-widest opacity-80 pb-2 mb-2 border-b border-border flex items-center gap-2 truncate">{alert.type} <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground animate-pulse ml-auto hidden sm:block">NOVO</span></h4>
                             <p className="text-sm font-medium leading-relaxed opacity-90">{alert.message}</p>
                             
                             {alert.action && (
                                <Button variant="outline" size="sm" className="mt-4 font-bold text-xs bg-background shadow hover:bg-secondary truncate w-full sm:w-auto" asChild>
                                   <a href={alert.action.url} target="_blank" rel="noopener noreferrer">{alert.action.label} <ArrowRight className="w-3.5 h-3.5 ml-2" /></a>
                                </Button>
                             )}
                          </div>
                       </div>
                     </Card>
                  );
               })}
             </div>
          ) : (
             <Card className="border-border border-dashed bg-transparent shadow-none w-full max-w-[900px]">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                   <CheckCircle2 className="w-12 h-12 text-success opacity-80 mb-4" />
                   <h3 className="text-sm font-black uppercase text-foreground mb-1">100% BLINDADO; Sem Anomalias Severas Hoje.</h3>
                   <p className="text-xs text-muted-foreground">O ambiente estocástico não superou seus limiares de alarme. Descanse os olhos.</p>
                </CardContent>
             </Card>
          )}
       </div>

    </div>
  );
}
