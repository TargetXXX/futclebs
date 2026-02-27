import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { ConfirmationModal } from '../shared/ConfirmationModal';

interface VotingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  isAdmin: boolean;
}

interface PlayerVotingStatus {
  id: string;
  name: string;
  is_goalkeeper: boolean;
  team: 'A' | 'B' | null;
  totalTeammates: number;
  votedCount: number;
  missingVotes: string[];
  hasCompleted: boolean;
}

export const VotingStatusModal: React.FC<VotingStatusModalProps> = ({ isOpen, onClose, matchId, isAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<PlayerVotingStatus[]>([]);
  const [matchDate, setMatchDate] = useState('');
  const [completingVoteId, setCompletingVoteId] = useState<string | null>(null);
  const [resettingPlayerId, setResettingPlayerId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState<{ open: boolean; playerId: string | null }>({ open: false, playerId: null });
  const [confirmReset, setConfirmReset] = useState<{ open: boolean; playerId: string | null }>({ open: false, playerId: null });

  useEffect(() => {
    if (!isOpen) {
      setPlayers([]);
      setMatchDate('');
      setLoading(false);
      return;
    }
    if (matchId && isAdmin) loadVotingStatus();
  }, [isOpen, matchId, isAdmin]);

  const formatDate = (date: string) =>
    new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleForceCompleteVote = (playerId: string) => setConfirmFinish({ open: true, playerId });

  const handleConfirmFinish = async () => {
    const playerId = confirmFinish.playerId;
    if (!playerId) return;
    setConfirmFinish({ open: false, playerId: null });
    setCompletingVoteId(playerId);
    try {
      const player = players.find(p => p.id === playerId);
      if (!player?.missingVotes?.length) return;

      const votesToInsert = player.missingVotes.map(targetId => ({
        match_id: matchId,
        voter_id: playerId,
        target_player_id: targetId,
        velocidade: 3, finalizacao: 3, passe: 3, drible: 3, defesa: 3, fisico: 3, esportividade: 5
      }));

      const { error } = await supabase.from('player_votes').insert(votesToInsert);
      if (error) throw error;
      await loadVotingStatus();
    } catch (err) {
      console.error('Erro ao completar votação:', err);
      alert('Erro ao completar votação. Verifique o console.');
    } finally {
      setCompletingVoteId(null);
    }
  };

  const handleResetPlayerVotes = (playerId: string) => {
    if (!isAdmin) return;
    setConfirmReset({ open: true, playerId });
  };

  const handleConfirmReset = async () => {
    const playerId = confirmReset.playerId;
    if (!playerId) return;
    setConfirmReset({ open: false, playerId: null });
    setResettingPlayerId(playerId);
    try {
      const { error } = await supabase
        .from('player_votes')
        .delete()
        .eq('match_id', matchId)
        .eq('voter_id', playerId);
      if (error) throw error;
      await loadVotingStatus();
    } catch (err: any) {
      console.error('Erro ao resetar votos:', err);
      alert(`❌ Erro ao resetar votos: ${err?.message || 'Verifique o console'}`);
    } finally {
      setResettingPlayerId(null);
    }
  };

  const loadVotingStatus = async () => {
    setLoading(true);
    try {
      const { data: match } = await supabase
        .from('matches')
        .select('match_date')
        .eq('id', matchId)
        .single();

      if (match) setMatchDate(match.match_date);

      const { data: matchResult } = await supabase
        .from('match_results')
        .select('players_team_a, players_team_b')
        .eq('match_id', matchId)
        .maybeSingle();

      if (!matchResult) { setPlayers([]); return; }

      const teamA: string[] = matchResult.players_team_a || [];
      const teamB: string[] = matchResult.players_team_b || [];
      const allPlayerIds = [...teamA, ...teamB];

      const { data: playersData } = await supabase
        .from('players')
        .select('id, name, is_goalkeeper')
        .in('id', allPlayerIds);

      if (!playersData) { setPlayers([]); return; }

      const existingPlayerIds = new Set(playersData.map(p => p.id));

      const { data: votes } = await supabase
        .from('player_votes')
        .select('voter_id, target_player_id')
        .eq('match_id', matchId);

      const statusList: PlayerVotingStatus[] = playersData.map(player => {
        const isTeamA = teamA.includes(player.id);
        const team = isTeamA ? 'A' : teamB.includes(player.id) ? 'B' : null;
        const teammates = isTeamA ? teamA : teamB;
        const teammatesIds = teammates.filter(id => id !== player.id && existingPlayerIds.has(id));
        const playerVotes = votes?.filter(v => v.voter_id === player.id && existingPlayerIds.has(v.target_player_id)) || [];
        const votedIds = new Set(playerVotes.map(v => v.target_player_id));
        const missingVotes = teammatesIds.filter(id => !votedIds.has(id));

        return {
          id: player.id,
          name: player.name,
          is_goalkeeper: player.is_goalkeeper,
          team,
          totalTeammates: teammatesIds.length,
          votedCount: playerVotes.length,
          missingVotes,
          hasCompleted: missingVotes.length === 0 && teammatesIds.length > 0
        };
      });

      statusList.sort((a, b) => {
        if (a.hasCompleted !== b.hasCompleted) return a.hasCompleted ? 1 : -1;
        if (a.team !== b.team) return (a.team || 'Z').localeCompare(b.team || 'Z');
        return a.name.localeCompare(b.name);
      });

      setPlayers(statusList);
    } catch (err) {
      console.error('Erro ao carregar status de votação:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (key: 'voted' | 'pending' | 'all') => {
    const voted = players.filter(p => p.hasCompleted).map(p => p.name);
    const pending = players.filter(p => !p.hasCompleted && p.totalTeammates > 0).map(p => p.name);
    const dateStr = matchDate ? formatDate(matchDate) : '';
    const footer = '\n\n_Gerado por FutClebs_';

    let text = '';
    if (key === 'voted') {
      text = `✅ *Já votaram*${dateStr ? ` — ${dateStr}` : ''} (${voted.length}):\n`;
      text += voted.length > 0 ? voted.map(n => `• ${n}`).join('\n') : 'Ninguém votou ainda.';
    } else if (key === 'pending') {
      text = `⚠️ *Falta votar*${dateStr ? ` — ${dateStr}` : ''} (${pending.length}):\n`;
      text += pending.length > 0 ? pending.map(n => `• ${n}`).join('\n') : '✅ Todos já votaram!';
    } else {
      text = `📊 *Status de Votação*${dateStr ? ` — ${dateStr}` : ''}\n\n`;
      text += voted.length > 0
        ? `✅ Já votaram (${voted.length}):\n${voted.map(n => `• ${n}`).join('\n')}`
        : '✅ Ninguém votou ainda.';
      text += '\n\n';
      text += pending.length > 0
        ? `⚠️ Falta votar (${pending.length}):\n${pending.map(n => `• ${n}`).join('\n')}`
        : '✅ Todos já votaram!';
    }

    navigator.clipboard.writeText(text + footer).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  if (!isOpen) return null;

  const completedCount = players.filter(p => p.hasCompleted).length;
  const totalPlayers = players.length;
  const completionPercent = totalPlayers > 0 ? Math.round((completedCount / totalPlayers) * 100) : 0;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-black text-white">Status de Votação</h2>
              <p className="text-slate-400 text-sm mt-1">
                {matchDate ? new Date(matchDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }) : 'Carregando...'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">Progresso de Votação</span>
              <span className="text-emerald-500">{completedCount}/{totalPlayers} completos ({completionPercent}%)</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {players.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={() => handleCopy('pending')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  copiedKey === 'pending'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {copiedKey === 'pending' ? '✓ Copiado!' : `Falta votar (${players.filter(p => !p.hasCompleted && p.totalTeammates > 0).length})`}
              </button>
              <button
                onClick={() => handleCopy('voted')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  copiedKey === 'voted'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {copiedKey === 'voted' ? '✓ Copiado!' : `Já votaram (${players.filter(p => p.hasCompleted).length})`}
              </button>
              <button
                onClick={() => handleCopy('all')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  copiedKey === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {copiedKey === 'all' ? '✓ Copiado!' : 'Copiar tudo'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 text-sm mt-4 font-bold">Carregando status...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">Nenhum dado de votação disponível</p>
            </div>
          ) : (
            players.map(player => (
              <div
                key={player.id}
                className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                  player.hasCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-orange-500/5 border-orange-500/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      player.team === 'A' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {player.team}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-sm truncate max-w-[150px] sm:max-w-none">{player.name}</h3>
                        {player.is_goalkeeper && (
                          <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[8px] font-black uppercase shrink-0">
                            GOL
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {player.hasCompleted ? (
                          <span className="text-emerald-500 font-bold">
                            ✓ Votação completa ({player.votedCount}/{player.totalTeammates})
                          </span>
                        ) : player.totalTeammates === 0 ? (
                          <span className="text-slate-500 font-bold">
                            Sem companheiros de time
                          </span>
                        ) : (
                          <span className="text-orange-500 font-bold">
                            ⚠ Faltam {player.missingVotes.length} voto(s) • {player.votedCount}/{player.totalTeammates}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <div className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase text-center shrink-0 ${
                      player.hasCompleted
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'bg-orange-500/20 text-orange-500'
                    }`}>
                      {player.hasCompleted ? 'Completo' : 'Pendente'}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      {!player.hasCompleted && player.totalTeammates > 0 && isAdmin && (
                        <button
                          onClick={() => handleForceCompleteVote(player.id)}
                          disabled={completingVoteId === player.id || resettingPlayerId === player.id}
                          className="px-3 py-1.5 rounded-lg font-black text-[10px] uppercase bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-1 sm:flex-none"
                          title="Finalizar votação com notas médias (3)"
                        >
                          {completingVoteId === player.id ? '⏳' : '✓ Finalizar'}
                        </button>
                      )}

                      {isAdmin && player.votedCount > 0 && (
                        <button
                          onClick={() => handleResetPlayerVotes(player.id)}
                          disabled={resettingPlayerId === player.id || completingVoteId === player.id}
                          className="px-3 py-1.5 rounded-lg font-black text-[10px] uppercase bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-1 sm:flex-none"
                          title="Resetar votos - jogador pode votar novamente"
                        >
                          {resettingPlayerId === player.id ? '⏳' : '🔄 Reset'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-sm uppercase transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

    <ConfirmationModal
      isOpen={confirmFinish.open}
      onClose={() => setConfirmFinish({ open: false, playerId: null })}
      onConfirm={handleConfirmFinish}
      isLoading={completingVoteId === confirmFinish.playerId}
      title="Finalizar Votação?"
      description={`Isso vai preencher os votos faltantes de ${players.find(p => p.id === confirmFinish.playerId)?.name ?? 'este jogador'} com notas médias (3). Essa ação não pode ser desfeita.`}
      confirmLabel="Sim, Finalizar"
      cancelLabel="Cancelar"
    />

    <ConfirmationModal
      isOpen={confirmReset.open}
      onClose={() => setConfirmReset({ open: false, playerId: null })}
      onConfirm={handleConfirmReset}
      isLoading={resettingPlayerId === confirmReset.playerId}
      title="Resetar Votos?"
      description={`Todos os votos feitos por ${players.find(p => p.id === confirmReset.playerId)?.name ?? 'este jogador'} nesta partida serão deletados. Ele poderá votar novamente do zero.`}
      confirmLabel="Sim, Resetar"
      cancelLabel="Cancelar"
    />
  </>
  );
};
