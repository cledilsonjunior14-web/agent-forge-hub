import React from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { Activity, Clock, Target, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaineisPage() {
  const { tasks, clients } = useGestaoData();

  const totalMinutos = tasks.reduce((acc, t) => acc + t.trackedMinutes, 0);
  const totalHoras = (totalMinutos / 60).toFixed(1);
  const totalConcluidas = tasks.filter(t => t.status === 'Concluído').length;
  const totalAtivas = tasks.length - totalConcluidas;

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto p-8 animate-in fade-in duration-300">
       <div className="flex justify-between items-center mb-8">
          <h2 className="font-black text-2xl tracking-widest uppercase flex items-center gap-3"><Activity className="w-6 h-6 text-primary"/> Painéis de Desempenho</h2>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-secondary/10 border-border shadow-sm">
             <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/> Horas Rastreadas</CardTitle></CardHeader>
             <CardContent><p className="text-3xl font-black">{totalHoras}h</p></CardContent>
          </Card>
          <Card className="bg-secondary/10 border-border shadow-sm">
             <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground flex items-center gap-2"><Target className="w-4 h-4 text-success"/> Tarefas Concluídas</CardTitle></CardHeader>
             <CardContent><p className="text-3xl font-black">{totalConcluidas}</p></CardContent>
          </Card>
          <Card className="bg-secondary/10 border-border shadow-sm">
             <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground flex items-center gap-2"><Rocket className="w-4 h-4 text-primary"/> Tarefas Ativas</CardTitle></CardHeader>
             <CardContent><p className="text-3xl font-black">{totalAtivas}</p></CardContent>
          </Card>
          <Card className="bg-secondary/10 border-border shadow-sm">
             <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Clientes Atendidos</CardTitle></CardHeader>
             <CardContent><p className="text-3xl font-black">{clients.length}</p></CardContent>
          </Card>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-background border border-border shadow-sm">
             <CardHeader className="border-b border-border bg-secondary/5">
                <CardTitle className="text-sm">Gastos de Tempo por Cliente</CardTitle>
             </CardHeader>
             <CardContent className="p-4 space-y-4">
               {clients.map(c => {
                  const cTasks = tasks.filter(t => t.clientId === c.id);
                  const min = cTasks.reduce((acc, t) => acc + t.trackedMinutes, 0);
                  if (min === 0) return null;
                  return (
                     <div key={c.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                        <span className="font-bold flex items-center gap-2">
                           <span className="w-3 h-3 rounded-full" style={{backgroundColor: c.color}}></span> {c.name}
                        </span>
                        <span className="font-mono text-muted-foreground">{(min/60).toFixed(1)}h</span>
                     </div>
                  );
               })}
             </CardContent>
          </Card>

          <Card className="bg-background border border-border shadow-sm">
             <CardHeader className="border-b border-border bg-secondary/5">
                <CardTitle className="text-sm">Status das Tarefas</CardTitle>
             </CardHeader>
             <CardContent className="p-4 space-y-4">
               {['Backlog', 'A Fazer', 'Em Andamento', 'Em Revisão', 'Aprovado', 'Concluído'].map(st => {
                  const count = tasks.filter(t => t.status === st).length;
                  if (count === 0) return null;
                  return (
                     <div key={st} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                        <span className="font-bold">{st}</span>
                        <span className="bg-secondary px-2 rounded-full font-mono text-xs text-muted-foreground">{count}</span>
                     </div>
                  );
               })}
             </CardContent>
          </Card>
       </div>
    </div>
  );
}
