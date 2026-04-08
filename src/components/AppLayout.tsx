import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FilterProvider, useFilters } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Target, ChevronDown } from 'lucide-react';
import { demoCampaigns } from '@/services/mockData';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const pageTitleMap: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Visão Geral da Conta' },
  '/campaigns': { title: 'Campanhas', subtitle: 'Gestão de Ativos' },
  '/creatives': { title: 'Criativos', subtitle: 'Batalha e Performance' },
  '/funis': { title: 'Funis Dinâmicos', subtitle: 'Trajetórias por Objetivo' },
  '/alerts': { title: 'Alertas', subtitle: 'Monitoramento Ativo' },
  '/insights': { title: 'Insights IA', subtitle: 'Inteligência e Otimização' },
  '/settings': { title: 'Configurações', subtitle: 'Integração e Metas' },
};

function HeaderBar() {
  const { pathname } = useLocation();
  const { selectedCampaigns, setSelectedCampaigns } = useFilters();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pageInfo = pageTitleMap[pathname] || { title: 'Dashboard' };

  // Helper
  const handleCampaignToggle = (cid: string) => {
    if (selectedCampaigns.includes(cid)) {
      setSelectedCampaigns(selectedCampaigns.filter(id => id !== cid));
    } else {
      setSelectedCampaigns([...selectedCampaigns, cid]);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-6 z-10 sticky top-0 md:h-20">
      <div className="flex items-center gap-2 mr-4 md:hidden">
         <SidebarTrigger className="hover:bg-transparent"/>
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="font-heading font-bold text-lg md:text-xl text-primary whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-wider">
            {pageInfo.title}
          </h1>
          <div className="hidden sm:flex items-center gap-2 bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-[9px] uppercase font-bold text-success tracking-wider">Operando em Tempo Real</span>
          </div>
        </div>
        {pageInfo.subtitle && <span className="text-xs text-muted-foreground mr-auto hidden sm:block">{pageInfo.subtitle}</span>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Ad Account Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-bg-surface border-border-default h-9 text-xs flex items-center gap-2 font-medium">
              <span className="hidden sm:inline">AIB Digital</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-bg-elevated border-border-strong text-text-primary z-50">
            <DropdownMenuLabel className="text-xs text-text-muted uppercase">Conta de Anúncio</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuCheckboxItem checked>AIB Digital</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={false}>Cliente X</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DateRangePicker />

        {/* Multi-Select de Campanha */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-bg-surface border-border-default h-9 text-xs flex items-center gap-2 min-w-[160px] justify-between font-medium">
              <div className="flex items-center gap-2 truncate text-text-primary">
                <Target className="w-3.5 h-3.5 text-brand-primary" />
                <span className="truncate">
                  {selectedCampaigns.length === 0 ? 'Todas as Campanhas' : `${selectedCampaigns.length} Selecionadas`}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-bg-elevated border-border-strong shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50">
            <DropdownMenuLabel className="text-xs text-text-muted uppercase flex justify-between items-center text-text-primary">
              Filtrar Campanhas
              {selectedCampaigns.length > 0 && (
                <button onClick={() => setSelectedCampaigns([])} className="text-[10px] text-brand-primary hover:underline cursor-pointer tracking-wider">LIMPAR</button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin text-text-primary">
               <DropdownMenuCheckboxItem 
                 checked={selectedCampaigns.length === 0} 
                 onCheckedChange={() => setSelectedCampaigns([])}
               >
                 Todas as Campanhas
               </DropdownMenuCheckboxItem>
               {demoCampaigns.map(camp => (
                 <DropdownMenuCheckboxItem 
                   key={camp.id}
                   checked={selectedCampaigns.includes(camp.id)}
                   onCheckedChange={() => handleCampaignToggle(camp.id)}
                 >
                   <span className="truncate text-xs">{camp.name}</span>
                 </DropdownMenuCheckboxItem>
               ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Botão de Refresh */}
        <Button 
          variant="default" 
          size="icon" 
          className="h-9 w-9 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 shrink-0 shadow-[0_0_15px_var(--brand-glow)]"
          onClick={handleRefresh}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </header>
  );
}

export default function AppLayout() {
  return (
    <FilterProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <HeaderBar />
            <main className="flex-1 overflow-auto scrollbar-thin">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </FilterProvider>
  );
}
