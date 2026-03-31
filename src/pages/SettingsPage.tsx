import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Key, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');

  const handleSave = () => {
    // In a real app, save to encrypted storage / edge function secrets
    if (claudeKey) localStorage.setItem('af_claude_key', claudeKey);
    if (openaiKey) localStorage.setItem('af_openai_key', openaiKey);
    toast({ title: 'Configurações salvas!' });
  };

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Configurações</h1>
            <p className="text-xs text-muted-foreground">API keys e integrações</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Conta</h2>
            <p className="mb-4 text-xs text-muted-foreground">Informações da sua conta</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="mt-1 font-mono text-sm text-foreground">{user?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{user?.id}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">API Keys</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Claude API Key</Label>
                <Input
                  type="password"
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="bg-secondary font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>OpenAI API Key (opcional)</Label>
                <Input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="bg-secondary font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <Button variant="glow" onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
