import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, Square, CalendarIcon, User, Flag, Plus, MessageSquare, 
  Paperclip, Search, ChevronDown, CheckCircle2, Circle, Clock, Tag
} from 'lucide-react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { useGestaoAuth } from '@/contexts/GestaoAuthContext';
import { Task, ChecklistItem } from '@/types/gestao';

export function TaskDrawer({ 
  taskId, 
  open, 
  onOpenChange 
}: { 
  taskId: string | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { tasks, updateTask, addActivity, activities } = useGestaoData();
  const { currentUser } = useGestaoAuth();
  const task = tasks.find(t => t.id === taskId);
  
  const [titleEdit, setTitleEdit] = useState('');
  const [descEdit, setDescEdit] = useState('');
  
  // Timer State
  const [timerText, setTimerText] = useState('00:00:00');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (task) {
      setTitleEdit(task.title);
      setDescEdit(task.description);
    }
  }, [task?.id]); // Only re-run when task ID changes, to preserve typing

  useEffect(() => {
    if (!task) return;
    
    if (task.timerRunning && task.timerStartedAt) {
      const start = new Date(task.timerStartedAt).getTime();
      timerIntervalRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - start) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        setTimerText(`${h}:${m}:${s}`);
      }, 1000);
    } else {
      setTimerText('00:00:00');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [task?.timerRunning, task?.timerStartedAt]);

  if (!task) return null;

  const handleTitleSave = () => {
    if (titleEdit !== task.title) {
      updateTask(task.id, { title: titleEdit }, `alterou o título para "${titleEdit}"`);
    }
  };

  const handleDescSave = () => {
    if (descEdit !== task.description) {
      updateTask(task.id, { description: descEdit }, `atualizou a descrição da tarefa`);
    }
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const toggleTimer = () => {
    if(!currentUser) return;
    if (task.timerRunning) {
      // Stop timer
      const start = new Date(task.timerStartedAt!).getTime();
      const diffMins = Math.floor((Date.now() - start) / 60000);
      const newTracked = task.trackedMinutes + diffMins;
      updateTask(task.id, {
        timerRunning: false,
        timerStartedAt: null,
        trackedMinutes: newTracked,
        timerHistory: [
          ...task.timerHistory,
          { userId: currentUser.id, startedAt: task.timerStartedAt!, stoppedAt: new Date().toISOString(), minutes: diffMins }
        ]
      }, `parou o rastreador de tempo (${diffMins} min)`);
    } else {
      // Start timer
      updateTask(task.id, {
        timerRunning: true,
        timerStartedAt: new Date().toISOString()
      }, `iniciou o rastreador de tempo`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[95vw] sm:max-w-[1200px] p-0 flex flex-col md:flex-row gap-0 overflow-hidden bg-background">
        
        {/* LEFT COLUMN - 60% */}
        <div className="flex-1 md:w-[60%] flex flex-col h-full border-r border-border overflow-y-auto scrollbar-thin">
          
          <div className="p-6 pb-2">
            <div className="text-[10px] uppercase text-muted-foreground tracking-widest mb-3 flex items-center gap-2">
              <span>ESPAÇO</span> <ChevronDown className="w-3 h-3"/>
              <span>PROJETO</span> <ChevronDown className="w-3 h-3"/>
              <span>LISTA</span>
            </div>
            
            <input 
              className="text-2xl font-black bg-transparent border-none outline-none focus:ring-0 w-full mb-4 text-foreground"
              value={titleEdit}
              onChange={(e) => setTitleEdit(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />

            {/* AI Banner Placeholder */}
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center gap-3 mb-6">
              <span className="text-xl">🤖</span>
              <p className="text-xs text-primary/80 font-medium">Peça ao Brain para criar um resumo, Gerar subtarefas ou encontrar tarefas semelhantes</p>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-24 text-muted-foreground text-xs uppercase font-bold tracking-wider">Status</span>
                <span className="px-2.5 py-1 text-xs font-bold rounded-sm bg-secondary text-foreground uppercase border cursor-pointer hover:bg-secondary/80">
                  {task.status}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="w-24 text-muted-foreground text-xs uppercase font-bold tracking-wider">Prioridade</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer hover:bg-secondary/50">
                  <Flag className={`w-3.5 h-3.5 ${task.priority === 'urgente' ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`}/> 
                  <span className="capitalize">{task.priority}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-24 text-muted-foreground text-xs uppercase font-bold tracking-wider">Datas</span>
                <span className="flex flex-1 items-center gap-2 cursor-pointer hover:bg-secondary/50 px-2 py-1 rounded">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">{task.startDate ? new Date(task.startDate).toLocaleDateString() : '–'}</span>
                  <span className="text-muted-foreground text-[10px]">→</span>
                  <span className="text-xs">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '–'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-24 text-muted-foreground text-xs uppercase font-bold tracking-wider">Tempo</span>
                <div className="flex items-center gap-2 flex-1">
                  <Button 
                    variant={task.timerRunning ? "destructive" : "outline"} 
                    size="sm" 
                    className="h-7 px-3 text-[10px] uppercase font-black w-24 flex justify-start gap-1.5"
                    onClick={toggleTimer}
                  >
                    {task.timerRunning ? <><Square className="w-3 h-3 fill-current"/> STOP</> : <><Play className="w-3 h-3 fill-current"/> PLAY</>}
                  </Button>
                  <span className="text-[11px] font-mono font-bold text-foreground/80 w-[50px]">{task.timerRunning ? timerText : ''}</span>
                  <span className="text-[10px] text-muted-foreground flex-1 truncate ml-1" title={`Rastreado: ${formatMinutes(task.trackedMinutes)}`}>
                    Total: {formatMinutes(task.trackedMinutes)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="w-24 text-muted-foreground text-xs uppercase font-bold tracking-wider">Pessoas</span>
                <div className="flex items-center -space-x-2">
                  {task.assignedTo.length === 0 ? <div className="w-7 h-7 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground hover:bg-secondary cursor-pointer"><User className="w-3.5 h-3.5"/></div> : 
                    task.assignedTo.map(uid => (
                      <div key={uid} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold" title={uid}>
                        {uid.slice(0, 2).toUpperCase()}
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <span className="w-24 text-muted-foreground text-xs uppercase font-bold tracking-wider">Etiquetas</span>
                 <div className="flex flex-wrap gap-1">
                    {task.tags.map(t => <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/80 text-foreground">{t}</span>)}
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-dashed opacity-50 cursor-pointer">+ Tag</span>
                 </div>
              </div>

            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">Descrição</h3>
              <Textarea 
                className="w-full min-h-[100px] text-sm bg-secondary/10 resize-y p-3 outline-none border focus:border-primary transition-colors" 
                placeholder="Adicione uma descrição detalhada..."
                value={descEdit}
                onChange={e => setDescEdit(e.target.value)}
                onBlur={handleDescSave}
              />
            </div>

            {/* Subtasks Section */}
            <div className="mb-8">
              <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">Subtarefas</h3>
              <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground border-dashed h-9"><Plus className="w-4 h-4 mr-2"/> Adicionar Subtarefa</Button>
            </div>

            {/* Checklists Section */}
            <div className="mb-8">
              <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">Checklists</h3>
              {task.checklists.map(chk => {
                const completed = chk.items.filter(i => i.done).length;
                return (
                  <div key={chk.id} className="mb-4 border border-border/50 rounded-lg p-4 bg-secondary/5">
                    <div className="flex items-center justify-between mb-3">
                       <h4 className="text-sm font-bold">{chk.title}</h4>
                       <span className="text-[10px] font-mono text-muted-foreground">{completed}/{chk.items.length}</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full mb-3 overflow-hidden">
                       <div className="bg-success h-full transition-all" style={{width: `${chk.items.length ? (completed/chk.items.length)*100 : 0}%`}}></div>
                    </div>
                    <div className="space-y-1">
                       {chk.items.map(item => (
                         <div key={item.id} className="flex items-center gap-3 p-1 hover:bg-secondary/50 rounded group">
                           {item.done ? <CheckCircle2 className="w-4 h-4 text-success cursor-pointer" /> : <Circle className="w-4 h-4 text-muted-foreground cursor-pointer" />}
                           <span className={`text-sm flex-1 outline-none ${item.done ? 'line-through opacity-50' : ''}`}>{item.text}</span>
                           <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                             <User className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                             <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                           </div>
                         </div>
                       ))}
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs mt-2 pl-0 text-muted-foreground hover:bg-transparent hover:text-primary"><Plus className="w-3 h-3 mr-1"/> Novo Item</Button>
                  </div>
                )
              })}
              <Button variant="outline" size="sm" className="justify-start text-xs border-dashed"><Plus className="w-3 h-3 mr-2"/> Adicionar Checklist</Button>
            </div>

            {/* Custom Fields Simulated */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Propriedades do Cliente</h3>
                 <span className="text-[10px] text-primary cursor-pointer hover:underline">+ Campo</span>
              </div>
              <div className="border border-border/50 rounded-lg divide-y divide-border/50 bg-secondary/5 text-sm">
                 {task.customFields.map((cf, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center p-2.5 hover:bg-secondary/30 transition-colors">
                       <span className="sm:w-1/3 text-[11px] font-bold text-muted-foreground uppercase">{cf.fieldId}</span>
                       <span className="flex-1 px-2 py-1 bg-background border border-border/50 rounded text-foreground inline-flex cursor-pointer hover:border-primary/50 text-xs">
                          {cf.value || <span className="opacity-30 italic">vazio</span>}
                       </span>
                    </div>
                 ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - 40% (ACTIVITY FEED) */}
        <div className="w-full md:w-[40%] bg-secondary/5 flex flex-col h-full relative">
          
          <div className="p-4 border-b border-border flex items-center justify-between bg-background shrink-0">
            <h3 className="text-sm font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary"/> Activity & Comentários</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin flex flex-col-reverse">
             {/* Reversing visually by mapping the combined feed */}
             {/* Feed includes Comments and ActivityLogs for this task. MOCK: Just task comments and simple logs */}
             {[...task.comments].reverse().map(c => (
               <div key={c.id} className="bg-background border border-border rounded-lg p-3 shadow-sm relative group text-sm">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center font-bold text-[10px]">{c.userId.slice(0, 2).toUpperCase()}</div>
                   <span className="font-bold text-xs">{c.userId}</span>
                   <span className="text-[10px] text-muted-foreground ml-auto">{new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
                 <p className="text-foreground/90 whitespace-pre-wrap mt-1 leading-relaxed">{c.text}</p>
                 <div className="flex gap-2 mt-3 p-1">
                   <span className="text-[10px] font-bold text-muted-foreground cursor-pointer hover:bg-secondary rounded px-2 py-1">Responder</span>
                   <span className="text-[10px] font-bold text-muted-foreground cursor-pointer hover:bg-secondary rounded px-2 py-1 text-center">👍</span>
                 </div>
               </div>
             ))}

             <div className="text-center w-full py-2 flex items-center gap-3">
               <div className="h-px bg-border/50 flex-1"></div>
               <span className="text-[10px] font-mono text-muted-foreground">FIM DO LOG RECENTE</span>
               <div className="h-px bg-border/50 flex-1"></div>
             </div>
          </div>

          {/* Footer Input */}
          <div className="p-4 border-t border-border bg-background shrink-0">
             <div className="flex flex-col gap-2 rounded-lg border border-border/80 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 bg-secondary/10 p-2 transition-all">
                <Textarea 
                  className="w-full min-h-[60px] bg-transparent resize-none border-none focus-visible:ring-0 shadow-none p-2 text-sm"
                  placeholder="Mencione @ para notificar ou insira atualização..."
                />
                <div className="flex items-center justify-between pt-1">
                   <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"><Paperclip className="w-4 h-4"/></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">@</Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"><Circle className="w-4 h-4"/></Button>
                   </div>
                   <Button size="sm" className="h-7 px-4 text-xs font-bold font-mono">ENVIAR</Button>
                </div>
             </div>
          </div>

        </div>

      </SheetContent>
    </Sheet>
  );
}
