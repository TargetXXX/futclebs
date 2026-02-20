import React, { useEffect, useMemo, useState } from 'react';
import { FullRankingModal } from '../modals/player/FullRankingModal.tsx';
import { calculateByPosition } from '@/utils/overall.utils.ts';
import { api, PlayerStats } from '@/services/axios.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';

interface RankingPlayer {
  id: string;
  name: string;
  is_goalkeeper: boolean;
  stats: PlayerStats | null;
  avatar: string | null;
  positions?: string[] | null;
}

interface RankingTabProps {
  onPlayerClick: (player: RankingPlayer) => void;
}

export const RankingTab: React.FC<RankingTabProps> = ({ onPlayerClick }) => {
  const { player } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<RankingPlayer[]>([]);
  const [isFullRankingOpen, setIsFullRankingOpen] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      if (!player?.org) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/organizations/${player.org}/players`);
        const parsed = (data || []).map((p: any) => ({
          id: String(p.id),
          name: p.name,
          is_goalkeeper: Boolean(p.is_goalkeeper),
          stats: p.stats
            ? { ...p.stats, overall: calculateByPosition(p as any, p.stats) }
            : null,
          avatar: p.avatar || null,
          positions: p.positions || null,
        }));
        setAllPlayers(parsed);
      } catch (err) {
        console.error('Erro ao buscar rankings:', err);
        setAllPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [player?.org]);

  const topPlayers = useMemo(
    () => [...allPlayers].sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0)).slice(0, 3),
    [allPlayers]
  );

  if (loading) return <p className="text-slate-400 text-center py-10">Carregando ranking...</p>;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsFullRankingOpen(true)}
        className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black uppercase"
      >
        Ver ranking completo
      </button>

      <div className="grid gap-2">
        {topPlayers.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => onPlayerClick(p)}
            className="text-left rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between"
          >
            <span className="font-semibold">#{idx + 1} {p.name}</span>
            <span className="font-black text-emerald-400">{p.stats?.overall || 0}</span>
          </button>
        ))}
      </div>

      <FullRankingModal
        isOpen={isFullRankingOpen}
        onClose={() => setIsFullRankingOpen(false)}
        players={allPlayers}
        onPlayerClick={(p) => {
          setIsFullRankingOpen(false);
          onPlayerClick(p as RankingPlayer);
        }}
      />
    </div>
  );
};
