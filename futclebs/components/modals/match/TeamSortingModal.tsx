import React, { useEffect, useState } from 'react';
import { api } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  isAdmin: boolean;
}

export const TeamSortingModal: React.FC<Props> = ({ isOpen, onClose, matchId, isAdmin }) => {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !matchId) return;
      const { data } = await api.get(`/matches/${matchId}/players`);
      const payload = data?.data ?? data ?? [];
      setPlayers(payload);
    };
    load();
  }, [isOpen, matchId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-white font-bold">Escalação</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {players.map((p) => <div key={p.id} className="bg-slate-800 rounded p-2 text-white text-sm">{p.name}</div>)}
        </div>
        {isAdmin && (
          <button
            onClick={() => api.put(`/matches/${matchId}/result`, { players_team_a: [], players_team_b: [] })}
            className="mt-4 px-4 py-2 bg-emerald-600 rounded"
          >
            Salvar times
          </button>
        )}
        <button onClick={onClose} className="mt-4 ml-2 px-4 py-2 bg-slate-700 rounded">Fechar</button>
      </div>
    </div>
  );
};
