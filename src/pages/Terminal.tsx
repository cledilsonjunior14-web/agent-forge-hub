import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal as TermIcon, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TermLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  time: string;
}

export default function TerminalPage() {
  const [lines, setLines] = useState<TermLine[]>([
    { type: 'system', text: 'AgentForge Terminal v1.0', time: new Date().toLocaleTimeString() },
    { type: 'system', text: 'Conecte-se ao seu ambiente local via WebSocket para executar comandos.', time: new Date().toLocaleTimeString() },
    { type: 'system', text: 'Digite "help" para ver comandos disponíveis.', time: new Date().toLocaleTimeString() },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  const addLine = (type: TermLine['type'], text: string) => {
    setLines((p) => [...p, { type, text, time: new Date().toLocaleTimeString() }]);
  };

  const handleCommand = (cmd: string) => {
    addLine('input', `$ ${cmd}`);

    const lower = cmd.trim().toLowerCase();
    if (lower === 'help') {
      addLine('output', 'Comandos disponíveis:');
      addLine('output', '  help       - Mostra esta ajuda');
      addLine('output', '  clear      - Limpa o terminal');
      addLine('output', '  agents     - Lista agentes (requer conexão com banco)');
      addLine('output', '  status     - Status da conexão');
      addLine('output', '  claude     - Info sobre integração Claude CLI');
    } else if (lower === 'clear') {
      setLines([]);
    } else if (lower === 'status') {
      addLine('output', '🔵 Terminal local: simulado');
      addLine('output', '⚪ WebSocket: não conectado');
      addLine('system', 'Para conexão real, configure o bridge WebSocket no seu VS Code.');
    } else if (lower === 'claude') {
      addLine('output', 'Integração Claude CLI:');
      addLine('output', '  Configure sua API key em Configurações');
      addLine('output', '  Use "claude <prompt>" para enviar comandos');
    } else {
      addLine('error', `Comando não reconhecido: ${cmd}`);
      addLine('system', 'Digite "help" para ver comandos disponíveis.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleCommand(input.trim());
    setInput('');
  };

  const colorMap = {
    input: 'text-primary',
    output: 'text-terminal-fg',
    error: 'text-destructive',
    system: 'text-muted-foreground',
  };

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TermIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Terminal</h1>
          <p className="text-xs text-muted-foreground">Integração com seu ambiente local</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-terminal-bg"
      >
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-2">
          <div className="h-3 w-3 rounded-full bg-destructive/70" />
          <div className="h-3 w-3 rounded-full bg-warning/70" />
          <div className="h-3 w-3 rounded-full bg-success/70" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">agentforge — terminal</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-sm scrollbar-thin">
          {lines.map((line, i) => (
            <div key={i} className={`${colorMap[line.type]} mb-1`}>
              <span className="mr-2 text-muted-foreground/50 text-xs">[{line.time}]</span>
              {line.text}
            </div>
          ))}
          <div className="flex items-center text-terminal-fg">
            <span className="mr-1 animate-blink">▌</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center border-t border-border px-4 py-2">
          <span className="mr-2 font-mono text-sm text-primary">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite um comando..."
            className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            autoFocus
          />
          <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
