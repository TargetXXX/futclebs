import React, { useState } from 'react';
import { api } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  onRefresh: () => void;
  onOpenVotingStatus?: () => void;
}

export const MatchFinishModal: React.FC<Props> = ({ isOpen, onClose, matchId, onRefresh, onOpenVotingStatus }) => {
  const [goalsA, setGoalsA] = useState(0);
  const [goalsB, setGoalsB] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/matches/${matchId}/result`, {
        goals_team_a: goalsA,
        goals_team_b: goalsB,
        players_team_a: [],
        players_team_b: [],
      });
      onRefresh();
      onClose();
      onOpenVotingStatus?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao finalizar partida');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[140] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-white font-bold">Encerrar Partida</h2>
        <div className="flex gap-3">
          <input type="number" value={goalsA} onChange={(e) => setGoalsA(Number(e.target.value))} className="w-full bg-slate-800 p-2 rounded" />
          <input type="number" value={goalsB} onChange={(e) => setGoalsB(Number(e.target.value))} className="w-full bg-slate-800 p-2 rounded" />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleFinish} disabled={loading} className="px-4 py-2 bg-emerald-600 rounded">{loading ? 'Salvando...' : 'Confirmar'}</button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded">Cancelar</button>
        </div>
      </div>
    </div>
  );
};
