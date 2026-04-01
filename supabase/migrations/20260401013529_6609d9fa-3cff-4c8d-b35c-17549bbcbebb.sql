
-- Adicionar 'viewer' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- Tabela de clientes
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  meta_account_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Vínculo usuário ↔ cliente
CREATE TABLE public.users_clients (
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, client_id)
);
ALTER TABLE public.users_clients ENABLE ROW LEVEL SECURITY;

-- Campanhas
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  meta_campaign_id text,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  objective text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Conjuntos de anúncios
CREATE TABLE public.ad_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  meta_adset_id text,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  targeting jsonb,
  budget numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;

-- Anúncios
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id uuid NOT NULL REFERENCES public.ad_sets(id) ON DELETE CASCADE,
  meta_ad_id text,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  creative_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Métricas
CREATE TABLE public.metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  date date NOT NULL,
  impressions bigint DEFAULT 0,
  reach bigint DEFAULT 0,
  frequency numeric(8,2) DEFAULT 0,
  clicks bigint DEFAULT 0,
  ctr numeric(8,4) DEFAULT 0,
  cpm numeric(12,2) DEFAULT 0,
  cpc numeric(12,2) DEFAULT 0,
  spend numeric(12,2) DEFAULT 0,
  results bigint DEFAULT 0,
  cost_per_result numeric(12,2) DEFAULT 0,
  roas numeric(8,2) DEFAULT 0,
  hook_rate numeric(8,2) DEFAULT 0,
  hold_rate numeric(8,2) DEFAULT 0,
  outbound_ctr numeric(8,4) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Insights IA
CREATE TABLE public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  content text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Alertas
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  alert_type text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Função para resolver entity -> client_id
CREATE OR REPLACE FUNCTION public.entity_client_id(_entity_type text, _entity_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _entity_type
    WHEN 'account' THEN _entity_id
    WHEN 'campaign' THEN (SELECT client_id FROM public.campaigns WHERE id = _entity_id)
    WHEN 'adset' THEN (SELECT c.client_id FROM public.ad_sets ast JOIN public.campaigns c ON c.id = ast.campaign_id WHERE ast.id = _entity_id)
    WHEN 'ad' THEN (SELECT c.client_id FROM public.ads a JOIN public.ad_sets ast ON ast.id = a.ad_set_id JOIN public.campaigns c ON c.id = ast.campaign_id WHERE a.id = _entity_id)
  END
$$;

-- Função: verifica acesso do usuário a um cliente
CREATE OR REPLACE FUNCTION public.user_has_client_access(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.users_clients
      WHERE user_id = _user_id AND client_id = _client_id
    )
$$;

-- RLS: clients
CREATE POLICY "admin_all_clients" ON public.clients FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "viewer_select_clients" ON public.clients FOR SELECT TO authenticated
  USING (user_has_client_access(auth.uid(), id));

-- RLS: users_clients
CREATE POLICY "admin_all_users_clients" ON public.users_clients FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "viewer_own_links" ON public.users_clients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS: campaigns
CREATE POLICY "admin_all_campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "viewer_select_campaigns" ON public.campaigns FOR SELECT TO authenticated
  USING (user_has_client_access(auth.uid(), client_id));

-- RLS: ad_sets
CREATE POLICY "admin_all_ad_sets" ON public.ad_sets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "viewer_select_ad_sets" ON public.ad_sets FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = ad_sets.campaign_id
    AND user_has_client_access(auth.uid(), c.client_id)
  ));

-- RLS: ads
CREATE POLICY "admin_all_ads" ON public.ads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "viewer_select_ads" ON public.ads FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ad_sets ast
    JOIN public.campaigns c ON c.id = ast.campaign_id
    WHERE ast.id = ads.ad_set_id
    AND user_has_client_access(auth.uid(), c.client_id)
  ));

-- RLS: metrics
CREATE POLICY "admin_all_metrics" ON public.metrics FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "viewer_select_metrics" ON public.metrics FOR SELECT TO authenticated
  USING (user_has_client_access(auth.uid(), entity_client_id(entity_type, entity_id)));

-- RLS: insights
CREATE POLICY "admin_all_insights" ON public.insights FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "viewer_select_insights" ON public.insights FOR SELECT TO authenticated
  USING (user_has_client_access(auth.uid(), entity_client_id(entity_type, entity_id)));

-- RLS: alerts
CREATE POLICY "admin_all_alerts" ON public.alerts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "viewer_select_alerts" ON public.alerts FOR SELECT TO authenticated
  USING (user_has_client_access(auth.uid(), entity_client_id(entity_type, entity_id)));

-- Índices para performance
CREATE INDEX idx_metrics_entity ON public.metrics(entity_type, entity_id, date);
CREATE INDEX idx_metrics_date ON public.metrics(date);
CREATE INDEX idx_campaigns_client ON public.campaigns(client_id);
CREATE INDEX idx_ad_sets_campaign ON public.ad_sets(campaign_id);
CREATE INDEX idx_ads_ad_set ON public.ads(ad_set_id);
CREATE INDEX idx_alerts_entity ON public.alerts(entity_type, entity_id);
CREATE INDEX idx_insights_entity ON public.insights(entity_type, entity_id);
CREATE INDEX idx_users_clients_user ON public.users_clients(user_id);
