import React, { useEffect, useState } from 'react';
import { api } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  isAdmin: boolean;
}

interface VoteStatusPlayer {
  id: number;
  name: string;
  votes_given: number;
  votes_missing: number;
}

export const VotingStatusModal: React.FC<Props> = ({ isOpen, onClose, matchId }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ players_count: number; is_fully_voted: boolean; players: VoteStatusPlayer[] } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !matchId) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/matches/${matchId}/votes/status`);
        setStatus(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, matchId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-white font-bold text-lg">Status de votação</h2>

        {loading && <p className="text-slate-400 text-sm">Carregando status...</p>}

        {!loading && status && (
          <>
            <p className="text-slate-400 text-sm">Participantes: {status.players_count}</p>
            <p className={`text-sm font-semibold ${status.is_fully_voted ? 'text-emerald-400' : 'text-amber-400'}`}>
              {status.is_fully_voted ? 'Votação concluída' : 'Ainda existem votos pendentes'}
            </p>

            <div className="max-h-72 overflow-auto space-y-2">
              {status.players.map((player) => (
                <div key={player.id} className="rounded-xl bg-slate-800/70 border border-slate-700/60 px-3 py-2 flex items-center justify-between">
                  <span className="text-white text-sm">{player.name}</span>
                  <span className="text-xs text-slate-300">
                    {player.votes_given} enviados • {player.votes_missing} faltando
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded">Fechar</button>
      </div>
    </div>
  );
};
