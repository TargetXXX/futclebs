import React, { useEffect, useState } from 'react';
import { api } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  onRefresh: () => void;
}

export const AdminMatchManagementModal: React.FC<Props> = ({ isOpen, onClose, matchId, onRefresh }) => {
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
    <div className="fixed inset-0 z-[140] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-white font-bold mb-3">Gerenciar inscritos</h2>
        <div className="space-y-2 max-h-80 overflow-auto">
          {players.map((p) => (
            <div key={p.id} className="flex justify-between bg-slate-800 rounded p-2 text-white text-sm">
              <span>{p.name}</span>
              <button
                onClick={async () => {
                  await api.delete(`/matches/${matchId}/players/${p.id}`);
                  const { data } = await api.get(`/matches/${matchId}/players`);
                  setPlayers(data || []);
                  onRefresh();
                }}
                className="text-red-400"
              >
                remover
              </button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 rounded">Fechar</button>
      </div>
    </div>
  );
};
