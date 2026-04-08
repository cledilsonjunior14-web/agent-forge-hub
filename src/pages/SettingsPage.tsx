import React, { useState } from 'react';
import { Settings, Link as LinkIcon, AlertCircle, Save, Moon, Sun, ToggleLeft, Key } from 'lucide-react';

export default function SettingsPage() {
  const [token, setToken] = useState('EAAIz...KDJ3');
  const [themeMode, setThemeMode] = useState('dark');

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-border-default">
         <div>
            <h2 className="font-heading font-bold text-2xl uppercase tracking-widest text-[#F0F2F7] flex items-center gap-3">
               <Settings className="w-6 h-6 text-brand-primary" /> Sistema Global
            </h2>
            <p className="text-sm text-text-secondary mt-1">Configurações de infraestrutura e metas globais de negócio.</p>
         </div>
      </div>

      <div className="space-y-8">
         {/* Meta Connection */}
         <div className="card p-6 border-l-4 border-l-brand-primary">
            <h3 className="font-heading font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#F0F2F7]">
               <LinkIcon className="w-5 h-5 text-brand-primary" /> Conexão Meta API
            </h3>
            <div className="flex items-center justify-between bg-bg-surface border border-border-strong rounded-lg p-5">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-[#1877F2]/10 flex items-center justify-center">
                     <span className="font-bold text-[#1877F2]">f</span>
                  </div>
                  <div>
                     <p className="font-bold text-text-primary text-sm">Meta Business Extension</p>
                     <p className="text-[10px] uppercase font-bold text-[#00E096] tracking-widest mt-1 mr-2 px-2 py-0.5 rounded bg-[#00E096]/10 inline-block">● Conectado Activamente</p>
                  </div>
               </div>
               <button className="text-xs bg-bg-elevated hover:bg-bg-overlay border border-border-default px-4 py-2 rounded font-bold uppercase tracking-widest transition-colors text-text-muted">Desconectar</button>
            </div>
            
            <div className="mt-6">
               <label className="block text-xs uppercase font-bold text-text-muted tracking-wide mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4"/> System User Token (Definitivo)
               </label>
               <div className="flex gap-3">
                  <input 
                     type="password" 
                     value={token}
                     onChange={(e) => setToken(e.target.value)}
                     className="flex-1 bg-bg-surface border border-border-strong rounded-lg px-4 py-3 text-sm text-text-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none" 
                  />
                  <button className="bg-brand-primary hover:bg-brand-primary/90 text-bg-base px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors">
                     <Save className="w-4 h-4" /> Salvar
                  </button>
               </div>
            </div>
         </div>

         {/* Objetivos Globais Padrão */}
         <div className="card p-6">
            <h3 className="font-heading font-bold uppercase tracking-widest mb-1 text-[#F0F2F7]">Limites Operacionais (Safeguard)</h3>
            <p className="text-xs text-text-secondary mb-6">Estes valores definem o termômetro de cores do dashboard (Excelente / Estável / Crítico).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Teto CPA (Vendas)</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">R$</span>
                     <input type="number" defaultValue="4.50" className="w-full bg-bg-surface border border-border-default rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-text-primary focus:border-brand-primary outline-none" />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Teto CPL (Leads)</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">R$</span>
                     <input type="number" defaultValue="14.00" className="w-full bg-bg-surface border border-border-default rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-text-primary focus:border-brand-primary outline-none" />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Piso ROAS (Vendas)</label>
                  <div className="relative">
                     <input type="number" defaultValue="3.0" className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-sm font-mono text-text-primary focus:border-brand-primary outline-none" />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">X</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Visual */}
         <div className="card p-6 border border-border-subtle bg-bg-surface/50">
            <h3 className="font-heading font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#F0F2F7]">Preferências de Interface</h3>
            <div className="flex items-center justify-between p-4 bg-bg-elevated rounded border border-border-default">
               <div className="flex items-center gap-3">
                  {themeMode === 'dark' ? <Moon className="w-5 h-5 text-brand-primary" /> : <Sun className="w-5 h-5 text-[#F1C40F]" />}
                  <div>
                     <p className="font-bold text-sm text-text-primary">AIB Dark Intelligence (V2)</p>
                     <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">Tema padrão forçado via Design System</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 opacity-50 cursor-not-allowed" title="A versão V2 foi focada exclusivamente no formato Dark.">
                  <ToggleLeft className="w-8 h-8 text-brand-primary shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Ativo</span>
               </div>
            </div>
            <div className="mt-4 flex gap-2 text-xs text-text-muted bg-brand-primary/5 p-3 rounded">
               <AlertCircle className="w-4 h-4 shrink-0 text-brand-primary" />
               <span>O tema "Light Mode" foi deprecado nesta versão focada em alta densidade de dados luminosos. Modificações de código são necessárias para reversão.</span>
            </div>
         </div>
      </div>
    </div>
  );
}
