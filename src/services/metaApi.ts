// src/services/metaApi.ts
// Integração seguindo a estrutura do MCP Meta Ads

const META_GRAPH_URL = 'https://graph.facebook.com/v19.0';

export interface MetaAccount {
  account_id: string;
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
}

export interface MetaInsight {
  impressions?: string;
  reach?: string;
  clicks?: string;
  spend?: string;
  cpm?: string;
  cpc?: string;
  ctr?: string;
  date_start?: string;
  date_stop?: string;
  actions?: { action_type: string; value: string }[];
  [key: string]: any;
}

// Helper genérico para chamadas à API da Meta
async function fetchMetaApi(endpoint: string, token: string, params: Record<string, any> = {}) {
  const url = new URL(`${META_GRAPH_URL}${endpoint}`);
  url.searchParams.append('access_token', token);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data || data;
}

// ============================================
// GRUPO 1 — Acesso e Estrutura
// ============================================

export async function listar_contas(token: string): Promise<MetaAccount[]> {
  const result = await fetchMetaApi('/me/adaccounts', token, {
    fields: 'account_id,name,account_status,currency,timezone_name',
    limit: 100,
  });
  return result;
}

export async function info_conta(token: string, account_id: string): Promise<any> {
  const result = await fetchMetaApi(`/act_${account_id}`, token, {
    fields: 'name,account_status,currency,timezone_name,balance,spend_cap',
  });
  return result;
}

export async function listar_campanhas(token: string, account_id: string, limit: number = 20): Promise<any[]> {
  const result = await fetchMetaApi(`/act_${account_id}/campaigns`, token, {
    fields: 'id,name,objective,status,daily_budget,lifetime_budget',
    limit,
  });
  return result;
}

export async function listar_conjuntos(token: string, account_id: string, campaign_id?: string, limit: number = 20): Promise<any[]> {
  const endpoint = campaign_id ? `/${campaign_id}/adsets` : `/act_${account_id}/adsets`;
  const result = await fetchMetaApi(endpoint, token, {
    fields: 'id,name,status,daily_budget,targeting,optimization_goal',
    limit,
  });
  return result;
}

export async function listar_anuncios(token: string, account_id: string, adset_id?: string, limit: number = 20): Promise<any[]> {
  const endpoint = adset_id ? `/${adset_id}/ads` : `/act_${account_id}/ads`;
  const result = await fetchMetaApi(endpoint, token, {
    fields: 'id,name,status,creative',
    limit,
  });
  return result;
}

export async function obter_criativo_do_anuncio(token: string, ad_id: string): Promise<any> {
  const result = await fetchMetaApi(`/${ad_id}`, token, {
    fields: 'creative{id,name,body,image_url,thumbnail_url}',
  });
  return result;
}

// ============================================
// GRUPO 2 — Insights e Métricas
// ============================================

const INSIGHT_FIELDS = 'impressions,reach,clicks,spend,cpm,cpc,ctr,frequency,actions,cost_per_action_type';

export async function insights_conta(token: string, account_id: string, date_preset: string = 'last_7d'): Promise<MetaInsight[]> {
  return await fetchMetaApi(`/act_${account_id}/insights`, token, {
    fields: INSIGHT_FIELDS,
    date_preset,
    level: 'account',
  });
}

export async function insights_campanha(token: string, campaign_id: string, date_preset: string = 'last_7d'): Promise<MetaInsight[]> {
  return await fetchMetaApi(`/${campaign_id}/insights`, token, {
    fields: INSIGHT_FIELDS,
    date_preset,
    level: 'campaign',
  });
}

export async function insights_todas_campanhas(token: string, account_id: string, date_preset: string = 'last_7d'): Promise<MetaInsight[]> {
  return await fetchMetaApi(`/act_${account_id}/insights`, token, {
    fields: `campaign_id,campaign_name,${INSIGHT_FIELDS}`,
    date_preset,
    level: 'campaign',
  });
}

export async function insights_diarios(token: string, account_id: string, date_preset: string = 'last_7d', campaign_id?: string): Promise<MetaInsight[]> {
  const endpoint = campaign_id ? `/${campaign_id}/insights` : `/act_${account_id}/insights`;
  return await fetchMetaApi(endpoint, token, {
    fields: INSIGHT_FIELDS,
    date_preset,
    time_increment: 1,
  });
}

export async function insights_por_hora(token: string, account_id: string, date_preset: string = 'last_7d', campaign_id?: string): Promise<MetaInsight[]> {
  const endpoint = campaign_id ? `/${campaign_id}/insights` : `/act_${account_id}/insights`;
  return await fetchMetaApi(endpoint, token, {
    fields: INSIGHT_FIELDS,
    date_preset,
    breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone',
  });
}

export async function insights_por_dispositivo(token: string, account_id: string, date_preset: string = 'last_7d', campaign_id?: string): Promise<MetaInsight[]> {
  const endpoint = campaign_id ? `/${campaign_id}/insights` : `/act_${account_id}/insights`;
  return await fetchMetaApi(endpoint, token, {
    fields: INSIGHT_FIELDS,
    date_preset,
    breakdowns: 'publisher_platform,impression_device',
  });
}

export async function insights_por_idade_genero(token: string, account_id: string, date_preset: string = 'last_7d', campaign_id?: string): Promise<MetaInsight[]> {
  const endpoint = campaign_id ? `/${campaign_id}/insights` : `/act_${account_id}/insights`;
  return await fetchMetaApi(endpoint, token, {
    fields: INSIGHT_FIELDS,
    date_preset,
    breakdowns: 'age,gender',
  });
}

export async function insights_por_regiao(token: string, account_id: string, date_preset: string = 'last_7d', campaign_id?: string): Promise<MetaInsight[]> {
  const endpoint = campaign_id ? `/${campaign_id}/insights` : `/act_${account_id}/insights`;
  return await fetchMetaApi(endpoint, token, {
    fields: INSIGHT_FIELDS,
    date_preset,
    breakdowns: 'region',
  });
}

export async function insights_custom(
  token: string,
  account_id: string,
  params: {
    fields?: string;
    breakdowns?: string;
    date_preset?: string;
    time_range?: string; // e.g. '{"since":"2023-01-01","until":"2023-01-31"}'
    level?: 'account' | 'campaign' | 'adset' | 'ad';
    campaign_id?: string;
    adset_id?: string;
    time_increment?: number | 'monthly' | 'all_days';
    limit?: number;
  }
): Promise<MetaInsight[]> {
  const { fields = INSIGHT_FIELDS, campaign_id, adset_id, ...rest } = params;
  
  let endpoint = `/act_${account_id}/insights`;
  if (adset_id) {
    endpoint = `/${adset_id}/insights`;
  } else if (campaign_id) {
    endpoint = `/${campaign_id}/insights`;
  }

  return await fetchMetaApi(endpoint, token, {
    fields,
    ...rest,
  });
}
