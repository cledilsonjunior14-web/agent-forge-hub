import React from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { demoCampaigns, demoAdSets } from '@/services/mockData';
import { Sparkles, ArrowRight, GitBranch, Target } from 'lucide-react';

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

const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function FunisPage() {
  const { selectedCampaigns } = useFilters();

  const filteredCamps = selectedCampaigns.length > 0 ? demoCampaigns.filter(c => selectedCampaigns.includes(c.id)) : demoCampaigns;
  const rawObj = filteredCamps.length === 1 ? filteredCamps[0].objective : 'OUTCOME_SALES';
  const objective = objectiveMap[rawObj] || 'vendas';
  const target = efficiencyTargets[objective];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Bloco A: Card de Eficiência Top */}
      <div className="card p-8 mb-8 bg-gradient-to-br from-bg-surface to-bg-elevated border-t-2" style={{ borderTopColor: `var(--obj-${objective})` }}>
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
               <h2 className="font-heading font-bold text-2xl uppercase tracking-widest text-[#F0F2F7] flex items-center gap-3">
                  <GitBranch className="w-6 h-6 text-brand-primary" />
                  Funil de {objective}
               </h2>
               <p className="text-sm text-text-secondary mt-1">Análise volumétrica da jornada do usuário baseada no objetivo ativo.</p>
            </div>
            <div className="text-right">
               <h4 className="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-1">⚡ Eficiência Atual vs Meta</h4>
               <div className="flex items-baseline justify-end gap-3">
                  <span className="font-heading font-bold text-3xl text-perf-excelente">7.2x</span>
                  <span className="text-sm font-medium text-text-muted">Meta {target.metric} ≥ {target.ideal}</span>
               </div>
            </div>
         </div>
         <div className="h-4 w-full bg-bg-overlay rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-perf-excelente w-[100%] rounded-full relative">
               <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>
            </div>
         </div>
         <div className="text-right text-xs text-perf-excelente font-bold mt-2 uppercase tracking-wide">Desempenho: 180% da meta 🔥</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Bloco B: Funil Dinamico Expandido */}
         <div className="card p-8 xl:col-span-3 min-h-[400px] flex items-center justify-center overflow-x-auto relative">
            <div className="absolute top-4 left-4 text-[10px] font-bold text-text-muted tracking-widest uppercase flex items-center gap-2">
               <Target className="w-3 h-3 text-text-secondary"/>
               Mapeamento Volumétrico
            </div>
            
            <div className="flex items-center gap-3 mt-4">
               <div className="bg-bg-elevated border border-border-default rounded-xl p-6 min-w-[200px] text-center shadow-lg">
                  <div className="text-xs uppercase text-text-muted tracking-widest mb-3 font-bold">Impressões</div>
                  <div className="font-heading text-4xl font-bold text-[#F0F2F7]">145.2K</div>
                  <div className="text-xs text-text-secondary mt-2">Custo: R$ 12.450</div>
               </div>

               <div className="flex flex-col items-center px-4 text-brand-primary/60">
                  <ArrowRight className="w-8 h-8" />
                  <span className="text-xs font-bold mt-1 bg-brand-primary/10 px-2 py-0.5 rounded text-brand-primary">3.8%</span>
               </div>

               <div className="bg-bg-elevated border border-border-default rounded-xl p-6 min-w-[200px] text-center shadow-lg">
                  <div className="text-xs uppercase text-text-muted tracking-widest mb-3 font-bold">Cliques</div>
                  <div className="font-heading text-4xl font-bold text-[#F0F2F7]">5,517</div>
                  <div className="text-xs text-text-secondary mt-2">Custo per ação: R$ 2.25</div>
               </div>

               <div className="flex flex-col items-center px-4 text-brand-primary/60">
                  <ArrowRight className="w-8 h-8" />
                  <span className="text-xs font-bold mt-1 bg-brand-primary/10 px-2 py-0.5 rounded text-brand-primary">2.1%</span>
               </div>

               <div className="bg-bg-elevated border-2 rounded-xl p-6 min-w-[240px] text-center shadow-[0_0_30px_rgba(231,76,60,0.15)] relative overflow-hidden" style={{ borderColor: `var(--obj-${objective})` }}>
                  <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent" style={{ '--tw-gradient-to': `var(--obj-${objective})` } as React.CSSProperties}></div>
                  <div className="text-xs uppercase tracking-widest mb-3 font-bold relative z-10" style={{ color: `var(--obj-${objective})` }}>Conversão Final</div>
                  <div className="font-heading text-5xl font-bold text-white relative z-10 mb-2">115</div>
                  <div className="text-xs font-bold bg-white/10 inline-block px-3 py-1 rounded-full relative z-10">CPA: R$ 108.26</div>
               </div>
            </div>
         </div>

         {/* Bloco D: Auto-Insights Isolado */}
         <div className="card p-6 border-t-4 border-t-brand-primary flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-brand-primary" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-widest">IA Automática</h3>
            </div>
            <div className="space-y-4 flex-1">
              <div className="border border-perf-critico/20 bg-perf-critico/5 rounded-lg p-4 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-sm">❌</span>
                   <span className="text-sm font-bold text-perf-critico leading-tight">Quebra no CTR Pós-clique</span>
                 </div>
                 <p className="text-xs text-text-secondary mb-3 leading-relaxed">Taxa de Carregamento da página parece estar atrapalhando o volume entre clique e ViewContent.</p>
                 <p className="text-xs font-bold text-text-primary"><strong className="text-perf-critico">AÇÃO:</strong> Otimizar asset de vídeo na landing page atual.</p>
              </div>
            </div>
         </div>
      </div>

      {/* Bloco C: Tabela Dinamica Refinada */}
      <div className="mt-8 card p-6">
         <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-[#F0F2F7] mb-6 border-b border-border-default pb-4">Desempenho Cirúrgico dos Conjuntos</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-bg-surface text-text-muted border-b border-border-subtle tracking-wider">
                <tr>
                  <th className="px-4 py-4 font-medium rounded-tl-lg">Ativo Específico</th>
                  <th className="px-4 py-4 font-medium text-right">Investimento</th>
                  <th className="px-4 py-4 font-medium text-center">Entrega</th>
                  <th className="px-4 py-4 font-medium text-right">Custo P/ Ação</th>
                  <th className="px-4 py-4 font-medium text-right rounded-tr-lg">Retorno / Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {demoAdSets.map((set, i) => (
                  <tr key={i} className="hover:bg-bg-elevated transition-colors group">
                    <td className="px-4 py-4 font-bold text-text-primary flex items-center gap-3">
                       <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-perf-excelente' : i === 2 ? 'bg-perf-critico' : 'bg-perf-bom'}`}></span>
                       {set.name}
                    </td>
                    <td className="px-4 py-4 text-right text-text-secondary font-mono">{formatCurrency(set.gasto)}</td>
                    <td className="px-4 py-4 text-center font-bold text-[#F0F2F7] text-base">{set.conversoes}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-xs">{formatCurrency(set.cpa)}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                       <span className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm ${set.cpa < 4 ? 'bg-perf-excelente/20 text-perf-excelente border border-perf-excelente/30' : set.cpa > 4.5 ? 'bg-perf-critico/20 text-perf-critico border border-perf-critico/30' : 'bg-perf-atencao/20 text-perf-atencao border border-perf-atencao/30'}`}>
                         {set.cpa < 4 ? 'Alta Escala' : set.cpa > 4.5 ? 'Gargalo' : 'Aceitável'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
