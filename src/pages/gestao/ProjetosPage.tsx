import React, { useState } from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Search, Plus, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProjetosPage() {
  const { projects, clients } = useGestaoData();
  const [search, setSearch] = useState('');

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-secondary/5 shrink-0">
         <h2 className="font-black text-lg tracking-widest uppercase flex items-center gap-2"><FolderOpen className="w-5 h-5"/> Projetos e Espaços</h2>
         <div className="flex gap-2">
            <div className="flex items-center h-9 px-3 bg-secondary/20 border border-border rounded-md w-full sm:w-64 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
               <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0"/>
               <input 
                 value={search} onChange={(e)=>setSearch(e.target.value)}
                 placeholder="Buscar projeto..."
                 className="bg-transparent border-none outline-none w-full text-sm h-full"
               />
            </div>
            <Button size="sm" className="h-9 font-bold"><Plus className="w-4 h-4 mr-1"/> Novo Projeto</Button>
         </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto w-full max-w-6xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => {
               const c = clients.find(cl => cl.id === p.clientId);
               return (
                  <div key={p.id} className="bg-card border border-border shadow-sm hover:shadow-md rounded-xl p-5 group flex flex-col transition-all hover:border-primary/50">
                     <div className="flex justify-between items-start mb-3">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">{p.type || 'Geral'}</Badge>
                        <Badge variant="outline" className={`text-[9px] uppercase ${p.status === 'Em andamento' ? 'text-primary border-primary/30' : ''}`}>{p.status}</Badge>
                     </div>
                     <h3 className="font-black text-lg mb-1 leading-tight group-hover:text-primary transition-colors">{p.name}</h3>
                     
                     <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-4">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: c?.color || '#ccc'}}></div>
                        <span className="truncate">{c?.name || 'Sem Cliente Vinculado'}</span>
                     </div>

                     <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">{p.description || 'Nenhuma descrição fornecida para este projeto.'}</p>

                     <div className="mt-auto space-y-3 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-muted-foreground">
                           <CalendarIcon className="w-3.5 h-3.5" />
                           {p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'} 
                           <span>→</span> 
                           <span className={p.deadline && new Date(p.deadline).getTime() < Date.now() ? 'text-destructive' : ''}>
                              {p.deadline ? new Date(p.deadline).toLocaleDateString() : '-'}
                           </span>
                        </div>
                        {p.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                             <Tag className="w-3 h-3 text-muted-foreground" />
                             {p.tags.map(t => <span key={t} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{t}</span>)}
                          </div>
                        )}
                     </div>
                  </div>
               )
            })}
         </div>
      </div>
    </div>
  );
}
