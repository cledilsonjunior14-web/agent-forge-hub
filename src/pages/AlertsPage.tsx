import React, { useState, useEffect } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMetaContext } from '@/hooks/useMetaContext';
import { listar_contas, info_conta } from '@/services/metaApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, Plus, Copy, Edit2, Trash2, 
  CheckSquare, XSquare, Search,
  Server, Smartphone, LayoutGrid, Menu
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

// Icons customizados para a tabela e modal
const ToggleActiveIcon = () => (
  <svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="20" rx="10" fill="#22c55e"/>
    <circle cx="26" cy="10" r="6" fill="white"/>
  </svg>
);
const ToggleInactiveIcon = () => (
   <svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
     <rect width="36" height="20" rx="10" fill="#3f3f46"/>
     <circle cx="10" cy="10" r="6" fill="#a1a1aa"/>
   </svg>
);
const MetaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
     <text x="5" y="16" fontFamily="Arial" fontSize="20" fontWeight="bold">f</text>
  </svg>
);
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

interface AlertRule {
  id: string;
  active: boolean;
  name: string;
  type: 'saldo' | 'erro';
  channel: 'meta' | 'google';
  connectionId: string;
  adAccountId: string;
  adAccountName: string;
  minBalance: number;
  messageTemplate: string;
}

const DEFAULT_MSG_TEMPLATE = "Olá,\n\nO saldo da conta de anúncios <CA> está em <SALDO>";

const ACCOUNT_STATUS_MAP: Record<number, { label: string, isError: boolean }> = {
  1: { label: 'Ativa', isError: false },
  2: { label: 'Conta Desativada', isError: true },
  3: { label: 'Pagamento Falhou', isError: true },
  7: { label: 'Em Revisão', isError: true },
  101: { label: 'Encerrada', isError: true },
  201: { label: 'Restrita (Política)', isError: true }
};

export default function AlertsPage() {
  const { token, hasMetaSetup } = useMetaContext();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  // States do Modal (Formulário)
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'saldo' | 'erro'>('saldo');
  const [formChannel, setFormChannel] = useState<'meta' | 'google'>('meta');
  const [formAccountId, setFormAccountId] = useState('');
  const [formAccountName, setFormAccountName] = useState('');
  const [formMinBalance, setFormMinBalance] = useState('0');
  const [formTemplate, setFormTemplate] = useState(DEFAULT_MSG_TEMPLATE);
  
  // Load Rules do LocalStorage
  useEffect(() => {
     const stored = localStorage.getItem('aib_multi_alerts');
     if (stored) {
        try { setRules(JSON.parse(stored)); } catch(e) {}
     }
  }, []);

  const saveRules = (newRules: AlertRule[]) => {
     setRules(newRules);
     localStorage.setItem('aib_multi_alerts', JSON.stringify(newRules));
  };

  // Buscar lista de contas vinculadas ao Perfil! (para o Select de Contas no modal)
  const { data: accountsList = [] } = useQuery({
     queryKey: ['meta-accounts-list'],
     enabled: hasMetaSetup && isModalOpen,
     queryFn: async () => {
        try {
           return await listar_contas(token);
        } catch(e) { return []; }
     }
  });

  // Consultar TODAS as contas cadastradas simultaneamente (useQueries)
  const activeAccountIds = Array.from(new Set(rules.map(r => r.adAccountId))).filter(Boolean);
  const queries = useQueries({
     queries: activeAccountIds.map(accId => ({
        queryKey: ['meta-live-account', accId],
        enabled: hasMetaSetup,
        refetchInterval: 120000, // 2 mins atualizacao passiva
        queryFn: async () => {
           try {
              const info = await info_conta(token, accId);
              return { accId, data: info };
           } catch(e) { return { accId, data: null, error: true }; }
        }
     }))
  });

  // Mapa rápido local [accId] => Resultados Graph API da conta
  const liveDataMap = queries.reduce((acc, query) => {
     if (query.data && query.data.accId) {
        acc[query.data.accId] = query.data;
     }
     return acc;
  }, {} as Record<string, any>);

  // Ações do Gerenciador
  const handleToggleRule = (id: string) => {
     saveRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };
  const handleDeleteRule = (id: string) => {
     saveRules(rules.filter(r => r.id !== id));
  };
  const handleDuplicateRule = (rule: AlertRule) => {
     const dup = { ...rule, id: crypto.randomUUID(), name: `${rule.name} (Cópia)` };
     saveRules([...rules, dup]);
  };
  
  const openNewModal = () => {
     setEditingRuleId(null);
     setFormName(''); setFormType('saldo'); setFormChannel('meta');
     setFormAccountId(''); setFormAccountName('');
     setFormMinBalance('0'); setFormTemplate(DEFAULT_MSG_TEMPLATE);
     setIsModalOpen(true);
  };

  const openEditModal = (r: AlertRule) => {
     setEditingRuleId(r.id);
     setFormName(r.name); setFormType(r.type); setFormChannel(r.channel);
     setFormAccountId(r.adAccountId); setFormAccountName(r.adAccountName);
     setFormMinBalance(r.minBalance.toString()); setFormTemplate(r.messageTemplate || DEFAULT_MSG_TEMPLATE);
     setIsModalOpen(true);
  };

  const handleSaveModal = () => {
     if (!formName || !formAccountId) return alert("Preencha o Nome e escolha a Conta Anúncio.");
     
     const payload: AlertRule = {
        id: editingRuleId || crypto.randomUUID(),
        active: true,
        name: formName,
        type: formType,
        channel: formChannel,
        connectionId: 'default',
        adAccountId: formAccountId,
        adAccountName: formAccountName || accountsList.find(a => a.account_id === formAccountId)?.name || 'Conta Desconhecida',
        minBalance: parseFloat(formMinBalance) || 0,
        messageTemplate: formTemplate
     };

     if (editingRuleId) {
        saveRules(rules.map(r => r.id === editingRuleId ? { ...r, ...payload } : r));
     } else {
        saveRules([...rules, payload]);
     }
     setIsModalOpen(false);
  };

  // Preview da Mensagem (Live rendering)
  const renderedMessage = formTemplate
     .replace('<CA>', formAccountName || '[Nome da Conta]')
     .replace('<SALDO>', `R$ XXX,XX`)
     .replace('<TARGET>', `R$ ${formMinBalance}`);

  if (!hasMetaSetup) return (
     <div className="flex flex-col items-center justify-center py-24 text-center">
       <div className="rounded-full bg-secondary p-6 mb-4"><Server className="h-10 w-10 text-muted-foreground" /></div>
       <h2 className="text-xl font-bold mb-2">Painel Desconectado</h2>
       <p className="text-sm text-muted-foreground max-w-[400px]">É preciso conectar a Graph API do Facebook nas Configurações H.U.B antes de cadastrar Regras de Alertas.</p>
     </div>
  );

  return (
    <div className="p-0 sm:p-2 bg-[#121212] min-h-screen text-white rounded-lg">
       
       {/* HEADER BAR TABLE */}
       <div className="flex flex-col sm:flex-row items-center justify-between p-4 mb-2 gap-4 border-b border-white/5">
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input className="bg-[#1e1e1e] border-none text-xs pl-9 h-9 w-full rounded focus-visible:ring-1 focus-visible:ring-primary/50 text-white" placeholder="Filtrar busca" />
             </div>
             <span className="text-xs text-white/50 text-nowrap">{rules.length} registro(s).</span>
          </div>

          <div className="flex items-center gap-3 ml-auto shrink-0 w-full sm:w-auto overflow-x-auto">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:bg-white/5"><Menu className="w-4 h-4" /></Button>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/5 bg-white/5"><LayoutGrid className="w-4 h-4" /></Button>
             
             <div className="h-4 w-px bg-white/10 mx-1"></div>
             
             <Select defaultValue="todos"><SelectTrigger className="h-8 text-xs border-none bg-transparent hover:bg-white/5 w-[140px] focus:ring-0 text-white/80"><SelectValue placeholder="Todos os status" /></SelectTrigger><SelectContent className="bg-[#1e1e1e] border-white/10"><SelectItem value="todos">Todos os status</SelectItem></SelectContent></Select>
             <Select defaultValue="todos"><SelectTrigger className="h-8 text-xs border-none bg-transparent hover:bg-white/5 w-[130px] focus:ring-0 text-white/80"><SelectValue placeholder="Todos os canais" /></SelectTrigger><SelectContent className="bg-[#1e1e1e] border-white/10"><SelectItem value="todos">Todos os canais</SelectItem></SelectContent></Select>
             <Select defaultValue="todos"><SelectTrigger className="h-8 text-xs border-none bg-transparent hover:bg-white/5 w-[120px] focus:ring-0 text-white/80"><SelectValue placeholder="Todos os tipos" /></SelectTrigger><SelectContent className="bg-[#1e1e1e] border-white/10"><SelectItem value="todos">Todos os tipos</SelectItem></SelectContent></Select>
             
             <Button onClick={openNewModal} size="sm" className="ml-2 h-8 text-[11px] uppercase font-bold tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="w-3.5 h-3.5 mr-1" /> Criar Alerta</Button>
          </div>
       </div>

       {/* INÍCIO DA TABELA TIPO SAAS */}
       <div className="w-full overflow-x-auto pb-10">
          <table className="w-full text-left border-collapse text-xs">
             <thead>
                <tr className="border-b border-white/5 text-white/70">
                   <th className="pt-2 pb-4 px-6 font-semibold min-w-[150px]">Nome</th>
                   <th className="pt-2 pb-4 px-6 font-semibold min-w-[200px]">Conta de anúncio</th>
                   <th className="pt-2 pb-4 px-6 font-semibold min-w-[130px]">Saldo atual</th>
                   <th className="pt-2 pb-4 px-6 font-semibold min-w-[150px]">Título do erro</th>
                   <th className="pt-2 pb-4 px-6 font-semibold w-full">Descrição do erro</th>
                   <th className="pt-2 pb-4 px-6 font-semibold text-right min-w-[120px]">Ações</th>
                </tr>
             </thead>
             <tbody>
                {rules.map(rule => {
                   const live = liveDataMap[rule.adAccountId]?.data;
                   
                   // Determinar Saldo Real da Meta
                   let actualBalance = 0;
                   if (live) actualBalance = Math.abs(Number(live.balance || 0) / 100);
                   
                   const isUnderThreshold = rule.type === 'saldo' && actualBalance <= rule.minBalance && live; // O Alerta de Saldo "Mínimo" (na imagem) dispara se saldo MÍNIMO atinge (ex: Pré-Pago). Mas na Meta (Pós-pago), o saldo cresce até o threshold. Adotaremos logica da variavel se for Positivo. 
                   const balanceColor = rule.type === 'saldo' && actualBalance < rule.minBalance ? "bg-destructive/20 text-destructive" : (live ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/50");

                   // Determinar Erro Real da Meta
                   const statusInfo = live ? ACCOUNT_STATUS_MAP[live.account_status] : null;
                   const hasError = statusInfo && statusInfo.isError;
                   const isErrorRule = rule.type === 'erro';

                   return (
                   <tr key={rule.id} className="border-b border-white[2%] hover:bg-white/[2%] transition-colors group">
                      <td className="py-3 px-6">
                         <div className="flex items-center gap-3">
                            <button onClick={() => handleToggleRule(rule.id)} className="shrink-0 outline-none">
                               {rule.active ? <ToggleActiveIcon /> : <ToggleInactiveIcon />}
                            </button>
                            <span className={rule.active ? 'text-white/90' : 'text-white/40'}>{rule.name}</span>
                         </div>
                      </td>
                      <td className={`py-3 px-6 ${rule.active ? 'text-white/70' : 'text-white/40'}`}>{rule.adAccountName}</td>
                      
                      {/* Saldo Atual */}
                      <td className="py-3 px-6">
                         {rule.active && (rule.type === 'saldo' || actualBalance > 0) ? (
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${balanceColor}`}>
                               R$ {formatCurrency(actualBalance)}
                            </span>
                         ) : null}
                      </td>
                      
                      {/* Titulo do Erro */}
                      <td className="py-3 px-6">
                         {rule.active && hasError && isErrorRule ? (
                            <span className="flex items-center gap-2 bg-destructive/10 text-destructive px-2 py-1 rounded w-fit">
                               <XSquare className="w-4 h-4 fill-destructive/20" /> ALERTA DE FLUXO
                            </span>
                         ) : rule.active && !hasError && isErrorRule && live ? (
                            <span className="bg-green-500/20 text-green-500 p-1 rounded inline-block">
                               <CheckSquare className="w-4 h-4" />
                            </span>
                         ) : null}
                      </td>
                      
                      {/* Descricao do erro */}
                      <td className="py-3 px-6 text-white/50">
                         {rule.active && hasError && isErrorRule ? statusInfo?.label : ''}
                      </td>
                      
                      {/* Ações */}
                      <td className="py-3 px-6 text-right">
                         <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/10 text-white/50"><MetaIcon /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDuplicateRule(rule)} className="w-7 h-7 hover:bg-white/10 text-white/50"><Copy className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(rule)} className="w-7 h-7 hover:bg-white/10 text-white/50"><Edit2 className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="w-7 h-7 hover:bg-destructive/20 text-white/50 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                         </div>
                      </td>
                   </tr>
                   );
                })}

                {rules.length === 0 && (
                   <tr>
                      <td colSpan={6} className="py-12 text-center text-white/30 text-sm border-none">
                         <Bell className="w-8 h-8 opacity-20 mx-auto mb-3" />
                         Nenhuma regra de alerta cadastrada.
                      </td>
                   </tr>
                )}
             </tbody>
          </table>
       </div>


       {/* MODAL DE CRIAÇÃO (SPLIT SCREEN SAAS) */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-[#18181A] border border-white/5 w-full max-w-[1100px] h-[85vh] sm:h-[700px] rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                
                {/* LADO ESQUERDO (FORM) */}
                <div className="flex-1 overflow-y-auto w-full border-r border-white/5 p-6 flex flex-col hide-scrollbar">
                   <h2 className="text-lg font-bold mb-6 text-white leading-none tracking-tight">{editingRuleId ? 'Editar alerta' : 'Criar alerta'}</h2>
                   
                   <div className="space-y-6 flex-1 text-sm">
                      {/* NOME */}
                      <div className="space-y-2">
                         <label className="text-white/80 font-medium">Nome <span className="text-destructive">*</span></label>
                         <Input value={formName} onChange={e=>setFormName(e.target.value)} className="bg-[#1e1e1e] border-none text-white focus-visible:ring-1 h-11" placeholder="Alerta cliente" />
                      </div>

                      {/* TIPO */}
                      <div className="space-y-2">
                         <label className="text-white/80 font-medium">Tipo de alerta</label>
                         <div className="flex items-center gap-3">
                            <button onClick={()=>setFormType('saldo')} className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors border ${formType==='saldo'? 'bg-blue-600 text-white border-blue-600' : 'bg-[#1e1e1e] text-white/60 border-transparent hover:bg-white/5'}`}>
                               <span className="text-lg font-serif italic font-bold">S</span> Saldo mínimo
                            </button>
                            <button onClick={()=>setFormType('erro')} className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors border ${formType==='erro'? 'bg-blue-600 text-white border-blue-600' : 'bg-[#1e1e1e] text-white/60 border-transparent hover:bg-white/5'}`}>
                               <Bell className="w-4 h-4" /> Erro na conta
                            </button>
                         </div>
                      </div>

                      {/* CANAL */}
                      <div className="space-y-2">
                         <label className="text-white/80 font-medium">Canal: <span className="text-destructive">*</span></label>
                         <div className="flex items-center gap-4">
                            <button onClick={()=>setFormChannel('meta')} className={`flex-1 h-32 rounded-xl flex flex-col items-center justify-center gap-3 border transition-all ${formChannel==='meta'? 'bg-blue-600/10 border-blue-600' : 'bg-[#1e1e1e] border-transparent hover:bg-white/5'}`}>
                               <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-serif italic text-xl font-bold">f</div>
                               <span className="font-bold">Meta Ads</span>
                               {formChannel === 'meta' ? <span className="text-blue-500 text-xs flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5" /> Selecionado</span> : <span className="text-white/50 text-xs flex items-center gap-1"><Plus className="w-3 h-3"/> Selecionar</span>}
                            </button>
                            <button onClick={()=>setFormChannel('google')} className={`flex-1 h-32 rounded-xl flex flex-col items-center justify-center gap-3 border transition-all ${formChannel==='google'? 'bg-blue-600/10 border-blue-600' : 'bg-[#1e1e1e] border-transparent hover:bg-white/5'}`}>
                               <GoogleIcon />
                               <span className="font-bold">Google Ads</span>
                               {formChannel === 'google' ? <span className="text-blue-500 text-xs flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5" /> Selecionado</span> : <span className="text-white/50 text-xs flex items-center gap-1"><Plus className="w-3 h-3"/> Selecionar</span>}
                            </button>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         {/* CONTA COM SELECT */}
                         <div className="space-y-2">
                            <label className="text-white/80 font-medium flex items-center gap-2">
                               {formChannel === 'meta' ? <MetaIcon /> : <GoogleIcon />} Conta de anúncio <span className="text-destructive">*</span>
                            </label>
                            <Select value={formAccountId} onValueChange={(v) => {
                               setFormAccountId(v);
                               const acc = accountsList.find(a=>a.account_id === v);
                               if(acc) setFormAccountName(acc.name);
                            }}>
                               <SelectTrigger className="bg-[#1e1e1e] border-none text-white/50 h-11 focus:ring-1 focus:ring-blue-500">
                                  <SelectValue placeholder="Clique aqui para selecionar" />
                               </SelectTrigger>
                               <SelectContent className="bg-[#1e1e1e] border-white/10 max-h-56">
                                  {accountsList.map(acc => (
                                     <SelectItem key={acc.account_id} value={acc.account_id}>{acc.name} ({acc.account_id})</SelectItem>
                                  ))}
                                  {accountsList.length === 0 && <SelectItem value="disabled" disabled>Nenhuma conta (Conecte a Meta)</SelectItem>}
                               </SelectContent>
                            </Select>
                         </div>

                         {/* SALDO MÍNIMO */}
                         {formType === 'saldo' && (
                         <div className="space-y-2">
                            <label className="text-white/80 font-medium">Saldo mínimo: <span className="text-destructive">*</span></label>
                            <Input type="number" value={formMinBalance} onChange={e=>setFormMinBalance(e.target.value)} className="bg-[#1e1e1e] border-none text-white h-11" />
                         </div>
                         )}
                      </div>

                      {/* WATZAPP PLACEHOLDER */}
                      <div className="space-y-2 pt-4 border-t border-white/5">
                         <label className="text-white/80 font-medium">Conta de WhatsApp padrão <span className="text-destructive">*</span></label>
                         <div className="flex items-center justify-between p-3 rounded-lg border border-blue-600 bg-[#0A1929] cursor-pointer">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden relative">
                                  <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0A1929] rounded-full"></div>
                               </div>
                               <div>
                                  <p className="font-bold text-white text-sm">558898071904</p>
                                  <p className="text-xs text-white/50">AIB DIGITAL - WPP (Integrado)</p>
                               </div>
                            </div>
                            <div className="w-5 h-5 rounded-full border-[6px] border-blue-500"></div>
                         </div>
                      </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
                      <Button onClick={()=>setIsModalOpen(false)} variant="ghost" className="text-white/60 hover:bg-white/5 flex-1 h-11">Cancelar</Button>
                      <Button onClick={handleSaveModal} className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-11 font-bold">Salvar Alerta</Button>
                   </div>
                </div>

                {/* LADO DIREITO (TEMPLATE) */}
                <div className="hidden md:flex flex-col w-[380px] bg-[#121212] p-8 border-l border-white/5 relative">
                   <h3 className="text-lg font-bold mb-6 text-white h-[28px]">Personalize sua mensagem</h3>
                   
                   <div className="bg-[#004d40] text-emerald-50 p-5 rounded-xl text-[13px] leading-relaxed relative min-h-[150px] whitespace-pre-wrap shadow-lg">
                      <div className="absolute -left-2 top-4 w-4 h-4 bg-[#004d40] rotate-45 rounded-sm"></div>
                      {renderedMessage}
                   </div>

                   <div className="mt-10 space-y-4">
                      <h4 className="font-bold text-white mb-2">Lista de variáveis</h4>
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                         <span className="text-sm text-white/60">Conta de anúncio</span>
                         <Badge variant="outline" className="font-mono text-[10px] bg-white text-black hover:bg-white">{'<CA>'}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                         <span className="text-sm text-white/60">Saldo Atual (Lido)</span>
                         <Badge variant="outline" className="font-mono text-[10px] bg-white text-black hover:bg-white">{'<SALDO>'}</Badge>
                      </div>
                      {formType === 'saldo' && (
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                         <span className="text-sm text-white/60">Saldo mínimo (Metrica)</span>
                         <Badge variant="outline" className="font-mono text-[10px] bg-white text-black hover:bg-white">{'<TARGET>'}</Badge>
                      </div>
                      )}
                      
                      <Button variant="outline" className="w-fit mt-6 border-white/10 bg-transparent hover:bg-white/5 text-white/80 gap-2 h-9 text-xs">
                         <SettingsIcon className="w-3.5 h-3.5" /> Configurações de Template Avançada
                      </Button>
                   </div>
                   
                   <Button onClick={()=>setIsModalOpen(false)} variant="ghost" className="absolute top-4 right-4 w-8 h-8 p-0 text-white/40 hover:bg-white/5 rounded-full"><XSquare className="w-5 h-5"/></Button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
