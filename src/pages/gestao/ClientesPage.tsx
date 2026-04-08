import React, { useState } from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, Phone, Mail, Building, LayoutGrid, List } from 'lucide-react';

export default function ClientesPage() {
  const { clients } = useGestaoData();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.contactEmail.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/5 shrink-0">
         <h2 className="font-black text-lg tracking-widest uppercase flex items-center gap-2"><Users className="w-5 h-5"/> Clientes (CRM)</h2>
         <Button size="sm"><Plus className="w-4 h-4 mr-1"/> Novo Cliente</Button>
      </div>

      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-background shrink-0">
         <div className="flex items-center h-9 px-3 bg-secondary/20 border border-border rounded-md w-full sm:w-96 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0"/>
            <input 
              value={search} onChange={(e)=>setSearch(e.target.value)}
              placeholder="Buscar cliente por nome ou email..."
              className="bg-transparent border-none outline-none w-full text-sm h-full"
            />
         </div>
         <div className="flex gap-2">
            <Button variant={view==='grid'?'default':'outline'} size="sm" onClick={()=>setView('grid')} className="h-9 w-9 p-0"><LayoutGrid className="w-4 h-4"/></Button>
            <Button variant={view==='list'?'default':'outline'} size="sm" onClick={()=>setView('list')} className="h-9 w-9 p-0"><List className="w-4 h-4"/></Button>
         </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto w-full">
         {view === 'grid' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-all group flex flex-col">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl text-white shadow-sm" style={{backgroundColor: c.color}}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <Badge variant="outline" className={`text-[9px] uppercase ${c.status.includes('ATIVO') ? 'text-success border-success/30' : 'text-muted-foreground'}`}>{c.status}</Badge>
                   </div>
                   
                   <h3 className="font-bold text-base mb-1 truncate group-hover:text-primary transition-colors">{c.name}</h3>
                   <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 font-medium">
                      <Building className="w-3.5 h-3.5"/> {c.segment || 'Sem segmento'}
                   </div>

                   <div className="space-y-2 mt-auto">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/20 p-1.5 rounded">
                         <Phone className="w-3 h-3 shrink-0"/> <span className="truncate">{c.contactPhone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/20 p-1.5 rounded">
                         <Mail className="w-3 h-3 shrink-0"/> <span className="truncate">{c.contactEmail || '—'}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
         ) : (
           <div className="bg-card rounded-xl border border-border overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead>
                   <tr className="border-b border-border bg-secondary/5 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                     <th className="p-4">Cliente</th>
                     <th className="p-4">Status</th>
                     <th className="p-4">Segmento</th>
                     <th className="p-4">Contato</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-secondary/10 cursor-pointer group">
                       <td className="p-4 font-bold flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{backgroundColor: c.color}}></span>
                          <span className="group-hover:text-primary transition-colors">{c.name}</span>
                       </td>
                       <td className="p-4"><Badge variant="outline" className={`text-[9px] uppercase ${c.status.includes('ATIVO') ? 'text-success border-success/30 bg-success/5' : ''}`}>{c.status}</Badge></td>
                       <td className="p-4 text-muted-foreground text-xs">{c.segment}</td>
                       <td className="p-4 flex flex-col gap-1 text-xs text-muted-foreground">
                          {c.contactPhone && <span>{c.contactPhone}</span>}
                          {c.contactEmail && <span>{c.contactEmail}</span>}
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
         )}
      </div>
    </div>
  );
}
