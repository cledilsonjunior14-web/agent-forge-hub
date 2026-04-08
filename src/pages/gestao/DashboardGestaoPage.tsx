import React from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { useGestaoAuth } from '@/contexts/GestaoAuthContext';
import { LayoutDashboard, Megaphone, Users, User, ArrowRight, Play, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function DashboardGestaoPage() {
  const { tasks, clients, updateTask, activities } = useGestaoData();
  const { currentUser } = useGestaoAuth();

  const myTasks = tasks.filter(t => t.assignedTo.includes(currentUser?.id || '') && t.status !== 'Concluído');
  const runningTask = tasks.find(t => t.timerRunning && t.assignedTo.includes(currentUser?.id || ''));

  const recentActivities = activities.slice(0, 5);

  const toggleTimer = (taskId: string, isRunning: boolean) => {
    if(!currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (isRunning) {
      const start = new Date(task.timerStartedAt!).getTime();
      const diffMins = Math.floor((Date.now() - start) / 60000);
      updateTask(task.id, {
        timerRunning: false,
        timerStartedAt: null,
        trackedMinutes: task.trackedMinutes + diffMins,
        timerHistory: [
          ...task.timerHistory,
          { userId: currentUser.id, startedAt: task.timerStartedAt!, stoppedAt: new Date().toISOString(), minutes: diffMins }
        ]
      }, `parou o rastreador de tempo`);
    } else {
      updateTask(task.id, {
        timerRunning: true,
        timerStartedAt: new Date().toISOString()
      }, `iniciou o rastreador de tempo`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto p-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h2 className="font-black text-2xl tracking-widest uppercase flex items-center gap-3">
               <LayoutDashboard className="w-6 h-6 text-primary"/> Home
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">Bem-vindo(a) de volta, <span className="font-bold text-foreground">{currentUser?.name}</span>.</p>
         </div>
      </div>

      {runningTask && (
         <div className="mb-8 border border-success/30 bg-success/5 rounded-xl p-4 flex items-center justify-between shadow-sm animate-pulse-slow">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success"><Play className="w-4 h-4 fill-current"/></div>
               <div>
                  <p className="text-xs uppercase font-bold text-success/80 tracking-wider">Timer Ativo</p>
                  <p className="font-bold text-lg">{runningTask.title}</p>
               </div>
            </div>
            <Button variant="destructive" onClick={() => toggleTimer(runningTask.id, true)} className="shadow-lg font-black tracking-wider"><Square className="w-4 h-4 mr-2 fill-current"/> PAAAR</Button>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Col - Minhas Tarefas */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="bg-background shadow-sm border-border">
               <CardHeader className="bg-secondary/5 border-b border-border">
                  <div className="flex justify-between items-center">
                     <div>
                        <CardTitle className="text-lg">Minhas Tarefas Abertas</CardTitle>
                        <CardDescription>O que você precisa entregar</CardDescription>
                     </div>
                     <Button size="sm" variant="ghost" asChild><Link to="/gestao/lista">Ver Todas <ArrowRight className="w-3 h-3 ml-1"/></Link></Button>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  {myTasks.length === 0 ? (
                     <div className="p-8 text-center text-muted-foreground italic">Tudo limpo! Nenhuma tarefa atribuída a você.</div>
                  ) : (
                     <div className="divide-y divide-border">
                        {myTasks.map(t => {
                           const c = clients.find(cl=>cl.id===t.clientId);
                           return (
                              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                                 <div>
                                    <p className="font-bold mb-1">{t.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                       <Badge variant="outline" className="text-[9px] uppercase border-border">{c?.name}</Badge>
                                       <span className={t.priority === 'urgente' ? 'text-destructive font-bold' : ''}>Prioridade: {t.priority}</span>
                                       <span>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Sem prazo'}</span>
                                    </div>
                                 </div>
                                 <Button 
                                   size="sm" 
                                   variant={t.timerRunning ? "destructive" : "outline"} 
                                   onClick={() => toggleTimer(t.id, t.timerRunning)}
                                   disabled={!!runningTask && runningTask.id !== t.id}
                                 >
                                    {t.timerRunning ? <Square className="w-3 h-3 fill-current"/> : <Play className="w-3 h-3 fill-current"/>}
                                 </Button>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

         {/* Right Col - Feed & Info */}
         <div className="space-y-8">
            <Card className="bg-background shadow-sm border-border">
               <CardHeader className="bg-secondary/5 border-b border-border">
                  <CardTitle className="text-base text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary"/> Activity Feed (Geral)</CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-4">
                  {recentActivities.map(a => (
                     <div key={a.id} className="text-sm">
                        <span className="font-bold text-primary mr-1">{a.userId}</span>
                        <span className="text-foreground/80">{a.description}</span>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">{new Date(a.createdAt).toLocaleString()}</div>
                     </div>
                  ))}
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
