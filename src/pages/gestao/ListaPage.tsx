import React, { useState } from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { useGestaoAuth } from '@/contexts/GestaoAuthContext';
import { TaskDrawer } from '@/components/gestao/TaskDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Filter, Command, User, Clock, CheckSquare, ArrowUpDown } from 'lucide-react';
import { Task } from '@/types/gestao';

export default function ListaPage() {
  const { tasks, clients, updateTask } = useGestaoData();
  const { hasPermission } = useGestaoAuth();
  const canCreateTask = hasPermission('tarefa', 'create');

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<'status' | 'client' | 'none'>('status');

  // Filter Tasks
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  // Grouping
  const getGroupedTasks = () => {
    if (groupBy === 'none') return { 'Todas': filteredTasks };
    
    if (groupBy === 'status') {
      const groups: Record<string, Task[]> = {};
      filteredTasks.forEach(t => {
        const s = t.status || 'Sem Status';
        if(!groups[s]) groups[s] = [];
        groups[s].push(t);
      });
      return groups;
    }

    if (groupBy === 'client') {
      const groups: Record<string, Task[]> = {};
      filteredTasks.forEach(t => {
        const client = clients.find(c => c.id === t.clientId);
        const name = client?.name || 'Sem Cliente';
        if(!groups[name]) groups[name] = [];
        groups[name].push(t);
      });
      return groups;
    }
    
    return { 'Todas': filteredTasks };
  };

  const grouped = getGroupedTasks();

  const handleStatusChange = (id: string, newStatus: string) => {
    updateTask(id, { status: newStatus }, `alterou o status para ${newStatus}`, 'status_changed');
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* TOOLBAR */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 bg-secondary/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center h-9 px-3 bg-background border border-border rounded-md shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all lg:w-80">
            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0"/>
            <input 
              value={search} onChange={(e)=>setSearch(e.target.value)}
              placeholder="Buscar tarefas..."
              className="bg-transparent border-none outline-none w-full text-sm h-full"
            />
          </div>
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="w-[140px] h-9 bg-background">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Lista Simples</SelectItem>
              <SelectItem value="status">Por Status</SelectItem>
              <SelectItem value="client">Por Cliente</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground"><Filter className="w-4 h-4"/> Filtros</Button>
        </div>
        
        <div className="flex gap-2">
          {canCreateTask && <Button size="sm" className="h-9 font-bold"><Plus className="w-4 h-4 mr-1"/> Nova Tarefa</Button>}
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {Object.entries(grouped).map(([groupName, groupTasks]) => (
          <div key={groupName} className="mb-8">
            {/* Group Header */}
            {groupBy !== 'none' && (
              <div className="flex items-center gap-3 mb-3 bg-secondary/30 px-3 py-2 rounded-t-lg border-b border-border/50">
                <h2 className="font-black text-sm uppercase tracking-wider">{groupName}</h2>
                <Badge variant="secondary" className="font-mono">{groupTasks.length}</Badge>
              </div>
            )}
            
            {/* Table */}
            <div className="w-full bg-card rounded-lg border border-border shadow-sm min-w-[800px] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                   <tr className="border-b border-border bg-secondary/5 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                     <th className="p-3 w-8 text-center"><CheckSquare className="w-3.5 h-3.5 mx-auto"/></th>
                     <th className="p-3 cursor-pointer hover:bg-secondary/10 group"><div className="flex items-center gap-1">Título <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"/></div></th>
                     <th className="p-3 w-40">Cliente</th>
                     <th className="p-3 w-32">Status</th>
                     <th className="p-3 w-32">Responsável</th>
                     <th className="p-3 w-32">Vencimento</th>
                     <th className="p-3 w-32 text-center">Progresso</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groupTasks.map((task) => {
                    const client = clients.find(c => c.id === task.clientId);
                    const overdue = isOverdue(task.dueDate) && task.status !== 'Concluído';
                    
                    return (
                      <tr key={task.id} className={`hover:bg-secondary/20 transition-colors group ${overdue ? 'bg-destructive/5 hover:bg-destructive/10' : ''}`}>
                         <td className="p-3 text-center"><input type="checkbox" className="rounded border-border focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary" /></td>
                         <td className="p-3 font-medium cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                            <div className="flex items-center gap-2">
                               <span className="group-hover:text-primary transition-colors">{task.title}</span>
                               {task.timerRunning && <span className="w-2 h-2 rounded-full bg-success animate-pulse" title="Timer rodando" />}
                            </div>
                         </td>
                         <td className="p-3">
                           {client ? (
                             <Badge variant="outline" style={{borderColor: client.color, color: client.color}} className="bg-transparent text-[10px] uppercase font-bold truncate max-w-full block text-center">
                               {client.name}
                             </Badge>
                           ) : <span className="text-muted-foreground text-xs italic">-</span>}
                         </td>
                         <td className="p-3">
                           <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                             <SelectTrigger className={`h-7 text-[10px] uppercase font-bold bg-secondary/50 border-none ${task.status==='Concluído' ? 'text-success' : ''}`}>
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="Backlog">Backlog</SelectItem>
                                <SelectItem value="A Fazer">A Fazer</SelectItem>
                                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                <SelectItem value="Concluído">Concluído</SelectItem>
                             </SelectContent>
                           </Select>
                         </td>
                         <td className="p-3">
                           <div className="flex items-center -space-x-1.5">
                              {task.assignedTo.length === 0 ? <span className="text-muted-foreground text-xs italic">-</span> : 
                                task.assignedTo.map(uid => (
                                  <div key={uid} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[9px] font-bold" title={uid}>
                                    {uid.slice(0, 2).toUpperCase()}
                                  </div>
                                ))
                              }
                           </div>
                         </td>
                         <td className="p-3">
                           <span className={`text-[11px] font-mono font-bold ${overdue ? 'text-destructive' : 'text-foreground/80'}`}>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Sem prazo'}
                           </span>
                         </td>
                         <td className="p-3 text-center">
                           {task.checklists.length > 0 ? (() => {
                             const total = task.checklists.reduce((acc, c) => acc + c.items.length, 0);
                             const done = task.checklists.reduce((acc, c) => acc + c.items.filter(i=>i.done).length, 0);
                             return <Badge variant="secondary" className="font-mono text-[10px]">{done}/{total}</Badge>;
                           })() : <span className="text-muted-foreground text-xs italic">-</span>}
                         </td>
                      </tr>
                    );
                  })}
                  {groupTasks.length === 0 && (
                     <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground italic text-sm">Nenhuma tarefa encontrada neste grupo.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <TaskDrawer taskId={selectedTaskId} open={!!selectedTaskId} onOpenChange={(o) => !o && setSelectedTaskId(null)} />
    </div>
  );
}
