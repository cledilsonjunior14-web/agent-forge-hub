import React from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { Button } from '@/components/ui/button';
import { FormInput, Plus, Copy, Link as LinkIcon, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FormulariosPage() {
  const { forms, clients, projects } = useGestaoData();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/5 shrink-0">
         <h2 className="font-black text-lg tracking-widest uppercase flex items-center gap-2"><FormInput className="w-5 h-5"/> Formulários</h2>
         <Button size="sm"><Plus className="w-4 h-4 mr-1"/> Criar Formulário</Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.length === 0 ? (
              <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                 <FormInput className="w-12 h-12 mx-auto mb-4 opacity-20" />
                 <h3 className="font-bold text-lg mb-2 text-foreground">Nenhum formulário ativo</h3>
                 <p className="text-sm mb-6 max-w-sm mx-auto">Crie formulários públicos para captação de briefings. As respostas virarão tarefas instantaneamente.</p>
                 <Button><Plus className="w-4 h-4 mr-2"/> Começar</Button>
              </div>
            ) : forms.map(f => {
              const c = clients.find(cl=>cl.id === f.clientId);
              return (
                <div key={f.id} className="bg-card border border-border shadow-sm hover:shadow-md rounded-xl p-5 transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                     <Badge variant={f.isActive ? 'default' : 'secondary'}>{f.isActive ? 'ATIVO' : 'RASCUNHO'}</Badge>
                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Settings2 className="w-4 h-4 text-muted-foreground"/></Button>
                  </div>
                  <h3 className="font-black text-lg mb-1">{f.title}</h3>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-6">Cliente vinculado: <span style={{color: c?.color}}>{c?.name || 'Projeto Padrão'}</span></p>
                  
                  <div className="flex justify-between items-center bg-secondary/20 p-2 rounded border border-border/50 text-xs text-muted-foreground">
                    <span className="truncate mr-2">aibdigital.com/form/{f.publicSlug}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0"><Copy className="w-3 h-3"/></Button>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs font-bold text-muted-foreground">
                    <span>{f.submissionCount} respostas</span>
                    <span className="flex items-center gap-1 text-primary cursor-pointer hover:underline"><LinkIcon className="w-3 h-3"/> Abrir Editor</span>
                  </div>
                </div>
              )
            })}
         </div>
      </div>
    </div>
  );
}
