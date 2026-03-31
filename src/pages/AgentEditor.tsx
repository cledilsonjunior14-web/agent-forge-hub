import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Bot, Save, Play, ChevronDown } from 'lucide-react';

const models = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'gpt-4o', 'gpt-4o-mini'];

export default function AgentEditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    system_prompt: '',
    context: '',
    task: '',
    model: 'claude-3-sonnet',
    tags: '',
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('agents').insert({
      name: form.name,
      description: form.description,
      system_prompt: form.system_prompt,
      context: form.context,
      task: form.task,
      model: form.model,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: 'idle',
      version: 1,
      user_id: user!.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Agente criado!' });
      navigate('/dashboard');
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Novo Agente</h1>
            <p className="text-xs text-muted-foreground">Configure os blocos do seu agente</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Informações Básicas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do Agente</Label>
                <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Meu Agente" className="bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <select
                  value={form.model}
                  onChange={(e) => update('model', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Breve descrição do agente" className="bg-secondary" />
            </div>
            <div className="mt-4 space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="dev, automação, cli" className="bg-secondary" />
            </div>
          </div>

          {/* Prompt Blocks */}
          {[
            { key: 'system_prompt', label: 'SYSTEM_ROLE', desc: 'Define o papel e comportamento do agente', placeholder: 'Você é um engenheiro sênior especializado em...' },
            { key: 'context', label: 'CONTEXT', desc: 'Contexto e informações relevantes', placeholder: 'O projeto atual usa React + TypeScript...' },
            { key: 'task', label: 'TASK', desc: 'A tarefa específica a ser executada', placeholder: 'Analise o código e sugira melhorias...' },
          ].map((block) => (
            <div key={block.key} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
                  {block.label}
                </span>
                <span className="text-xs text-muted-foreground">{block.desc}</span>
              </div>
              <Textarea
                value={form[block.key as keyof typeof form]}
                onChange={(e) => update(block.key, e.target.value)}
                placeholder={block.placeholder}
                rows={5}
                className="resize-none bg-secondary font-mono text-sm"
              />
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="glow" onClick={handleSave} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Agente'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
