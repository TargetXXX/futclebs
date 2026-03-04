import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { SUPER_ADMIN_IDS } from '@/constants/app.constants';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import { calculateByPosition } from '@/utils/overall.utils';
import { OrganizationRequiredModal } from '../shared/OrganizationRequiredModal';


interface Season {
  id: string;
  name: string;
  started_at: string;
  ended_at: string | null;
  created_by: string;
}

interface SeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  organizationId: string | null;
}

const toInputDate = (iso: string) => iso.slice(0, 10);

export const SeasonModal: React.FC<SeasonModalProps> = ({ isOpen, onClose, currentUserId, organizationId }) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState<Season | null>(null);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});

  // Edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');


  const isSuperAdmin = SUPER_ADMIN_IDS.includes(currentUserId);

  useEffect(() => {
    if (isOpen && isSuperAdmin && organizationId) {
      loadSeasons();
      setMessage(null);
      setNewSeasonName('');
      setNewStartDate('');
      setNewEndDate('');
      setEditingId(null);
    }
  }, [isOpen, isSuperAdmin, organizationId]);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('organization_id', organizationId)
        .order('started_at', { ascending: false });

      if (error) throw error;

      const list: Season[] = data || [];
      setSeasons(list);

      const now = new Date();
      // Ativa = sem ended_at OU ended_at ainda no futuro
      setActiveSeason(list.find(s => !s.ended_at || new Date(s.ended_at) > now) ?? null);

      // Contar partidas finalizadas em cada temporada
      const { data: matches } = await supabase
        .from('matches')
        .select('id, match_date')
        .eq('status', 'finished')
        .eq('organization_id', organizationId);

      if (matches) {
        const counts: Record<string, number> = {};
        for (const season of list) {
          const start = new Date(season.started_at);
          const end = season.ended_at ? new Date(season.ended_at) : new Date();
          counts[season.id] = matches.filter(m => {
            const d = new Date(m.match_date);
            return d >= start && d <= end;
          }).length;
        }
        setMatchCounts(counts);
      }
    } catch (err: any) {
      console.error('Erro ao carregar temporadas:', err);
      setMessage({ type: 'error', text: `❌ Tabela "seasons" não encontrada. Rode o SQL no Supabase primeiro.` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim() || !newStartDate) return;
    setConfirmCreate(false);
    setActionLoading(true);
    setMessage(null);
    try {
      const payload = {
        name: newSeasonName.trim(),
        started_at: new Date(newStartDate + 'T12:00:00').toISOString(),
        ended_at: newEndDate ? new Date(newEndDate + 'T12:00:00').toISOString() : null,
        created_by: currentUserId,
        organization_id: organizationId,
      };

      const { error, data } = await supabase.from('seasons').insert(payload).select();
      console.log('Season insert result:', { error, data });

      if (error) throw new Error(error.message);

      setMessage({ type: 'success', text: `✅ Temporada "${newSeasonName.trim()}" criada com sucesso!` });
      setNewSeasonName('');
      setNewStartDate('');
      setNewEndDate('');
      await loadSeasons();
    } catch (err: any) {
      console.error('Erro ao criar temporada:', err);
      setMessage({ type: 'error', text: `❌ Erro: ${err?.message || 'Tabela "seasons" não encontrada. Rode o SQL no Supabase.'}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndSeason = async () => {
    if (!activeSeason) return;
    setConfirmEnd(false);
    setActionLoading(true);
    setMessage(null);
    try {
      // 1. Buscar stats + dados dos jogadores para calcular overall
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, name, is_goalkeeper, positions, player_stats(*)');
      if (playersError) throw new Error(playersError.message);

      // 2. Salvar snapshot de cada jogador que tem stats
      const snapshots = (playersData || [])
        .filter((p: any) => p.player_stats && (Array.isArray(p.player_stats) ? p.player_stats[0] : p.player_stats))
        .map((p: any) => {
          const s = Array.isArray(p.player_stats) ? p.player_stats[0] : p.player_stats;
          const overall = calculateByPosition(p, s);
          return {
            season_id: activeSeason.id,
            season_name: activeSeason.name,
            player_id: p.id,
            player_name: p.name,
            overall,
            velocidade: s.velocidade,
            finalizacao: s.finalizacao,
            passe: s.passe,
            drible: s.drible,
            defesa: s.defesa,
            fisico: s.fisico,
            esportividade: s.esportividade,
            saved_at: new Date().toISOString(),
          };
        });

      if (snapshots.length > 0) {
        const { error: snapError } = await supabase
          .from('season_stats_snapshots')
          .insert(snapshots);
        if (snapError) throw new Error(`Erro ao salvar histórico: ${snapError.message}`);
      }

      // 3. Resetar player_stats de todos
      const { error: resetError } = await supabase
        .from('player_stats')
        .delete()
        .neq('player_id', '00000000-0000-0000-0000-000000000000');
      if (resetError) throw new Error(`Erro ao resetar stats: ${resetError.message}`);

      // 4. Marcar temporada como encerrada
      const { error: endError } = await supabase
        .from('seasons')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', activeSeason.id);
      if (endError) throw new Error(endError.message);

      setMessage({
        type: 'success',
        text: `✅ Temporada "${activeSeason.name}" encerrada! Histórico de ${snapshots.length} jogador(es) salvo. Overalls resetados.`,
      });
      await loadSeasons();
    } catch (err: any) {
      console.error('Erro ao encerrar temporada:', err);
      setMessage({ type: 'error', text: `❌ Erro: ${err?.message || 'Verifique o console.'}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEdit = (season: Season) => {
    setEditingId(season.id);
    setEditName(season.name);
    setEditStart(toInputDate(season.started_at));
    setEditEnd(season.ended_at ? toInputDate(season.ended_at) : '');
    setMessage(null);
  };

  const handleCancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (seasonId: string) => {
    if (!editName.trim() || !editStart) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('seasons')
        .update({
          name: editName.trim(),
          started_at: new Date(editStart + 'T12:00:00').toISOString(),
          ended_at: editEnd ? new Date(editEnd + 'T12:00:00').toISOString() : null,
        })
        .eq('id', seasonId);

      if (error) throw new Error(error.message);

      setEditingId(null);
      setMessage({ type: 'success', text: '✅ Temporada atualizada com sucesso!' });
      await loadSeasons();
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ Erro: ${err?.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.from('seasons').delete().eq('id', seasonId);
      if (error) throw new Error(error.message);
      setMessage({ type: 'success', text: '✅ Temporada removida.' });
      await loadSeasons();
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ Erro: ${err?.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenSeason = async () => {
    if (!confirmReopen) return;
    setActionLoading(true);
    setMessage(null);
    const season = confirmReopen;
    setConfirmReopen(null);
    try {
      // 1. Buscar snapshots desta temporada
      const { data: snapshots, error: snapError } = await supabase
        .from('season_stats_snapshots')
        .select('*')
        .eq('season_id', season.id);
      if (snapError) throw new Error(snapError.message);

      // 2. Restaurar player_stats de cada jogador pelo snapshot
      if (snapshots && snapshots.length > 0) {
        for (const snap of snapshots) {
          await supabase.from('player_stats').upsert({
            player_id: snap.player_id,
            velocidade:    snap.velocidade,
            finalizacao:   snap.finalizacao,
            passe:         snap.passe,
            drible:        snap.drible,
            defesa:        snap.defesa,
            fisico:        snap.fisico,
            esportividade: snap.esportividade,
          }, { onConflict: 'player_id' });
        }
      }

      // 3. Reabrir a temporada
      const { error } = await supabase
        .from('seasons')
        .update({ ended_at: null })
        .eq('id', season.id);
      if (error) throw new Error(error.message);

      setMessage({
        type: 'success',
        text: `✅ Temporada "${season.name}" reaberta! Overall de ${snapshots?.length ?? 0} jogador(es) restaurado.`,
      });
      await loadSeasons();
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ Erro: ${err?.message}` });
    } finally {
      setActionLoading(false);
    }
  };


  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const suggestName = () => {
    const now = new Date();
    const month = now.toLocaleString('pt-BR', { month: 'long' });
    const year = now.getFullYear();
    setNewSeasonName(`Temporada ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`);
  };

  const canCreate = newSeasonName.trim() && newStartDate;

  if (!isOpen || !isSuperAdmin) return null;

  if (!organizationId) {
    return (
      <OrganizationRequiredModal
        message="Selecione uma organização para gerenciar temporadas."
        onClose={onClose}
      />
    );
  }

  // Todas as temporadas (ativas e encerradas) no histórico
  const allSeasons = seasons;

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="w-full h-full sm:h-auto sm:max-w-lg bg-slate-950 sm:bg-slate-900 border-none sm:border sm:border-slate-800 sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen sm:max-h-[90vh] shadow-2xl">

          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Temporadas</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão de Ciclos • Histórico por Jogador</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Temporada Ativa */}
            <div className={`rounded-2xl border p-4 ${activeSeason ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/30 border-slate-700/30'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Temporada Atual</p>
              {activeSeason ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">{activeSeason.name}</p>
                    <p className="text-emerald-500 text-xs font-bold mt-0.5">
                      {formatDate(activeSeason.started_at)} → {activeSeason.ended_at ? formatDate(activeSeason.ended_at) : 'em aberto'}
                    </p>
                    {activeSeason.ended_at && (
                      <p className="text-yellow-500 text-[10px] mt-0.5 font-bold">
                        ⏳ Encerra em {formatDate(activeSeason.ended_at)}
                      </p>
                    )}
                    <p className="text-slate-500 text-[10px] mt-1">
                      {matchCounts[activeSeason.id] ?? 0} partida(s) neste período
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-500 text-[10px] font-black uppercase">Ativa</span>
                    </div>
                    <button
                      onClick={() => setConfirmEnd(true)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      Encerrar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm font-bold">Nenhuma temporada ativa</p>
              )}
            </div>

            {/* Aviso informativo */}
            <div className="flex gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-300 text-xs leading-relaxed">
                Ao <span className="text-white font-bold">encerrar</span> uma temporada, o overall de cada jogador é <span className="text-white font-bold">salvo no histórico</span> e depois <span className="text-red-400 font-bold">resetado</span> para a próxima temporada começar do zero.
              </p>
            </div>

            {/* Criar nova temporada */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Temporada</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Temporada Março 2026"
                  value={newSeasonName}
                  onChange={e => setNewSeasonName(e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                />
                <button onClick={suggestName} className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl transition-all text-xs font-black" title="Sugerir nome">✨</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data início *</p>
                  <input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data fim (opcional)</p>
                  <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} min={newStartDate} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                </div>
              </div>
              <button
                onClick={() => { if (canCreate) setConfirmCreate(true); }}
                disabled={!canCreate || actionLoading}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Criar Temporada
                  </>
                )}
              </button>
            </div>

            {/* Feedback */}
            {message && (
              <div className={`p-4 rounded-2xl text-sm font-bold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {message.text}
              </div>
            )}

            {/* Todas as temporadas */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Todas as Temporadas</p>
              {loading ? (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <div className="w-6 h-6 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-slate-500 text-xs font-black uppercase">Carregando...</p>
                </div>
              ) : allSeasons.length === 0 ? (
                <p className="text-slate-600 text-xs font-bold text-center py-4">Nenhuma temporada criada ainda</p>
              ) : (
                <div className="space-y-2">
                  {allSeasons.map(season => (
                    <div key={season.id} className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                      {editingId === season.id ? (
                        // Modo edição inline
                        <div className="p-3 space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-500 font-black uppercase">Início</p>
                              <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-500 font-black uppercase">Fim (opcional)</p>
                              <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} min={editStart} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(season.id)} disabled={!editName.trim() || !editStart || actionLoading} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50">
                              {actionLoading ? '⏳' : '✓ Salvar'}
                            </button>
                            <button onClick={handleCancelEdit} className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-black text-[10px] uppercase tracking-wider transition-all">
                              Cancelar
                            </button>
                            <button onClick={() => handleDeleteSeason(season.id)} disabled={actionLoading} className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-black text-[10px] uppercase transition-all disabled:opacity-50" title="Excluir temporada">
                              🗑
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Modo visualização
                        <div className="flex items-center justify-between p-3 gap-2">
                          <div>
                            <p className="text-white font-bold text-xs">{season.name}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">
                              {formatDate(season.started_at)} → {season.ended_at ? formatDate(season.ended_at) : <span className="text-emerald-400">em aberto</span>}
                            </p>
                            <p className="text-slate-600 text-[10px]">{matchCounts[season.id] ?? 0} partida(s)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const isActive = !season.ended_at || new Date(season.ended_at) > new Date();
                              return (
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                  {isActive ? 'Ativa' : 'Encerrada'}
                                </span>
                              );
                            })()}
                            {/* Botão reabrir — só para temporadas encerradas (ended_at no passado) */}
                            {season.ended_at && new Date(season.ended_at) <= new Date() && (
                              <button
                                onClick={() => setConfirmReopen(season)}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-400 transition-all"
                                title="Reabrir temporada"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                            <button onClick={() => handleStartEdit(season)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all" title="Editar">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800">
            <button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
              Fechar
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmCreate}
        onClose={() => setConfirmCreate(false)}
        onConfirm={handleCreateSeason}
        isLoading={actionLoading}
        zIndex={300}
        title="Criar Temporada?"
        description={`A temporada "${newSeasonName}" será criada com início em ${newStartDate ? new Date(newStartDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''}${newEndDate ? ` e fim em ${new Date(newEndDate + 'T12:00:00').toLocaleDateString('pt-BR')}` : ' (sem data de fim definida)'}. Nenhum overall será alterado.`}
        confirmLabel="Sim, Criar"
        cancelLabel="Cancelar"
      />

      <ConfirmationModal
        isOpen={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        onConfirm={handleEndSeason}
        isLoading={actionLoading}
        zIndex={300}
        title="Encerrar Temporada?"
        description={`O overall atual de TODOS os jogadores será salvo no histórico e depois RESETADO. A temporada "${activeSeason?.name}" será encerrada. Essa ação não pode ser desfeita.`}
        confirmLabel="Sim, Salvar e Resetar"
        cancelLabel="Cancelar"
      />
      <ConfirmationModal
        isOpen={!!confirmReopen}
        onClose={() => setConfirmReopen(null)}
        onConfirm={handleReopenSeason}
        isLoading={actionLoading}
        zIndex={300}
        title="Reabrir Temporada?"
        description={`A temporada "${confirmReopen?.name}" será reaberta e o overall de todos os jogadores será RESTAURADO ao estado salvo no snapshot desta temporada.`}
        confirmLabel="Sim, Reabrir e Restaurar"
        cancelLabel="Cancelar"
      />
    </>
  );
};
