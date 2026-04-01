import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Users, Bot, Activity, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UserRow {
  id: string;
  email?: string;
  created_at: string;
  roles: string[];
}

export default function AdminPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load all agents (admin can see all)
    const { data: agentsData } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
    setAgents(agentsData || []);

    // Load user roles
    const { data: rolesData } = await supabase.from('user_roles').select('*');

    // Build user list from roles
    const userMap = new Map<string, UserRow>();
    (rolesData || []).forEach((r: any) => {
      const existing = userMap.get(r.user_id);
      if (existing) {
        existing.roles.push(r.role);
      } else {
        userMap.set(r.user_id, {
          id: r.user_id,
          created_at: r.created_at || '',
          roles: [r.role],
        });
      }
    });
    setUsers(Array.from(userMap.values()));
    setLoading(false);
  };

  const deleteAgent = async (id: string) => {
    const { error } = await supabase.from('agents').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Agente removido' });
      setAgents((p) => p.filter((a) => a.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-xs text-muted-foreground">Gestão de usuários e agentes</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Usuários', value: users.length, icon: Users },
            { label: 'Agentes', value: agents.length, icon: Bot },
            { label: 'Execuções', value: '—', icon: Activity },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <stat.icon className="h-4 w-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Users */}
        <div className="mb-8 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Usuários com Roles</h2>
          </div>
          <div className="divide-y divide-border">
            {users.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-mono text-xs text-foreground">{u.id}</p>
                  </div>
                  <div className="flex gap-1">
                    {u.roles.map((role) => (
                      <span key={role} className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* All Agents */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Todos os Agentes</h2>
          </div>
          <div className="divide-y divide-border">
            {agents.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Nenhum agente</p>
            ) : (
              agents.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{a.model} · v{a.version}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteAgent(a.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
