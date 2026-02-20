import React, { useEffect, useState } from 'react';
import { api, Player } from '@/services/axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const AdminUserManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
      const orgId = localStorage.getItem('orgId');
      if (!orgId) return;
      const { data } = await api.get(`/organizations/${orgId}/players`);
      setPlayers(data || []);
    };
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-white font-bold mb-3">Gerenciar Jogadores</h2>
        <div className="space-y-2 max-h-80 overflow-auto">
          {players.map((p) => (
            <div key={p.id} className="p-2 bg-slate-800 rounded text-white text-sm flex justify-between">
              <span>{p.name}</span>
              <button onClick={() => api.delete(`/players/${p.id}`)} className="text-red-400">Excluir</button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 rounded">Fechar</button>
      </div>
    </div>
  );
};
