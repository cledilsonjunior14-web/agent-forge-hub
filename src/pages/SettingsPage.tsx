import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Key, Save, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { listar_contas, MetaAccount } from '@/services/metaApi';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');

  // Meta Ads States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    // Load local keys
    setClaudeKey(localStorage.getItem('af_claude_key') || '');
    setOpenaiKey(localStorage.getItem('af_openai_key') || '');

    // Load Meta settings from Supabase
    async function loadSettings() {
      if (!user) return;
      try {
        const { data, error } = await (supabase as any)
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setAccessToken(data.meta_access_token || '');
        }
      } catch (err: any) {
        console.error('Erro ao carregar configurações Meta:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user]);


  const handleSave = async () => {
    if (claudeKey) localStorage.setItem('af_claude_key', claudeKey);
    if (openaiKey) localStorage.setItem('af_openai_key', openaiKey);

    if (!user) {
       toast({ title: 'Configurações locais salvas!' });
       return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        meta_access_token: accessToken,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await (supabase as any)
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Todas as configurações foram salvas com sucesso!',
      });
    } catch (err: any) {
      console.error('Ops, falha no banco:', err);
      toast({
        title: 'Erro ao salvar no banco',
        description: err.message || 'Verifique se rodou as relativas migrations ou reset no BD local.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8 pb-20">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Configurações</h1>
            <p className="text-xs text-muted-foreground">API keys e integrações do sistema</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Informações da Conta */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Conta Principal</h2>
            <p className="mb-4 text-xs text-muted-foreground">Informações da sua conta de acesso</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="mt-1 font-mono text-sm text-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Meta Ads Integration */}
          <div className="rounded-xl border border-border bg-card p-5 overflow-visible">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Integração Meta Ads</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Insira seu User Access Token com permissões (ads_read) para habilitar inteligência MCP.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User Access Token</Label>
                <div className="flex gap-2">
                  <Input 
                    type="password" 
                    value={accessToken} 
                    onChange={(e) => setAccessToken(e.target.value)} 
                    placeholder="EAA..." 
                    className="bg-secondary font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Salve o token e utilize o seletor de contas diretamente no Dashboard.</p>
              </div>
            </div>
          </div>

          {/* External AI APIs */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Chaves de IA Externas</h2>
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

          <Button variant="default" className="w-full sm:w-auto" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
