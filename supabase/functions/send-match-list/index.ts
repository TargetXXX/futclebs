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

    let isManual = false;
    let forceGroupId: string | null = null;
    try {
      const body = await req.json();
      isManual = body?.manual === true;
      forceGroupId = body?.group_id ?? null; // envia para grupo específico
    } catch { /* body vazio = cron */ }

    const triggeredBy = isManual ? 'manual' : 'cron';
    console.log('🚀 Iniciando envio. Manual:', isManual, '| GroupId:', forceGroupId);

    // 1. Busca configuração global do WhatsApp
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .single();

    console.log('📋 Config:', JSON.stringify({ found: !!config, url: config?.evolution_api_url, instance: config?.instance_name, hasKey: !!config?.evolution_api_key }));

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

    if (!config.evolution_api_url || !config.evolution_api_key || !config.instance_name) {
      return new Response(
        JSON.stringify({ error: 'Configuração incompleta. Preencha URL, API Key e Instância.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Data atual BRT (UTC-3)
    const nowBRT = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    const today = nowBRT.toISOString().split('T')[0];

    // Dia da semana em BRT (0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab)
    const dowBRT = nowBRT.getUTCDay();
    const dowMap: Record<number, string> = {
      0: 'send_sunday',
      1: 'send_monday',
      2: 'send_tuesday',
      3: 'send_wednesday',
      4: 'send_thursday',
      5: 'send_friday',
      6: 'send_saturday',
    };
    const todayField = dowMap[dowBRT];
    console.log('📅 Data BRT:', today, '| Dia:', dowBRT, '| Campo:', todayField);

    // 3. Busca grupos ativos para envio
    let groupsQuery = supabase.from('whatsapp_groups').select('*').eq('is_active', true);

    if (forceGroupId) {
      // Envio manual para grupo específico
      groupsQuery = groupsQuery.eq('id', forceGroupId);
    } else if (!isManual) {
      // Cron: só envia para grupos configurados para hoje
      groupsQuery = groupsQuery.eq(todayField, true);
    }
    // Manual sem group_id: envia para TODOS os grupos ativos

    const { data: groups, error: groupsError } = await groupsQuery;
    console.log('👥 Grupos:', groups?.length ?? 0, '| Erro:', groupsError?.message ?? 'nenhum');

    if (!groups || groups.length === 0) {
      return new Response(
        JSON.stringify({ error: isManual ? 'Nenhum grupo ativo encontrado.' : `Nenhum grupo configurado para envio hoje (${todayField}).` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Busca jogadores (da partida mais recente/aberta)
    const { data: matches } = await supabase
      .from('matches')
      .select('id, match_date, status')
      .in('status', ['open', 'in_progress'])
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .limit(1);

    let match: any = matches?.[0] ?? null;
    if (!match) {
      const { data: latest } = await supabase
        .from('matches')
        .select('id, match_date, status')
        .order('match_date', { ascending: false })
        .limit(1);
      match = latest?.[0] ?? null;
    }
    console.log('⚽ Partida:', match ? match.id : 'nenhuma');

    let registrations: any[] = [];
    if (match) {
      const { data: regs } = await supabase
        .from('match_players')
        .select('player_id, status, players(name, is_goalkeeper)')
        .eq('match_id', match.id)
        .order('created_at', { ascending: true });
      registrations = regs || [];
    }

    const confirmed   = registrations.filter((r: any) => r.status === 'confirmed');
    const waiting     = registrations.filter((r: any) => r.status === 'waiting');
    const goalkeepers  = confirmed.filter((r: any) => r.players?.is_goalkeeper === true);
    const fieldPlayers = confirmed.filter((r: any) => !r.players?.is_goalkeeper);

    // 5. Monta mensagem com data atual BRT
    const matchDateFormatted = nowBRT.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });

    const MAX_GOALKEEPERS = 2;
    const MAX_FIELD = 12;

    const buildMessage = (groupName: string) => {
      const lines: string[] = [];
      lines.push(`⚽ *LISTA FutClebs* ⚽`);
      lines.push(`📅 ${matchDateFormatted.charAt(0).toUpperCase() + matchDateFormatted.slice(1)}`);
      lines.push(``);

      for (let i = 0; i < MAX_GOALKEEPERS; i++) {
        const gk = goalkeepers[i];
        lines.push(`*${i + 1} - GOLEIRO* - ${gk ? `✅ ${gk.players.name}` : ``}`);
      }
      lines.push(``);

      for (let i = 0; i < MAX_FIELD; i++) {
        const p   = fieldPlayers[i];
        const num = i + 3;
        lines.push(`*${num} - MENSAL* - ${p ? `✅ ${p.players.name}` : ``}`);
      }

      if (waiting.length > 0) {
        lines.push(``);
        lines.push(`⏳ *LISTA DE ESPERA:*`);
        waiting.forEach((r: any, i: number) => {
          lines.push(`${i + 1}. ${r.players?.name || 'Desconhecido'}`);
        });
      }

      lines.push(``);
      lines.push(`_Gerado pelo FutClebs_ 🤖`);
      return lines.join('\n');
    };

    // 6. Envia para cada grupo
    const results: any[] = [];

    for (const group of groups) {
      if (!group.group_jid) {
        console.log(`⚠️ Grupo "${group.name}" sem JID — pulando`);
        results.push({ group: group.name, skipped: true, reason: 'JID não configurado' });
        continue;
      }

      const message = buildMessage(group.name);
      const evolutionEndpoint = `${config.evolution_api_url}/message/sendText/${config.instance_name}`;
      console.log(`📲 Enviando para "${group.name}" (${group.group_jid})`);

      let sendOk = false;
      let sendResult: any = null;

      try {
        const sendResponse = await fetch(evolutionEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.evolution_api_key,
          },
          body: JSON.stringify({
            number: group.group_jid,
            text: message,
            delay: 0,
            linkPreview: false,
          }),
        });

        const rawText = await sendResponse.text();
        console.log(`📡 "${group.name}" status:`, sendResponse.status, '|', rawText.slice(0, 150));

        try { sendResult = JSON.parse(rawText); }
        catch { sendResult = { raw: rawText }; }

        sendOk = sendResponse.ok;
      } catch (fetchErr: any) {
        sendResult = { error: fetchErr.message };
        console.error(`❌ Erro ao enviar para "${group.name}":`, fetchErr.message);
      }

      // Loga cada envio
      await supabase.from('whatsapp_sends_log').insert({
        match_id:        match?.id ?? null,
        sent_at:         new Date().toISOString(),
        status:          sendOk ? 'success' : 'error',
        response:        JSON.stringify(sendResult).slice(0, 500),
        message_preview: `[${group.name}] ${message.slice(0, 150)}`,
        triggered_by:    triggeredBy,
      });

      results.push({ group: group.name, jid: group.group_jid, success: sendOk, detail: sendResult });
    }

    const allOk = results.every(r => r.skipped || r.success);

    return new Response(
      JSON.stringify({
        success: allOk,
        groups_sent: results.length,
        players_confirmed: confirmed.length,
        triggered_by: triggeredBy,
        results,
      }),
      { status: allOk ? 200 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('💥 Erro geral:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
