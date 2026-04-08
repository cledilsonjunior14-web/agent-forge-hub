import React, { useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { demoCreatives } from '@/services/mockData';
import { LayoutGrid, List, ArrowUpRight, ArrowDownRight, Video, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const formatCurrency = (val: number | undefined) => val !== undefined ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

export default function CreativesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const creatives = demoCreatives;
  const promessas = creatives.filter(c => c.status === 'escalar');
  const sangrias = creatives.filter(c => c.status === 'pausar');

  const renderCreativeDetails = (c: any) => (
    <div className="space-y-4">
      <div className="aspect-video bg-bg-overlay border border-border-default rounded flex items-center justify-center">
         <span className="text-text-muted font-bold tracking-widest uppercase">Preview de Alta Resolução</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-bg-surface p-3 rounded border border-border-subtle">
           <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Custo por Aquisição</p>
           <p className="font-mono text-lg font-bold">{formatCurrency(c.cpa || c.lixo)}</p>
         </div>
         <div className="bg-bg-surface p-3 rounded border border-border-subtle">
           <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Taxa de Clique (CTR)</p>
           <p className="font-mono text-lg font-bold">4.2%</p>
         </div>
         <div className="bg-bg-surface p-3 rounded border border-border-subtle">
           <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Volume Captado</p>
           <p className="font-mono text-lg font-bold">{c.conversoes}</p>
         </div>
         <div className="bg-bg-surface p-3 rounded border border-border-subtle">
           <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Recomendação IA</p>
           <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${c.status === 'escalar' ? 'text-perf-excelente' : 'text-perf-critico'}`}>{c.status === 'escalar' ? 'ESCALAR ORÇAMENTO' : 'PAUSAR IMEDIATAMENTE'}</p>
         </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-border-default">
         <div>
            <h2 className="font-heading font-bold text-2xl uppercase tracking-widest text-[#F0F2F7]">Biblioteca de Criativos</h2>
            <p className="text-sm text-text-secondary mt-1">Análise minuciosa de performance gráfica e audiovisual.</p>
         </div>
         <div className="mt-4 sm:mt-0 flex items-center bg-bg-surface border border-border-default rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md flex items-center gap-2 text-xs font-bold uppercase transition-colors ${viewMode === 'grid' ? 'bg-bg-overlay text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
               <LayoutGrid className="w-4 h-4" /> <span>Grade</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md flex items-center gap-2 text-xs font-bold uppercase transition-colors ${viewMode === 'list' ? 'bg-bg-overlay text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
               <List className="w-4 h-4" /> <span>Lista</span>
            </button>
         </div>
      </div>

      {viewMode === 'grid' ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {creatives.map((c, i) => (
               <Dialog key={i}>
                 <DialogTrigger asChild>
                   <div className="card overflow-hidden hover:-translate-y-1 transition-transform group cursor-pointer">
                      <div className="aspect-video bg-bg-overlay border-b border-border-subtle relative flex items-center justify-center">
                         <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Vídeo Mockup</span>
                         <div className="absolute inset-0 bg-gradient-to-t from-bg-surface/80 to-transparent transition-opacity"></div>
                         <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${c.status === 'escalar' ? 'bg-perf-excelente text-bg-base' : 'bg-perf-critico text-bg-base'}`}>
                            {c.status === 'escalar' ? '🔥 Excelente' : '❌ Pausar'}
                         </span>
                      </div>
                      <div className="p-4">
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <h4 className="font-bold text-sm text-text-primary mb-1 break-words line-clamp-2">{c.name}</h4>
                           </TooltipTrigger>
                           <TooltipContent className="bg-bg-elevated border border-border-strong text-text-primary max-w-xs break-words">
                             <p>{c.name} - Clique para abrir o detalhamento completo e histórico de faturamento deste criativo Específico.</p>
                           </TooltipContent>
                         </Tooltip>
                         <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-4">Campanha: Toro Burger</p>
                         
                         <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-text-muted font-medium flex items-center gap-1">
                                 CPA / Lixo
                                 <Tooltip>
                                   <TooltipTrigger><Info className="w-3 h-3"/></TooltipTrigger>
                                   <TooltipContent className="bg-bg-elevated text-xs border border-border-strong">
                                     O Custo por Aquisição (CPA) ou o custo morto investido antes de gerar vendas (Lixo).
                                   </TooltipContent>
                                 </Tooltip>
                               </span>
                               <span className="font-bold font-mono">{formatCurrency(c.cpa || c.lixo)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-text-muted font-medium">CTR</span>
                               <span className="font-bold font-mono">4.2%</span>
                            </div>
                         </div>
                         
                         <button className={`w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors ${c.status === 'escalar' ? 'bg-perf-excelente/10 text-perf-excelente hover:bg-perf-excelente/20' : 'bg-perf-critico/10 text-perf-critico hover:bg-perf-critico/20'}`}>
                            {c.conversoes} Cap — {c.status === 'escalar' ? 'Escalar ↗' : 'Desativar ↘'}
                         </button>
                      </div>
                   </div>
                 </DialogTrigger>
                 <DialogContent className="bg-bg-elevated border-border-strong text-text-primary">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-heading break-words">{c.name}</DialogTitle>
                    </DialogHeader>
                    {renderCreativeDetails(c)}
                 </DialogContent>
               </Dialog>
            ))}
         </div>
      ) : (
         <div className="card overflow-hidden mb-12">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase bg-bg-surface text-text-muted tracking-wider">
                     <tr>
                        <th className="px-4 py-3 font-bold border-b border-border-strong w-20">Preview</th>
                        <th className="px-4 py-3 font-bold border-b border-border-strong">Nome Criativo</th>
                        <th className="px-4 py-3 font-bold border-b border-border-strong text-right">Custo Primário</th>
                        <th className="px-4 py-3 font-bold border-b border-border-strong text-center">CTR Escala</th>
                        <th className="px-4 py-3 font-bold border-b border-border-strong text-center">Volume Cap</th>
                        <th className="px-4 py-3 font-bold border-b border-border-strong text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle bg-bg-base">
                     {creatives.map((c, i) => (
                        <Dialog key={i}>
                           <DialogTrigger asChild>
                              <tr className="hover:bg-bg-elevated transition-colors cursor-pointer">
                                 <td className="px-4 py-2">
                                    <div className="w-16 h-9 rounded bg-bg-overlay border border-border-default"></div>
                                 </td>
                                 <td className="px-4 py-2 font-bold text-text-primary break-words max-w-[200px]">{c.name}</td>
                                 <td className="px-4 py-2 text-right font-mono text-text-secondary">{formatCurrency(c.cpa || c.lixo)}</td>
                                 <td className="px-4 py-2 text-center text-xs font-bold text-text-primary">4.2%</td>
                                 <td className="px-4 py-2 text-center font-bold text-text-primary">{c.conversoes}</td>
                                 <td className="px-4 py-2 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.status === 'escalar' ? 'bg-perf-excelente text-bg-base' : 'bg-perf-critico text-bg-base'}`}>
                                       {c.status}
                                    </span>
                                 </td>
                              </tr>
                           </DialogTrigger>
                           <DialogContent className="bg-bg-elevated border-border-strong text-text-primary">
                              <DialogHeader>
                                <DialogTitle className="text-lg font-heading break-words">{c.name}</DialogTitle>
                              </DialogHeader>
                              {renderCreativeDetails(c)}
                           </DialogContent>
                        </Dialog>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* Batalha Expandida */}
      <div>
         <div className="flex items-center gap-2 mb-6">
            <Video className="w-5 h-5 text-brand-primary" />
            <h2 className="font-heading font-bold text-xl uppercase tracking-widest text-[#F0F2F7]">Central de Batalha (Geral)</h2>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card bg-[#00E096]/[0.02] border-[#00E096]/20 overflow-hidden shadow-[0_0_50px_rgba(0,224,150,0.03)]">
               <div className="p-5 border-b border-[#00E096]/10 flex items-center justify-between bg-[#00E096]/[0.05]">
                  <div className="flex items-center gap-3">
                     <ArrowUpRight className="w-5 h-5 text-[#00E096]" />
                     <h3 className="font-bold text-sm uppercase tracking-widest text-[#00E096]">Promessas Escaláveis</h3>
                  </div>
                  <span className="text-xs bg-[#00E096]/20 text-[#00E096] px-2 py-1 rounded font-bold">{promessas.length} Encontrados</span>
               </div>
               <div className="p-5 space-y-3">
                  {promessas.map((c, i) => (
                     <Dialog key={i}>
                        <DialogTrigger asChild>
                           <div className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-lg hover:border-[#00E096]/30 transition-colors group cursor-pointer">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 shrink-0 rounded bg-bg-overlay flex items-center justify-center text-text-muted text-[8px] font-bold group-hover:scale-105 transition-transform">TH</div>
                                 <div className="min-w-0 pr-2">
                                    <p className="text-sm font-bold text-text-primary break-words">{c.name}</p>
                                    <p className="text-xs text-text-secondary mt-0.5">CPA Estável: R$ {c.cpa}</p>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                 <div className="px-2 py-0.5 rounded bg-[#00E096]/10 text-[#00E096] text-xs font-bold uppercase">{c.conversoes} Cap</div>
                                 <span className="text-[9px] text-[#00E096]/60 mt-1 uppercase tracking-wider font-bold">Safe Zone</span>
                              </div>
                           </div>
                        </DialogTrigger>
                        <DialogContent className="bg-bg-elevated border-border-strong text-text-primary">
                           <DialogHeader>
                             <DialogTitle className="text-lg font-heading break-words">{c.name}</DialogTitle>
                           </DialogHeader>
                           {renderCreativeDetails(c)}
                        </DialogContent>
                     </Dialog>
                  ))}
               </div>
            </div>

            <div className="card bg-[#FF4D4D]/[0.02] border-[#FF4D4D]/20 overflow-hidden shadow-[0_0_50px_rgba(255,77,77,0.03)]">
               <div className="p-5 border-b border-[#FF4D4D]/10 flex items-center justify-between bg-[#FF4D4D]/[0.05]">
                  <div className="flex items-center gap-3">
                     <ArrowDownRight className="w-5 h-5 text-[#FF4D4D]" />
                     <h3 className="font-bold text-sm uppercase tracking-widest text-[#FF4D4D]">Sangria no Orçamento</h3>
                  </div>
                  <span className="text-xs bg-[#FF4D4D]/20 text-[#FF4D4D] px-2 py-1 rounded font-bold">{sangrias.length} Encontrados</span>
               </div>
               <div className="p-5 space-y-3">
                  {sangrias.map((c, i) => (
                     <Dialog key={i}>
                        <DialogTrigger asChild>
                           <div className="flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-lg hover:border-[#FF4D4D]/30 transition-colors group cursor-pointer">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 shrink-0 rounded bg-[#FF4D4D]/5 border border-[#FF4D4D]/20 flex items-center justify-center text-[#FF4D4D]/50 text-[8px] font-bold group-hover:scale-105 transition-transform">TH</div>
                                 <div className="min-w-0 pr-2">
                                    <p className="text-sm font-bold text-text-primary break-words">{c.name}</p>
                                    <p className="text-xs text-[#FF4D4D] mt-0.5">Lixo Confirmado: R$ {c.lixo}</p>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                 <div className="px-2 py-0.5 rounded bg-[#FF4D4D]/10 text-[#FF4D4D] text-xs font-bold uppercase">{c.conversoes} Cap</div>
                                 <span className="text-[9px] text-[#FF4D4D]/60 mt-1 uppercase tracking-wider font-bold">Bloqueio Urgente</span>
                              </div>
                           </div>
                        </DialogTrigger>
                        <DialogContent className="bg-bg-elevated border-border-strong text-text-primary">
                           <DialogHeader>
                             <DialogTitle className="text-lg font-heading break-words">{c.name}</DialogTitle>
                           </DialogHeader>
                           {renderCreativeDetails(c)}
                        </DialogContent>
                     </Dialog>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
