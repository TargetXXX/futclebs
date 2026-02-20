import React, { useEffect, useState } from 'react';
import { api } from '@/services/axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export const MatchSummaryModal: React.FC<Props> = ({ isOpen, onClose, matchId }) => {
  const [match, setMatch] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !matchId) return;
      const { data } = await api.get(`/matches/${matchId}`);
      setMatch(data?.data || data);
    };
    load();
  }, [isOpen, matchId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-white font-bold">Resumo da Partida</h2>
        <p className="text-slate-400 mt-3">{match?.name || 'Partida'}</p>
        <p className="text-slate-400">Status: {match?.status || '-'}</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 rounded">Fechar</button>
      </div>
    </div>
  );
};
