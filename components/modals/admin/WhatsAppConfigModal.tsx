import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { OrganizationRequiredModal } from '../shared/OrganizationRequiredModal';

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

interface WhatsAppGroup {
  id?: string;
  name: string;
  group_jid: string;
  send_monday: boolean;
  send_tuesday: boolean;
  send_wednesday: boolean;
  send_thursday: boolean;
  send_friday: boolean;
  is_active: boolean;
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
  organizationId: string | null;
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

const emptyGroup: WhatsAppGroup = {
  name: '',
  group_jid: '',
  send_monday: false,
  send_tuesday: false,
  send_wednesday: false,
  send_thursday: false,
  send_friday: false,
  is_active: true,
};

const DAYS = [
  { field: 'send_monday',    label: 'Seg' },
  { field: 'send_tuesday',   label: 'Ter' },
  { field: 'send_wednesday', label: 'Qua' },
  { field: 'send_thursday',  label: 'Qui' },
  { field: 'send_friday',    label: 'Sex' },
];

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({ isOpen, onClose, isSuperAdmin, organizationId }) => {
  const [config, setConfig] = useState<WhatsAppConfig>(emptyConfig);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null); // group id ou 'all'
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'groups' | 'logs'>('config');

  useEffect(() => {
    if (isOpen && organizationId) { loadAll(); setMessage(null); }
  }, [isOpen, organizationId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: cfg }, { data: grps }, { data: lgLogs }] = await Promise.all([
        supabase.from('whatsapp_config').select('*').eq('organization_id', organizationId).limit(1).single(),
        supabase.from('whatsapp_groups').select('*').eq('organization_id', organizationId).order('created_at'),
        supabase.from('whatsapp_sends_log').select('*').eq('organization_id', organizationId).order('sent_at', { ascending: false }).limit(10),
      ]);
      if (cfg) setConfig(cfg);
      setGroups(grps || []);
      setLogs(lgLogs || []);
    } catch (err: any) {
      if (err?.message?.includes('does not exist')) {
        setMessage({ type: 'error', text: '❌ Execute o SQL database/whatsapp_setup.sql e database/whatsapp_groups.sql no Supabase primeiro.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (config.id) {
        const { error } = await supabase.from('whatsapp_config').update({
          is_active: config.is_active,
          evolution_api_url: config.evolution_api_url.trim().replace(/\/$/, ''),
          evolution_api_key: config.evolution_api_key.trim(),
          instance_name: config.instance_name.trim(),
          organization_id: organizationId,
          updated_at: new Date().toISOString(),
        }).eq('id', config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('whatsapp_config').insert({
          is_active: config.is_active,
          evolution_api_url: config.evolution_api_url.trim().replace(/\/$/, ''),
          evolution_api_key: config.evolution_api_key.trim(),
          instance_name: config.instance_name.trim(),
          organization_id: organizationId,
        }).select().single();
        if (error) throw error;
        if (data) setConfig(data);
      }
      setMessage({ type: 'success', text: '✅ Configuração salva!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroup = async (g: WhatsAppGroup) => {
    setSaving(true);
    setMessage(null);
    try {
      if (g.id) {
        const { error } = await supabase.from('whatsapp_groups').update({
          name: g.name.trim(),
          group_jid: g.group_jid.trim(),
          send_monday: g.send_monday,
          send_tuesday: g.send_tuesday,
          send_wednesday: g.send_wednesday,
          send_thursday: g.send_thursday,
          send_friday: g.send_friday,
          is_active: g.is_active,
          organization_id: organizationId,
        }).eq('id', g.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('whatsapp_groups').insert({
          name: g.name.trim(),
          group_jid: g.group_jid.trim(),
          send_monday: g.send_monday,
          send_tuesday: g.send_tuesday,
          send_wednesday: g.send_wednesday,
          send_thursday: g.send_thursday,
          send_friday: g.send_friday,
          is_active: g.is_active,
          organization_id: organizationId,
        });
        if (error) throw error;
      }
      setMessage({ type: 'success', text: '✅ Grupo salvo!' });
      setEditingGroup(null);
      await loadAll();
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Remover este grupo?')) return;
    await supabase.from('whatsapp_groups').delete().eq('id', id);
    await loadAll();
  };

  const handleTest = async (groupId?: string) => {
    const key = groupId ?? 'all';
    setTesting(key);
    setMessage(null);
    try {
      const body: any = { manual: true, organization_id: organizationId };
      if (groupId) body.group_id = groupId;

      const { data, error } = await supabase.functions.invoke('send-match-list', { body });
      if (error) throw new Error(error.message || 'Erro ao chamar a função');

      const sent = data?.groups_sent ?? 0;
      setMessage({ type: 'success', text: `✅ Enviado para ${sent} grupo(s)! ${data?.players_confirmed ?? 0} confirmado(s)` });
      await loadAll();
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setTesting(null);
    }
  };

  const setC = (field: keyof WhatsAppConfig, value: any) =>
    setConfig(prev => ({ ...prev, [field]: value }));

  const setG = (field: keyof WhatsAppGroup, value: any) =>
    setEditingGroup(prev => prev ? { ...prev, [field]: value } : prev);

  const formatLogDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (!isOpen || !isSuperAdmin) return null;

  if (!organizationId) {
    return (
      <OrganizationRequiredModal
        message="Selecione uma organização para configurar o WhatsApp."
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full h-full sm:h-auto sm:max-w-lg bg-slate-950 sm:bg-slate-900 border-none sm:border sm:border-slate-800 sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen sm:max-h-[90vh] shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Envio Automático</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          {(['config', 'groups', 'logs'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-white border-b-2 border-green-500' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab === 'config' ? '⚙️ API' : tab === 'groups' ? '👥 Grupos' : '📋 Logs'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <div className="w-6 h-6 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-xs font-black uppercase">Carregando...</p>
            </div>
          ) : activeTab === 'config' ? (
            <div className="p-6 space-y-5">
              {/* Toggle ativo */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${config.is_active ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/30 border-slate-700/30'}`}>
                <div>
                  <p className="text-white font-black text-sm">Envio Automático</p>
                  <p className="text-slate-400 text-xs mt-0.5">{config.is_active ? 'Ativo' : 'Inativo'}</p>
                </div>
                <button onClick={() => setC('is_active', !config.is_active)}
                  className={`relative w-12 h-6 rounded-full transition-all ${config.is_active ? 'bg-green-500' : 'bg-slate-700'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.is_active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">URL da Evolution API *</label>
                <input type="url" placeholder="http://34.45.206.149:8080" value={config.evolution_api_url}
                  onChange={e => setC('evolution_api_url', e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all placeholder:text-slate-600" />
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">API Key *</label>
                <div className="relative">
                  <input type={showKey ? 'text' : 'password'} placeholder="Sua chave" value={config.evolution_api_key}
                    onChange={e => setC('evolution_api_key', e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all placeholder:text-slate-600" />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showKey ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Instância */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome da Instância *</label>
                <input type="text" placeholder="futclebs" value={config.instance_name}
                  onChange={e => setC('instance_name', e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all placeholder:text-slate-600" />
              </div>

              {/* Feedback */}
              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => handleTest()} disabled={testing !== null}
                  className="flex-1 py-3 rounded-2xl bg-green-600/10 border border-green-500/30 hover:bg-green-600/20 disabled:opacity-40 text-green-400 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  {testing === 'all' ? <><div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />Enviando...</> : <>📲 Enviar para Todos</>}
                </button>
                <button onClick={handleSaveConfig} disabled={saving || testing !== null}
                  className="flex-1 py-3 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-40 text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20">
                  {saving ? <><div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />Salvando...</> : <>💾 Salvar</>}
                </button>
              </div>
            </div>

          ) : activeTab === 'groups' ? (
            <div className="p-6 space-y-4">
              {/* Form edição/criação */}
              {editingGroup ? (
                <div className="p-4 rounded-2xl border border-green-500/30 bg-green-500/5 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-400">
                    {editingGroup.id ? 'Editar Grupo' : 'Novo Grupo'}
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Grupo</label>
                    <input type="text" placeholder="Ex: GALERA DO FUT - QUINTA" value={editingGroup.name}
                      onChange={e => setG('name', e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-slate-600" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">JID do Grupo</label>
                    <input type="text" placeholder="120363xxxxxxxxxx@g.us" value={editingGroup.group_jid}
                      onChange={e => setG('group_jid', e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-slate-600 font-mono text-xs" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dias de Envio</label>
                    <div className="flex gap-1.5">
                      {DAYS.map(({ field, label }) => (
                        <button key={field} onClick={() => setG(field as keyof WhatsAppGroup, !(editingGroup as any)[field])}
                          className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase border transition-all ${(editingGroup as any)[field] ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-500'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleSaveGroup(editingGroup)} disabled={saving}
                      className="flex-1 py-3 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-40 text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all">
                      {saving ? 'Salvando...' : '💾 Salvar'}
                    </button>
                    <button onClick={() => setEditingGroup(null)}
                      className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest transition-all">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditingGroup({ ...emptyGroup })}
                  className="w-full py-3 rounded-2xl border border-dashed border-green-500/30 text-green-400 hover:bg-green-500/5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  + Novo Grupo
                </button>
              )}

              {/* Lista de grupos */}
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 text-xs font-bold">Nenhum grupo cadastrado</p>
                  <p className="text-slate-700 text-[10px] mt-1">Execute database/whatsapp_groups.sql no Supabase</p>
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.id} className={`p-4 rounded-2xl border space-y-3 ${group.is_active ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-900/30 border-slate-800/30 opacity-50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-black text-sm truncate">{group.name || 'Sem nome'}</p>
                        <p className="text-slate-500 text-[10px] font-mono truncate mt-0.5">{group.group_jid || 'JID não configurado'}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleTest(group.id)} disabled={testing !== null || !group.group_jid}
                          className="p-2 bg-green-600/10 hover:bg-green-600/20 disabled:opacity-40 text-green-400 border border-green-500/30 rounded-xl transition-all"
                          title="Enviar agora">
                          {testing === group.id ? <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          )}
                        </button>
                        <button onClick={() => setEditingGroup({ ...group })}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 rounded-xl transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => group.id && handleDeleteGroup(group.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Dias */}
                    <div className="flex gap-1.5">
                      {DAYS.map(({ field, label }) => (
                        <span key={field} className={`flex-1 text-center text-[9px] font-black uppercase py-1 rounded-lg ${(group as any)[field] ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-600'}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Feedback */}
              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {message.text}
                </div>
              )}
            </div>

          ) : (
            /* Logs */
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
              <button onClick={loadAll} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-wider transition-all">
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

