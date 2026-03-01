// Supabase Edge Function: send-match-list
// Busca a próxima partida aberta, monta a lista e envia para grupo WhatsApp
// via Evolution API (auto-hospedada).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Verifica se é envio manual ou automático (cron)
    let isManual = false;
    try {
      const body = await req.json();
      isManual = body?.manual === true;
    } catch { /* body vazio = cron */ }

    const triggeredBy = isManual ? 'manual' : 'cron';
    console.log('🚀 Iniciando envio. Manual:', isManual);

    // 1. Busca configuração do WhatsApp
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .single();

    console.log('📋 Config:', JSON.stringify({
      found: !!config,
      url: config?.evolution_api_url,
      instance: config?.instance_name,
      hasKey: !!config?.evolution_api_key,
      hasJid: !!config?.group_jid,
    }));

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'Configuração não encontrada. Configure no app primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isManual && !config.is_active) {
      return new Response(
        JSON.stringify({ error: 'Envio automático está desativado.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!config.evolution_api_url || !config.evolution_api_key || !config.instance_name || !config.group_jid) {
      return new Response(
        JSON.stringify({
          error: 'Configuração incompleta.',
          missing: {
            url: !config.evolution_api_url,
            key: !config.evolution_api_key,
            instance: !config.instance_name,
            jid: !config.group_jid,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Data atual no fuso horário do Brasil (UTC-3)
    const nowBRT = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    const today = nowBRT.toISOString().split('T')[0];
    console.log('📅 Data atual BRT:', today);

    // Tenta buscar próxima partida aberta ou em andamento
    const { data: matches } = await supabase
      .from('matches')
      .select('id, match_date, status')
      .in('status', ['open', 'in_progress'])
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .limit(1);

    // Se não achar, pega a mais recente de qualquer status
    let match: any = matches?.[0] ?? null;
    if (!match) {
      const { data: latest } = await supabase
        .from('matches')
        .select('id, match_date, status')
        .order('match_date', { ascending: false })
        .limit(1);
      match = latest?.[0] ?? null;
    }

    console.log('⚽ Partida:', match ? JSON.stringify(match) : 'nenhuma — enviando lista vazia');

    // 3. Busca jogadores se tiver partida
    let registrations: any[] = [];
    if (match) {
      const { data: regs, error: regsError } = await supabase
        .from('match_players')
        .select('player_id, status, players(name, is_goalkeeper)')
        .eq('match_id', match.id)
        .order('created_at', { ascending: true });

      console.log('📋 Regs error:', regsError?.message ?? 'nenhum');
      console.log('📋 Regs sample:', JSON.stringify(regs?.slice(0, 2)));
      registrations = regs || [];
    }

    console.log('👥 Jogadores:', registrations.length);

    // 4. Monta a lista — sempre com a data atual do envio (BRT)
    const matchDateFormatted = nowBRT.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });

    const MAX_GOALKEEPERS = 2;
    const MAX_FIELD = 12;

    const confirmed   = registrations.filter((r: any) => r.status === 'confirmed');
    const waiting     = registrations.filter((r: any) => r.status === 'waiting');
    const goalkeepers  = confirmed.filter((r: any) => r.players?.is_goalkeeper === true);
    const fieldPlayers = confirmed.filter((r: any) => !r.players?.is_goalkeeper);

    const lines: string[] = [];
    lines.push(`⚽ *LISTA FutClebs* ⚽`);
    lines.push(`📅 ${matchDateFormatted.charAt(0).toUpperCase() + matchDateFormatted.slice(1)}`);
    lines.push(``);

    // Goleiros (posições 1-2)
    for (let i = 0; i < MAX_GOALKEEPERS; i++) {
      const gk = goalkeepers[i];
      lines.push(`*${i + 1} - GOLEIRO* - ${gk ? `✅ ${gk.players.name}` : ``}`);
    }

    lines.push(``);

    // Jogadores de linha (posições 3-14) — todos MENSAL
    for (let i = 0; i < MAX_FIELD; i++) {
      const p   = fieldPlayers[i];
      const num = i + 3;
      lines.push(`*${num} - MENSAL* - ${p ? `✅ ${p.players.name}` : ``}`);
    }

    // Lista de espera
    if (waiting.length > 0) {
      lines.push(``);
      lines.push(`⏳ *LISTA DE ESPERA:*`);
      waiting.forEach((r: any, i: number) => {
        lines.push(`${i + 1}. ${r.players?.name || 'Desconhecido'}`);
      });
    }

    lines.push(``);
    lines.push(`_Gerado pelo FutClebs_ 🤖`);

    const message = lines.join('\n');

    // 5. Envia via Evolution API
    let sendResult: any = null;
    let sendOk = false;

    const evolutionEndpoint = `${config.evolution_api_url}/message/sendText/${config.instance_name}`;
    console.log('📲 Enviando para:', evolutionEndpoint, '→ JID:', config.group_jid);

    try {
      const sendResponse = await fetch(evolutionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.evolution_api_key,
        },
        body: JSON.stringify({
          number: config.group_jid,
          text: message,
          delay: 0,
          linkPreview: false,
        }),
      });

      const rawText = await sendResponse.text();
      console.log('📡 Evolution status:', sendResponse.status, '| body:', rawText.slice(0, 300));

      try { sendResult = JSON.parse(rawText); }
      catch { sendResult = { raw: rawText }; }

      sendOk = sendResponse.ok;
    } catch (fetchErr: any) {
      sendResult = { error: fetchErr.message };
      console.error('❌ Erro ao conectar Evolution API:', fetchErr.message);
    }

    // 6. Loga o envio
    await supabase.from('whatsapp_sends_log').insert({
      match_id:        match?.id ?? null,
      sent_at:         new Date().toISOString(),
      status:          sendOk ? 'success' : 'error',
      response:        JSON.stringify(sendResult).slice(0, 500),
      message_preview: message.slice(0, 200),
      triggered_by:    triggeredBy,
    });

    if (!sendOk) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Evolution API retornou erro.',
          evolution_endpoint: evolutionEndpoint,
          evolution_jid: config.group_jid,
          evolution_instance: config.instance_name,
          detail: sendResult,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        match_id:          match?.id ?? null,
        match_date:        match?.match_date ?? null,
        players_confirmed: confirmed.length,
        triggered_by:      triggeredBy,
        result:            sendResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('💥 Erro geral:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

