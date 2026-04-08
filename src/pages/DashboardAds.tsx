import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { useMetaContext } from '@/hooks/useMetaContext';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { differenceInDays, subDays } from 'date-fns';

// Componentes da Aplicação
import { AudienceCharts } from '@/components/charts/AudienceCharts';

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
  Filter as FilterIcon, Sparkles as SparklesIcon, ImageIcon, Pencil, X, PanelTopInactive, Users, ChevronDown, ArrowUp, ArrowDown, CheckSquare
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

import { Link } from 'react-router-dom';
import { insights_custom, listar_campanhas, listar_conjuntos, obter_criativo_do_anuncio } from '@/services/metaApi';

// ==========================================
// CONFIGURAÇÕES PADRÃO (FALLBACK)
// ==========================================
const DEFAULT_STRINGS = {
  headerTitle: "Consultor de Tráfego",
  headerSubtitle: "Operando em tempo real",
  btnUpdate: "Atualizar",
  btnInsights: "Insights IA Completos",
  titleKpis: "Radar de Performance",
  titleFunnel: "Trajetória do Usuário (Funil)",
  titleCreatives: "Batalha de Criativos",
  titleAdSets: "Saúde dos Conjuntos (Ad Sets)",
  titleInsights: "Auto-Insights Express",
  txtBestAds: "Promessas Escalonáveis",
  txtWorstAds: "Sangria no Orçamento",
  txtEmptyData: "Não há tráfego rodando neste período exato para popular todo o funil.",
  
  isCritCtrLow: "O criativo não está parando o dedo da audiência.",
  isCritCtrLowAction: "Testar novo criativo com gancho forte nos primeiros 3s.",
  isOppCtrHigh: "O tráfego está barato e engajado.",
  isOppCtrHighAction: "Aumente o orçamento da peça ou clone a campanha para escalar horizontal.",
  isAttCpcHigh: "Você está pagando caro pelo clique. Público saturado ou criativo desalinhado.",
  isAttCpcHighAction: "Renove a segmentação Advantage ou o ângulo de oferta.",
  isOppCpaDrop: "O custo por resultado entrou em queda de tração natural.",
  isOppCpaDropAction: "Momento excelente para escalar o budget (+20% ao dia).",
  isOppStable: "Operação saudável nos limiares.",
  isOppStableAction: "Deixe o algoritmo otimizar na fase de aprendizado da Meta."
};

const BENCHMARKS = { ctr: 1.5, cpc: 2.0, conversao: 5 };

function calcVariation(current: number, prev: number) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

// ==========================================
// COMPONENTES UX MINIS (Textos Customizados)
// ==========================================

function EditableText({ value, onChange, className, iconClassName = "w-3 h-3" }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  
  if (isEditing) {
    return (
      <input 
        autoFocus
        className={`bg-background text-foreground border-b border-primary focus:outline-none w-auto max-w-full px-1 ${className}`}
        style={{ width: `${Math.max(temp.length + 1, 5)}ch` }}
        value={temp} 
        onChange={e => setTemp(e.target.value)}
        onBlur={() => { onChange(temp); setIsEditing(false); }}
        onKeyDown={e => { if(e.key === 'Enter' || e.key === 'Escape') { onChange(temp); setIsEditing(false); } }}
      />
    );
  }
  return (
     <span className={`group/edit relative cursor-pointer hover:bg-secondary/40 px-1 -ml-1 rounded transition-colors inline-flex max-w-full items-center gap-1.5 ${className}`} onClick={() => {setTemp(value); setIsEditing(true);}} title="Clique para editar este texto">
        <span className="truncate">{value}</span>
        <Pencil className={`opacity-0 group-hover/edit:opacity-80 text-muted-foreground transition-opacity shrink-0 ${iconClassName}`} />
     </span>
  );
}

function KpiCard({ title, value, varPct, invertGood = false }: any) {
  const isUp = varPct >= 0;
  const isGood = invertGood ? !isUp : isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <Card className="bg-card border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors w-full min-w-0">
      <CardContent className="p-4 overflow-hidden">
        <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-2 truncate" title={title}>{title}</p>
        <div className="flex items-end justify-between flex-wrap gap-2">
          <h3 className="text-xl lg:text-2xl font-black text-foreground tracking-tight truncate">{value}</h3>
          {(varPct !== 0 && varPct !== Infinity && !isNaN(varPct)) && (
            <div className={`flex items-center gap-1 text-[10px] whitespace-nowrap font-bold px-2 py-0.5 rounded-full shrink-0 ${isGood ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
               <Icon className="h-3 w-3" />
               {Math.abs(varPct).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightItem({ type, title, message, action, texts, updateText }: any) {
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
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-black opacity-90 truncate">{title}</h4>
        <p className="text-xs opacity-80 mt-1 mb-2 leading-relaxed">
           <EditableText value={message} onChange={(v:any) => updateText(message === texts.isCritCtrLow ? 'isCritCtrLow' : 
                                                                    message === texts.isOppCtrHigh ? 'isOppCtrHigh' :
                                                                    message === texts.isAttCpcHigh ? 'isAttCpcHigh' :
                                                                    message === texts.isOppCpaDrop ? 'isOppCpaDrop' :
                                                                    message === texts.isOppStable ? 'isOppStable' : '', v)} />
        </p>
        <span className="text-[10px] uppercase tracking-wider font-bold bg-background/50 px-2 py-1 rounded inline-block shadow-sm">
          🎯 Ação: <EditableText value={action} onChange={(v:any) => updateText(action === texts.isCritCtrLowAction ? 'isCritCtrLowAction' : 
                                                                    action === texts.isOppCtrHighAction ? 'isOppCtrHighAction' :
                                                                    action === texts.isAttCpcHighAction ? 'isAttCpcHighAction' :
                                                                    action === texts.isOppCpaDropAction ? 'isOppCpaDropAction' :
                                                                    action === texts.isOppStableAction ? 'isOppStableAction' : '', v)} />
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { dateRange, prevDateRange } = useFilters();
  const { token, accountId, hasMetaSetup, isLoading: isMetaSetupLoading } = useMetaContext();

  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const toggleCampaign = (id: string) => {
     setSelectedCampaignIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
     setSelectedAdSetId('all'); // Reseta adset ao mexer em campanha plural
  };
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>('all');
  const [selectedAdModal, setSelectedAdModal] = useState<any>(null);
  const [adsetSort, setAdsetSort] = useState<{key: string, dir: 'asc'|'desc'}>({key: 'spend', dir: 'desc'});

  // ESTADO DE PERSONALIZAÇÃO
  const [texts, setTexts] = useState<typeof DEFAULT_STRINGS>(DEFAULT_STRINGS);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
     const savedTexts = localStorage.getItem('aib_custom_texts');
     if (savedTexts) setTexts({...DEFAULT_STRINGS, ...JSON.parse(savedTexts)});
     const savedHidden = localStorage.getItem('aib_hidden_panels');
     if (savedHidden) setHidden(JSON.parse(savedHidden));
  }, []);

  useEffect(() => {
     setSelectedAdSetId('all');
  }, [selectedCampaignIds]);

  const updateText = (key: keyof typeof DEFAULT_STRINGS, val: string) => {
    if(!key) return; 
    const novo = { ...texts, [key]: val || DEFAULT_STRINGS[key] };
    setTexts(novo);
    localStorage.setItem('aib_custom_texts', JSON.stringify(novo));
  };

  const isVisible = (panel: string) => !hidden.includes(panel);
  const togglePanel = (panel: string) => {
    const novo = hidden.includes(panel) ? hidden.filter(h => h !== panel) : [...hidden, panel];
    setHidden(novo);
    localStorage.setItem('aib_hidden_panels', JSON.stringify(novo));
  };

  const currFromStr = dateRange.from.toISOString().split('T')[0];
  const currToStr = dateRange.to.toISOString().split('T')[0];
  const currTimeRangeJSON = JSON.stringify({ since: currFromStr, until: currToStr });
  const prevTimeRangeJSON = JSON.stringify({ since: prevDateRange.from.toISOString().split('T')[0], until: prevDateRange.to.toISOString().split('T')[0] });

  // 1. SELECTORS DROPDOWN LISTS
  const { data: campaignList } = useQuery({ queryKey: ['meta-campaigns-list', accountId], enabled: hasMetaSetup, queryFn: async () => {
     const res = await listar_campanhas(token, accountId, 100);
     return Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
  }});
  const { data: adSetList } = useQuery({ 
     queryKey: ['meta-adsets-list', accountId, selectedCampaignIds], 
     enabled: hasMetaSetup && selectedCampaignIds.length > 0, 
     queryFn: async () => {
        // Pega todos os AdSets se a filtragem for flexível ou itera se multiplas (por ora, fetch geral e local filter para UX super rapida)
        const res = await listar_conjuntos(token, accountId, selectedCampaignIds[0] || 'all', 100);
        return Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
     }
  });
  
  // 2. MAIN KPIS
  const queryParams: any = selectedAdSetId !== 'all' ? { level: 'adset', adset_id: selectedAdSetId } 
       : { level: 'account' };
  
  if (selectedAdSetId === 'all' && selectedCampaignIds.length > 0) {
     queryParams.filtering = JSON.stringify([{ field: "campaign.id", operator: "IN", value: selectedCampaignIds }]);
  }

  queryParams.fields = 'impressions,clicks,spend,cpm,cpc,ctr,actions,purchase_roas';
  
  const { data: currMetrics, isLoading: isMetricsLoading, isFetching: isMetricsFetching } = useQuery({
    queryKey: ['meta-dash-curr', accountId, selectedCampaignIds, selectedAdSetId, currFromStr, currToStr],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, {...queryParams, time_range: currTimeRangeJSON});
      const data = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
      return data.length > 0 ? parseMetricsObject(data[0]) : null;
    }
  });

  const { data: prevMetrics } = useQuery({
    queryKey: ['meta-dash-prev', accountId, selectedCampaignIds, selectedAdSetId, prevDateRange.from.toISOString(), prevDateRange.to.toISOString()],
    enabled: hasMetaSetup,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, {...queryParams, time_range: prevTimeRangeJSON});
      const data = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
      return data.length > 0 ? parseMetricsObject(data[0]) : null;
    }
  });

  // 3. RANKINGS (AD SETS & CREATIVES)
  const rankingParamsBase: any = selectedAdSetId !== 'all' ? { level: 'ad', adset_id: selectedAdSetId }
      : { level: 'ad' };
  if (selectedAdSetId === 'all' && selectedCampaignIds.length > 0) {
      rankingParamsBase.filtering = JSON.stringify([{ field: "campaign.id", operator: "IN", value: selectedCampaignIds }]);
  }

  const { data: creativeRanking } = useQuery({
    queryKey: ['meta-dash-creatives', accountId, selectedCampaignIds, selectedAdSetId, currFromStr, currToStr],
    enabled: hasMetaSetup && isVisible('creatives'),
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...rankingParamsBase, fields: 'ad_id,ad_name,spend,actions,cpc,ctr', time_range: currTimeRangeJSON, limit: 150 });
      let data = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
      const parsed = data.map((d: any) => ({ ...parseMetricsObject(d), ad_id: d.ad_id, ad_name: d.ad_name, creativeDetails: null })).filter((m: any) => m.spend > 0);
      const sorted = parsed.sort((a: any, b: any) => {
         const cpaA = a.results > 0 ? a.spend / a.results : 9999 + a.spend;
         const cpaB = b.results > 0 ? b.spend / b.results : 9999 + b.spend;
         return cpaA - cpaB;
      });
      const avgCpa = sorted.length ? sorted.reduce((sum: number, c: any) => sum + (c.results>0 ? c.spend/c.results : 0), 0) / sorted.filter((c:any)=>c.results>0).length : 0;
      const best = sorted.slice(0, 3);
      const worst = sorted.slice(-3).reverse(); 

      async function enrichAds(adsList: any[]) {
        return Promise.all(adsList.map(async (ad: any) => {
           try { if (ad.ad_id) { ad.creativeDetails = (await obter_criativo_do_anuncio(token, ad.ad_id))?.creative || null; } } catch { } return ad;
        }));
      }
      return { best: await enrichAds(best), worst: await enrichAds(worst), medianCpa: isNaN(avgCpa) ? 0 : avgCpa };
    }
  });

  // ADSET RANKING (Saúde dos Conjuntos)
  const adsetRankingParams: any = { level: 'adset' };
  if (selectedCampaignIds.length > 0) {
      adsetRankingParams.filtering = JSON.stringify([{ field: "campaign.id", operator: "IN", value: selectedCampaignIds }]);
  }

  const { data: adSetRanking } = useQuery({
    queryKey: ['meta-dash-adset-ranking', accountId, selectedCampaignIds, currFromStr, currToStr],
    enabled: hasMetaSetup && isVisible('adsets') && selectedAdSetId === 'all',
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...adsetRankingParams, fields: 'adset_id,adset_name,spend,actions,cpc,ctr,cpm', time_range: currTimeRangeJSON, limit: 100 });
      let data = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
      return data.map((d: any) => ({ ...parseMetricsObject(d), adset_id: d.adset_id, adset_name: d.adset_name })).filter((m: any) => m.spend > 0);
    }
  });

  const sortedAdSets = useMemo(() => {
     if(!adSetRanking) return [];
     return [...adSetRanking].sort((a:any, b:any) => {
        let valA = a[adsetSort.key] || 0;
        let valB = b[adsetSort.key] || 0;
        if(adsetSort.key === 'cpa') {
           valA = a.results > 0 ? a.spend / a.results : a.spend;
           valB = b.results > 0 ? b.spend / b.results : b.spend;
        }
        if(adsetSort.dir === 'asc') return valA - valB;
        return valB - valA;
     });
  }, [adSetRanking, adsetSort]);


  // PARSERS
  function parseMetricsObject(m: any) {
    const isWpp = m.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
    const isLead = m.actions?.find((a: any) => a.action_type === 'lead');
    const isPurch = m.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');
    const resultAction = isPurch || isLead || isWpp || null;
    let resultType = isPurch ? 'compra' : isLead ? 'lead' : isWpp ? 'conversa' : 'clique';
    const results = Number(resultAction?.value || m.clicks || 0);

    return {
       spend: Number(m.spend || 0), impressions: Number(m.impressions || 0), clicks: Number(m.clicks || 0),
       ctr: Number(m.ctr || 0), cpc: Number(m.cpc || 0), cpm: Number(m.cpm || 0),
       results, resultType, roas: Number(m.purchase_roas?.[0]?.value || 0),
       cpa: results > 0 ? Number(m.spend || 0) / results : 0
    };
  }

  const m = currMetrics || { spend:0, impressions:0, clicks:0, results:0, cpa:0, ctr:0, cpc:0, cpm:0, resultType:'evento' };
  const p = prevMetrics || { spend:0, impressions:0, clicks:0, results:0, cpa:0, ctr:0, cpc:0, cpm:0 };
  const conversionRate = m.clicks > 0 ? (m.results / m.clicks) * 100 : 0;

  const autoInsights = useMemo(() => {
    if (!currMetrics) return [];
    const _in = [];
    if (m.ctr > 0 && m.ctr < BENCHMARKS.ctr) { _in.push({ type: 'critical', title: `CTR Baixo (${m.ctr.toFixed(2)}%)`, message: texts.isCritCtrLow, action: texts.isCritCtrLowAction }); } 
    else if (m.ctr >= BENCHMARKS.ctr + 1) { _in.push({ type: 'opportunity', title: `Tração Suprema (${m.ctr.toFixed(2)}% CTR)`, message: texts.isOppCtrHigh, action: texts.isOppCtrHighAction }); }
    if (m.cpc > BENCHMARKS.cpc) { _in.push({ type: 'attention', title: `CPC Salgado (${formatCurrency(m.cpc)})`, message: texts.isAttCpcHigh, action: texts.isAttCpcHighAction }); }
    if (m.results > 0 && m.cpa < (prevMetrics?.cpa || 9999)) { _in.push({ type: 'opportunity', title: `Custo Caindo (${formatCurrency(m.cpa)})`, message: texts.isOppCpaDrop, action: texts.isOppCpaDropAction }); }
    if (_in.length === 0) { _in.push({ type: 'opportunity', title: "Motor Saudável", message: texts.isOppStable, action: texts.isOppStableAction }); }
    return _in;
  }, [currMetrics, prevMetrics, texts]);

  if (isMetaSetupLoading) return <div className="p-20 flex justify-center"><BarChart className="animate-spin w-10 h-10 text-primary" /></div>;
  if (!hasMetaSetup) return (
     <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
       <div className="rounded-full bg-secondary p-6 mb-4"><SettingsIcon className="h-10 w-10 text-muted-foreground" /></div>
       <h2 className="text-xl font-bold mb-2">Conecte a Inteligência</h2><Link to="/settings"><Button>Vincular no Facebook Ads</Button></Link>
     </div>
  );

  return (
    <div className="bg-background min-h-[100dvh]">
      <div className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full xl:w-auto overflow-hidden">
          <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary shadow-sm"><ShieldCheck className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight truncate"><EditableText value={texts.headerTitle} onChange={(v: string) => updateText('headerTitle', v)} className="text-lg font-black" /></h1>
            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 opacity-80 truncate">
               <span className="w-1.5 h-1.5 rounded-full bg-success ring-2 ring-success/20 animate-pulse flex-shrink-0"></span> <EditableText value={texts.headerSubtitle} onChange={(v: string) => updateText('headerSubtitle', v)} className="text-[10px]" />
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full xl:w-auto">
          <DateRangePicker />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="outline" className="w-[180px] h-9 bg-card font-semibold text-xs border-border flex-1 max-w-[200px] shadow-sm justify-between truncate">
                  <span className="truncate">{selectedCampaignIds.length === 0 ? "📊 Todas as Campanhas" : `${selectedCampaignIds.length} Campanhas Selecionadas`}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px] max-h-[400px] overflow-y-auto" align="end">
               <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Foco Analítico</DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuCheckboxItem checked={selectedCampaignIds.length === 0} onCheckedChange={() => setSelectedCampaignIds([])} className="font-bold text-primary">Mostrar Tudo Global</DropdownMenuCheckboxItem>
               <DropdownMenuSeparator />
               {campaignList?.map((c: any) => (
                 <DropdownMenuCheckboxItem key={c.id} checked={selectedCampaignIds.includes(c.id)} onCheckedChange={() => toggleCampaign(c.id)} className="text-xs truncate" title={c.name}>
                    {c.name}
                 </DropdownMenuCheckboxItem>
               ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {selectedCampaignIds.length > 0 && (
            <Select value={selectedAdSetId} onValueChange={setSelectedAdSetId}>
              <SelectTrigger className="w-[180px] h-9 bg-card/50 ring-1 ring-primary/20 bg-primary/5 font-semibold text-xs border-border flex-1 max-w-[200px] truncate shadow-inner">
                 <SelectValue placeholder="Convergência AdSet" />
              </SelectTrigger>
              <SelectContent className="max-w-[300px]">
                <SelectItem value="all" className="font-bold border-b border-border mb-1 text-primary">⚡ Intersecção Global</SelectItem>
                {adSetList?.map((c: any) => (<SelectItem key={c.id} value={c.id} className="text-xs truncate">{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          )}

          <Button variant="default" size="sm" className="h-9 gap-1.5 font-bold shadow-md shadow-primary/20 text-xs px-3 min-w-max" onClick={() => queryClient.invalidateQueries()} disabled={isMetricsFetching}>
            <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 ${isMetricsFetching ? 'animate-spin' : ''}`} /> <EditableText value={texts.btnUpdate} onChange={(v:string) => updateText('btnUpdate', v)} />
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-8 pb-32">
        {isVisible('kpis') && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
              <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest flex items-center gap-1.5"><BarChart className="w-3 h-3 flex-shrink-0" /><EditableText value={texts.titleKpis} onChange={(v:string) => updateText('titleKpis', v)} /></h2>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10" onClick={() => togglePanel('kpis')}><X className="w-4 h-4"/></Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
               <KpiCard title="Investimento (Spend)" value={formatCurrency(m.spend)} varPct={calcVariation(m.spend, p.spend)} invertGood={true} />
               <KpiCard title={`Volume (${m.resultType})`} value={formatNumber(m.results)} varPct={calcVariation(m.results, p.results)} />
               <KpiCard title={`CPA Global`} value={formatCurrency(m.cpa)} varPct={calcVariation(m.cpa, p.cpa)} invertGood={true} />
               <KpiCard title="CTR Geral (Ads)" value={formatPercent(m.ctr)} varPct={calcVariation(m.ctr, p.ctr)} />
               <KpiCard title="Custo Rel. (CPM)" value={formatCurrency(m.cpm)} varPct={calcVariation(m.cpm, p.cpm)} invertGood={true} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`space-y-6 min-w-0 flex-1 transition-all duration-300 ${isVisible('insights') ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            
            {isVisible('funnel') && (
              <div className="space-y-3 min-w-0 animate-in fade-in zoom-in-95 duration-300 relative">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest flex items-center gap-1.5 truncate"><FilterIcon className="w-3 h-3 flex-shrink-0" /> <EditableText value={texts.titleFunnel} onChange={(v:string) => updateText('titleFunnel', v)} className="truncate" /></h2>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 ml-2" onClick={() => togglePanel('funnel')}><X className="w-4 h-4"/></Button>
                </div>
                <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm overflow-hidden ring-1 ring-border shadow-inner w-full min-w-0">
                  <CardContent className="p-4 sm:p-6 overflow-x-auto min-h-[160px] flex items-center scrollbar-thin scrollbar-thumb-muted">
                     {m.impressions === 0 && !isMetricsLoading ? (<div className="w-full text-center text-xs font-bold text-muted-foreground py-8 opacity-70"><EditableText value={texts.txtEmptyData} onChange={(v:string) => updateText('txtEmptyData', v)} /></div>
                     ) : (
                       <div className="flex items-center w-full min-w-[700px] justify-between relative mx-auto pb-2">
                          <div className="absolute top-1/2 left-10 right-10 h-1 bg-border/50 -translate-y-1/2 rounded-full -z-10 shadow-inner hidden sm:block"></div>
                          <div className="flex flex-col items-center bg-card z-10 p-4 border border-border rounded-xl w-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-primary/50 transition-colors">
                             <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1"><Eye className="w-3 h-3 inline mr-1"/> Descoberta</span>
                             <span className="text-3xl font-black text-foreground mb-1 tracking-tighter">{formatNumber(m.impressions)}</span>
                             <span className="text-[9px] bg-secondary/80 text-secondary-foreground font-black px-2 py-0.5 rounded-sm uppercase tracking-wider opacity-80">Impressões</span>
                          </div>
                          <div className="flex flex-col items-center z-10 px-0.5"><span className={`text-[10px] font-black px-2 py-1 rounded shadow-sm mb-1 ${m.ctr >= BENCHMARKS.ctr ? 'bg-success text-success-foreground' : 'bg-destructive/10 text-destructive'}`}>{m.ctr.toFixed(2)}% CTR</span><ArrowRight className="w-4 h-4 text-border" /></div>
                          <div className="flex flex-col items-center bg-card z-10 p-4 border border-border rounded-xl w-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-primary/50 transition-colors">
                             <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1"><MousePointer className="w-3 h-3 inline mr-1"/> Intenção</span>
                             <span className="text-3xl font-black text-foreground mb-1 tracking-tighter">{formatNumber(m.clicks)}</span>
                             <span className="text-[9px] bg-secondary/80 text-secondary-foreground font-black px-2 py-0.5 rounded-sm uppercase tracking-wider opacity-80">Cliques</span>
                             <span className="text-[9px] font-bold text-muted-foreground mt-2 bg-secondary/30 px-2 py-0.5 rounded">CPC {formatCurrency(m.cpc)}</span>
                          </div>
                          <div className="flex flex-col items-center z-10 px-0.5"><span className={`text-[10px] font-black px-2 py-1 rounded shadow-sm mb-1 ${conversionRate >= BENCHMARKS.conversao ? 'bg-success text-success-foreground' : 'bg-primary/10 text-primary'}`}>{conversionRate.toFixed(2)}% CV</span><ArrowRight className="w-4 h-4 text-border" /></div>
                          <div className="flex flex-col items-center bg-primary/5 z-10 p-4 border-2 border-primary/50 rounded-xl w-[200px] shadow-[0_8px_30px_rgba(var(--primary),0.1)] ring-2 ring-primary/20 ring-offset-2 ring-offset-background group hover:scale-[1.02] transition-transform cursor-default">
                             <span className="text-[10px] font-black tracking-widest uppercase text-primary mb-1"><Target className="w-3 h-3 inline mr-1"/> Aquisição</span>
                             <span className="text-3xl font-black text-primary mb-1 tracking-tighter drop-shadow-sm">{formatNumber(m.results)}</span>
                             <span className="text-[9px] bg-primary text-primary-foreground font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">{m.resultType}</span>
                             <span className="text-[9px] font-bold text-primary/80 mt-2 bg-background/50 backdrop-blur px-2 py-0.5 rounded shadow-sm border border-primary/10">CPA {formatCurrency(m.cpa)}</span>
                          </div>
                       </div>
                     )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ADSETS RANKING - Só exibe se não escondeu e se houver AdSets multi, i.e., Drilldown adset == 'all' */}
            {isVisible('adsets') && selectedAdSetId === 'all' && adSetRanking && adSetRanking.length > 0 && (
              <div className="pt-2 min-w-0 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest flex items-center gap-1.5 truncate"><Users className="w-3 h-3 text-cyan-500 flex-shrink-0" /> <EditableText value={texts.titleAdSets} onChange={(v:string) => updateText('titleAdSets', v)} /></h2>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 ml-2" onClick={() => togglePanel('adsets')}><X className="w-4 h-4"/></Button>
                </div>
                <Card className="bg-card shadow-sm ring-1 ring-background overflow-hidden">
                   <CardContent className="p-0 overflow-x-auto">
                      <table className="w-full text-left text-xs text-muted-foreground">
                         <thead className="bg-secondary/20 border-b border-border text-[10px] uppercase font-black tracking-wider">
                           <tr>
                             <th className="p-3 pl-4">Nome do Conjunto</th>
                             <th className="p-3 text-right cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setAdsetSort({key:'spend', dir: adsetSort.key==='spend'&&adsetSort.dir==='desc'?'asc':'desc'})}>
                                Gasto (Saída) {adsetSort.key==='spend' && (adsetSort.dir==='desc'?<ArrowDown className="w-3 h-3 inline"/>:<ArrowUp className="w-3 h-3 inline"/>)}
                             </th>
                             <th className="p-3 text-right cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setAdsetSort({key:'results', dir: adsetSort.key==='results'&&adsetSort.dir==='desc'?'asc':'desc'})}>
                                Aquis. (Volume) {adsetSort.key==='results' && (adsetSort.dir==='desc'?<ArrowDown className="w-3 h-3 inline"/>:<ArrowUp className="w-3 h-3 inline"/>)}
                             </th>
                             <th className="p-3 text-right pr-4 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setAdsetSort({key:'cpa', dir: adsetSort.key==='cpa'&&adsetSort.dir==='asc'?'desc':'asc'})}>
                                CPA (Custo Saúde) {adsetSort.key==='cpa' && (adsetSort.dir==='asc'?<ArrowUp className="w-3 h-3 inline"/>:<ArrowDown className="w-3 h-3 inline"/>)}
                             </th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-border/50">
                            {sortedAdSets.map((adset: any, i:number) => {
                               const thisCpa = adset.results > 0 ? adset.spend / adset.results : adset.spend;
                               const globalCpa = m.cpa || 0;
                               const isGood = thisCpa <= (globalCpa * 1.1) && adset.results > 0;
                               const isBad = thisCpa > (globalCpa * 1.5) || adset.results === 0;

                               return (
                                 <tr key={adset.adset_id} className={`hover:bg-secondary/10 transition-colors ${isGood ? 'bg-success/5' : isBad ? 'bg-destructive/5' : ''}`}>
                                   <td className="p-3 pl-4 font-bold text-foreground max-w-[150px] truncate" title={adset.adset_name}>{adset.adset_name}</td>
                                   <td className="p-3 text-right font-mono text-foreground/80">{formatCurrency(adset.spend)}</td>
                                   <td className="p-3 text-right font-black text-foreground">{adset.results}</td>
                                   <td className="p-3 text-right pr-4">
                                      <Badge variant="outline" className={`font-mono text-[9px] px-1.5 py-0 shadow-sm ${isGood ? 'text-success border-success/30 bg-success/10' : isBad ? 'text-destructive border-destructive/30 bg-destructive/10' : ''}`}>
                                        {formatCurrency(thisCpa)}
                                      </Badge>
                                   </td>
                                 </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </CardContent>
                </Card>
              </div>
            )}

            {isVisible('creatives') && (
              <div className="pt-2 min-w-0 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest flex items-center gap-1.5 truncate"><Flame className="w-3 h-3 text-orange-500 flex-shrink-0" /> <EditableText value={texts.titleCreatives} onChange={(v:string) => updateText('titleCreatives', v)} /></h2>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 ml-2" onClick={() => togglePanel('creatives')}><X className="w-4 h-4"/></Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="bg-success/5 border-success/30 shadow-sm ... ring-1 ring-background">
                    <CardContent className="p-4 flex flex-col h-full min-w-0 relative overflow-hidden group">
                      <div className="absolute -right-10 -top-10 text-success opacity-5 pointer-events-none transform group-hover:scale-110 transition-transform"><Trophy className="w-40 h-40" /></div>
                      <h3 className="text-[11px] font-black uppercase text-success mb-4 flex items-center gap-1.5 opacity-90 z-10 w-full truncate"><ArrowRight className="w-3.5 h-3.5 -rotate-45 shrink-0" /> <EditableText value={texts.txtBestAds} onChange={(v:string) => updateText('txtBestAds', v)} /></h3>
                      <div className="space-y-2 flex-grow z-10">
                        {creativeRanking?.best?.length ? creativeRanking.best.map((ad:any, i:number) => (
                           <div key={i} onClick={() => setSelectedAdModal({...ad, rank: 'best'})} className="flex gap-3 bg-background/80 p-2.5 rounded-lg border border-success/20 items-center hover:bg-background transition-all hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] cursor-pointer shadow-sm relative group/ad">
                              <div className="absolute right-2 top-2 opacity-0 group-hover/ad:opacity-100 transition-opacity bg-background/95 backdrop-blur px-2 py-1 rounded shadow text-[9px] font-mono text-muted-foreground border border-border z-20 pointer-events-none">CTR: {formatPercent(ad.ctr)} | CPC: {formatCurrency(ad.cpc)}</div>
                              <div className="w-12 h-12 bg-secondary rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50 relative">{ad.creativeDetails?.image_url || ad.creativeDetails?.thumbnail_url ? <img src={ad.creativeDetails.image_url || ad.creativeDetails.thumbnail_url} className="w-full h-full object-cover" alt="thumb" /> : <ImageIcon className="w-4 h-4 text-muted-foreground opacity-50" />}</div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate text-foreground/90 w-full" title={ad.ad_name}>{ad.ad_name}</p>
                                  <div className="flex justify-between items-center mt-1.5 gap-2"><span className="text-[10px] font-mono text-muted-foreground font-semibold truncate shrink-0">CPA {formatCurrency(ad.results>0 ? ad.spend/ad.results : ad.spend)}</span><Badge variant="default" className="bg-success hover:bg-success text-[9px] px-1.5 py-0 shadow-sm shrink-0">{ad.results} cap</Badge></div>
                              </div>
                           </div>
                        )) : <p className="text-xs text-muted-foreground p-4">Aguardando dados.</p>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-destructive/5 border-destructive/30 shadow-sm ... ring-1 ring-background">
                    <CardContent className="p-4 flex flex-col h-full min-w-0 relative overflow-hidden group">
                      <div className="absolute -right-6 -bottom-6 text-destructive opacity-5 pointer-events-none transform group-hover:-rotate-12 transition-transform"><AlertTriangle className="w-32 h-32" /></div>
                      <h3 className="text-[11px] font-black uppercase text-destructive mb-4 flex items-center gap-1.5 opacity-90 z-10 w-full truncate"><TrendingDown className="w-3.5 h-3.5 shrink-0" /> <EditableText value={texts.txtWorstAds} onChange={(v:string) => updateText('txtWorstAds', v)} /></h3>
                      <div className="space-y-2 flex-grow z-10">
                        {creativeRanking?.worst?.length ? creativeRanking.worst.map((ad:any, i:number) => (
                           <div key={i} onClick={() => setSelectedAdModal({...ad, rank: 'worst'})} className="flex gap-3 bg-background/80 p-2.5 rounded-lg border border-destructive/20 items-center transition-all hover:bg-background hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] cursor-pointer shadow-sm relative group/ad">
                              <div className="absolute right-2 top-2 opacity-0 group-hover/ad:opacity-100 transition-opacity bg-background/95 backdrop-blur px-2 py-1 rounded shadow text-[9px] font-mono text-muted-foreground border border-border z-20 pointer-events-none">CTR: {formatPercent(ad.ctr)} | CPC: {formatCurrency(ad.cpc)}</div>
                              <div className="w-12 h-12 bg-secondary rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50 grayscale group-hover/ad:grayscale-0 transition-all">{ad.creativeDetails?.image_url || ad.creativeDetails?.thumbnail_url ? <img src={ad.creativeDetails.image_url || ad.creativeDetails.thumbnail_url} className="w-full h-full object-cover" alt="thumb" /> : <ImageIcon className="w-4 h-4 text-muted-foreground opacity-50" />}</div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate text-foreground/90 w-full" title={ad.ad_name}>{ad.ad_name}</p>
                                  <div className="flex justify-between items-center mt-1.5 gap-2"><span className="text-[10px] font-mono text-destructive/80 font-semibold truncate shrink-0">Lixo {formatCurrency(ad.spend)}</span><Badge variant="destructive" className="bg-destructive/80 text-[9px] px-1.5 py-0 shadow-sm shrink-0">{ad.results} cap</Badge></div>
                              </div>
                           </div>
                        )) : <p className="text-xs text-muted-foreground p-4">Não há ads críticos.</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* CHARTS DA API BREAKDOWNS (NOVO) */}
            <AudienceCharts 
               selectedCampaignIds={selectedCampaignIds} 
               selectedAdSetId={selectedAdSetId} 
               isVisible={isVisible('audience')}
               onClose={() => togglePanel('audience')}
               texts={texts}
            />

          </div>

          {isVisible('insights') && (
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3 min-w-0 h-[calc(100vh-140px)] animate-in fade-in slide-in-from-right-5 duration-500 max-h-[1000px]">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest flex items-center gap-1.5 truncate"><Lightbulb className="w-3 h-3 text-warning flex-shrink-0" /><EditableText value={texts.titleInsights} onChange={(v:string) => updateText('titleInsights', v)} className="truncate" /></h2>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2" onClick={() => togglePanel('insights')}><X className="w-4 h-4"/></Button>
              </div>
               <Card className="bg-card border-none ring-1 ring-border shadow-md shadow-black/5 h-[calc(100%-2rem)] flex flex-col min-w-0">
                <CardContent className="p-0 flex flex-col h-full overflow-hidden">
                   <div className="p-4 bg-primary/5 border-b border-primary/10 text-[11px] text-muted-foreground font-semibold flex items-start gap-2 leading-relaxed tracking-wide">
                     <div className="bg-primary/20 rounded-full w-2 h-2 mt-1.5 shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse flex-shrink-0"></div> 
                     <span>Inteligência AIB aplicada base ({currFromStr} vs {prevDateRange.from.toISOString().split('T')[0]}).</span>
                   </div>
                   <div className="p-4 space-y-3 flex-1 overflow-y-auto scrollbar-thin">
                     {autoInsights.map((insight, idx) => (<InsightItem key={idx} type={insight.type} title={insight.title} message={insight.message} action={insight.action} texts={texts} updateText={updateText}/>))}
                   </div>
                   <div className="p-4 border-t border-border bg-card/80 backdrop-blur shrink-0 hidden md:block">
                     <Link to="/insights"><Button variant="default" className="w-full text-xs font-black uppercase h-10 shadow-lg shadow-primary/20"><SparklesIcon className="w-4 h-4 mr-2 text-orange-300" /> Claude Central</Button></Link>
                   </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      {hidden.length > 0 && (
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce cursor-pointer justify-center flex" onClick={() => {setHidden([]); localStorage.removeItem('aib_hidden_panels')}}>
            <Badge variant="secondary" className="px-4 py-2 font-black text-xs shadow-xl border border-primary/20 bg-background hover:bg-secondary cursor-pointer gap-2 opacity-90 hover:opacity-100 transition-opacity"><PanelTopInactive className="w-4 h-4 text-primary" /> Restaurar Blocos Ocultos ({hidden.length})</Badge>
         </div>
      )}

      {/* AD PREVIEW MODAL */}
      <Dialog open={!!selectedAdModal} onOpenChange={(o) => (!o && setSelectedAdModal(null))}>
         <DialogContent className="max-w-[90vw] w-[800px] bg-card border-border shadow-2xl p-0 gap-0 overflow-hidden mt-[5vh]">
             {selectedAdModal && (() => {
               const ad = selectedAdModal;
               const c = ad.creativeDetails || {};
               const thumb = c.image_url || c.object_story_spec?.video_data?.image_url || c.thumbnail_url;
               const rankColor = ad.rank === 'best' ? 'text-success bg-success/10 border-success/30' : 'text-destructive bg-destructive/10 border-destructive/30';
               const rankIcon = ad.rank === 'best' ? <Trophy className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />;

               return (
                 <div className="flex flex-col md:flex-row h-full max-h-[80vh]">
                    <div className="md:w-5/12 bg-secondary/30 flex items-center justify-center border-b md:border-b-0 md:border-r border-border p-6 align-middle relative min-h-[250px] md:min-h-[400px]">
                       {thumb ? <img src={thumb} className="w-full max-h-[300px] md:max-h-full object-contain drop-shadow-lg rounded-md" alt="Preview"/> : <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50 mx-auto" />}
                       {c.call_to_action_type && <Badge className="absolute top-4 left-4 bg-primary/80 backdrop-blur shadow">{c.call_to_action_type.replace(/_/g, ' ')}</Badge>}
                    </div>

                    <div className="md:w-7/12 flex flex-col bg-background relative overflow-hidden">
                        <DialogHeader className="p-6 border-b border-border pb-4 shrink-0">
                           <DialogTitle className="text-lg font-black leading-tight flex items-start gap-2 pr-6 break-words" title={ad.ad_name} style={{overflowWrap: 'anywhere'}}>{ad.ad_name}</DialogTitle>
                           <p className="text-[10px] text-muted-foreground font-mono mt-1">ID: {ad.ad_id}</p>
                        </DialogHeader>
                        <div className="p-6 flex-1 overflow-y-auto space-y-6 scrollbar-thin">
                           <div className={`p-4 rounded-xl border flex gap-3 ${rankColor}`}>
                              {rankIcon}
                              <div>
                                 <h4 className="text-sm font-bold opacity-90">Diagnóstico do Algoritmo</h4>
                                 <p className="text-xs opacity-80 mt-1">Este criativo está performando <b>{ad.rank === 'best' ? 'acima' : 'abaixo'} da média</b>. O custo de conversão é de <span className="font-bold underline decoration-current underline-offset-2">{formatCurrency(ad.cpa)}</span>, contra a média geral de {formatCurrency(creativeRanking?.medianCpa || 0)}.</p>
                              </div>
                           </div>
                           <div className="space-y-2">
                             <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Copy / Conteúdo Principal</h4>
                             <div className="text-sm text-foreground/90 whitespace-pre-wrap bg-secondary/20 p-4 rounded-lg border border-border/50 text-left leading-relaxed">{c.body || c.title || <span className="italic opacity-50">Texto dinâmico não extraível via API unificada.</span>}</div>
                           </div>
                           <div className="grid grid-cols-3 gap-3">
                              <div className="p-3 bg-secondary/10 rounded-lg border border-border/50 text-center"><p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Custo (CPM)</p><p className="text-sm font-mono font-bold">{formatCurrency(ad.cpm)}</p></div>
                              <div className="p-3 bg-secondary/10 rounded-lg border border-border/50 text-center"><p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Atração (CTR)</p><p className="text-sm font-mono font-bold">{formatPercent(ad.ctr)}</p></div>
                              <div className="p-3 bg-secondary/10 rounded-lg border border-border/50 text-center"><p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Gasto Seguro</p><p className="text-sm font-mono font-bold">{formatCurrency(ad.spend)}</p></div>
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
