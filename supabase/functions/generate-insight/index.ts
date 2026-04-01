import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar autenticação
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { entity_type, entity_id, metrics, client_name } = await req.json();

    if (!entity_type || !entity_id) {
      return new Response(JSON.stringify({ error: 'entity_type e entity_id são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Você é um analista sênior de marketing digital especialista em Meta Ads.
Analise as métricas abaixo e gere um insight acionável em português brasileiro.

Cliente: ${client_name || 'N/A'}
Tipo da entidade: ${entity_type}
Métricas (últimos registros): ${JSON.stringify(metrics?.slice(0, 10))}

Use o framework:
1. **Hook** — O que está acontecendo (dado principal que chama atenção)
2. **Proposta de Valor** — Por que isso importa e o que significa para o negócio
3. **CTA** — Ação específica recomendada com próximos passos claros

Seja direto, prático e baseado em dados. Responda em português brasileiro.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      }),
    });

    const result = await response.json();
    const insight = result.choices?.[0]?.message?.content || 'Não foi possível gerar o insight.';

    // Salvar no banco
    await supabase.from('insights').insert({
      entity_type,
      entity_id,
      content: insight,
    });

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
