import React, { useState } from 'react';
import { useGestaoData } from '@/contexts/GestaoDataContext';
import { useGestaoAuth } from '@/contexts/GestaoAuthContext';
import { TaskDrawer } from '@/components/gestao/TaskDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, MessageSquare, Clock } from 'lucide-react';
import { Task } from '@/types/gestao';

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = ['Backlog', 'A Fazer', 'Em Andamento', 'Em Revisão', 'Aprovado', 'Concluído'];

function SortableTaskCard({ task, onClick }: { task: Task, onClick: () => void }) {
  const { clients } = useGestaoData();
  const client = clients.find(c => c.id === task.clientId);
  const color = client?.color || '#cccccc';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getDueDateColor = () => {
    if (!task.dueDate) return 'text-muted-foreground';
    const d = new Date(task.dueDate).setHours(0,0,0,0);
    const today = new Date().setHours(0,0,0,0);
    if (task.status === 'Concluído') return 'text-success';
    if (d < today) return 'text-destructive';
    if (d === today) return 'text-warning';
    return 'text-success';
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} style={style}
        className="w-full bg-secondary/50 rounded-lg h-24 border border-dashed border-primary/50 opacity-50 mb-3"
      ></div>
    );
  }

  const checklistTotal = task.checklists.reduce((acc, c) => acc + c.items.length, 0);
  const checklistDone = task.checklists.reduce((acc, c) => acc + c.items.filter(i=>i.done).length, 0);

  return (
    <div
      ref={setNodeRef} {...attributes} {...listeners}
      onClick={onClick}
      className={`relative w-full bg-card rounded-lg p-3 border shadow-sm mb-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all border-l-4`}
      style={{ ...style, borderLeftColor: color }}
    >
      <div className="flex justify-between items-start mb-2">
         <Badge variant="outline" className="text-[9px] uppercase max-w-[120px] truncate" style={{color, borderColor: color}}>{client?.name}</Badge>
         {task.priority === 'urgente' && <span className="text-[9px] text-destructive font-bold bg-destructive/10 px-1 rounded">🔴 URGENTE</span>}
      </div>
      
      <p className="text-sm font-bold leading-tight mb-4 text-foreground/90">{task.title}</p>
      
      <div className="flex items-center justify-between mt-auto">
         <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
            <span className={getDueDateColor()}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString().slice(0,5) : '–'}</span>
            <div className="flex -space-x-1.5 ml-2">
              {task.assignedTo.map(uid => (
                <div key={uid} className="w-5 h-5 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[8px] font-bold" title={uid}>
                  {uid.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
         </div>
         <div className="flex gap-2 text-muted-foreground text-[10px] items-center font-bold">
            {checklistTotal > 0 && <span>☑ {checklistDone}/{checklistTotal}</span>}
            {task.comments.length > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3"/>{task.comments.length}</span>}
            {task.trackedMinutes > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3"/> {Math.floor(task.trackedMinutes/60)}h</span>}
         </div>
      </div>

      {task.timerRunning && <div className="absolute right-2 bottom-2 w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
    </div>
  );
}

function KanbanColumn({ id, title, tasks, onTaskClick }: { id: string, title: string, tasks: Task[], onTaskClick: (id: string) => void }) {
  const { setNodeRef } = useSortable({ id, data: { type: 'Column' } });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col bg-secondary/10 rounded-xl h-full border border-border/50">
       <div className="p-3 border-b border-border/50 flex items-center justify-between bg-secondary/30 rounded-t-xl shrink-0">
          <h3 className="font-black text-xs uppercase tracking-wider">{title}</h3>
          <Badge variant="secondary" className="font-mono text-[10px]">{tasks.length}</Badge>
       </div>
       
       <div className="flex-1 p-3 overflow-y-auto scrollbar-thin">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} className="min-h-[150px] h-full">
               {tasks.map(t => (
                  <SortableTaskCard key={t.id} task={t} onClick={() => onTaskClick(t.id)} />
               ))}
            </div>
          </SortableContext>
       </div>

       <div className="p-2 border-t border-border/50 shrink-0">
          <Button variant="ghost" size="sm" className="w-full justify-center text-xs text-muted-foreground hover:bg-secondary/50 border-dashed border border-border"><Plus className="w-3 h-3 mr-1"/> Tarefa</Button>
       </div>
    </div>
  );
}

export default function KanbanPage() {
  const { tasks, updateTask } = useGestaoData();
  const { hasPermission } = useGestaoAuth();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const t = tasks.find(x => x.id === active.id);
    if(t) setActiveDragTask(t);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Detect if dropping over a column or over another task
    const activeTask = tasks.find(t => t.id === activeId);
    if(!activeTask) return;

    const isOverAColumn = COLUMNS.includes(overId);
    if (isOverAColumn) {
      if(activeTask.status !== overId) {
        updateTask(activeId, { status: overId }, `moveu de ${activeTask.status} para ${overId}`, 'moved');
      }
      return;
    }

    const overTask = tasks.find(t => t.id === overId);
    if (overTask && overTask.status !== activeTask.status) {
      updateTask(activeId, { status: overTask.status }, `moveu de ${activeTask.status} para ${overTask.status}`, 'moved');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* TOOLBAR */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 bg-secondary/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center h-9 px-3 bg-background border border-border rounded-md shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all lg:w-64">
            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0"/>
            <input 
              value={search} onChange={(e)=>setSearch(e.target.value)}
              placeholder="Buscar no board..."
              className="bg-transparent border-none outline-none w-full text-sm h-full"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground"><Filter className="w-4 h-4"/> Filtros</Button>
          
          <div className="flex items-center bg-secondary/50 rounded-full px-2 py-1 gap-1">
             <div className="w-4 h-4 rounded-full bg-[#FF6B35]"></div>
             <div className="w-4 h-4 rounded-full bg-[#F39C12]"></div>
             <div className="w-4 h-4 rounded-full bg-[#2ECC71]"></div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {hasPermission('tarefa', 'create') && <Button size="sm" className="h-9 font-bold"><Plus className="w-4 h-4 mr-1"/> Nova Tarefa</Button>}
        </div>
      </div>

      {/* BOARD CONTENT */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-background">
         <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
         >
           <div className="flex items-stretch h-full gap-5">
             <SortableContext items={COLUMNS} strategy={undefined}>
               {COLUMNS.map(col => {
                 const colTasks = filteredTasks.filter(t => t.status === col || (!t.status && col === 'Backlog'));
                 return (
                    <KanbanColumn 
                      key={col} id={col} title={col} 
                      tasks={colTasks} onTaskClick={id => setSelectedTaskId(id)}
                    />
                 );
               })}
             </SortableContext>
           </div>
           <DragOverlay>
             {activeDragTask ? <SortableTaskCard task={activeDragTask} onClick={()=>{}} /> : null}
           </DragOverlay>
         </DndContext>
      </div>

      <TaskDrawer taskId={selectedTaskId} open={!!selectedTaskId} onOpenChange={(o) => !o && setSelectedTaskId(null)} />
    </div>
  );
}
