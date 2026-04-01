import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FilterProvider, useFilters, Period } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

function HeaderBar() {
  const { isAdmin } = useAuth();
  const { period, setPeriod, selectedClientId, setSelectedClientId } = useFilters();

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      return data || [];
    },
  });

  const periods: { value: Period; label: string }[] = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
  ];

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <SidebarTrigger />
      <div className="flex-1" />

      {/* Seletor de cliente (admin) */}
      {isAdmin && clients && clients.length > 0 && (
        <Select value={selectedClientId || 'all'} onValueChange={(v) => setSelectedClientId(v === 'all' ? null : v)}>
          <SelectTrigger className="w-[200px] bg-card">
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Seletor de período */}
      <div className="flex gap-1 rounded-lg bg-card p-1">
        {periods.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={period === p.value ? 'default' : 'ghost'}
            className="h-7 text-xs"
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
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
