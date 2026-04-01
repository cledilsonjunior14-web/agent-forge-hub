import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState<MetaAccount[]>([]);

  useEffect(() => {
    // Load local keys
    setClaudeKey(localStorage.getItem('af_claude_key') || '');
    setOpenaiKey(localStorage.getItem('af_openai_key') || '');

    // Load Meta settings from Supabase
    async function loadSettings() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setAccessToken(data.meta_access_token || '');
          setAccountId(data.meta_account_id || '');
          if (data.meta_access_token) {
             fetchAccounts(data.meta_access_token);
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar configurações Meta:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user]);

  const fetchAccounts = async (tokenToUse: string) => {
    if (!tokenToUse) return;
    setLoadingAccounts(true);
    try {
      const resp = await listar_contas(tokenToUse);
      // O Meta retorna data como um array dentro do objeto
      const dataArray = (resp as any).data || resp;
      setAvailableAccounts(Array.isArray(dataArray) ? dataArray : []);
    } catch (err: any) {
      toast({
        title: 'Erro ao conectar à Meta',
        description: err.message || 'Token inválido ou sem permissão de ads_read.',
        variant: 'destructive',
      });
      setAvailableAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleFetchClick = () => {
    if (!accessToken) {
      toast({
         title: 'Atenção',
         description: 'Insira o Token de Acesso primeiro.',
         variant: 'destructive',
      });
      return;
    }
    fetchAccounts(accessToken);
  };

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
        meta_account_id: accountId,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Todas as configurações foram salvas com sucesso!',
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações da Meta no banco.',
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
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
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
          <div className="rounded-xl border border-border bg-card p-5">
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
                  <Button onClick={handleFetchClick} disabled={loadingAccounts || !accessToken} variant="secondary" className="px-3">
                    {loadingAccounts ? <Loader2 className="w-4 h-4 animate-spin" /> : "Listar Contas"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Conta de Anúncios Base (Account ID)</Label>
                <Select value={accountId} onValueChange={setAccountId} disabled={availableAccounts.length === 0}>
                  <SelectTrigger className="bg-secondary text-sm">
                    <SelectValue placeholder={availableAccounts.length === 0 ? "Carregue o token primeiro" : "Selecione a conta"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.map(acc => (
                      <SelectItem key={acc.account_id} value={acc.account_id}>
                        {acc.name} ({acc.account_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground mt-1">Conta para a qual os primeiros insights serão carregados.</p>
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
