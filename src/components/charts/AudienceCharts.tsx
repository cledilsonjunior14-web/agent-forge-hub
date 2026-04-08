import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { useMetaContext } from '@/hooks/useMetaContext';
import { insights_custom } from '@/services/metaApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart as BarC, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Activity, Users, Map, Clock, ShieldCheck, X, AlertTriangle, Info } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';

export function AudienceCharts({ 
  selectedCampaignIds, 
  selectedAdSetId,
  isVisible,
  onClose,
  texts
}: { 
  selectedCampaignIds: string[]; 
  selectedAdSetId: string;
  isVisible: boolean;
  onClose: () => void;
  texts: any;
}) {
  const { dateRange } = useFilters();
  const { token, accountId, hasMetaSetup } = useMetaContext();

  const [metric, setMetric] = useState<'spend' | 'results' | 'cpa' | 'impressions'>('spend');

  const currFromStr = dateRange?.from?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
  const currToStr = dateRange?.to?.toISOString().split('T')[0] || currFromStr;
  const time_range = JSON.stringify({ since: currFromStr, until: currToStr });

  const baseParams: any = { 
    time_range, 
    fields: 'impressions,spend,actions',
    use_unified_attribution_setting: 'true'
  };
  if (selectedAdSetId !== 'all') {
    baseParams.level = 'adset';
    baseParams.adset_id = selectedAdSetId;
  } else if (selectedCampaignIds && selectedCampaignIds.length > 0) {
    baseParams.level = 'campaign';
    baseParams.filtering = JSON.stringify([{ field: "campaign.id", operator: "IN", value: selectedCampaignIds }]);
  } else {
    baseParams.level = 'account';
  }

  const parseAction = (dataArray: any[]) => {
    if (!Array.isArray(dataArray)) return [];
    return dataArray.map(m => {
      const isLead = m.actions?.find((a: any) => a.action_type === 'lead');
      const isPurch = m.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');
      const isWpp = m.actions?.find((a: any) => 
        a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
        a.action_type === 'onsite_conversion.messaging_first_reply' ||
        a.action_type.includes('message')
      );
      const res = isPurch || isLead || isWpp;
      const results = Number(res?.value || 0);
      const spend = Number(m.spend || 0);
      const impressions = Number(m.impressions || 0);
      return { 
        ...m, 
        results, 
        spend,
        impressions,
        cpa: results > 0 ? spend / results : spend
      };
    });
  };

  // 1. AGE & GENDER
  const { data: demogData } = useQuery({
    queryKey: ['meta-dash-demog', accountId, selectedCampaignIds, selectedAdSetId, time_range],
    enabled: hasMetaSetup && isVisible,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...baseParams, breakdowns: 'age,gender' });
      const rawData = (res as any).data || res;
      const data = parseAction(Array.isArray(rawData) ? rawData : []);
      const ageMap: Record<string, any> = {};
      data.forEach(d => {
         const a = d.age || 'Desconhecido';
         if (!ageMap[a]) ageMap[a] = { age: a, male_spend: 0, female_spend: 0, male_results: 0, female_results: 0, male_impressions: 0, female_impressions: 0 };
         if (d.gender === 'male') { ageMap[a].male_spend += d.spend; ageMap[a].male_results += d.results; ageMap[a].male_impressions += d.impressions; }
         else if (d.gender === 'female') { ageMap[a].female_spend += d.spend; ageMap[a].female_results += d.results; ageMap[a].female_impressions += d.impressions; }
      });
      return Object.values(ageMap).map((a:any) => ({
         ...a,
         male_cpa: a.male_results > 0 ? +(a.male_spend / a.male_results).toFixed(2) : a.male_spend,
         female_cpa: a.female_results > 0 ? +(a.female_spend / a.female_results).toFixed(2) : a.female_spend,
      })).sort((a,b) => a.age.localeCompare(b.age));
    }
  });

  // 2. PLACEMENT & PLATFORM
  const { data: platformData } = useQuery({
    queryKey: ['meta-dash-platform', accountId, selectedCampaignIds, selectedAdSetId, time_range],
    enabled: hasMetaSetup && isVisible,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...baseParams, breakdowns: 'publisher_platform,platform_position' });
      const rawData = (res as any).data || res;
      const data = parseAction(Array.isArray(rawData) ? rawData : []);
      const platMap: Record<string, any> = {};
      
      const formatPlacementName = (pub: string, pos: string) => {
         if (!pub || pub === 'undefined') return 'Desconhecido';
         if (!pos || pos === 'undefined') pos = 'Geral';
         const p = pub.toLowerCase();
         const s = pos.toLowerCase();
         if (p.includes('instagram')) {
            if (s.includes('story')) return 'IG Stories';
            if (s.includes('feed')) return 'IG Feed';
            if (s.includes('reels')) return 'IG Reels';
            if (s.includes('explore')) return 'IG Explore';
            return 'Instagram';
         }
         if (p.includes('facebook')) {
            if (s.includes('story')) return 'FB Stories';
            if (s.includes('feed')) return 'FB Feed';
            if (s.includes('video')) return 'FB Videos';
            if (s.includes('right_hand')) return 'FB Coluna Dir';
            return 'Facebook';
         }
         if (p.includes('audience_network')) return 'Audience Net';
         if (p.includes('messenger')) return 'Messenger';
         return `${pub} - ${pos}`.substring(0, 15);
      };

      data.forEach(d => {
         const pName = formatPlacementName(d.publisher_platform, d.platform_position || d.placement);
         if (!platMap[pName]) platMap[pName] = { name: pName, spend: 0, results: 0, impressions: 0 };
         platMap[pName].spend += d.spend;
         platMap[pName].results += d.results;
         platMap[pName].impressions += d.impressions;
      });
      return Object.values(platMap)
        .map((p:any) => ({...p, cpa: p.results > 0 ? p.spend/p.results : p.spend }))
        .sort((a:any,b:any) => b[metric] - a[metric])
        .slice(0, 6);
    }
  });

  // 3. HOURLY STATS
  const { data: hourlyData } = useQuery({
    queryKey: ['meta-dash-hourly', accountId, selectedCampaignIds, selectedAdSetId, time_range],
    enabled: hasMetaSetup && isVisible,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...baseParams, breakdowns: 'hourly_stats_aggregated_by_audience_time_zone' });
      const rawData = (res as any).data || res;
      const data = parseAction(Array.isArray(rawData) ? rawData : []);
      const hMap: Record<string, any> = {};
      data.forEach(d => {
         const hRaw = d.hourly_stats_aggregated_by_audience_time_zone || '00:00:00';
         const h = hRaw.split(':')[0] + 'h'; 
         if (!hMap[h]) hMap[h] = { hora: h, spend: 0, results: 0, impressions: 0, calcHora: parseInt(hRaw.split(':')[0]) };
         hMap[h].spend += d.spend;
         hMap[h].results += d.results;
         hMap[h].impressions += d.impressions;
      });
      return Object.values(hMap)
         .sort((a:any, b:any) => a.calcHora - b.calcHora)
         .map((h:any) => ({...h, cpa: h.results > 0 ? +(h.spend/h.results).toFixed(2) : +h.spend.toFixed(2) }));
    }
  });

  // 4. DAILY TRENDS
  const { data: dailyData } = useQuery({
    queryKey: ['meta-dash-daily', accountId, selectedCampaignIds, selectedAdSetId, time_range],
    enabled: hasMetaSetup && isVisible,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...baseParams, time_increment: 1 });
      const rawData = (res as any).data || res;
      const data = parseAction(Array.isArray(rawData) ? rawData : []);
      return data.map(d => ({
         date: d.date_start.split('-').slice(1).join('/'),
         spend: +Number(d.spend).toFixed(2),
         cpa: d.cpa ? +d.cpa.toFixed(2) : 0,
         results: d.results,
         impressions: d.impressions
      }));
    }
  });

  const COLORS = ['#8b5cf6', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];

  // Formatter customizado para Tooltips e YAxis dependendo da Métrica selecionada
  const formatValue = (val: number) => {
     if (metric === 'spend' || metric === 'cpa') return formatCurrency(val);
     return formatNumber(val);
  };

  const metricLabels = {
     spend: 'Gasto (R$)',
     results: 'Conversões / Mensagens',
     cpa: 'Custo de Aquisição (R$)',
     impressions: 'Visibilidade (Impressões)'
  };
  


  const EmptyState = ({ text }: { text: string }) => (
      <div className="h-full flex flex-col items-center justify-center text-xs opacity-50 p-6 text-center gap-2">
         <AlertTriangle className="w-6 h-6 opacity-50 mb-1" />
         <p>{text}</p>
         <p className="text-[10px] opacity-70 mt-2">Dica: Selecione a métrica "Gasto (R$)" no topo. Variáveis base sempre são entregues.</p>
      </div>
  );

  if (!isVisible) return null;

  return (
    <div className="pt-8 min-w-0 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
         <h2 className="text-sm font-black uppercase text-foreground/80 tracking-widest flex items-center gap-2">
           <Activity className="w-5 h-5 text-primary" /> 
           Inteligência Demográfica e Posicionamentos
         </h2>
         
         <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap hidden sm:block">Selecionar Métrica:</span>
            <Select value={metric} onValueChange={(val: any) => setMetric(val)}>
               <SelectTrigger className="w-[200px] h-8 bg-card border-primary/20 ring-1 ring-primary/10 text-xs font-bold rounded shadow-sm text-primary">
                  <SelectValue placeholder="Métrica Base" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="spend" className="text-xs font-bold">💸 {metricLabels.spend}</SelectItem>
                  <SelectItem value="results" className="text-xs font-bold">🎯 {metricLabels.results}</SelectItem>
                  <SelectItem value="cpa" className="text-xs font-bold">🛡️ {metricLabels.cpa}</SelectItem>
                  <SelectItem value="impressions" className="text-xs font-bold">👁️ {metricLabels.impressions}</SelectItem>
               </SelectContent>
            </Select>

            <button className="h-7 w-7 bg-card border border-border text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded inline-flex items-center justify-center transition-colors focus:outline-none" onClick={onClose} title="Ocultar Painel"><X className="w-4 h-4"/></button>
         </div>
      </div>



      <div className="grid lg:grid-cols-2 gap-4 mt-4">
         
         {/* IDADE & GENERO (Gasto) */}
         <Card className="bg-card shadow-sm border-border overflow-hidden ring-1 ring-background">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between space-y-0">
               <CardTitle className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80"><Users className="w-3 h-3 text-primary"/> Por Idade e Gênero</CardTitle>
               <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded shadow-sm">{metricLabels[metric]}</span>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
               {demogData && demogData.length > 0 && demogData.some(d => d[`male_${metric}`] > 0 || d[`female_${metric}`] > 0) ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarC data={demogData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                     <XAxis dataKey="age" tick={{fontSize: 9, fill: '#888'}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fontSize: 9, fill: '#888'}} axisLine={false} tickLine={false} tickFormatter={formatValue} />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '8px'}} formatter={(val: number) => formatValue(val)} />
                     <Legend wrapperStyle={{fontSize: '10px'}} />
                     <Bar dataKey={`female_${metric}`} name={`Mulheres (${metricLabels[metric]})`} fill="#ec4899" radius={metric === 'cpa' ? [4,4,0,0] : undefined} stackId="a" />
                     <Bar dataKey={`male_${metric}`} name={`Homens (${metricLabels[metric]})`} fill="#3b82f6" radius={[4,4,0,0]} stackId="a" />
                   </BarC>
                 </ResponsiveContainer>
               ) : <EmptyState text={`O relatório de ${metricLabels[metric]} para Demografia voltou vazio (restrições da Meta ou tráfego zerado).`} />}
            </CardContent>
         </Card>

         {/* PLATAFORMAS (Pie) */}
         <Card className="bg-card shadow-sm border-border overflow-hidden ring-1 ring-background">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between space-y-0">
               <CardTitle className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80"><Map className="w-3 h-3 text-emerald-500"/> Top Posicionamentos</CardTitle>
               <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded shadow-sm">{metricLabels[metric]}</span>
            </CardHeader>
            <CardContent className="p-4 h-[250px] relative">
               {platformData && platformData.length > 0 && platformData.some(p => p[metric] > 0) ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={platformData} dataKey={metric} nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} stroke="none" labelLine={false} label={(p) => p.name}>
                        {platformData.map((e, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '8px'}} itemStyle={{color: '#fff'}} formatter={(val: number) => formatValue(val)} />
                   </PieChart>
                 </ResponsiveContainer>
               ) : <EmptyState text={`As plataformas não reportaram ${metricLabels[metric]} puros.`} />}
            </CardContent>
         </Card>

         {/* TIME SERIES (CPA LINE) */}
         <Card className="bg-card shadow-sm border-border overflow-hidden ring-1 ring-background">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between space-y-0">
               <CardTitle className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80"><ShieldCheck className="w-3 h-3 text-primary"/> Linha do Tempo</CardTitle>
               <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded shadow-sm">Tracking Diário: {metricLabels[metric]}</span>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
               {dailyData && dailyData.length > 0 && dailyData.some(d => d[metric] > 0) ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={dailyData} margin={{ top: 5, right: -5, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                     <XAxis dataKey="date" tick={{fontSize: 9, fill: '#888'}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fontSize: 9, fill: '#888'}} axisLine={false} tickLine={false} tickFormatter={formatValue} />
                     <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '8px'}} formatter={(val: number) => formatValue(val)} />
                     <Line type="monotone" dataKey={metric} name={metricLabels[metric]} stroke="#8b5cf6" strokeWidth={3} dot={{r:3, fill: '#8b5cf6', strokeWidth:0}} activeDot={{r:6}} />
                   </LineChart>
                 </ResponsiveContainer>
               ) : <EmptyState text="O vetor temporal não possui registros para esta métrica." />}
            </CardContent>
         </Card>

         {/* HOURLY HEATMAP (Bar Chart de CPA por Hora) */}
         <Card className="bg-card shadow-sm border-border overflow-hidden ring-1 ring-background">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between space-y-0">
               <CardTitle className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80"><Clock className="w-3 h-3 text-orange-500"/> Volume por Horário da Audiência</CardTitle>
               <span className="text-[9px] font-mono bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded shadow-sm">Janela: {metricLabels[metric]}</span>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
               {hourlyData && hourlyData.length > 0 && hourlyData.some(h => h[metric] > 0) ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarC data={hourlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                     <XAxis dataKey="hora" tick={{fontSize: 8, fill: '#888'}} axisLine={false} tickLine={false} interval={1} />
                     <YAxis tick={{fontSize: 9, fill: '#888'}} axisLine={false} tickLine={false} tickFormatter={formatValue} />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '8px'}} formatter={(val: number) => formatValue(val)} />
                     <Bar dataKey={metric} name={metricLabels[metric]} fill="#f97316" radius={[4,4,0,0]} />
                   </BarC>
                 </ResponsiveContainer>
               ) : <EmptyState text={`Sem eventos medidos de hora em hora para essa faixa. (Afetado pelo iOS 14).`} />}
            </CardContent>
         </Card>

      </div>
    </div>
  );
}
