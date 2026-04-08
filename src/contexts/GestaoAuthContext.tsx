import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { GestaoUser, UserRole } from '@/types/gestao';

interface GestaoAuthContextType {
  currentUser: GestaoUser | null;
  hasPermission: (resource: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  canAccessClient: (clientId: string) => boolean;
  canAccessProject: (projectId: string) => boolean;
}

const GestaoAuthContext = createContext<GestaoAuthContextType | undefined>(undefined);

export const GestaoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, roles, isAdmin } = useAuth();
  const [currentUser, setCurrentUser] = useState<GestaoUser | null>(null);

  useEffect(() => {
    if (!user) {
      setCurrentUser(null);
      return;
    }

    // Check localStorage for existing Gestao user mapping
    const storedUsersJson = localStorage.getItem('aib_users');
    let storedUsers: GestaoUser[] = [];
    if (storedUsersJson) {
      storedUsers = JSON.parse(storedUsersJson);
    }

    let gestaoUser = storedUsers.find(u => u.email === user.email);

    if (!gestaoUser) {
      // Auto-create Gestao mapping for the current Supabase user
      let role: UserRole = 'colaborador';
      if (isAdmin) role = 'admin';
      else if (roles.includes('user')) role = 'gestor';

      gestaoUser = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: role,
        clientAccess: [],
        projectAccess: [],
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      storedUsers.push(gestaoUser);
      localStorage.setItem('aib_users', JSON.stringify(storedUsers));
    } else {
      // Always sync the ID to ensure session matches Supabase precisely
      if(gestaoUser.id !== user.id) {
          gestaoUser.id = user.id;
          localStorage.setItem('aib_users', JSON.stringify(storedUsers));
      }
    }

    setCurrentUser(gestaoUser);

  }, [user, roles, isAdmin]);

  const hasPermission = (resource: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    if (!currentUser) return false;
    const role = currentUser.role;
    
    if (role === 'admin') return true;

    if (role === 'gestor') {
      if (action === 'delete' && resource === 'tarefa') return false; // Per table
      if (action === 'delete') return false; // Let's strictly disallow delete for gestor unless specified
      return true; // Tabela indica que gestor faz quase tudo menos delete e gerenciar profis
    }

    // role === 'colaborador'
    if (role === 'colaborador') {
      if (action === 'view' && resource === 'dashboard') return false;
      if (action === 'create') return false; // Nao cria cliente, projeto, tarefa...
      if (action === 'delete') return false;
      if (action === 'edit' && resource === 'tarefa') return true; // Somente atribuida (validado no UI)
    }

    return false;
  };

  const canAccessClient = (clientId: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'gestor') return true;
    return currentUser.clientAccess.length === 0 || currentUser.clientAccess.includes(clientId);
  };

  const canAccessProject = (projectId: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'gestor') return true;
    return currentUser.projectAccess.length === 0 || currentUser.projectAccess.includes(projectId);
  };

  return (
    <GestaoAuthContext.Provider value={{ currentUser, hasPermission, canAccessClient, canAccessProject }}>
      {children}
    </GestaoAuthContext.Provider>
  );
};

export const useGestaoAuth = () => {
  const ctx = useContext(GestaoAuthContext);
  if (!ctx) throw new Error('useGestaoAuth must be used within GestaoAuthProvider');
  return ctx;
};
