import React, { useEffect, useState } from 'react';
import { api, PlayerStats } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId: string;
  onRefresh: () => void;
}

interface PlayerOption { id: number; name: string; }

export const PlayerVoteModal: React.FC<Props> = ({ isOpen, onClose, matchId, currentUserId, onRefresh }) => {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [targetPlayerId, setTargetPlayerId] = useState<number | null>(null);
  const [stats, setStats] = useState<Omit<PlayerStats,'player_id'|'overall'>>({
    velocidade: 5, finalizacao: 5, passe: 5, drible: 5, defesa: 5, esportividade: 5, fisico: 5,
  });
  const [error, setError] = useState<string | null>(null);
  const votablePlayers = players.filter((p) => String(p.id) !== String(currentUserId));

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
      const { data } = await api.get(`/matches/${matchId}/players`);
      setPlayers((data || []).map((p: any) => ({ id: p.id, name: p.name })));
    };
    load();
  }, [isOpen, matchId]);

  const submit = async () => {
    if (!targetPlayerId) return;
    setError(null);
    try {
      await api.post(`/matches/${matchId}/votes`, { target_player_id: targetPlayerId, ...stats });
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Não foi possível registrar seu voto.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
        <h2 className="text-white font-bold">Votar jogador</h2>
        <select className="w-full bg-slate-800 p-2 rounded" onChange={(e) => setTargetPlayerId(Number(e.target.value))}>
          <option value="">Selecione</option>
          {votablePlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {Object.keys(stats).map((k) => (
          <div key={k} className="flex items-center justify-between text-sm text-white">
            <span>{k}</span>
            <input type="number" min={0} max={10} value={(stats as any)[k]} onChange={(e) => setStats((s) => ({ ...s, [k]: Number(e.target.value) }))} className="w-20 bg-slate-800 rounded p-1" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <button onClick={submit} className="px-4 py-2 bg-emerald-600 rounded">Enviar voto</button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded">Cancelar</button>
        </div>
      </div>
    </div>
  );
};
