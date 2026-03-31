import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Bot, Terminal, Zap, ArrowRight } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-foreground">AgentForge</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/register">
            <Button variant="glow" size="sm">Criar Conta</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-block rounded-full border border-border bg-card px-4 py-1 text-xs text-muted-foreground">
            Hub de criação de agentes de IA
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-6xl">
            Crie. Execute.
            <span className="text-gradient"> Automatize.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
            Plataforma para criar, gerenciar e executar agentes de IA com integração direta ao seu terminal e Claude CLI.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/register">
              <Button variant="glow" size="lg">
                Começar Agora
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Entrar</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: Bot, title: 'Editor de Agentes', desc: 'Blocos SYSTEM_ROLE, CONTEXT e TASK com versionamento completo.' },
          { icon: Terminal, title: 'Terminal Integrado', desc: 'Execute comandos e conecte com Claude CLI direto da plataforma.' },
          { icon: Zap, title: 'Execução Rápida', desc: 'Rode agentes e veja resultados em tempo real com logs detalhados.' },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
          >
            <feature.icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
