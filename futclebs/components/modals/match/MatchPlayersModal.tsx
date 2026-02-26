import React, { useEffect, useState } from 'react';
import { api, PlayerStats } from '../../../services/axios.ts';
import { ConfirmationModal } from '../shared/ConfirmationModal.tsx';

interface RegisteredPlayer {
  player_id: string;
  name: string;
  is_goalkeeper: boolean;
  stats: PlayerStats | null;
  avatar: string | null;
}

interface MatchPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId: string;
  currentUserIsGoalkeeper: boolean;
  onPlayerClick: (player: RegisteredPlayer) => void;
  onRefreshMatchList?: () => void;
}

export const MatchPlayersModal: React.FC<MatchPlayersModalProps> = ({ isOpen, onClose, matchId, currentUserId, onPlayerClick, onRefreshMatchList }) => {
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const isUserRegistered = players.some((p) => p.player_id === currentUserId);

  const fetchRegisteredPlayers = async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/matches/${matchId}/players`);
      const payload = data?.data ?? data ?? [];
      const mapped = payload.map((item: any) => ({
        player_id: String(item.id),
        name: item.name,
        is_goalkeeper: Boolean(item.is_goalkeeper),
        stats: item.stats || null,
        avatar: item.avatar || null,
      }));
      setPlayers(mapped);
    } catch (e) {
      console.error(e);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchRegisteredPlayers();
  }, [isOpen, matchId]);

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      await api.post(`/matches/${matchId}/players/${currentUserId}`);
      await fetchRegisteredPlayers();
      onRefreshMatchList?.();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black/90 p-4 flex items-center justify-center">
      <div className="w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 p-6">
        <h2 className="text-white font-bold mb-4">Inscritos</h2>
        {loading ? <p className="text-slate-400">Carregando...</p> : (
          <div className="space-y-2">
            {players.map((p) => (
              <button key={p.player_id} onClick={() => onPlayerClick(p)} className="w-full text-left p-3 rounded-xl bg-slate-800/60 text-white flex justify-between">
                <span>{p.name}</span><span>{p.stats?.overall || 0}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          {!isUserRegistered && <button onClick={handleRegister} disabled={actionLoading} className="px-4 py-2 rounded bg-emerald-600">Entrar</button>}
          {isUserRegistered && <button onClick={() => setIsConfirmModalOpen(true)} className="px-4 py-2 rounded bg-red-600">Sair</button>}
          <button onClick={onClose} className="px-4 py-2 rounded bg-slate-700">Fechar</button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={async () => {
          setActionLoading(true);
          try {
            await api.delete(`/matches/${matchId}/players/${currentUserId}`);
            await fetchRegisteredPlayers();
            onRefreshMatchList?.();
          } finally {
            setActionLoading(false);
            setIsConfirmModalOpen(false);
          }
        }}
        title="Sair da partida"
        description="Deseja remover sua inscrição?"
        confirmLabel="Sim"
        cancelLabel="Cancelar"
        isLoading={actionLoading}
      />
    </div>
  );
};
