import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGestaoAuth } from './GestaoAuthContext';
import { 
  Client, Project, Task, FormTemplate, ActivityEntry, ActivityAction
} from '@/types/gestao';

interface GestaoDataContextType {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  forms: FormTemplate[];
  activities: ActivityEntry[];
  addClient: (c: Client) => void;
  updateClient: (id: string, partial: Partial<Client>) => void;
  addProject: (p: Project) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  addTask: (t: Task) => void;
  updateTask: (id: string, partial: Partial<Task>, logDescription?: string, action?: ActivityAction) => void;
  deleteTask: (id: string) => void;
  addActivity: (entry: Omit<ActivityEntry, 'id' | 'createdAt' | 'userId'>) => void;
}

const GestaoDataContext = createContext<GestaoDataContextType | undefined>(undefined);

export const GestaoDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useGestaoAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  // Load from local storage
  useEffect(() => {
    const rawClients = localStorage.getItem('aib_clients');
    const rawProjects = localStorage.getItem('aib_projects');
    const storedTasks = localStorage.getItem('aib_tasks');
    if (storedTasks) {
      const parsed = JSON.parse(storedTasks).map((t: any) => ({
         ...t,
         assignedTo: t.assignedTo || [],
         checklists: t.checklists || [],
         comments: t.comments || [],
         attachments: t.attachments || [],
         customFields: t.customFields || [],
         activityLog: t.activityLog || [],
         tags: t.tags || [],
         dependencies: t.dependencies || [],
         linkedTasks: t.linkedTasks || [],
         timerHistory: t.timerHistory || [],
         trackedMinutes: t.trackedMinutes || 0,
         timerRunning: t.timerRunning || false
      }));
      setTasks(parsed);
    }
    const rawForms = localStorage.getItem('aib_forms');
    const rawActs = localStorage.getItem('aib_activities');

    if (rawClients) setClients(JSON.parse(rawClients));
    if (rawProjects) setProjects(JSON.parse(rawProjects));
    if (rawForms) setForms(JSON.parse(rawForms));
    if (rawActs) setActivities(JSON.parse(rawActs));
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addActivity = (entryProps: Omit<ActivityEntry, 'id' | 'createdAt' | 'userId'>) => {
    if (!currentUser) return;
    const newEntry: ActivityEntry = {
      ...entryProps,
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id, // Enforce current user
      createdAt: new Date().toISOString()
    };
    
    setActivities(prev => {
      const next = [newEntry, ...prev];
      saveToStorage('aib_activities', next);
      return next;
    });
  };

  const addClient = (c: Client) => {
    setClients(prev => {
      const next = [...prev, c];
      saveToStorage('aib_clients', next);
      return next;
    });
    addActivity({ action: 'created', description: `Criou o cliente ${c.name}`, field: 'cliente' });
  };

  const updateClient = (id: string, partial: Partial<Client>) => {
    setClients(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...partial, updatedAt: new Date().toISOString() } : c);
      saveToStorage('aib_clients', next);
      return next;
    });
    // Detailed activity could optionally be generated on individual field changes via UI hooks
  };

  const addProject = (p: Project) => {
    setProjects(prev => {
      const next = [...prev, p];
      saveToStorage('aib_projects', next);
      return next;
    });
    addActivity({ action: 'created', description: `Criou o projeto ${p.name}`, field: 'projeto' });
  };

  const updateProject = (id: string, partial: Partial<Project>) => {
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p);
      saveToStorage('aib_projects', next);
      return next;
    });
  };

  const addTask = (t: Task) => {
    setTasks(prev => {
      const next = [...prev, t];
      saveToStorage('aib_tasks', next);
      return next;
    });
    addActivity({ action: 'created', description: `Criou a tarefa ${t.title}`, field: 'tarefa' });
  };

  const updateTask = (id: string, partial: Partial<Task>, logDescription?: string, action: ActivityAction = 'field_changed') => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...partial, updatedAt: new Date().toISOString() } : t);
      saveToStorage('aib_tasks', next);
      return next;
    });
    if (logDescription) {
      addActivity({ action, description: logDescription });
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage('aib_tasks', next);
      return next;
    });
  };

  return (
    <GestaoDataContext.Provider value={{
      clients, projects, tasks, forms, activities,
      addClient, updateClient, addProject, updateProject, addTask, updateTask, deleteTask, addActivity
    }}>
      {children}
    </GestaoDataContext.Provider>
  );
};

export const useGestaoData = () => {
  const ctx = useContext(GestaoDataContext);
  if (!ctx) throw new Error('useGestaoData must be used within GestaoDataProvider');
  return ctx;
};
