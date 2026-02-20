import React, { useEffect, useState } from 'react';
import { api } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  isAdmin: boolean;
}

export const VotingStatusModal: React.FC<Props> = ({ isOpen, onClose, matchId }) => {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !matchId) return;
      const { data } = await api.get(`/matches/${matchId}/players`);
      setPlayers(data || []);
    };
    load();
  }, [isOpen, matchId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-white font-bold">Status de votação</h2>
        <p className="text-slate-400 text-sm mb-3">Participantes: {players.length}</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded">Fechar</button>
      </div>
    </div>
  );
};
