import React, { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { demoCampaigns, demoAdSets, demoCreatives, demoDemographics } from '@/services/mockData';
import { 
  Sparkles, DollarSign, ShoppingCart, Target, MousePointerClick, BarChart2, 
  TrendingUp, TrendingDown, ArrowRight, GitBranch, ArrowUpRight, ArrowDownRight, Minus, Video 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area } from 'recharts';

// ======== MAPA DE OBJETIVOS ========
const objectiveMap: Record<string, string> = {
  'OUTCOME_AWARENESS': 'reconhecimento',
  'OUTCOME_TRAFFIC': 'trafego',
  'OUTCOME_ENGAGEMENT': 'engajamento',
  'OUTCOME_LEADS': 'leads',
  'OUTCOME_APP_PROMOTION': 'app',
  'OUTCOME_SALES': 'vendas',
};

const efficiencyTargets: Record<string, { metric: string, ideal: number, direction: 'lower' | 'higher' }> = {
  reconhecimento: { metric: 'CPM', ideal: 15, direction: 'lower' },
  trafego: { metric: 'CPC', ideal: 1.50, direction: 'lower' },
  engajamento: { metric: 'Taxa Eng.', ideal: 5, direction: 'higher' },
  leads: { metric: 'CPL', ideal: 20, direction: 'lower' },
  app: { metric: 'CPI', ideal: 10, direction: 'lower' },
  vendas: { metric: 'ROAS', ideal: 4, direction: 'higher' },
};

// ======== UTILITARIOS ========
const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatVolume = (val: number) => val.toLocaleString('pt-BR');
const formatPct = (val: number) => `${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

const BadgeVar = ({ pct }: { pct: number }) => {
  if (pct === 0) return <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium bg-[#8B92A5]/10 text-text-secondary"><Minus className="w-3 h-3"/> 0.0%</span>;
  if (pct > 0) return <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium bg-[#00E096]/10 text-[#00E096]"><ArrowUpRight className="w-3 h-3"/> {pct.toFixed(1)}%</span>;
  return <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium bg-[#FF4D4D]/10 text-[#FF4D4D]"><ArrowDownRight className="w-3 h-3"/> {Math.abs(pct).toFixed(1)}%</span>;
};

// ======== COMPONENTES LOCAIS ========
function ClaudeCentral() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-background px-4 py-3 rounded-full font-bold shadow-[0_0_20px_var(--brand-glow)] hover:shadow-[0_0_25px_var(--brand-primary)] hover:scale-105 transition-all">
        <Sparkles className="w-5 h-5 fill-current" />
        <span className="uppercase tracking-wider text-xs">Claude Central</span>
      </button>
    </div>
  );
}

function RadarMetrics({ objective }: { objective: string }) {
  const cards = [
    { label: 'INVESTIMENTO (SPEND)', value: formatCurrency(12450.00), varPct: 12.5, icon: DollarSign, color: 'var(--perf-bom)', insight: 'Consumo acelerado nas últimas 4 horas.' },
    { label: 'VOLUME (CONVERSÃO)', value: formatVolume(482), varPct: 45.2, icon: ShoppingCart, color: 'var(--perf-excelente)' },
    { label: 'CPA GLOBAL', value: formatCurrency(25.83), varPct: -15.4, icon: Target, color: 'var(--perf-bom)', insight: 'CPA reduziu R$ 4,10 após pausar o criativo em saturação.' },
    { label: 'CTR GERAL (ADS)', value: formatPct(3.8), varPct: -2.1, icon: MousePointerClick, color: 'var(--perf-atencao)' },
    { label: 'CUSTO REL. (CPM)', value: formatCurrency(8.40), varPct: 5.6, icon: BarChart2, color: 'var(--perf-critico)', insight: 'O custo de impressão subiu 12% no período da noite (20h-23h).' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((c, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="card card-metric p-5 animate-in fade-in slide-in-from-bottom-2 h-full" style={{ animationDelay: `${i * 40}ms`, borderTopColor: c.color, borderTopWidth: '2px' }}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-tight w-2/3 break-words">{c.label}</span>
              <c.icon className="w-4 h-4 shrink-0 text-text-secondary" />
            </div>
            <div className="font-heading font-bold text-2xl lg:text-3xl text-text-primary mb-2 line-clamp-1 truncate">{c.value}</div>
            <BadgeVar pct={c.varPct} />
          </div>
          {c.insight && (
             <div className="p-3 bg-bg-surface border border-border-default rounded-b-lg -mt-3 shadow-inner hidden md:block">
               <p className="text-[10px] sm:text-xs text-text-secondary leading-tight"><strong className="text-brand-primary">💡 Análise:</strong> {c.insight}</p>
             </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DynamicFunnel({ objective }: { objective: string }) {
  const target = efficiencyTargets[objective];
  
  return (
    <div className="card p-6 mb-8 flex flex-col xl:flex-row gap-6">
      <div className="xl:w-2/3 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-primary/10 p-2 rounded-lg"><GitBranch className="w-5 h-5 text-brand-primary" /></div>
          <div>
            <h3 className="font-heading font-bold tracking-widest text-xs uppercase text-text-muted">Objetivo Detectado</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="uppercase font-bold text-sm" style={{ color: `var(--obj-${objective})` }}>{objective}</span>
              <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-text-secondary uppercase">Detectado Automaticamente</span>
            </div>
          </div>
        </div>

        {/* Funnel Mock (Vendas) */}
        <div className="flex items-center gap-2 my-auto px-4 overflow-x-auto pb-4 scrollbar-thin">
           <div className="bg-bg-elevated border border-border-default rounded-xl p-4 min-w-[140px] flex-shrink-0">
              <div className="text-[10px] uppercase text-text-muted tracking-wider mb-2 font-bold">Impressões</div>
              <div className="font-heading text-xl font-bold">145.2K</div>
           </div>
           <div className="flex flex-col items-center flex-shrink-0 px-2 text-text-muted">
              <ArrowRight className="w-4 h-4" />
              <span className="text-[10px] mt-1">3.8%</span>
           </div>
           <div className="bg-bg-elevated border border-border-default rounded-xl p-4 min-w-[140px] flex-shrink-0">
              <div className="text-[10px] uppercase text-text-muted tracking-wider mb-2 font-bold">Cliques</div>
              <div className="font-heading text-xl font-bold">5,517</div>
           </div>
           <div className="flex flex-col items-center flex-shrink-0 px-2 text-text-muted">
              <ArrowRight className="w-4 h-4" />
              <span className="text-[10px] mt-1">2.1%</span>
           </div>
           <div className="bg-bg-elevated border-2 rounded-xl p-4 min-w-[160px] flex-shrink-0 relative overflow-hidden" style={{ borderColor: `var(--obj-${objective})`, background: `linear-gradient(135deg, var(--bg-elevated), rgba(231,76,60,0.05))` }}>
              <div className="text-[10px] uppercase text-text-muted tracking-wider mb-2 font-bold z-10 relative">Aquisições (Vendas)</div>
              <div className="font-heading text-2xl font-bold z-10 relative text-[#F0F2F7]">115</div>
           </div>
        </div>
      </div>

      <div className="xl:w-1/3 border-t xl:border-t-0 xl:border-l border-border-default pt-6 xl:pt-0 xl:pl-6 flex flex-col justify-center">
         <h4 className="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-4">⚡ Eficiência do Objetivo</h4>
         <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium">Meta {target.metric} ≥ {target.ideal}x</span>
            <span className="font-heading font-bold text-xl text-perf-excelente">7.2x</span>
         </div>
         <div className="h-2 w-full bg-bg-overlay rounded-full overflow-hidden mb-2">
            <div className="h-full bg-perf-excelente w-[100%] rounded-full relative">
               <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>
            </div>
         </div>
         <div className="text-right text-xs text-perf-excelente font-bold">180% da meta 🔥</div>
      </div>
    </div>
  );
}

function AutoInsights() {
  return (
    <div className="card p-6 border-l-4 border-l-brand-primary h-full">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-4 h-4 text-brand-primary" />
        <h3 className="font-heading font-bold text-xs uppercase tracking-widest">Auto-Insights Express</h3>
      </div>
      <div className="space-y-4">
        <div className="border border-perf-critico/20 bg-perf-critico/5 rounded-lg p-3">
           <div className="flex items-center gap-2 mb-1">
             <span className="text-xs">❌</span>
             <span className="text-sm font-bold text-perf-critico">CTR Baixo (1.40%) no Conjunto 02</span>
           </div>
           <p className="text-xs text-text-secondary mb-2">O criativo não está parando o dedo da audiência.</p>
           <p className="text-xs font-medium text-text-primary"><strong className="text-perf-critico">AÇÃO:</strong> Testar novo formato com gancho forte nos primeiros 3 segundos.</p>
        </div>
        <div className="border border-perf-excelente/20 bg-perf-excelente/5 rounded-lg p-3">
           <div className="flex items-center gap-2 mb-1">
             <span className="text-xs">✅</span>
             <span className="text-sm font-bold text-perf-excelente">ROAS Excelente (7.2x)</span>
           </div>
           <p className="text-xs text-text-secondary mb-2">Campanha tracionando bem em público frio.</p>
           <p className="text-xs font-medium text-text-primary"><strong className="text-perf-excelente">AÇÃO:</strong> Campanha escalável. Considere aporte diário de 20%.</p>
        </div>
      </div>
    </div>
  );
}

function AdSetsHealth() {
  return (
    <div className="card h-full">
      <div className="p-5 border-b border-border-default">
         <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-text-muted">Saúde dos Conjuntos (Vendas)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase bg-bg-surface text-text-muted border-b border-border-subtle tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Nome do Conjunto</th>
              <th className="px-4 py-3 font-medium text-right">Gasto</th>
              <th className="px-4 py-3 font-medium text-center">Volume</th>
              <th className="px-4 py-3 font-medium text-right">CPA</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {demoAdSets.map((set, i) => (
              <tr key={i} className="hover:bg-bg-elevated transition-colors">
                <td className="px-4 py-3 font-medium text-text-primary border-l-2" style={{ borderLeftColor: i === 0 ? 'var(--perf-excelente)' : i === 2 ? 'var(--perf-critico)' : 'transparent' }}>
                   {set.name}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(set.gasto)}</td>
                <td className="px-4 py-3 text-center font-bold text-text-primary">{set.conversoes}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${set.cpa < 4 ? 'bg-perf-excelente/10 text-perf-excelente' : set.cpa > 4.5 ? 'bg-perf-critico/10 text-perf-critico' : 'bg-perf-atencao/10 text-perf-atencao'}`}>
                    {formatCurrency(set.cpa)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                   {i === 0 && <span className="text-[10px] uppercase font-bold text-perf-excelente tracking-wider">★ Top</span>}
                   {i === 2 && <span className="text-[10px] uppercase font-bold text-perf-critico tracking-wider">Revisar</span>}
                   {i === 1 && <span className="text-[10px] uppercase font-bold text-perf-bom tracking-wider">Estável</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatalhaCriativos() {
  const promessas = demoCreatives.filter(c => c.status === 'escalar');
  const sangrias = demoCreatives.filter(c => c.status === 'pausar');

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-6">
         <Video className="w-5 h-5 text-brand-primary" />
         <h2 className="font-heading font-bold text-lg uppercase tracking-widest text-text-primary">Batalha de Criativos</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* GREEN ZONE */}
         <div className="card bg-[#00E096]/[0.02] border-[#00E096]/20 overflow-hidden">
            <div className="p-4 border-b border-[#00E096]/10 flex items-center gap-2 bg-[#00E096]/[0.05]">
               <ArrowUpRight className="w-4 h-4 text-[#00E096]" />
               <h3 className="font-bold text-xs uppercase tracking-widest text-[#00E096]">Promessas Escaláveis</h3>
            </div>
            <div className="p-4 space-y-3">
               {promessas.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-lg hover:border-[#00E096]/30 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-bg-overlay flex items-center justify-center text-text-muted text-[8px] font-bold">THUMB</div>
                        <div>
                           <p className="text-sm font-bold text-text-primary">{c.name}</p>
                           <p className="text-xs text-text-secondary">CPA: R$ {c.cpa}</p>
                        </div>
                     </div>
                     <div className="px-2 py-1 rounded bg-[#00E096]/10 text-[#00E096] text-xs font-bold uppercase">{c.conversoes} Cap</div>
                  </div>
               ))}
            </div>
         </div>

         {/* RED ZONE */}
         <div className="card bg-[#FF4D4D]/[0.02] border-[#FF4D4D]/20 overflow-hidden">
            <div className="p-4 border-b border-[#FF4D4D]/10 flex items-center gap-2 bg-[#FF4D4D]/[0.05]">
               <ArrowDownRight className="w-4 h-4 text-[#FF4D4D]" />
               <h3 className="font-bold text-xs uppercase tracking-widest text-[#FF4D4D]">Sangria no Orçamento</h3>
            </div>
            <div className="p-4 space-y-3">
               {sangrias.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-lg hover:border-[#FF4D4D]/30 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-bg-overlay flex items-center justify-center text-text-muted text-[8px] font-bold">THUMB</div>
                        <div>
                           <p className="text-sm font-bold text-text-primary">{c.name}</p>
                           <p className="text-xs text-[#FF4D4D]">Lixo: R$ {c.lixo}</p>
                        </div>
                     </div>
                     <div className="px-2 py-1 rounded bg-[#FF4D4D]/10 text-[#FF4D4D] text-xs font-bold uppercase">{c.conversoes} Cap</div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function InteligenciaDemografica() {
  const [metric, setMetric] = useState('Gasto (R$)');
  const d = demoDemographics;

  return (
    <div className="mt-8 card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
         <h2 className="font-heading font-bold text-lg uppercase tracking-widest text-text-primary">Investimento e Demografia</h2>
         <select 
            value={metric} 
            onChange={(e) => setMetric(e.target.value)}
            className="bg-bg-elevated border border-border-default text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-brand-primary outline-none"
         >
            <option>Gasto (R$)</option>
            <option>Impressões</option>
            <option>Cliques</option>
         </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Grafico 1: Idade e Gênero */}
         <div className="bg-bg-surface p-4 rounded-xl border border-border-subtle">
            <h4 className="text-xs uppercase font-bold text-text-muted mb-6 tracking-wide">Por Idade e Gênero</h4>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.porIdadeGenero} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="faixa" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-default)', borderRadius: '8px' }} />
                    <Bar dataKey="mulheres" name="Mulheres" fill="#FF6B9D" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="homens" name="Homens" fill="#4A9EFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         
         {/* Grafico 2: Posicionamentos */}
         <div className="bg-bg-surface p-4 rounded-xl border border-border-subtle">
            <h4 className="text-xs uppercase font-bold text-text-muted mb-6 tracking-wide">Top Posicionamentos</h4>
            <div className="h-[250px] w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.posicionamentos} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                      {d.posicionamentos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-default)', borderRadius: '8px' }} />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-4">
                  <span className="text-[10px] text-text-muted uppercase font-bold">Total</span>
                  <span className="font-heading font-bold text-2xl">100%</span>
               </div>
            </div>
         </div>

         {/* Grafico 3: Linha do Tempo */}
         <div className="bg-bg-surface p-4 rounded-xl border border-border-subtle">
            <h4 className="text-xs uppercase font-bold text-text-muted mb-6 tracking-wide">Tracking Diário</h4>
            <div className="h-[250px] w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.linhaTempo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip cursor={{ stroke: 'var(--border-strong)' }} contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-default)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="valor" fill="url(#purpleGradient)" stroke="none" />
                    <Line type="monotone" dataKey="valor" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Grafico 4: Picos de Horário */}
         <div className="bg-bg-surface p-4 rounded-xl border border-border-subtle">
            <h4 className="text-xs uppercase font-bold text-text-muted mb-6 tracking-wide">Volume por Horário</h4>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.porHorario} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-default)', borderRadius: '8px' }} />
                    <Bar dataKey="valor" name="Volume" fill="#E67E22" radius={[4, 4, 0, 0]}>
                       {d.porHorario.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.valor > 15 ? '#F39C12' : '#E67E22'} className={entry.valor > 15 ? 'stroke-[#F1C40F] stroke-2 drop-shadow-[0_0_10px_rgba(241,196,15,0.5)]' : ''}/>
                       ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Grafico 5: Custo por Horário */}
         <div className="bg-bg-surface p-4 rounded-xl border border-border-subtle lg:col-span-2 xl:col-span-1">
            <h4 className="text-xs uppercase font-bold text-text-muted mb-6 tracking-wide">Custo vs Volatilidade Diária</h4>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.custoPorHora} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip cursor={{ stroke: 'var(--border-strong)' }} contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-default)', borderRadius: '8px' }} />
                    <Line yAxisId="left" type="monotone" name="CPA Médio" dataKey="cpa" stroke="#FF4D4D" strokeWidth={3} dot={{ r: 4, fill: '#FF4D4D', strokeWidth: 0 }} />
                    <Line yAxisId="right" type="monotone" name="CPM" dataKey="cpm" stroke="#00E096" strokeWidth={3} dot={{ r: 4, fill: '#00E096', strokeWidth: 0 }} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}

// ======== PÁGINA PRINCIPAL ========
export default function DashboardAds() {
  const { selectedCampaigns } = useFilters();

  // Dedução de Objetivo Global para Contexto
  const filteredCamps = selectedCampaigns.length > 0 ? demoCampaigns.filter(c => selectedCampaigns.includes(c.id)) : demoCampaigns;
  const rawObj = filteredCamps.length === 1 ? filteredCamps[0].objective : 'OUTCOME_SALES';
  const finalObjective = objectiveMap[rawObj] || 'vendas';

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <ClaudeCentral />
      <RadarMetrics objective={finalObjective} />
      <DynamicFunnel objective={finalObjective} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <AdSetsHealth />
         </div>
         <div>
            <AutoInsights />
         </div>
      </div>

      <BatalhaCriativos />
      <InteligenciaDemografica />
    </div>
  );
}
