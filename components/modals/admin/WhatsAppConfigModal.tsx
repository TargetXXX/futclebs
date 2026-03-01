import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

interface WhatsAppConfig {
  id?: string;
  is_active: boolean;
  evolution_api_url: string;
  evolution_api_key: string;
  instance_name: string;
  group_jid: string;
  send_day_monday: boolean;
  send_day_thursday: boolean;
  send_hour: number;
}

interface WhatsAppLog {
  id: string;
  sent_at: string;
  status: string;
  message_preview: string;
  triggered_by: string;
  match_id: string | null;
}

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
}

const emptyConfig: WhatsAppConfig = {
  is_active: false,
  evolution_api_url: '',
  evolution_api_key: '',
  instance_name: '',
  group_jid: '',
  send_day_monday: true,
  send_day_thursday: true,
  send_hour: 8,
};

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({ isOpen, onClose, isSuperAdmin }) => {
  const [config, setConfig] = useState<WhatsAppConfig>(emptyConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      loadLogs();
      setMessage(null);
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setConfig(data);
    } catch (err: any) {
      if (err?.message?.includes('does not exist') || err?.message?.includes('relation')) {
        setMessage({ type: 'error', text: '❌ Tabela não encontrada. Execute o SQL do arquivo database/whatsapp_setup.sql no Supabase primeiro.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data } = await supabase
        .from('whatsapp_sends_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      setLogs(data || []);
    } catch { /* silencioso */ }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (config.id) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update({
            is_active: config.is_active,
            evolution_api_url: config.evolution_api_url.trim().replace(/\/$/, ''),
            evolution_api_key: config.evolution_api_key.trim(),
            instance_name: config.instance_name.trim(),
            group_jid: config.group_jid.trim(),
            send_day_monday: config.send_day_monday,
            send_day_thursday: config.send_day_thursday,
            send_hour: config.send_hour,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_config')
          .insert({
            is_active: config.is_active,
            evolution_api_url: config.evolution_api_url.trim().replace(/\/$/, ''),
            evolution_api_key: config.evolution_api_key.trim(),
            instance_name: config.instance_name.trim(),
            group_jid: config.group_jid.trim(),
            send_day_monday: config.send_day_monday,
            send_day_thursday: config.send_day_thursday,
            send_hour: config.send_hour,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setConfig(data);
      }
      setMessage({ type: 'success', text: '✅ Configuração salva com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ Erro ao salvar: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-match-list', {
        body: { manual: true },
      });

      if (error) throw new Error(error.message || 'Erro ao chamar a função');

      setMessage({
        type: 'success',
        text: `✅ Enviado! Partida ${data?.match_date ? new Date(data.match_date + 'T12:00:00').toLocaleDateString('pt-BR') : ''} · ${data?.players_confirmed ?? 0} confirmado(s)`,
      });
      await loadLogs();
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const set = (field: keyof WhatsAppConfig, value: any) =>
    setConfig(prev => ({ ...prev, [field]: value }));

  const formatLogDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  if (!isOpen || !isSuperAdmin) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full h-full sm:h-auto sm:max-w-lg bg-slate-950 sm:bg-slate-900 border-none sm:border sm:border-slate-800 sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen sm:max-h-[90vh] shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              📲 WhatsApp
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Configuração de Envio Automático
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          {(['config', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab === 'config' ? '⚙️ Configuração' : '📋 Histórico'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <div className="w-6 h-6 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-xs font-black uppercase">Carregando...</p>
            </div>
          ) : activeTab === 'config' ? (
            <div className="p-6 space-y-5">

              {/* Status ativo */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${config.is_active ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/30 border-slate-700/30'}`}>
                <div>
                  <p className="text-white font-black text-sm">Envio Automático</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {config.is_active ? 'Ativo — enviará nos dias configurados' : 'Inativo — não enviará automaticamente'}
                  </p>
                </div>
                <button
                  onClick={() => set('is_active', !config.is_active)}
                  className={`relative w-12 h-6 rounded-full transition-all ${config.is_active ? 'bg-green-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.is_active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Como obter os dados — tutorial */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Como configurar</p>
                <ol className="text-blue-300 text-xs space-y-1.5 leading-relaxed list-none">
                  <li><span className="text-white font-bold">1.</span> Instale a <span className="text-white font-bold">Evolution API</span> (Docker ou servidor)</li>
                  <li><span className="text-white font-bold">2.</span> Crie uma instância e conecte seu WhatsApp pelo QR Code</li>
                  <li><span className="text-white font-bold">3.</span> Pegue o <span className="text-white font-bold">JID do grupo</span>: no Evolution API Manager → instância → grupos</li>
                  <li><span className="text-white font-bold">4.</span> Preencha os campos abaixo e salve</li>
                  <li><span className="text-white font-bold">5.</span> Clique em <span className="text-white font-bold">Testar Envio</span> para validar</li>
                </ol>
              </div>

              {/* URL da API */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  URL da Evolution API *
                </label>
                <input
                  type="url"
                  placeholder="https://minha-evolution.com"
                  value={config.evolution_api_url}
                  onChange={e => set('evolution_api_url', e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  API Key *
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="Sua chave de autenticação"
                    value={config.evolution_api_key}
                    onChange={e => set('evolution_api_key', e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Nome da instância */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Nome da Instância *
                </label>
                <input
                  type="text"
                  placeholder="Ex: futclebs"
                  value={config.instance_name}
                  onChange={e => set('instance_name', e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* JID do grupo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  JID do Grupo WhatsApp *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5511999999999-1234567890@g.us"
                  value={config.group_jid}
                  onChange={e => set('group_jid', e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 font-mono text-xs"
                />
                <p className="text-slate-600 text-[10px]">
                  Encontre em: Evolution API → sua instância → Grupos
                </p>
              </div>

              {/* Dias de envio */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Dias de Envio Automático
                </label>
                <div className="flex gap-2">
                  {[
                    { field: 'send_day_monday', label: 'Segunda' },
                    { field: 'send_day_thursday', label: 'Quinta' },
                  ].map(({ field, label }) => (
                    <button
                      key={field}
                      onClick={() => set(field as keyof WhatsAppConfig, !config[field as keyof WhatsAppConfig])}
                      className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all ${(config[field as keyof WhatsAppConfig] as boolean) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-500'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horário */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Horário de Envio (BRT)
                </label>
                <select
                  value={config.send_hour}
                  onChange={e => set('send_hour', Number(e.target.value))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
                <p className="text-slate-600 text-[10px]">
                  ⚠️ O horário automático precisa ser ajustado manualmente no SQL do cron job
                </p>
              </div>

              {/* Feedback */}
              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {message.text}
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleTest}
                  disabled={testing || saving || !config.evolution_api_url}
                  className="flex-1 py-3 rounded-2xl bg-green-600/10 border border-green-500/30 hover:bg-green-600/20 disabled:opacity-40 disabled:cursor-not-allowed text-green-400 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <><div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />Enviando...</>
                  ) : (
                    <>📲 Testar Envio</>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || testing}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {saving ? (
                    <><div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />Salvando...</>
                  ) : (
                    <>💾 Salvar</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Aba de logs */
            <div className="p-6 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Últimos 10 envios</p>
              {logs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-600 text-xs font-bold">Nenhum envio registrado ainda</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`p-3 rounded-xl border space-y-1 ${log.status === 'success' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase ${log.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {log.status === 'success' ? '✅ Sucesso' : '❌ Erro'}
                      </span>
                      <span className="text-slate-500 text-[10px]">{formatLogDate(log.sent_at)}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{log.message_preview}</p>
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${log.triggered_by === 'cron' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                      {log.triggered_by === 'cron' ? '🤖 Automático' : '👆 Manual'}
                    </span>
                  </div>
                ))
              )}
              <button
                onClick={loadLogs}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-wider transition-all"
              >
                Atualizar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 shrink-0">
          <button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

