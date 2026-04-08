import React, { useState } from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { TaskDrawer } from '@/components/gestao/TaskDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Task } from '@/types/gestao';

export default function CalendarioPage() {
  const { tasks, clients } = useGestaoData();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Base month state
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getTasksForDay = (day: number) => {
    const dStr = new Date(year, month, day).toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate?.startsWith(dStr) || t.startDate?.startsWith(dStr));
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      
      {/* TOOLBAR */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/5 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4"/></Button>
          <h2 className="font-black text-lg w-40 text-center uppercase tracking-widest capitalize">
            {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4"/></Button>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="h-9 font-bold" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
           <Button variant="outline" size="sm" className="h-9 text-muted-foreground"><Filter className="w-4 h-4 mr-2"/>Filtros</Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
         <div className="grid grid-cols-7 gap-px bg-border/50 rounded-xl overflow-hidden border border-border/80">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="bg-secondary/20 p-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {d}
              </div>
            ))}
            
            {blanks.map(b => (
              <div key={`blank-${b}`} className="bg-secondary/5 min-h-[120px] p-2 opacity-50" />
            ))}
            
            {days.map(d => {
              const dayTasks = getTasksForDay(d);
              const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
              return (
                <div key={d} className={`bg-background min-h-[120px] p-2 border-t border-transparent hover:bg-secondary/10 transition-colors ${isToday ? 'border-primary ring-1 ring-inset ring-primary/20 bg-primary/5' : ''}`}>
                   <div className="font-bold text-xs mb-2 p-1 inline-block text-muted-foreground">
                     <span className={isToday ? 'bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full' : ''}>{d}</span>
                   </div>
                   <div className="space-y-1">
                     {dayTasks.map(t => {
                       const c = clients.find(cl=>cl.id === t.clientId);
                       return (
                         <div 
                           key={t.id} 
                           onClick={() => setSelectedTaskId(t.id)}
                           className="text-[10px] p-1.5 rounded bg-secondary cursor-pointer hover:opacity-80 truncate border-l-[3px]"
                           style={{ borderLeftColor: c?.color || '#ccc' }}
                         >
                           {t.title}
                         </div>
                       );
                     })}
                   </div>
                </div>
              );
            })}
         </div>
      </div>

      <TaskDrawer taskId={selectedTaskId} open={!!selectedTaskId} onOpenChange={(o) => !o && setSelectedTaskId(null)} />
    </div>
  );
}
