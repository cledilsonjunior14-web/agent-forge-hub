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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Icons
import {
  TrendingUp, TrendingDown, Settings as SettingsIcon, AlertCircle, 
  Lightbulb, ArrowRight, Target, MousePointer, Eye,
  RefreshCw, BarChart, Trophy, Flame, AlertTriangle, ShieldCheck,
  Filter as FilterIcon, Sparkles as SparklesIcon, ImageIcon, ExternalLink
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { insights_custom, listar_campanhas, obter_criativo_do_anuncio } from '@/services/metaApi';

// ==========================================
// CONFIGURAÇÕES E TEXTOS PERSONALIZÁVEIS
// ==========================================
const STRINGS = {
  headerTitle: "Consultor de Tráfego",
  headerSubtitle: "Operando em tempo real",
  btnUpdate: "Atualizar",
  btnInsights: "Insights IA Completos",
  titleKpis: "Radar de Performance",
  titleFunnel: "Trajetória do Usuário (Funil)",
  titleCreatives: "Batalha de Criativos",
  titleInsights: "Auto-Insights Express",
  txtBestAds: "Promessas Escalonáveis (Melhores)",
  txtWorstAds: "Sangria no Orçamento (Piores)",
  txtEmptyData: "Não há tráfego rodando neste período exato para popular todo o funil.",
  
  isCritCtrLow: "O criativo não está parando o dedo da audiência.",
  isCritCtrLowAction: "Testar novo criativo com gancho (hook) forte nos primeiros 3s.",
  isOppCtrHigh: "O tráfego está barato e engajado.",
  isOppCtrHighAction: "Aumente o orçamento da peça ou clone a campanha para escalar horizontal.",
  isAttCpcHigh: "Você está pagando caro pelo clique. Público saturado ou criativo desalinhado.",
  isAttCpcHighAction: "Renove a segmentação Advantage ou o ângulo de oferta.",
  isOppCpaDrop: "O custo por resultado entrou em queda de tração natural.",
  isOppCpaDropAction: "Momento excelente para escalar o budget da campanha viva (+20% ao dia).",
  isOppStable: "Operação saudável nos limiares.",
  isOppStableAction: "Deixe o algoritmo otimizar na fase de aprendizado da Meta."
};

const BENCHMARKS = {
  ctr: 1.5,
  cpc: 2.0,
  conversao: 5 
};

// ==========================================
// HELPERS
// ==========================================
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
    <Card className="bg-card border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-2">{title}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">{value}</h3>
          {(varPct !== 0 && varPct !== Infinity && !isNaN(varPct)) && (
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isGood ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
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
    opportunity: 'border-l-success bg-success/5 text-success'
  };
  const icons = {
    critical: <AlertTriangle className="h-5 w-5 text-destructive mr-2 flex-shrink-0" />,
    attention: <AlertCircle className="h-5 w-5 text-warning mr-2 flex-shrink-0" />,
    opportunity: <Lightbulb className="h-5 w-5 text-success mr-2 flex-shrink-0" />
  };

  return (
    <div className={`border-l-4 rounded-r-lg p-4 flex items-start shadow-sm transition-transform hover:scale-[1.01] ${colors[type as keyof typeof colors]}`}>
      {icons[type as keyof typeof icons]}
      <div className="flex-1">
        <h4 className="text-[13px] font-black opacity-90">{title}</h4>
        <p className="text-xs opacity-80 mt-1 mb-2 leading-relaxed">{message}</p>
        <span className="text-[10px] uppercase tracking-wider font-bold bg-background/50 px-2 py-1 rounded inline-block shadow-sm">🎯 Ação: {action}</span>
      </div>
    </div>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================
export default function DashboardPage() {
  const { dateRange, prevDateRange } = useFilters();
  const { token, accountId, hasMetaSetup, isLoading: isMetaSetupLoading } = useMetaContext();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedAdModal, setSelectedAdModal] = useState<any>(null); // Triggers Ad Preview Modal

  const currFromStr = dateRange.from.toISOString().split('T')[0];
  const currToStr = dateRange.to.toISOString().split('T')[0];
  const currTimeRangeJSON = JSON.stringify({ since: currFromStr, until: currToStr });

  const prevTimeRangeJSON = JSON.stringify({ 
      since: prevDateRange.from.toISOString().split('T')[0], 
      until: prevDateRange.to.toISOString().split('T')[0] 
  });

  // 1. LISTA DE CAMPANHAS
  const { data: campaignList } = useQuery({
    queryKey: ['meta-campaigns-list', accountId],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await listar_campanhas(token, accountId, 100);
      return (res as any).data || res || [];
    }
  });

  // 2. MÉTRICAS CORE (ATUAL)
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

  // 3. MÉTRICAS (ANTERIOR) PARA COMPARAÇÃO
  const prevQueryParams = { ...queryParams, time_range: prevTimeRangeJSON };
  const { data: prevMetrics } = useQuery({
    queryKey: ['meta-dash-prev', accountId, selectedCampaignId, prevDateRange.from.toISOString(), prevDateRange.to.toISOString()],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, prevQueryParams as any);
      const data = (res as any).data || res;
      if (!data || data.length === 0) return null;
      return parseMetricsObject(data[0]);
    }
  });

  // 4. RANKING CRIATIVOS COM ENRIQUECIMENTO DE MODAL
  const rankingParams = selectedCampaignId === 'all' ? 
    { level: 'ad', fields: 'ad_id,ad_name,spend,actions,cpc,ctr', time_range: currTimeRangeJSON, limit: 150 } 
    : 
    { level: 'ad', campaign_id: selectedCampaignId, fields: 'ad_id,ad_name,spend,actions,cpc,ctr', time_range: currTimeRangeJSON, limit: 100 };

  const { data: creativeRanking } = useQuery({
    queryKey: ['meta-dash-creatives', accountId, selectedCampaignId, currFromStr, currToStr],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, rankingParams as any);
      const data = (res as any).data || res || [];
      const parsed = data.map((d: any) => {
         return {
            ...parseMetricsObject(d),
            ad_id: d.ad_id,
            ad_name: d.ad_name,
            creativeDetails: null // Preenchido no Promise.all
         };
      }).filter((m: any) => m.spend > 0);

      const sorted = parsed.sort((a: any, b: any) => {
         const cpaA = a.results > 0 ? a.spend / a.results : 9999 + a.spend;
         const cpaB = b.results > 0 ? b.spend / b.results : 9999 + b.spend;
         return cpaA - cpaB;
      });

      const avgCpa = sorted.length ? sorted.reduce((sum: number, c: any) => sum + (c.results>0 ? c.spend/c.results : 0), 0) / sorted.filter((c:any)=>c.results>0).length : 0;

      const best = sorted.slice(0, 3);
      const worst = sorted.slice(-3).reverse(); 

      // Buscar detalhes aprofundados para os modais
      async function enrichAds(adsList: any[]) {
        return Promise.all(adsList.map(async (ad: any) => {
           try {
              if (!ad.ad_id) return ad;
              const adInfo = await obter_criativo_do_anuncio(token, ad.ad_id);
              ad.creativeDetails = adInfo?.creative || null;
           } catch {
              // ignora erro silencioso
           }
           return ad;
        }));
      }

      return {
        best: await enrichAds(best),
        worst: await enrichAds(worst),
        medianCpa: isNaN(avgCpa) ? 0 : avgCpa
      };
    }
  });


  // ==========================================
  // PARSERS
  // ==========================================
  function parseMetricsObject(m: any) {
    const isWpp = m.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
    const isLead = m.actions?.find((a: any) => a.action_type === 'lead');
    const isPurch = m.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');
    
    // Auto-detect do núcleo do funnel
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

  // Prepara variaveis unificadas do Funil
  const m = currMetrics || { spend:0, impressions:0, clicks:0, results:0, cpa:0, ctr:0, cpc:0, cpm:0, resultType:'evento' };
  const p = prevMetrics || { spend:0, impressions:0, clicks:0, results:0, cpa:0, ctr:0, cpc:0, cpm:0 };
  const conversionRate = m.clicks > 0 ? (m.results / m.clicks) * 100 : 0;

  // Auto-Insights System
  const autoInsights = useMemo(() => {
    if (!currMetrics) return [];
    const _in = [];
    if (currMetrics.ctr > 0 && currMetrics.ctr < BENCHMARKS.ctr) {
      _in.push({ type: 'critical', title: `CTR Baixo (${currMetrics.ctr.toFixed(2)}%)`, message: STRINGS.isCritCtrLow, action: STRINGS.isCritCtrLowAction });
    } else if (currMetrics.ctr >= BENCHMARKS.ctr + 1) {
      _in.push({ type: 'opportunity', title: `Tração Monstra (${currMetrics.ctr.toFixed(2)}% CTR)`, message: STRINGS.isOppCtrHigh, action: STRINGS.isOppCtrHighAction });
    }

    if (currMetrics.cpc > BENCHMARKS.cpc) {
      _in.push({ type: 'attention', title: `CPC em ${formatCurrency(currMetrics.cpc)}`, message: STRINGS.isAttCpcHigh, action: STRINGS.isAttCpcHighAction });
    }
    
    if (currMetrics.results > 0 && currMetrics.cpa < (prevMetrics?.cpa || 9999)) {
       _in.push({ type: 'opportunity', title: `CPA Baixo: ${formatCurrency(currMetrics.cpa)}`, message: STRINGS.isOppCpaDrop, action: STRINGS.isOppCpaDropAction });
    }

    if (_in.length === 0) {
      _in.push({ type: 'opportunity', title: STRINGS.isOppStable, message: 'Benchmark respeitado globalmente.', action: STRINGS.isOppStableAction });
    }
    return _in;
  }, [currMetrics, prevMetrics]);


  // ==========================================
  // RENDER UI
  // ==========================================

  if (isMetaSetupLoading) return <div className="p-20 flex justify-center"><BarChart className="animate-spin w-10 h-10 text-primary" /></div>;
  if (!hasMetaSetup) return (
     <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
       <div className="rounded-full bg-secondary p-6 mb-4"><SettingsIcon className="h-10 w-10 text-muted-foreground" /></div>
       <h2 className="text-xl font-bold mb-2">Conecte o Cérebro</h2>
       <p className="text-muted-foreground max-w-md mb-6">A agência precisa vincular a Token Meta nas configurações para alimentar a consultoria inteligente desta página.</p>
       <Link to="/settings"><Button>Ligar no Facebook Ads</Button></Link>
     </div>
  );

  return (
    <div className="bg-background min-h-[100dvh]">
      
      {/* HEADER FIXO - CONSULTOR UX */}
      <div className="sticky top-0 z-20 w-full border-b border-border bg-background/95 backdrop-blur shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary shadow-sm hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">{STRINGS.headerTitle}</h1>
            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 opacity-80">
               <span className="w-1.5 h-1.5 rounded-full bg-success ring-2 ring-success/20 animate-pulse"></span> {STRINGS.headerSubtitle}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full xl:w-auto">
          
          {/* O NOVO DATE-RANGE PICKER COMPLETO */}
          <DateRangePicker />

          {/* Seletor de Campanhas Dinâmico */}
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[220px] h-9 bg-card font-semibold text-xs border-border flex-1 max-w-[220px] truncate focus:ring-primary/50">
              <SelectValue placeholder="Alvo Analítico..." />
            </SelectTrigger>
            <SelectContent className="max-w-[300px]">
              <SelectItem value="all" className="font-bold border-b border-border mb-1">📊 Mostrar Tudo (Base Global)</SelectItem>
              {campaignList?.map((c: any) => (
                <SelectItem key={c.id} value={c.id} className="text-xs truncate">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="default" size="sm" className="h-9 gap-1.5 font-bold shadow-md shadow-primary/20 hover:scale-[1.03] transition-transform active:scale-95 text-xs px-3" onClick={() => refetch()} disabled={isMetricsLoading}>
            <RefreshCw className={`w-3.5 h-3.5 ${isMetricsLoading ? 'animate-spin' : ''}`} /> {STRINGS.btnUpdate}
          </Button>

          <Link to="/insights">
            <Button size="sm" variant="outline" className="h-9 gap-1.5 text-[10px] uppercase font-black tracking-wider text-muted-foreground hover:text-foreground">
               <SparklesIcon className="w-3.5 h-3.5 text-orange-400" /> {STRINGS.btnInsights}
            </Button>
          </Link>

        </div>
      </div>

      <div className="p-6 max-w-[1400px] mx-auto space-y-8 pb-24">
        
        {/* ======================= KPIs ======================== */}
        <div>
          <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest mb-3 flex items-center gap-1.5">
            <BarChart className="w-3 h-3" /> {STRINGS.titleKpis}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             <KpiCard title="Investimento (Spend)" value={formatCurrency(m.spend)} varPct={calcVariation(m.spend, p.spend)} invertGood={true} />
             <KpiCard title={`Volume (${m.resultType})`} value={formatNumber(m.results)} varPct={calcVariation(m.results, p.results)} />
             <KpiCard title={`CPA Global`} value={formatCurrency(m.cpa)} varPct={calcVariation(m.cpa, p.cpa)} invertGood={true} />
             <KpiCard title="CTR Geral (Ads)" value={formatPercent(m.ctr)} varPct={calcVariation(m.ctr, p.ctr)} />
             <KpiCard title="Custo Rel. (CPM)" value={formatCurrency(m.cpm)} varPct={calcVariation(m.cpm, p.cpm)} invertGood={true} />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">

          {/* =========================================
              FUNIL OTIMIZADO E RANKING (ESQUERDA)
              ========================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* FUNIL DINÂMICO NÚCLEO ZERO */}
            <div className="space-y-3">
              <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest flex items-center gap-1.5">
                <FilterIcon className="w-3 h-3" /> {STRINGS.titleFunnel}
              </h2>
              
              <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm overflow-hidden ring-1 ring-border shadow-inner">
                <CardContent className="p-6 overflow-x-auto min-h-[160px] flex items-center">
                   
                   {m.impressions === 0 && !isMetricsLoading ? (
                      <div className="w-full text-center text-xs font-bold text-muted-foreground py-8 opacity-70">
                        {STRINGS.txtEmptyData}
                      </div>
                   ) : (
                     <div className="flex items-center w-full min-w-[750px] justify-between relative mx-auto">
                        <div className="absolute top-1/2 left-10 right-10 h-1 bg-border/50 -translate-y-1/2 rounded-full -z-10 shadow-inner hidden md:block"></div>

                        {/* BLOCO IMPRESSÃO */}
                        <div className="flex flex-col items-center bg-card z-10 p-5 pt-4 border border-border rounded-xl w-[220px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-background">
                           <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1 flex items-center gap-1 opacity-80"><Eye className="w-3 h-3"/> Descoberta</span>
                           <span className="text-4xl font-black text-foreground mb-1 tracking-tighter">{formatNumber(m.impressions)}</span>
                           <span className="text-[9px] bg-secondary/80 text-secondary-foreground font-black px-2 py-0.5 rounded-sm uppercase tracking-wider opacity-80">Impressões</span>
                        </div>

                        {/* VAZAMENTO 1 */}
                        <div className="flex flex-col items-center z-10 px-0.5 transform -translate-y-2">
                           <span className={`text-[11px] font-black px-2.5 py-1 rounded shadow-sm mb-1 ${m.ctr >= BENCHMARKS.ctr ? 'bg-success text-success-foreground' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
                              {m.ctr.toFixed(2)}% CTR
                           </span>
                           <ArrowRight className="w-5 h-5 text-border/80" />
                        </div>

                        {/* BLOCO CLIQUES */}
                        <div className="flex flex-col items-center bg-card z-10 p-5 pt-4 border border-border rounded-xl w-[220px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-background">
                           <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1 flex items-center gap-1 opacity-80"><MousePointer className="w-3 h-3"/> Intenção</span>
                           <span className="text-4xl font-black text-foreground mb-1 tracking-tighter">{formatNumber(m.clicks)}</span>
                           <span className="text-[9px] bg-secondary/80 text-secondary-foreground font-black px-2 py-0.5 rounded-sm uppercase tracking-wider opacity-80">Cliques</span>
                           <span className="text-[10px] font-bold text-muted-foreground mt-3 tracking-tight bg-secondary/30 px-2 py-0.5 rounded">CPC {formatCurrency(m.cpc)}</span>
                        </div>

                        {/* VAZAMENTO 2 */}
                        <div className="flex flex-col items-center z-10 px-0.5 transform -translate-y-2">
                           <span className={`text-[11px] font-black px-2.5 py-1 rounded shadow-sm mb-1 ${conversionRate >= BENCHMARKS.conversao ? 'bg-success text-success-foreground' : 'bg-primary/10 border border-primary/20 text-primary'}`}>
                              {conversionRate.toFixed(2)}% CV
                           </span>
                           <ArrowRight className="w-5 h-5 text-border/80" />
                        </div>

                        {/* BLOCO CONVERSÃO TARGET */}
                        <div className="flex flex-col items-center bg-primary/5 z-10 p-5 pt-4 border-2 border-primary/50 rounded-xl w-[220px] shadow-[0_8px_30px_rgba(var(--primary),0.1)] ring-2 ring-primary/20 ring-offset-2 ring-offset-background relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>
                           <span className="text-[10px] font-black tracking-widest uppercase text-primary mb-1 flex items-center gap-1 drop-shadow-sm"><Target className="w-3 h-3"/> Aquisição</span>
                           <span className="text-4xl font-black text-primary mb-1 tracking-tighter drop-shadow-sm">{formatNumber(m.results)}</span>
                           <span className="text-[9px] bg-primary text-primary-foreground font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">{m.resultType}</span>
                           <span className="text-[10px] font-bold text-primary/80 mt-3 tracking-tight bg-background/50 backdrop-blur px-2 py-0.5 rounded shadow-sm border border-primary/10">CPA {formatCurrency(m.cpa)}</span>
                        </div>
                     </div>
                   )}
                </CardContent>
              </Card>
            </div>

            {/* RANKING PREMIUM + INTERATIVIDADE HOVER/CLICK */}
            <div className="pt-2">
              <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest flex items-center gap-1.5 mb-3">
                <Flame className="w-3 h-3 text-orange-500" /> {STRINGS.titleCreatives}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* CAIXA DE MELHORES */}
                <Card className="bg-success/5 border-success/30 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 text-success opacity-5 pointer-events-none"><Trophy className="w-40 h-40" /></div>
                  <CardContent className="p-4 relative z-10 flex flex-col h-full">
                    <h3 className="text-[11px] font-black uppercase text-success mb-4 flex items-center gap-1.5 opacity-90 tracking-wider">
                       <ArrowRight className="w-3.5 h-3.5 -rotate-45" /> {STRINGS.txtBestAds}
                    </h3>
                    
                    <div className="space-y-2 flex-grow">
                      {creativeRanking?.best?.length ? creativeRanking.best.map((ad:any, i:number) => {
                         const thumbSource = ad.creativeDetails?.thumbnail_url || ad.creativeDetails?.image_url;
                         return (
                           <div 
                             key={i} 
                             onClick={() => setSelectedAdModal({...ad, rank: 'best'})}
                             className="flex gap-3 bg-background/80 p-2.5 rounded-lg border border-success/20 items-center hover:bg-background transition-all hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] cursor-pointer shadow-sm relative group/ad"
                           >
                              
                              {/* Hover tooltip stats */}
                              <div className="absolute right-2 top-2 opacity-0 group-hover/ad:opacity-100 transition-opacity bg-background/95 backdrop-blur px-2 py-1 rounded shadow text-[9px] font-mono text-muted-foreground border border-border z-10">
                                CTR: {formatPercent(ad.ctr)} | CPC: {formatCurrency(ad.cpc)}
                              </div>

                              {/* Mini-Thumb do Meta */}
                              <div className="w-12 h-12 bg-secondary rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50 relative">
                                 {thumbSource ? 
                                    <img src={thumbSource} className="w-full h-full object-cover" alt="Ad thumb" /> 
                                    : <ImageIcon className="w-4 h-4 text-muted-foreground opacity-50" />
                                 }
                              </div>

                              <div className="flex-1 min-w-0">
                                  {/* Tooltip nativo longo cortado no ellipsis */}
                                  <p className="text-xs font-bold truncate text-foreground/90" title={ad.ad_name}>{ad.ad_name}</p>
                                  <div className="flex justify-between items-center mt-1.5">
                                     <span className="text-[10px] font-mono text-muted-foreground font-semibold">CPA {formatCurrency(ad.results>0 ? ad.spend/ad.results : ad.spend)}</span>
                                     <Badge variant="default" className="bg-success hover:bg-success text-[9px] px-1.5 py-0 shadow-sm">{ad.results} cap</Badge>
                                  </div>
                              </div>
                           </div>
                         );
                      }) : <p className="text-xs text-muted-foreground italic text-center p-4">Aguardando performance escalar.</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* CAIXA DE PIORES */}
                <Card className="bg-destructive/5 border-destructive/30 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-6 -bottom-6 text-destructive opacity-5 pointer-events-none"><AlertTriangle className="w-32 h-32" /></div>
                  <CardContent className="p-4 relative z-10 flex flex-col h-full">
                    <h3 className="text-[11px] font-black uppercase text-destructive mb-4 flex items-center gap-1.5 opacity-90 tracking-wider">
                       <TrendingDown className="w-3.5 h-3.5" /> {STRINGS.txtWorstAds}
                    </h3>
                    
                    <div className="space-y-2 flex-grow">
                      {creativeRanking?.worst?.length ? creativeRanking.worst.map((ad:any, i:number) => {
                         const thumbSource = ad.creativeDetails?.thumbnail_url || ad.creativeDetails?.image_url;
                         return (
                           <div 
                             key={i} 
                             onClick={() => setSelectedAdModal({...ad, rank: 'worst'})}
                             className="flex gap-3 bg-background/80 p-2.5 rounded-lg border border-destructive/20 items-center transition-all hover:bg-background hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] cursor-pointer shadow-sm relative group/ad"
                           >
                              {/* Hover tooltip stats */}
                              <div className="absolute right-2 top-2 opacity-0 group-hover/ad:opacity-100 transition-opacity bg-background/95 backdrop-blur px-2 py-1 rounded shadow text-[9px] font-mono text-muted-foreground border border-border z-10 pointer-events-none">
                                CTR: {formatPercent(ad.ctr)} | CPC: {formatCurrency(ad.cpc)}
                              </div>

                              <div className="w-12 h-12 bg-secondary rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50 grayscale group-hover/ad:grayscale-0 transition-all">
                                 {thumbSource ? 
                                    <img src={thumbSource} className="w-full h-full object-cover" alt="Ad thumb" /> 
                                    : <ImageIcon className="w-4 h-4 text-muted-foreground opacity-50" />
                                 }
                              </div>

                              <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate text-foreground/90" title={ad.ad_name}>{ad.ad_name}</p>
                                  <div className="flex justify-between items-center mt-1.5">
                                     <span className="text-[10px] font-mono text-destructive/80 font-semibold">Gasto Lixo {formatCurrency(ad.spend)}</span>
                                     <Badge variant="destructive" className="bg-destructive/80 text-[9px] px-1.5 py-0 shadow-sm">{ad.results} cap</Badge>
                                  </div>
                              </div>
                           </div>
                         );
                      }) : <p className="text-xs text-muted-foreground italic text-center p-4">Não há ads ruins em detecção.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>

          {/* =========================================
              AUTO INSIGHTS BAR (DIREITA)
              ========================================= */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3 text-warning" /> {STRINGS.titleInsights}
            </h2>
            <Card className="bg-card border-none ring-1 ring-border shadow-md shadow-black/5 h-[calc(100%-2rem)] flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                 
                 <div className="p-4 bg-primary/5 border-b border-primary/10 text-[11px] text-muted-foreground font-semibold flex items-start gap-2 leading-relaxed tracking-wide">
                   <div className="bg-primary/20 rounded-full w-2 h-2 mt-1.5 shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse flex-shrink-0"></div> 
                   <span>A Inteligência Diagnóstica aplicou o framework comparando o período base: ({currFromStr} vs {prevDateRange.from.toISOString().split('T')[0]}).</span>
                 </div>
                 
                 <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[600px] lg:max-h-none scrollbar-thin">
                   {autoInsights.map((insight, idx) => (
                      <InsightItem 
                         key={`insight-${idx}`} 
                         type={insight.type} 
                         title={insight.title} 
                         message={insight.message} 
                         action={insight.action} 
                      />
                   ))}
                 </div>
                 
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* =========================================
          AD PREVIEW MODAL (RAIO-X DO CRIATIVO)
          ========================================= */}
      <Dialog open={!!selectedAdModal} onOpenChange={(o) => (!o && setSelectedAdModal(null))}>
         <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-0 gap-0 overflow-hidden mt-[5vh]">
             {selectedAdModal && (() => {
               const ad = selectedAdModal;
               const c = ad.creativeDetails || {};
               const thumb = c.thumbnail_url || c.image_url;
               const rankColor = ad.rank === 'best' ? 'text-success bg-success/10 border-success/30' : 'text-destructive bg-destructive/10 border-destructive/30';
               const rankIcon = ad.rank === 'best' ? <Trophy className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />;

               return (
                 <div className="flex flex-col md:flex-row h-full max-h-[80vh]">
                    
                    {/* Imagem Lateral */}
                    <div className="md:w-5/12 bg-secondary/30 flex items-center justify-center border-r border-border p-6 align-middle relative">
                       {thumb ? 
                         <img src={thumb} className="w-full max-h-[300px] md:max-h-full object-contain drop-shadow-lg rounded-md" alt="Preview"/> 
                         : 
                         <div className="text-center text-muted-foreground opacity-50 flex flex-col items-center gap-2">
                           <ImageIcon className="w-12 h-12 mx-auto" />
                           <p className="text-xs">Mídia indisponível na API</p>
                         </div>
                       }
                       <div className="absolute top-4 left-4 flex gap-2">
                          {c.call_to_action_type && (
                             <Badge className="bg-primary/80 backdrop-blur shadow">{c.call_to_action_type.replace(/_/g, ' ')}</Badge>
                          )}
                       </div>
                    </div>

                    {/* Dados Diagnósticos */}
                    <div className="md:w-7/12 flex flex-col bg-background relative">
                        <DialogHeader className="p-6 border-b border-border pb-4">
                           <DialogTitle className="text-lg font-black leading-tight flex items-start gap-2 pr-4">
                             {ad.ad_name}
                           </DialogTitle>
                           <p className="text-[10px] text-muted-foreground font-mono mt-1">ID: {ad.ad_id}</p>
                        </DialogHeader>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                           
                           {/* Placar Analítico */}
                           <div className={`p-4 rounded-xl border flex gap-3 ${rankColor}`}>
                              {rankIcon}
                              <div>
                                 <h4 className="text-sm font-bold opacity-90">Diagnóstico do Algoritmo</h4>
                                 <p className="text-xs opacity-80 mt-1">
                                   Este criativo está performando <b>{ad.rank === 'best' ? 'acima' : 'abaixo'} da média</b> do seu portfólio.
                                   O custo de conversão é de <span className="font-bold underline decoration-current underline-offset-2">{formatCurrency(ad.cpa)}</span>, enquanto a média da conta está em {formatCurrency(creativeRanking?.medianCpa || 0)}.
                                 </p>
                              </div>
                           </div>

                           {/* Copy (Texto Principal) */}
                           <div className="space-y-2">
                             <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Copy / Conteúdo Principal</h4>
                             <div className="text-sm text-foreground/90 whitespace-pre-wrap bg-secondary/20 p-4 rounded-lg border border-border/50 text-left leading-relaxed">
                                {c.body || c.title || <span className="italic opacity-50">Não especificado na extração de API.</span>}
                             </div>
                           </div>

                           {/* Métricas Drill-down */}
                           <div className="grid grid-cols-3 gap-3">
                              <div className="p-3 bg-secondary/10 rounded-lg border border-border/50 text-center">
                                 <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Custo (CPM)</p>
                                 <p className="text-sm font-mono font-bold text-foreground">{formatCurrency(ad.cpm)}</p>
                              </div>
                              <div className="p-3 bg-secondary/10 rounded-lg border border-border/50 text-center">
                                 <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Atração (CTR)</p>
                                 <p className="text-sm font-mono font-bold text-foreground">{formatPercent(ad.ctr)}</p>
                              </div>
                              <div className="p-3 bg-secondary/10 rounded-lg border border-border/50 text-center">
                                 <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Gasto (Spend)</p>
                                 <p className="text-sm font-mono font-bold text-foreground">{formatCurrency(ad.spend)}</p>
                              </div>
                           </div>

                        </div>
                    </div>
                 </div>
               );
             })()}
         </DialogContent>
      </Dialog>

    </div>
  );
}
