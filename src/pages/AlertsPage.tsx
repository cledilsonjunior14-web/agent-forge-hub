import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, BellRing, Settings2, SlidersHorizontal } from 'lucide-react';

const alertasDemo = [
  { id: 1, tipo: 'critico', titulo: 'CPA Alto detectado', tempo: 'há 2 horas', msg: 'Conjunto "00 - Mix de público base" disparou acima do Threshold.', cpa: 45.20, meta: 20.00, acao: 'Pausar conjunto e testar novo público imediatamente.' },
  { id: 2, tipo: 'atencao', titulo: 'Frequência Saturando', tempo: 'há 5 horas', msg: 'A campanha de Reconhecimento atingiu 7.5 de frequência média.', acao: 'Rotacionar criativos para evitar "ad fatigue".' },
  { id: 3, tipo: 'positivo', titulo: 'Meta Atingida: ROAS', tempo: 'há 1 dia', msg: 'A campanha "Toro Burger" bateu 7.2x de ROAS.', acao: 'Aumentar orçamento diário em 20%.' },
  { id: 4, tipo: 'informativo', titulo: 'Orçamento Diário no Limite', tempo: 'há 2 dias', msg: 'A campanha gastou 95% do limite 4 horas antes do fim do dia.', acao: 'Verificar picos de tráfego noturno.' }
];

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<'ativos' | 'historico' | 'config'>('ativos');

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 flex flex-col min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
         <div>
            <h2 className="font-heading font-bold text-2xl uppercase tracking-widest text-[#F0F2F7] flex items-center gap-3">
               <BellRing className="w-6 h-6 text-brand-primary" /> Central de Alertas
            </h2>
            <p className="text-sm text-text-secondary mt-1">Monitoramento ativo sob regras matemáticas.</p>
         </div>
      </div>

      <div className="flex items-center gap-6 mb-8 border-b border-border-default">
         <button onClick={() => setActiveTab('ativos')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'ativos' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-muted hover:text-text-secondary'}`}>
            Alertas Ativos
         </button>
         <button onClick={() => setActiveTab('historico')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'historico' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-muted hover:text-text-secondary'}`}>
            Histórico
         </button>
         <button onClick={() => setActiveTab('config')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'config' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-muted hover:text-text-secondary'}`}>
            <Settings2 className="w-4 h-4 inline-block mr-1" /> Configurações
         </button>
      </div>

      {activeTab === 'ativos' && (
         <div className="space-y-4">
            {alertasDemo.filter(a => a.tipo !== 'positivo' && a.tipo !== 'informativo').map(a => (
               <div key={a.id} className={`card p-5 border-l-4 ${a.tipo === 'critico' ? 'border-l-perf-critico bg-perf-critico/[0.03]' : 'border-l-perf-atencao bg-perf-atencao/[0.03]'}`}>
                  <div className="flex items-start justify-between">
                     <div className="flex gap-4">
                        <div className="mt-1">
                           {a.tipo === 'critico' ? <XCircle className="w-6 h-6 text-perf-critico" /> : <AlertTriangle className="w-6 h-6 text-perf-atencao" />}
                        </div>
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <h3 className={`font-bold text-lg ${a.tipo === 'critico' ? 'text-perf-critico' : 'text-perf-atencao'}`}>{a.titulo}</h3>
                              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">[{a.tempo}]</span>
                           </div>
                           <p className="text-text-primary text-sm font-medium mb-1">{a.msg}</p>
                           {a.cpa && <p className="text-xs text-text-secondary font-mono mb-3">CPA atual: R$ {a.cpa.toFixed(2)} | Meta: R$ {a.meta?.toFixed(2)}</p>}
                           
                           <div className="mt-3 bg-bg-base border border-border-default rounded p-3">
                              <p className="text-xs text-text-primary"><strong className="text-brand-primary uppercase tracking-widest mr-2">❤️ Ação Sugerida:</strong> {a.acao}</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 shrink-0">
                        <button className="px-4 py-2 bg-bg-overlay border border-border-strong hover:bg-bg-elevated transition-colors rounded text-xs font-bold uppercase tracking-wider text-text-primary shadow-sm">Resolver</button>
                        <button className="px-4 py-2 hover:bg-bg-overlay text-text-muted transition-colors rounded text-xs font-bold uppercase tracking-wider">Descartar</button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      )}

      {activeTab === 'historico' && (
         <div className="space-y-4 opacity-75">
            {alertasDemo.filter(a => a.tipo === 'positivo' || a.tipo === 'informativo').map(a => (
               <div key={a.id} className={`card p-5 border-l-4 ${a.tipo === 'positivo' ? 'border-l-perf-excelente' : 'border-l-brand-primary'}`}>
                  <div className="flex items-start justify-between">
                     <div className="flex gap-4">
                        <div className="mt-1">
                           {a.tipo === 'positivo' ? <CheckCircle2 className="w-6 h-6 text-perf-excelente" /> : <Info className="w-6 h-6 text-brand-primary" />}
                        </div>
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <h3 className={`font-bold text-base ${a.tipo === 'positivo' ? 'text-perf-excelente' : 'text-brand-primary'}`}>{a.titulo}</h3>
                              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">[{a.tempo}]</span>
                           </div>
                           <p className="text-text-primary text-xs font-medium mb-1">{a.msg}</p>
                           <p className="text-[10px] text-text-secondary mt-2"><strong className="uppercase">Resolução Automática:</strong> {a.acao}</p>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      )}

      {activeTab === 'config' && (
         <div className="card p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-default">
               <SlidersHorizontal className="w-5 h-5 text-brand-primary" />
               <h3 className="font-heading font-bold uppercase tracking-widest">Gatilhos do Sistema</h3>
            </div>
            
            <div className="space-y-6 max-w-2xl">
               {[
                  { label: "CPA Crítico Acima da Meta", threshold: "20%", badge: "Vendas" },
                  { label: "Frequência Extrema", threshold: "> 6.0", badge: "Reconhecimento" },
                  { label: "CTR Custo/Benefício Baixo", threshold: "< 1.5%", badge: "Tráfego" },
                  { label: "Alerta de ROAS Sub-ótimo", threshold: "< 2.0x", badge: "Vendas" },
               ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-bg-surface border border-border-subtle rounded-lg">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-bold text-sm text-text-primary">{c.label}</span>
                           <span className="px-1.5 py-0.5 rounded bg-bg-overlay text-[9px] uppercase tracking-wider text-text-secondary border border-border-default">{c.badge}</span>
                        </div>
                        <span className="text-xs text-text-muted">Despachar quando limite for cruzado</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="bg-bg-overlay border border-border-strong px-3 py-1.5 rounded text-xs font-mono font-bold text-brand-primary">
                           Lim: {c.threshold}
                        </div>
                        <div className="w-10 h-5 bg-brand-primary rounded-full relative cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                           <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                        </div>
                     </div>
                  </div>
               ))}
               
               <div className="pt-6 border-t border-border-subtle">
                  <button className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest hover:bg-brand-primary hover:text-bg-base transition-colors duration-300">
                     Salvar Mudanças
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
