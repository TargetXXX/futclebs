import React, { useEffect, useState } from 'react';
import { api, PlayerStats } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats | null;
  playerName: string;
  playerId: string;
  isGoalkeeper: boolean;
  onViewMatchSummary: (mid: string) => void;
}

export const PlayerStatsModal: React.FC<Props> = ({ isOpen, onClose, stats, playerName }) => {
  const [matches, setMatches] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
      const orgId = localStorage.getItem('orgId');
      if (!orgId) return;
      const { data } = await api.get(`/organizations/${orgId}/tournaments`);
      const flat = (data?.data || data || []).flatMap((t: any) => t.matches || []);
      setMatches(flat);
    };
    load();
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 p-6">
        <h2 className="text-white font-bold">{playerName}</h2>
        <p className="text-emerald-400 font-black">OVR {stats?.overall || 0}</p>
        <p className="text-slate-400 mt-4 mb-2">Últimas partidas: {matches.length}</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded">Fechar</button>
      </div>
    </div>
  );
};
