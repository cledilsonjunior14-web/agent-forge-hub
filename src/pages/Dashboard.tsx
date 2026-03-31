import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Play, AlertCircle, CheckCircle2, Clock, Plus, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Agent, AgentStatus } from '@/types/agent';

const statusConfig: Record<AgentStatus, { icon: any; color: string; label: string }> = {
  active: { icon: CheckCircle2, color: 'text-success', label: 'Ativo' },
  running: { icon: Play, color: 'text-info', label: 'Rodando' },
  error: { icon: AlertCircle, color: 'text-destructive', label: 'Erro' },
  idle: { icon: Clock, color: 'text-muted-foreground', label: 'Inativo' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setAgents((data as Agent[]) || []);
        setLoading(false);
      });
  }, [user]);

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.status === 'active').length,
    running: agents.filter((a) => a.status === 'running').length,
    errors: agents.filter((a) => a.status === 'error').length,
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus agentes de IA</p>
        </div>
        <Link to="/agents/new">
          <Button variant="glow">
            <Plus className="mr-1 h-4 w-4" />
            Novo Agente
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: Bot, color: 'text-primary' },
          { label: 'Ativos', value: stats.active, icon: CheckCircle2, color: 'text-success' },
          { label: 'Rodando', value: stats.running, icon: Activity, color: 'text-info' },
          { label: 'Erros', value: stats.errors, icon: AlertCircle, color: 'text-destructive' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : agents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20"
        >
          <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium text-foreground">Nenhum agente ainda</p>
          <p className="mb-4 text-sm text-muted-foreground">Crie seu primeiro agente de IA</p>
          <Link to="/agents/new">
            <Button variant="glow">
              <Plus className="mr-1 h-4 w-4" />
              Criar Agente
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, i) => {
            const sc = statusConfig[agent.status];
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/agents/${agent.id}`}
                  className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-surface-hover"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{agent.name}</h3>
                    <div className="flex items-center gap-1">
                      <sc.icon className={`h-3.5 w-3.5 ${sc.color}`} />
                      <span className={`text-xs ${sc.color}`}>{sc.label}</span>
                    </div>
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                    {agent.description || 'Sem descrição'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {agent.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{agent.model}</span>
                    <span>v{agent.version}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
