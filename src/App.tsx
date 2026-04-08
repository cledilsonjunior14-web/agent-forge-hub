import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import DashboardPage from '@/pages/DashboardAds';
import CampaignsPage from '@/pages/CampaignsPage';
import AdSetsPage from '@/pages/AdSetsPage';
import AdsPage from '@/pages/AdsPage';
import CreativesPage from '@/pages/CreativesPage';
import AlertsPage from '@/pages/AlertsPage';
import InsightsPage from '@/pages/InsightsPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFound from '@/pages/NotFound';
import ListaPage from '@/pages/gestao/ListaPage';
import KanbanPage from '@/pages/gestao/KanbanPage';
import GanttPage from '@/pages/gestao/GanttPage';
import CalendarioPage from '@/pages/gestao/CalendarioPage';
import DocumentoPage from '@/pages/gestao/DocumentoPage';
import FormulariosPage from '@/pages/gestao/FormulariosPage';
import PaineisPage from '@/pages/gestao/PaineisPage';
import ClientesPage from '@/pages/gestao/ClientesPage';
import ProjetosPage from '@/pages/gestao/ProjetosPage';
import EquipePage from '@/pages/gestao/EquipePage';
import DashboardGestaoPage from '@/pages/gestao/DashboardGestaoPage';
import { GestaoAuthProvider } from '@/contexts/GestaoAuthContext';
import { GestaoDataProvider } from '@/contexts/GestaoDataContext';
import { seedGestaoData } from '@/utils/seedGestao';

// Seed initial mock data for Gestão module
seedGestaoData();

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <GestaoAuthProvider>
              <GestaoDataProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/campaigns" element={<CampaignsPage />} />
                      <Route path="/campaigns/:campaignId/adsets" element={<AdSetsPage />} />
                      <Route path="/adsets/:adSetId/ads" element={<AdsPage />} />
                      <Route path="/creatives" element={<CreativesPage />} />
                      <Route path="/alerts" element={<AlertsPage />} />
                      <Route path="/insights" element={<InsightsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      
                      {/* GESTAO ROUTES */}
                      <Route path="/gestao/lista" element={<ListaPage />} />
                      <Route path="/gestao/kanban" element={<KanbanPage />} />
                      <Route path="/gestao/gantt" element={<GanttPage />} />
                      <Route path="/gestao/calendario" element={<CalendarioPage />} />
                      <Route path="/gestao/documento" element={<DocumentoPage />} />
                      <Route path="/gestao/formularios" element={<FormulariosPage />} />
                      <Route path="/gestao/paineis" element={<PaineisPage />} />
                      <Route path="/gestao/clientes" element={<ClientesPage />} />
                      <Route path="/gestao/projetos" element={<ProjetosPage />} />
                      <Route path="/gestao/equipe" element={<EquipePage />} />
                      <Route path="/gestao" element={<DashboardGestaoPage />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </GestaoDataProvider>
            </GestaoAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;