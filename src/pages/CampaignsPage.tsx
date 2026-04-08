import React from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { demoCampaigns } from '@/services/mockData';
import { Badge } from '@/components/ui/badge';
import { Activity, CircleDollarSign, Target, MousePointerClick, ChevronDown } from 'lucide-react';

const objectiveMap: Record<string, string> = {
  'OUTCOME_AWARENESS': 'reconhecimento',
  'OUTCOME_TRAFFIC': 'trafego',
  'OUTCOME_ENGAGEMENT': 'engajamento',
  'OUTCOME_LEADS': 'leads',
  'OUTCOME_APP_PROMOTION': 'app',
  'OUTCOME_SALES': 'vendas',
};

const formatCurrency = (val: number | undefined) => val !== undefined ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
const formatVolume = (val: number | undefined) => val !== undefined ? val.toLocaleString('pt-BR') : '-';

export default function CampaignsPage() {
  const { dateRange, selectedCampaigns } = useFilters();
  const campaigns = selectedCampaigns.length > 0 ? demoCampaigns.filter(c => selectedCampaigns.includes(c.id)) : demoCampaigns;

  const totalInvestido = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
  const totalConversoes = campaigns.reduce((acc, c) => acc + (c.conversoes || c.leads || 0), 0);
  const cpaMedio = totalConversoes > 0 ? totalInvestido / totalConversoes : 0;
  const totalReceita = campaigns.reduce((acc, c) => acc + (c.receita || 0), 0);
  const roasMedio = totalInvestido > 0 ? totalReceita / totalInvestido : 0;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div className="card-metric p-4 border-t-2 border-t-brand-primary">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Total Investido</span>
               <CircleDollarSign className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="font-heading font-bold text-2xl text-[#F0F2F7]">{formatCurrency(totalInvestido)}</div>
         </div>
         <div className="card-metric p-4 border-t-2 border-t-[#00E096]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Total Aquisições</span>
               <Target className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="font-heading font-bold text-2xl text-[#F0F2F7]">{formatVolume(totalConversoes)}</div>
         </div>
         <div className="card-metric p-4 border-t-2 border-t-[#FF4D4D]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Custo P/ Aquisição</span>
               <Activity className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="font-heading font-bold text-2xl text-[#F0F2F7]">{formatCurrency(cpaMedio)}</div>
         </div>
         <div className="card-metric p-4 border-t-2 border-t-[#3498DB]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">ROAS Médio</span>
               <MousePointerClick className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="font-heading font-bold text-2xl text-[#F0F2F7]">{roasMedio.toFixed(2)}x</div>
         </div>
      </div>

      <div className="card overflow-hidden">
         <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-bg-surface">
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-text-primary">Monitoramento Avançado</h3>
            <span className="text-xs text-brand-primary font-medium">{campaigns.length} Campanhas Listadas</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="text-[10px] uppercase bg-bg-elevated text-text-muted tracking-wider">
                  <tr>
                     <th className="px-6 py-4 font-bold border-b border-border-strong w-2"></th>
                     <th className="px-6 py-4 font-bold border-b border-border-strong">Nome da Campanha</th>
                     <th className="px-6 py-4 font-bold border-b border-border-strong text-center">Status</th>
                     <th className="px-6 py-4 font-bold border-b border-border-strong">Objetivo</th>
                     <th className="px-6 py-4 font-bold border-b border-border-strong text-right">Investimento</th>
                     <th className="px-6 py-4 font-bold border-b border-border-strong text-center">Volume</th>
                     <th className="px-6 py-4 font-bold border-b border-border-strong text-right">Resultado</th>
                     <th className="px-6 py-4 font-bold border-b border-border-strong text-right">CTR / CPM</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border-subtle bg-bg-surface">
                  {campaigns.map(camp => {
                     const obj = objectiveMap[camp.objective] || 'vendas';
                     const resultLabel = obj === 'vendas' ? `CPA: ${formatCurrency(camp.cpa)}` : obj === 'leads' ? `CPL: ${formatCurrency(camp.cpl)}` : `CPC: ${formatCurrency(camp.cpc)}`;
                     
                     return (
                     <tr key={camp.id} className="hover:bg-bg-elevated transition-colors cursor-pointer group">
                        <td className="px-4 text-center">
                           <ChevronDown className="w-4 h-4 text-text-disabled group-hover:text-text-secondary transition-colors" />
                        </td>
                        <td className="px-6 py-4 font-bold text-text-primary">
                           {camp.name}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${camp.status === 'ATIVO' ? 'bg-[#00E096]/20 text-[#00E096]' : 'bg-[#F1C40F]/10 text-[#F1C40F]'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'ATIVO' ? 'bg-[#00E096]' : 'bg-[#F1C40F]'}`}></span>
                              {camp.status}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant="outline" className="border-border-default uppercase tracking-wider text-[10px]" style={{ color: `var(--obj-${obj})`, borderColor: `var(--obj-${obj})` }}>
                              {obj}
                           </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-text-secondary">
                           {formatCurrency(camp.spend)}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-text-primary">
                           {formatVolume(camp.conversoes || camp.leads || camp.cliques || camp.alcance)}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-xs font-bold text-text-primary bg-bg-overlay px-2 py-1 rounded border border-border-subtle">
                             {resultLabel}
                           </span>
                           {camp.roas && <div className="text-[10px] text-perf-excelente font-bold mt-1 uppercase tracking-widest">{camp.roas}x ROAS</div>}
                        </td>
                        <td className="px-6 py-4 text-right text-xs">
                           <div className="font-bold text-text-primary">{camp.ctr ? `${camp.ctr}% CTR` : '-'}</div>
                           <div className="text-[10px] text-text-muted font-medium mt-1">R$ {camp.cpm?.toFixed(2)} CPM</div>
                        </td>
                     </tr>
                     );
                  })}
               </tbody>
            </table>
            {campaigns.length === 0 && (
               <div className="p-8 text-center text-text-muted italic">Nenhuma campanha atende aos filtros atuais.</div>
            )}
         </div>
      </div>
    </div>
  );
}
