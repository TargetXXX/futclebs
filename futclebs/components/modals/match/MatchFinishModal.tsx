import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  onRefresh: () => void;
  onOpenVotingStatus?: () => void;
}

interface MatchPlayer {
  id: number;
  name: string;
  team: number;
}

export const MatchFinishModal: React.FC<Props> = ({ isOpen, onClose, matchId, onRefresh, onOpenVotingStatus }) => {
  const [goalsA, setGoalsA] = useState(0);
  const [goalsB, setGoalsB] = useState(0);
  const [assignStats, setAssignStats] = useState(false);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [scorers, setScorers] = useState<Record<number, number>>({});
  const [assists, setAssists] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlayers = async () => {
      if (!isOpen || !matchId) return;

      const { data } = await api.get(`/matches/${matchId}/players`);
      const mapped = (data || []).map((item: any) => ({
        id: Number(item.id),
        name: item.name,
        team: Number(item?.pivot?.team ?? item.team ?? 1),
      }));
      setPlayers(mapped);
      setScorers({});
      setAssists({});
      setAssignStats(false);
      setGoalsA(0);
      setGoalsB(0);
      setError(null);
    };

    loadPlayers();
  }, [isOpen, matchId]);

  const teamAPlayers = useMemo(() => players.filter((player) => player.team === 1), [players]);
  const teamBPlayers = useMemo(() => players.filter((player) => player.team === 2), [players]);

  const scorersA = teamAPlayers.reduce((acc, p) => acc + (scorers[p.id] || 0), 0);
  const scorersB = teamBPlayers.reduce((acc, p) => acc + (scorers[p.id] || 0), 0);
  const assistsA = teamAPlayers.reduce((acc, p) => acc + (assists[p.id] || 0), 0);
  const assistsB = teamBPlayers.reduce((acc, p) => acc + (assists[p.id] || 0), 0);

  const isInvalidStats = assignStats && (scorersA !== goalsA || scorersB !== goalsB || assistsA > goalsA || assistsB > goalsB);

  const buildPayload = () => {
    const scorersPayload = Object.entries(scorers)
      .filter(([, goals]) => goals > 0)
      .map(([playerId, goals]) => {
        const player = players.find((p) => p.id === Number(playerId));
        return {
          player_id: Number(playerId),
          team: player?.team === 2 ? 'B' : 'A',
          goals,
        };
      });

    const assistsPayload = Object.entries(assists)
      .filter(([, total]) => total > 0)
      .map(([playerId, total]) => {
        const player = players.find((p) => p.id === Number(playerId));
        return {
          player_id: Number(playerId),
          team: player?.team === 2 ? 'B' : 'A',
          assists: total,
        };
      });

    return {
      goals_team_a: goalsA,
      goals_team_b: goalsB,
      players_team_a: teamAPlayers.map((p) => p.id),
      players_team_b: teamBPlayers.map((p) => p.id),
      ...(assignStats ? { scorers: scorersPayload, assists: assistsPayload } : {}),
    };
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    if (assignStats && isInvalidStats) {
      setLoading(false);
      setError('A soma de gols deve bater com o placar de cada time e assistências não podem ultrapassar os gols.');
      return;
    }

    try {
      await api.post(`/matches/${matchId}/result`, buildPayload());
      onRefresh();
      onClose();
      onOpenVotingStatus?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao finalizar partida');
    } finally {
      setLoading(false);
    }
  };

  const updateCounter = (
    setter: React.Dispatch<React.SetStateAction<Record<number, number>>>,
    playerId: number,
    value: number
  ) => {
    setter((current) => ({ ...current, [playerId]: Math.max(0, value) }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl space-y-4">
        <h2 className="text-white font-bold">Encerrar Partida</h2>

        <div className="grid grid-cols-2 gap-3">
          <input type="number" min={0} value={goalsA} onChange={(e) => setGoalsA(Number(e.target.value))} className="w-full bg-slate-800 p-2 rounded" placeholder="Gols Time A" />
          <input type="number" min={0} value={goalsB} onChange={(e) => setGoalsB(Number(e.target.value))} className="w-full bg-slate-800 p-2 rounded" placeholder="Gols Time B" />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={assignStats} onChange={(e) => setAssignStats(e.target.checked)} />
          Atribuir gols e assistências agora
        </label>

        {assignStats && (
          <div className="grid md:grid-cols-2 gap-4">
            {[{ title: 'Time A', list: teamAPlayers }, { title: 'Time B', list: teamBPlayers }].map((section) => (
              <div key={section.title} className="rounded-xl border border-slate-700 p-3 space-y-2">
                <p className="text-white font-semibold">{section.title}</p>
                {section.list.length === 0 && <p className="text-xs text-slate-400">Sem jogadores neste time.</p>}
                {section.list.map((player) => (
                  <div key={player.id} className="grid grid-cols-[1fr_64px_64px] items-center gap-2 text-xs">
                    <span className="text-slate-200 truncate">{player.name}</span>
                    <input
                      type="number"
                      min={0}
                      value={scorers[player.id] || 0}
                      onChange={(e) => updateCounter(setScorers, player.id, Number(e.target.value))}
                      className="bg-slate-800 rounded px-2 py-1"
                      title="Gols"
                    />
                    <input
                      type="number"
                      min={0}
                      value={assists[player.id] || 0}
                      onChange={(e) => updateCounter(setAssists, player.id, Number(e.target.value))}
                      className="bg-slate-800 rounded px-2 py-1"
                      title="Assistências"
                    />
                  </div>
                ))}
              </div>
            ))}

            <div className="md:col-span-2 text-xs text-slate-300">
              <p>Time A: gols atribuídos <strong>{scorersA}</strong> / placar <strong>{goalsA}</strong> • assistências <strong>{assistsA}</strong></p>
              <p>Time B: gols atribuídos <strong>{scorersB}</strong> / placar <strong>{goalsB}</strong> • assistências <strong>{assistsB}</strong></p>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-2">
          <button onClick={handleFinish} disabled={loading} className="px-4 py-2 bg-emerald-600 rounded">
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded">Cancelar</button>
        </div>
      </div>
    </div>
  );
};
