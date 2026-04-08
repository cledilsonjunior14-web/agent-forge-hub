import React, { useState } from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { TaskDrawer } from '@/components/gestao/TaskDrawer';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { Task } from '@/types/gestao';

export default function GanttPage() {
  const { tasks, clients } = useGestaoData();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Gantt logic simplified: last 30 days and next 60 days
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const days = Array.from({length: 60}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - 10 + i);
    return d;
  });

  const getDayLeft = (date: Date) => {
     let diff = (date.getTime() - days[0].getTime()) / (1000 * 3600 * 24);
     return Math.max(0, diff * 40); // 40px per day
  };

  const getWidth = (start: Date, end: Date) => {
     let diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
     return Math.max(40, diff * 40);
  };

  const ganttTasks = tasks.filter(t => t.startDate && t.dueDate).sort((a,b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/5 shrink-0">
         <h2 className="font-black text-lg tracking-widest uppercase flex items-center gap-2"><CalendarIcon className="w-5 h-5"/> Visão Gantt</h2>
      </div>

      <div className="flex-1 overflow-auto relative flex">
         {/* Left Names */}
         <div className="w-64 border-r border-border bg-card shrink-0 flex flex-col">
            <div className="h-12 border-b border-border bg-secondary/5 shrink-0"></div>
            {ganttTasks.map(t => (
               <div key={`name-${t.id}`} className="h-12 border-b border-border flex items-center px-3 truncate text-xs font-bold hover:bg-secondary/20 cursor-pointer" onClick={() => setSelectedTaskId(t.id)}>
                 {t.title}
               </div>
            ))}
         </div>

         {/* Right Chart */}
         <div className="flex-1 overflow-x-auto relative bg-background">
            {/* Header Days */}
            <div className="h-12 border-b border-border flex bg-secondary/5" style={{width: `${days.length * 40}px`}}>
               {days.map(d => (
                 <div key={d.toISOString()} className={`w-[40px] shrink-0 border-r border-border/50 text-center flex flex-col justify-center items-center text-[10px] ${d.getTime() === today.getTime() ? 'bg-primary/20 text-primary font-black' : 'text-muted-foreground'}`}>
                   <span>{d.getDate()}</span>
                   <span className="opacity-50">{['D','S','T','Q','Q','S','S'][d.getDay()]}</span>
                 </div>
               ))}
            </div>

            {/* Rows */}
            <div className="relative" style={{width: `${days.length * 40}px`}}>
               {/* Today Line */}
               <div className="absolute top-0 bottom-0 w-px bg-primary z-0 opacity-50" style={{ left: getDayLeft(today) + 20 }}></div>

               {ganttTasks.map((t, i) => {
                 const s = new Date(t.startDate!);
                 const e = new Date(t.dueDate!);
                 const left = getDayLeft(s);
                 const width = getWidth(s, e);
                 const c = clients.find(cl=>cl.id === t.clientId);
                 return (
                   <div key={`row-${t.id}`} className="h-12 border-b border-border/50 relative hover:bg-secondary/5">
                      <div 
                        onClick={() => setSelectedTaskId(t.id)}
                        className="absolute h-8 top-2 rounded-md shadow-sm border opacity-90 hover:opacity-100 flex items-center px-2 cursor-pointer z-10 transition-transform hover:scale-[1.02]"
                        style={{ left, width, backgroundColor: c?.color || '#ccc', borderColor: 'rgba(0,0,0,0.2)' }}
                      >
                         <span className="text-[10px] text-black font-black truncate">{t.title}</span>
                      </div>
                   </div>
                 )
               })}
            </div>
         </div>
      </div>

      <TaskDrawer taskId={selectedTaskId} open={!!selectedTaskId} onOpenChange={(o) => !o && setSelectedTaskId(null)} />
    </div>
  );
}
