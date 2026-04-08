import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save, Plus } from 'lucide-react';

export default function DocumentoPage() {
  const [docs, setDocs] = useState([{ id: 1, title: 'Planejamento Autoescola Q1', content: 'Metas:\n1. Aumentar matrículas em 30%\n2. Reduzir CPL.' }]);
  const [activeDoc, setActiveDoc] = useState(1);

  const doc = docs.find(d => d.id === activeDoc);

  const handleUpdate = (content: string) => {
    setDocs(docs.map(d => d.id === activeDoc ? { ...d, content } : d));
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/5 shrink-0">
         <h2 className="font-black text-lg tracking-widest uppercase flex items-center gap-2"><FileText className="w-5 h-5"/> Documentos</h2>
         <Button size="sm" onClick={() => setDocs([...docs, { id: Date.now(), title: 'Novo Documento', content: '' }])}><Plus className="w-4 h-4 mr-1"/> Novo</Button>
      </div>

      <div className="flex-1 overflow-hidden flex">
         {/* Sidebar */}
         <div className="w-64 border-r border-border bg-card shrink-0 p-4 space-y-2">
            {docs.map(d => (
              <div 
                key={d.id} 
                onClick={() => setActiveDoc(d.id)}
                className={`p-3 rounded-lg cursor-pointer text-sm font-bold transition-colors ${activeDoc === d.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
              >
                {d.title}
              </div>
            ))}
         </div>

         {/* Editor */}
         <div className="flex-1 p-8 bg-background relative flex flex-col">
           {doc ? (
             <>
               <input 
                 className="text-3xl font-black bg-transparent border-none outline-none mb-6"
                 value={doc.title}
                 onChange={(e) => setDocs(docs.map(d => d.id === activeDoc ? { ...d, title: e.target.value } : d))}
               />
               <Textarea 
                 className="flex-1 resize-none bg-transparent border-none outline-none text-base shadow-none focus-visible:ring-0 p-0 leading-relaxed font-serif"
                 value={doc.content}
                 onChange={(e) => handleUpdate(e.target.value)}
                 placeholder="Comece a digitar..."
               />
               <div className="absolute right-8 bottom-8">
                 <Button className="shadow-lg"><Save className="w-4 h-4 mr-2"/> Salvar</Button>
               </div>
             </>
           ) : (
             <div className="m-auto text-muted-foreground italic">Selecione um documento.</div>
           )}
         </div>
      </div>
    </div>
  );
}
