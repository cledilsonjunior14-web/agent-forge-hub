import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { useMetaContext } from '@/hooks/useMetaContext';
import { insights_custom } from '@/services/metaApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart as BarC, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Activity, Users, Map, Clock, ShieldCheck, X } from 'lucide-react';

export function AudienceCharts({ 
  selectedCampaignId, 
  selectedAdSetId,
  isVisible,
  onClose,
  texts
}: { 
  selectedCampaignId: string; 
  selectedAdSetId: string;
  isVisible: boolean;
  onClose: () => void;
  texts: any;
}) {
  const { dateRange } = useFilters();
  const { token, accountId, hasMetaSetup } = useMetaContext();

  const currFromStr = dateRange.from.toISOString().split('T')[0];
  const currToStr = dateRange.to.toISOString().split('T')[0];
  const time_range = JSON.stringify({ since: currFromStr, until: currToStr });

  const baseParams: any = { time_range, fields: 'impressions,spend,actions' };
  if (selectedAdSetId !== 'all') {
    baseParams.level = 'adset';
    baseParams.adset_id = selectedAdSetId;
  } else if (selectedCampaignId !== 'all') {
    baseParams.level = 'campaign';
    baseParams.campaign_id = selectedCampaignId;
  } else {
    baseParams.level = 'account';
  }

  // Helper to parse CPA and results from standard Action structure
  const parseAction = (dataArray: any[]) => {
    if (!Array.isArray(dataArray)) return [];
    return dataArray.map(m => {
      const isLead = m.actions?.find((a: any) => a.action_type === 'lead');
      const isPurch = m.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');
      const isWpp = m.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
      const res = isPurch || isLead || isWpp;
      const results = Number(res?.value || 0);
      const spend = Number(m.spend || 0);
      return { 
        ...m, 
        results, 
        cpa: results > 0 ? spend / results : spend // se zero conversoes, cpa é o spend
      };
    });
  };

  // 1. AGE & GENDER
  const { data: demogData } = useQuery({
    queryKey: ['meta-dash-demog', accountId, selectedCampaignId, selectedAdSetId, time_range],
    enabled: hasMetaSetup && isVisible,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...baseParams, breakdowns: 'age,gender' });
      const data = parseAction((res as any).data || res || []);
      // Agrupar por Age (Ex: '18-24') 
      const ageMap: Record<string, any> = {};
      data.forEach(d => {
         const a = d.age || 'Desconhecido';
         if (!ageMap[a]) ageMap[a] = { age: a, male_spend: 0, female_spend: 0, male_cpa: 0, female_cpa: 0, male_results: 0, female_results: 0 };
         const spend = Number(d.spend);
         if (d.gender === 'male') { ageMap[a].male_spend += spend; ageMap[a].male_results += d.results; }
         else if (d.gender === 'female') { ageMap[a].female_spend += spend; ageMap[a].female_results += d.results; }
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
    queryKey: ['meta-dash-platform', accountId, selectedCampaignId, selectedAdSetId, time_range],
    enabled: hasMetaSetup && isVisible,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...baseParams, breakdowns: 'publisher_platform,placement' });
      const data = parseAction((res as any).data || res || []);
      const platMap: Record<string, any> = {};
      data.forEach(d => {
         const p = `${d.publisher_platform} - ${d.placement}`;
         if (!platMap[p]) platMap[p] = { name: p, spend: 0, results: 0 };
         platMap[p].spend += Number(d.spend);
         platMap[p].results += d.results;
      });
      return Object.values(platMap)
        .sort((a:any,b:any) => b.spend - a.spend)
        .slice(0, 6) // Top 6 placements pra não quebrar o Pie
        .map((p:any) => ({...p, spend: +p.spend.toFixed(2)}));
    }
  });

  // 3. HOURLY STATS
  const { data: hourlyData } = useQuery({
    queryKey: ['meta-dash-hourly', accountId, selectedCampaignId, selectedAdSetId, time_range],
    enabled: hasMetaSetup && isVisible,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...baseParams, breakdowns: 'hourly_stats_aggregated_by_audience_time_zone' });
      const data = parseAction((res as any).data || res || []);
      const hMap: Record<string, any> = {};
      data.forEach(d => {
         // o retorno do breakdown é hourly_stats_aggregated_by_audience_time_zone -> Ex: 00:00:00 - 00:59:59
         const hRaw = d.hourly_stats_aggregated_by_audience_time_zone || '00:00:00';
         const h = hRaw.split(':')[0] + 'h'; 
         if (!hMap[h]) hMap[h] = { hora: h, spend: 0, results: 0, calcHora: parseInt(hRaw.split(':')[0]) };
         hMap[h].spend += Number(d.spend);
         hMap[h].results += d.results;
      });
      return Object.values(hMap)
         .sort((a:any, b:any) => a.calcHora - b.calcHora)
         .map((h:any) => ({...h, cpa: h.results > 0 ? +(h.spend/h.results).toFixed(2) : +h.spend.toFixed(2) }));
    }
  });

  // 4. DAILY TRENDS (Time Series)
  const { data: dailyData } = useQuery({
    queryKey: ['meta-dash-daily', accountId, selectedCampaignId, selectedAdSetId, time_range],
    enabled: hasMetaSetup && isVisible,
    queryFn: async () => {
      const res = await insights_custom(token, accountId, { ...baseParams, time_increment: 1 });
      const data = parseAction((res as any).data || res || []);
      return data.map(d => ({
         date: d.date_start.split('-').slice(1).join('/'), // Ex: 04/01
         spend: +Number(d.spend).toFixed(2),
         cpa: d.cpa ? +d.cpa.toFixed(2) : 0,
         results: d.results
      }));
    }
  });

  const COLORS = ['#8b5cf6', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];

  if (!isVisible) return null;

  return (
    <div className="pt-8 min-w-0 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-sm font-black uppercase text-foreground/80 tracking-widest flex items-center gap-2">
           <Activity className="w-5 h-5 text-primary" /> 
           Inteligência Demográfica e Posicionamentos
         </h2>
         <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10" onClick={onClose} title="Ocultar Painel"><X className="w-4 h-4"/></Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
         
         {/* IDADE & GENERO (Gasto) */}
         <Card className="bg-card shadow-sm border-border overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-secondary/10">
               <CardTitle className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80"><Users className="w-3 h-3 text-primary"/> Gasto por Idade e Gênero</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
               {demogData && demogData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarC data={demogData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                     <XAxis dataKey="age" tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '8px'}} />
                     <Legend wrapperStyle={{fontSize: '10px'}} />
                     <Bar dataKey="female_spend" name="Fem (Gasto R$)" fill="#ec4899" radius={[4,4,0,0]} stackId="a" />
                     <Bar dataKey="male_spend" name="Masc (Gasto R$)" fill="#3b82f6" radius={[4,4,0,0]} stackId="a" />
                   </BarC>
                 </ResponsiveContainer>
               ) : <div className="h-full flex items-center justify-center text-xs opacity-50">Sem dados demográficos.</div>}
            </CardContent>
         </Card>

         {/* PLATAFORMAS (Pie) */}
         <Card className="bg-card shadow-sm border-border overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-secondary/10">
               <CardTitle className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80"><Map className="w-3 h-3 text-emerald-500"/> Top Posicionamentos (Gasto)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[250px] relative">
               {platformData && platformData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={platformData} dataKey="spend" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} stroke="none" labelLine={false} label={(p) => p.name.split('-')[1]? p.name.split('-')[1].substring(0,8) : p.name.substring(0,8)}>
                        {platformData.map((e, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '8px'}} itemStyle={{color: '#fff'}} formatter={(val) => `R$ ${val}`} />
                   </PieChart>
                 </ResponsiveContainer>
               ) : <div className="h-full flex items-center justify-center text-xs opacity-50">Sem dados de plataforma.</div>}
            </CardContent>
         </Card>

         {/* TIME SERIES (CPA LINE) */}
         <Card className="bg-card shadow-sm border-border overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-secondary/10">
               <CardTitle className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80"><ShieldCheck className="w-3 h-3 text-primary"/> CPA (Custo de Venda/Lead) Semanal</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
               {dailyData && dailyData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                     <XAxis dataKey="date" tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '8px'}} />
                     <Line type="monotone" dataKey="cpa" name="CPA (R$)" stroke="#8b5cf6" strokeWidth={3} dot={{r:4, fill: '#8b5cf6', strokeWidth:0}} activeDot={{r:6}} />
                   </LineChart>
                 </ResponsiveContainer>
               ) : <div className="h-full flex items-center justify-center text-xs opacity-50">Sem dados de tempo.</div>}
            </CardContent>
         </Card>

         {/* HOURLY HEATMAP (Bar Chart de CPA por Hora) */}
         <Card className="bg-card shadow-sm border-border overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-secondary/10">
               <CardTitle className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80"><Clock className="w-3 h-3 text-orange-500"/> Volume de Captação vs Horário da Audiência</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
               {hourlyData && hourlyData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarC data={hourlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                     <XAxis dataKey="hora" tick={{fontSize: 9, fill: '#888'}} axisLine={false} tickLine={false} interval={1} />
                     <YAxis tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} orientation="right" />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111', borderColor: '#333', fontSize: '11px', borderRadius: '8px'}} />
                     <Bar dataKey="results" name="Captações/Vendas" fill="#f97316" radius={[4,4,0,0]} />
                   </BarC>
                 </ResponsiveContainer>
               ) : <div className="h-full flex items-center justify-center text-xs opacity-50">Sem relatório horário. iOS14 pode impactar rastreio.</div>}
            </CardContent>
         </Card>

      </div>
    </div>
  );
}
