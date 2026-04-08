import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Command } from 'lucide-react';

export default function InsightsPage() {
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [input, setInput] = useState('');

  const suggestions = [
    "Resumo da conta em 3 tópicos.",
    "Por que meu CPA aumentou ontem?",
    "Quais criativos posso escalar?",
    "Identifique gargalos de CPM."
  ];

  const handleSend = (e?: React.FormEvent, text?: string) => {
    e?.preventDefault();
    const query = text || input;
    if (!query) return;

    setMessages([...messages, { role: 'user', content: query }]);
    setInput('');
    
    // Mock IA
    setTimeout(() => {
       setMessages(prev => [...prev, { 
         role: 'ai', 
         content: "Estou analisando a volumetria nas campanhas de Vendas vs Leads. Identificamos que o Conjunto 'Mix de Público' apresenta uma queda na taxa de conversão do botão. Recomendo testar landing pages mais agressivas." 
       }]);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto animate-in fade-in duration-500 min-h-screen flex flex-col">
      <div className="text-center mb-12 mt-4">
         <div className="inline-flex items-center justify-center p-3 bg-brand-primary/10 rounded-2xl mb-6 shadow-[0_0_30px_rgba(0,188,212,0.15)]">
            <Sparkles className="w-8 h-8 text-brand-primary" />
         </div>
         <h2 className="font-heading font-bold text-3xl uppercase tracking-widest text-[#F0F2F7]">AIB AI Core</h2>
         <p className="text-sm text-text-secondary mt-2 max-w-lg mx-auto">Converse com a inteligência do sistema para gerar relatórios na hora e extrair insights escondidos nas suas campanhas.</p>
      </div>

      <div className="flex-1 flex flex-col justify-end min-h-[400px]">
         {messages.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto w-full">
               {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(undefined, s)}
                    className="card p-4 text-left hover:border-brand-primary/50 hover:bg-brand-primary/[0.02] transition-colors group relative overflow-hidden"
                  >
                     <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/20 group-hover:bg-brand-primary transition-colors"></div>
                     <span className="text-sm font-medium text-text-primary group-hover:text-brand-primary transition-colors">{s}</span>
                  </button>
               ))}
            </div>
         ) : (
            <div className="space-y-6 mb-8 overflow-y-auto max-h-[60vh] scrollbar-thin rounded-xl p-4">
               {messages.map((m, i) => (
                  <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     {m.role === 'ai' && (
                        <div className="w-8 h-8 shrink-0 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 mt-1">
                           <Bot className="w-4 h-4 text-brand-primary" />
                        </div>
                     )}
                     <div className={`p-4 rounded-xl max-w-[80%] ${m.role === 'user' ? 'bg-bg-elevated border border-border-strong text-text-primary rounded-tr-sm' : 'bg-brand-primary/[0.05] border border-brand-primary/20 text-[#F0F2F7] rounded-tl-sm'}`}>
                        <p className="text-sm leading-relaxed">{m.content}</p>
                     </div>
                     {m.role === 'user' && (
                        <div className="w-8 h-8 shrink-0 rounded-full bg-bg-surface flex items-center justify-center border border-border-default mt-1">
                           <User className="w-4 h-4 text-text-muted" />
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}
      </div>

      {/* Input Area */}
      <div className="relative mt-auto">
         <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-purple-600 rounded-xl blur opacity-20"></div>
         <form onSubmit={handleSend} className="relative bg-bg-elevated border border-border-strong rounded-xl flex items-center focus-within:border-brand-primary/50 transition-colors shadow-xl">
            <div className="pl-4">
               <Command className="w-5 h-5 text-text-muted" />
            </div>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Digite '/' para comandos ou faça uma pergunta livre..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-text-primary px-4 py-4 placeholder:text-text-disabled"
            />
            <div className="pr-2">
               <button type="submit" disabled={!input} className="p-2 bg-brand-primary text-bg-base rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <Send className="w-5 h-5" />
               </button>
            </div>
         </form>
         <div className="text-center mt-3">
             <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">AIB CLI • Claude 3.5 Sonnet Integration Active</span>
         </div>
      </div>
    </div>
  );
}
