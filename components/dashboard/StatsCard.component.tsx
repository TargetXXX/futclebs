import React from 'react';
import { Player, PlayerStats } from '../../services/supabase.ts';

interface StatsCardProps {
  userProfile: Player;
  userStats: PlayerStats | null;
  onOpenStats: () => void;
  onOpenAvatar: () => void;
  onOpenPositions: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  userProfile,
  userStats,
  onOpenStats,
  onOpenAvatar,
  onOpenPositions
}) => {
  return (
    <div
      onClick={onOpenStats}
      className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-cyan-700 p-5 sm:p-6 rounded-[2rem] shadow-2xl cursor-pointer active:scale-[0.99] transition-all"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.18),transparent_35%)]" />
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAvatar();
              }}
              className="relative group/avatar shrink-0"
              title="Editar avatar"
            >
              <div className="relative">
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="Avatar"
                    className="w-11 h-11 rounded-full object-cover border-2 border-white/40 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:border-white shadow-lg shadow-black/30"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-800/60 flex items-center justify-center border-2 border-white/20 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:border-white/70 shadow-lg shadow-black/30">
                    <span className="text-white font-black text-xl">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Seu Nível</p>
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase border border-white/20 tracking-widest whitespace-nowrap">
                {userProfile.is_goalkeeper ? 'Goleiro' : 'Linha'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl sm:text-6xl font-black text-white tabular-nums leading-none">
              {userStats?.overall ?? '--'}
            </span>
            <span className="text-emerald-100 font-bold text-lg">OVR</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPositions();
            }}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase border border-white/15 tracking-widest transition-all inline-flex items-center gap-1.5"
          >
            {userProfile.positions && userProfile.positions.length > 0
              ? userProfile.positions.join(' • ')
              : 'Definir Posições'}
          </button>
        </div>

        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md group-hover:scale-105 transition-transform shrink-0 self-end sm:self-auto">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
