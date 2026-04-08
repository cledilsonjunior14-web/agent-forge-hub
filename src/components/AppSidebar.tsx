import {
  LayoutDashboard, Megaphone, Image, AlertTriangle, Sparkles, LogOut, Settings as SettingsIcon,
  ListTodo, Kanban, Calendar, FileText, FormInput, Activity, Users, FolderOpen, Users2, BarChartBig
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useGestaoAuth } from '@/contexts/GestaoAuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Campanhas', url: '/campaigns', icon: Megaphone },
  { title: 'Criativos', url: '/creatives', icon: Image },
  { title: 'Alertas', url: '/alerts', icon: AlertTriangle },
  { title: 'Insights IA', url: '/insights', icon: Sparkles },
  { title: 'Configurações', url: '/settings', icon: SettingsIcon },
];

const gestaoNavItems = [
  { title: 'Dashboard', url: '/gestao', icon: LayoutDashboard },
  { title: 'Lista', url: '/gestao/lista', icon: ListTodo },
  { title: 'Kanban', url: '/gestao/kanban', icon: Kanban },
  { title: 'Gantt', url: '/gestao/gantt', icon: BarChartBig },
  { title: 'Calendário', url: '/gestao/calendario', icon: Calendar },
  { title: 'Documento', url: '/gestao/documento', icon: FileText },
  { title: 'Formulários', url: '/gestao/formularios', icon: FormInput },
  { title: 'Painéis', url: '/gestao/paineis', icon: Activity },
  { title: 'Clientes', url: '/gestao/clientes', icon: Users },
  { title: 'Projetos', url: '/gestao/projetos', icon: FolderOpen },
  { title: 'Equipe', url: '/gestao/equipe', icon: Users2, adminOnly: true },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { currentUser } = useGestaoAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-foreground">AIB Ads</span>
            <span className="text-[10px] text-muted-foreground">Intelligence</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs font-bold tracking-widest uppercase text-muted-foreground">Tráfego</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === '/'} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs font-bold tracking-widest uppercase text-muted-foreground mt-4">Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {gestaoNavItems.filter(item => !item.adminOnly || currentUser?.role === 'admin').map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === '/gestao'} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}