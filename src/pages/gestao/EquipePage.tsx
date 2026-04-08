import React, { useState, useEffect } from 'react';
import { useGestaoAuth } from '@/contexts/GestaoAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users2, Shield, Mail, Calendar as CalendarIcon, UserCheck } from 'lucide-react';
import { GestaoUser } from '@/types/gestao';
import { useAuth } from '@/contexts/AuthContext';

export default function EquipePage() {
  const { currentUser } = useGestaoAuth();
  const [users, setUsers] = useState<GestaoUser[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('aib_users');
    if (stored) {
      setUsers(JSON.parse(stored));
    }
  }, []);

  if (currentUser?.role !== 'admin') {
     return <div className="p-8 text-center text-muted-foreground"><Shield className="w-12 h-12 mx-auto mb-4 opacity-50"/> Acesso negado. Apenas administradores podem gerenciar a equipe.</div>
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/5 shrink-0">
         <h2 className="font-black text-lg tracking-widest uppercase flex items-center gap-2"><Users2 className="w-5 h-5"/> Membros e Permissões</h2>
         <Button size="sm" variant="outline"><UserCheck className="w-4 h-4 mr-1"/> Sincronizar Supabase</Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto w-full max-w-5xl mx-auto">
         <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead>
                   <tr className="border-b border-border bg-secondary/5 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                     <th className="p-4">Usuário</th>
                     <th className="p-4 w-40">Cargo (Role)</th>
                     <th className="p-4 w-32">Status</th>
                     <th className="p-4 w-48 text-right">Cadastrado em</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/10 transition-colors">
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                {u.name.slice(0, 2).toUpperCase()}
                             </div>
                             <div>
                                <p className="font-bold text-foreground leading-tight">{u.name}</p>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3"/> {u.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="p-4">
                          <Badge variant="outline" className={`text-[9px] uppercase font-bold 
                            ${u.role === 'admin' ? 'border-primary text-primary' : 
                              u.role === 'gestor' ? 'border-warning text-warning' : 'border-border text-muted-foreground'}`
                          }>
                             {u.role}
                          </Badge>
                       </td>
                       <td className="p-4"><Badge variant={u.isActive ? 'default' : 'secondary'} className="text-[10px] uppercase">{u.isActive ? 'Ativo' : 'Inativo'}</Badge></td>
                       <td className="p-4 text-right text-xs font-mono text-muted-foreground flex items-center justify-end gap-1.5 h-full">
                          <CalendarIcon className="w-3.5 h-3.5"/>
                          {new Date(u.createdAt).toLocaleDateString()}
                       </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                     <tr><td colSpan={4} className="p-8 text-center text-muted-foreground italic">Nenhum usuário encontrado na base local.</td></tr>
                  )}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
}
