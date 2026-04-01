import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { useMetaContext } from '@/hooks/useMetaContext';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { differenceInDays, subDays } from 'date-fns';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Icons
import {
  TrendingUp, TrendingDown, Settings as SettingsIcon, AlertCircle, 
  Lightbulb, ArrowRight, MessageCircle, Info, Target, MousePointer, Eye,
  RefreshCw, BarChart, Trophy, Flame, AlertTriangle, ShieldCheck,
  Filter as FilterIcon, Sparkles as SparklesIcon
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { insights_custom, listar_campanhas } from '@/services/metaApi';

// ==========================================
// HELPERS E REGRAS DE NEGÓCIO (BENCHMARKS)
// ==========================================
const BENCHMARKS = {
  ctr: 1.5,
  cpc: 2.0,
  conversao: 5 // 5% de conversão de lead global por ex.
};

function getPreviousPeriod(from: Date, to: Date) {
  const diff = Math.max(differenceInDays(to, from), 0);
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, diff);
  return {
    from: prevFrom.toISOString().split('T')[0],
    to: prevTo.toISOString().split('T')[0]
  };
}

function calcVariation(current: number, prev: number) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

// ==========================================
// COMPONENTES UX MINIS
// ==========================================

function KpiCard({ title, value, varPct, invertGood = false }: any) {
  const isUp = varPct >= 0;
  const isGood = invertGood ? !isUp : isUp;
  const color = isGood ? 'text-success' : 'text-destructive';
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <Card className="bg-card border-border shadow-sm flex flex-col justify-between">
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">{title}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          {(varPct !== 0 && varPct !== Infinity && !isNaN(varPct)) && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isGood ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
               <Icon className="h-3 w-3" />
               {Math.abs(varPct).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightItem({ type, title, message, action }: any) {
  const colors = {
    critical: 'border-l-destructive bg-destructive/5 text-destructive-foreground',
    attention: 'border-l-warning bg-warning/5 text-warning',
    opportunity: 'border-l-primary bg-primary/5 text-primary'
  };
  const icons = {
    critical: <AlertTriangle className="h-5 w-5 text-destructive mr-2 flex-shrink-0" />,
    attention: <AlertCircle className="h-5 w-5 text-warning mr-2 flex-shrink-0" />,
    opportunity: <Lightbulb className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
  };

  return (
    <div className={`border-l-4 rounded-r-lg p-4 flex items-start ${colors[type as keyof typeof colors]}`}>
      {icons[type as keyof typeof icons]}
      <div className="flex-1">
        <h4 className="text-sm font-bold opacity-90">{title}</h4>
        <p className="text-xs opacity-80 mt-1 mb-2 leading-relaxed">{message}</p>
        <span className="text-[11px] font-semibold bg-background/50 px-2 py-1 rounded inline-block">🎯 Ação: {action}</span>
      </div>
    </div>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function DashboardPage() {
  const { dateRange } = useFilters();
  const { token, accountId, hasMetaSetup, isLoading: isMetaSetupLoading } = useMetaContext();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  const currFromStr = dateRange.from.toISOString().split('T')[0];
  const currToStr = dateRange.to.toISOString().split('T')[0];
  const currTimeRangeJSON = JSON.stringify({ since: currFromStr, until: currToStr });

  const prevDates = getPreviousPeriod(dateRange.from, dateRange.to);
  const prevTimeRangeJSON = JSON.stringify({ since: prevDates.from, until: prevDates.to });

  // 1. LISTA DE CAMPANHAS PARA SELETOR STICKY
  const { data: campaignList } = useQuery({
    queryKey: ['meta-campaigns-list', accountId],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await listar_campanhas(token, accountId, 100);
      return (res as any).data || res || [];
    }
  });

  // 2. BUSCADOR CORE DE MÉTRICAS (ATUAL)
  const queryParams = selectedCampaignId === 'all' ? 
    { level: 'account', fields: 'impressions,clicks,spend,cpm,cpc,ctr,actions,purchase_roas', time_range: currTimeRangeJSON } 
    : 
    { level: 'campaign', campaign_id: selectedCampaignId, fields: 'impressions,clicks,spend,cpm,cpc,ctr,actions,purchase_roas', time_range: currTimeRangeJSON };

  const { data: currMetrics, isLoading: isMetricsLoading, refetch } = useQuery({
    queryKey: ['meta-dash-curr', accountId, selectedCampaignId, currFromStr, currToStr],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, queryParams as any);
      const data = (res as any).data || res;
      if (!data || data.length === 0) return null;
      return parseMetricsObject(data[0]);
    }
  });

  // 3. BUSCADOR DE MÉTRICAS (ANTERIOR)
  const prevQueryParams = { ...queryParams, time_range: prevTimeRangeJSON };
  const { data: prevMetrics } = useQuery({
    queryKey: ['meta-dash-prev', accountId, selectedCampaignId, prevDates.from, prevDates.to],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, prevQueryParams as any);
      const data = (res as any).data || res;
      if (!data || data.length === 0) return null;
      return parseMetricsObject(data[0]);
    }
  });

  // 4. RANKING DE CRIATIVOS (Top 3 Melhores vs Piores por Custo de Resultado)
  const rankingParams = selectedCampaignId === 'all' ? 
    { level: 'ad', fields: 'ad_name,spend,actions,cpc,ctr', time_range: currTimeRangeJSON, limit: 150 } 
    : 
    { level: 'ad', campaign_id: selectedCampaignId, fields: 'ad_name,spend,actions,cpc,ctr', time_range: currTimeRangeJSON, limit: 100 };

  const { data: creativeRanking } = useQuery({
    queryKey: ['meta-dash-creatives', accountId, selectedCampaignId, currFromStr, currToStr],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, rankingParams as any);
      const data = (res as any).data || res || [];
      const parsed = data.map((d: any) => {
         const m = parseMetricsObject(d);
         return { ...m, ad_name: d.ad_name };
      }).filter((m: any) => m.spend > 0); // só quem gastou dinheiro

      // Ordenar do menor custo/resultado (melhor) para o maior
      // Se não tem resultado, o CPA é o próprio spend (tecnicamente infinito, jogamos no final)
      const sorted = parsed.sort((a: any, b: any) => {
         const cpaA = a.results > 0 ? a.spend / a.results : 9999 + a.spend;
         const cpaB = b.results > 0 ? b.spend / b.results : 9999 + b.spend;
         return cpaA - cpaB;
      });

      const avgCpa = sorted.length ? sorted.reduce((sum: number, c: any) => sum + (c.results>0 ? c.spend/c.results : 0), 0) / sorted.filter((c:any)=>c.results>0).length : 0;

      return {
        best: sorted.slice(0, 3), // top 3
        worst: sorted.slice(-3).reverse(), // piores 3
        medianCpa: isNaN(avgCpa) ? 0 : avgCpa
      };
    }
  });

  // ==========================================
  // PARSERS E PROCESSADORES
  // ==========================================
  function parseMetricsObject(m: any) {
    const isWpp = m.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
    const isLead = m.actions?.find((a: any) => a.action_type === 'lead');
    const isPurch = m.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');
    
    // Auto-detect funnel bottom
    const resultAction = isPurch || isLead || isWpp || null;
    let resultType = 'clique';
    if (isPurch) resultType = 'compra';
    else if (isLead) resultType = 'lead';
    else if (isWpp) resultType = 'conversa';

    const results = Number(resultAction?.value || m.clicks || 0);

    return {
       spend: Number(m.spend || 0),
       impressions: Number(m.impressions || 0),
       clicks: Number(m.clicks || 0),
       ctr: Number(m.ctr || 0),
       cpc: Number(m.cpc || 0),
       cpm: Number(m.cpm || 0),
       results,
       resultType,
       roas: Number(m.purchase_roas?.[0]?.value || 0),
       cpa: results > 0 ? Number(m.spend || 0) / results : 0
    };
  }

  // Montagem Lógica do Funil Horizontal
  const m = currMetrics || { spend:0, impressions:0, clicks:0, results:0, cpa:0, ctr:0, cpc:0, cpm:0, resultType:'evento' };
  const p = prevMetrics || { spend:0, impressions:0, clicks:0, results:0, cpa:0, ctr:0, cpc:0, cpm:0 };
  
  const conversionRate = m.clicks > 0 ? (m.results / m.clicks) * 100 : 0;

  // Montagem Lógica dos Insights Automáticos
  const autoInsights = useMemo(() => {
    if (!currMetrics) return [];
    const _in = [];
    if (currMetrics.ctr > 0 && currMetrics.ctr < BENCHMARKS.ctr) {
      _in.push({ type: 'critical', title: 'CTR abaixo de 1.5%', message: `O seu click-through rate de ${currMetrics.ctr.toFixed(2)}% indica que o criativo não está parando o dedo da audiência.`, action: 'Testar novo criativo com gancho (hook) mais forte nos 3 primeiros segundos.' });
    } else if (currMetrics.ctr >= BENCHMARKS.ctr + 1) {
      _in.push({ type: 'opportunity', title: 'Criativo Campeão (Alto CTR)', message: `Com um CTR fantástico de ${currMetrics.ctr.toFixed(2)}%, o tráfego está barato e engajado.`, action: 'Aumente o orçamento destas peças ou clone a campanha para escalar.' });
    }

    if (currMetrics.cpc > BENCHMARKS.cpc) {
      _in.push({ type: 'attention', title: 'Custo por Clique Salgado', message: `Você está pagando ${formatCurrency(currMetrics.cpc)} por cada clique. O público pode estar saturado ou mal segmentado.`, action: 'Atualize os interesses ou troque a segmentação PMax/Advantage.' });
    }
    
    if (currMetrics.results > 0 && currMetrics.cpa < (prevMetrics?.cpa || 9999)) {
       _in.push({ type: 'opportunity', title: 'Custo de Conversão em Queda!', message: `O CPA caiu para ${formatCurrency(currMetrics.cpa)}. Excelente tração.`, action: 'Momento seguro para escalar orçamento horizontal diário (+20%).' });
    }

    if (_in.length === 0) {
      _in.push({ type: 'opportunity', title: 'Operação Estável', message: 'Nenhuma anomalia detectada nos KPIs base deste escopo.', action: 'Deixe o algoritmo trabalhar (Fase de Aprendizado).' });
    }
    return _in;
  }, [currMetrics, prevMetrics]);

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  if (isMetaSetupLoading) return <div className="p-20 text-center"><BarChart className="animate-spin w-8 h-8 text-primary mx-auto" /></div>;
  if (!hasMetaSetup) return (
     <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
       <div className="rounded-full bg-secondary p-6 mb-4"><SettingsIcon className="h-10 w-10 text-muted-foreground" /></div>
       <h2 className="text-xl font-bold mb-2 text-foreground">Acesso ao Painel Consultivo</h2>
       <p className="text-muted-foreground max-w-md mb-6">Injetar a Camada de Inteligência exige acesso à sua conta de anúncios.</p>
       <Link to="/settings"><Button>Vincular Meta Ads Agora</Button></Link>
     </div>
  );

  return (
    <div className="bg-background min-h-screen">
      
      {/* 1. HEADER FIXO (STICKY) PIXEL PERFECT */}
      <div className="sticky top-0 z-10 w-full border-b border-border bg-background/90 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Consultor de Tráfego</h1>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-success"></span> Operando em tempo real
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[200px] h-9 bg-secondary text-xs font-semibold">
              <SelectValue placeholder="Selecione a fonte..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📊 Todas as Campanhas</SelectItem>
              {campaignList?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={() => refetch()} disabled={isMetricsLoading}>
            <RefreshCw className={`w-3 h-3 ${isMetricsLoading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Link to="/insights"><Button size="sm" className="h-9 text-xs gap-1"><Lightbulb className="w-3 h-3"/> Insights Completos</Button></Link>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24">
        
        {/* =========================================
            2. OS KPIS DE SUPERFÍCIE (HORIZONTAL CARDS) 
            ========================================= */}
        <div>
          <h2 className="text-sm font-black uppercase text-foreground/80 tracking-widest mb-4 flex items-center gap-2">
            Radar de Performance <Badge variant="secondary" className="text-[10px] uppercase font-mono bg-secondary/80">{currFromStr} até {currToStr}</Badge>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <KpiCard title="Investimento" value={formatCurrency(m.spend)} varPct={calcVariation(m.spend, p.spend)} invertGood={true} />
             <KpiCard title={`Atrações (${m.resultType})`} value={formatNumber(m.results)} varPct={calcVariation(m.results, p.results)} />
             <KpiCard title={`CPA (Custo por ${m.resultType})`} value={formatCurrency(m.cpa)} varPct={calcVariation(m.cpa, p.cpa)} invertGood={true} />
             <KpiCard title="CTR Geral" value={formatPercent(m.ctr)} varPct={calcVariation(m.ctr, p.ctr)} />
             <KpiCard title="CPM" value={formatCurrency(m.cpm)} varPct={calcVariation(m.cpm, p.cpm)} invertGood={true} />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">

          {/* =========================================
              3. O FUNIL DINÂMICO CENTRAL (ESQUERDA 3 COLs)
              ========================================= */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-sm font-black uppercase text-foreground/80 tracking-widest flex items-center gap-2">
              <FilterIcon className="w-4 h-4" /> Trajetória do Usuário (Funil)
            </h2>
            <Card className="bg-card border-none ring-1 ring-border/50 shadow-md">
              <CardContent className="p-6 overflow-x-auto">
                 <div className="flex items-center min-w-[700px] justify-between gap-2 relative">
                    {/* Linha conectora no fundo */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-secondary -translate-y-1/2 rounded-full hidden md:block z-0"></div>

                    {/* BLOCO 1: ALCANCE / IMPRESSÃO */}
                    <div className="flex flex-col items-center bg-card z-10 p-4 border border-border rounded-xl w-[200px] shadow-sm relative group hover:border-primary/50 transition-colors">
                       <span className="text-xs font-bold uppercase text-muted-foreground mb-1"><Eye className="w-3 h-3 inline mr-1"/> Descoberta</span>
                       <span className="text-3xl font-black text-foreground mb-2">{formatNumber(m.impressions)}</span>
                       <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-mono">Impressões</span>
                    </div>

                    {/* Seta Com Taxa 1 */}
                    <div className="flex flex-col items-center z-10 px-2">
                       <span className={`text-xs font-bold px-2 py-1 rounded-full text-white mb-1 shadow-sm ${m.ctr >= BENCHMARKS.ctr ? 'bg-success' : 'bg-warning text-warning-foreground'}`}>
                          {m.ctr.toFixed(2)}% CTR
                       </span>
                       <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* BLOCO 2: CLIQUE / INTENÇÃO */}
                    <div className="flex flex-col items-center bg-card z-10 p-4 border border-border rounded-xl w-[200px] shadow-sm relative group hover:border-primary/50 transition-colors">
                       <span className="text-xs font-bold uppercase text-muted-foreground mb-1"><MousePointer className="w-3 h-3 inline mr-1"/> Engajamento</span>
                       <span className="text-3xl font-black text-foreground mb-2">{formatNumber(m.clicks)}</span>
                       <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-mono">Cliques de Link</span>
                       <span className="text-[10px] text-muted-foreground mt-2 font-mono">Custo: {formatCurrency(m.cpc)}/clique</span>
                    </div>

                    {/* Seta Com Taxa 2 */}
                    <div className="flex flex-col items-center z-10 px-2">
                       <span className={`text-xs font-bold px-2 py-1 rounded-full text-white mb-1 shadow-sm ${conversionRate >= BENCHMARKS.conversao ? 'bg-success' : 'bg-primary'}`}>
                          {conversionRate.toFixed(2)}% CV
                       </span>
                       <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* BLOCO 3: CONVERSÃO FINAL */}
                    <div className="flex flex-col items-center bg-card z-10 p-4 border border-border rounded-xl w-[200px] shadow-sm relative group ring-2 ring-primary/20">
                       <span className="text-xs font-bold uppercase text-primary mb-1"><Target className="w-3 h-3 inline mr-1"/> Conversão</span>
                       <span className="text-3xl font-black text-foreground mb-2">{formatNumber(m.results)}</span>
                       <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono uppercase font-bold">{m.resultType}s</span>
                       <span className="text-[10px] text-muted-foreground mt-2 font-mono">Custo: {formatCurrency(m.cpa)}/{m.resultType}</span>
                    </div>
                 </div>
              </CardContent>
            </Card>

            {/* =========================================
                5. TELA DE CRIATIVOS / RANKING INFERIOR
                ========================================= */}
            <div className="pt-6">
              <h2 className="text-sm font-black uppercase text-foreground/80 tracking-widest flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-orange-500" /> Batalha de Criativos (Performance Absoluta pelo CPA)
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {/* OS MELHORES */}
                <Card className="bg-card border-success/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Trophy className="w-24 h-24" /></div>
                  <CardContent className="p-5 relative z-10">
                    <h3 className="text-xs font-bold uppercase text-success mb-3 flex items-center gap-1"><ArrowRight className="w-3 h-3 rotate-45" /> Promessas Escalonáveis (Melhores)</h3>
                    <div className="space-y-3">
                      {creativeRanking?.best?.length ? creativeRanking.best.map((ad:any, i:number) => (
                        <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-success/5 border border-success/10">
                          <p className="text-xs font-bold truncate" title={ad.ad_name}>{ad.ad_name}</p>
                          <div className="flex justify-between items-center mt-1">
                             <span className="text-[10px] text-muted-foreground font-mono">CPA: {formatCurrency(ad.results>0 ? ad.spend/ad.results : ad.spend)}</span>
                             <span className="text-[10px] font-bold bg-success text-success-foreground px-1.5 py-0.5 rounded">{ad.results} resultados</span>
                          </div>
                        </div>
                      )) : <p className="text-xs text-muted-foreground">Poucos dados.</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* OS PIORES */}
                <Card className="bg-card border-destructive/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><AlertTriangle className="w-24 h-24" /></div>
                  <CardContent className="p-5 relative z-10">
                    <h3 className="text-xs font-bold uppercase text-destructive mb-3 flex items-center gap-1"><ArrowRight className="w-3 h-3 -rotate-45" /> Sangria no Orçamento (Piores)</h3>
                    <div className="space-y-3">
                      {creativeRanking?.worst?.length ? creativeRanking.worst.map((ad:any, i:number) => (
                        <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                           <p className="text-xs font-bold truncate" title={ad.ad_name}>{ad.ad_name}</p>
                           <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-muted-foreground font-mono">Gasto Lixo: {formatCurrency(ad.spend)}</span>
                              <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">{ad.results} resultados</span>
                           </div>
                        </div>
                      )) : <p className="text-xs text-muted-foreground">Poucos dados.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>

          {/* =========================================
              4. A CAMADA DE INTELIGÊNCIA DIREITA (1 COL)
              ========================================= */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase text-foreground/80 tracking-widest flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-warning" /> Auto-Insights Express
            </h2>
            <Card className="bg-card border-none ring-1 ring-border/50 shadow-md h-full">
              <CardContent className="p-0">
                 <div className="p-4 bg-secondary/30 border-b border-border text-xs text-muted-foreground leading-relaxed">
                   <strong>Aqui está o que está acontecendo:</strong> O algoritmo de regras varreu seu funil em {new Date().toLocaleTimeString('pt-BR')}.
                 </div>
                 <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                   {autoInsights.map((insight, idx) => (
                      <InsightItem 
                         key={idx} 
                         type={insight.type} 
                         title={insight.title} 
                         message={insight.message} 
                         action={insight.action} 
                      />
                   ))}
                 </div>
                 <div className="p-4 border-t border-border">
                   <Link to="/insights">
                      <Button variant="outline" className="w-full text-xs font-semibold h-8 rounded shrink shadow-sm flex items-center gap-2">
                         <SparklesIcon className="w-3 h-3 text-primary" /> Análise Profunda com Claude
                      </Button>
                   </Link>
                 </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}

