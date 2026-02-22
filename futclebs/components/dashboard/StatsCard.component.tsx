import React from 'react';
import { Player, PlayerStats } from '../../services/axios.ts';

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
  const rating = Math.max(0, Math.min(100, userStats?.overall ?? 0));

  return (
    <div
      onClick={onOpenStats}
      className="group relative overflow-hidden rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.35),_transparent_42%),linear-gradient(135deg,_#04271f_0%,_#083d33_45%,_#0b2139_100%)] p-5 sm:p-6 shadow-[0_22px_65px_-25px_rgba(16,185,129,0.8)] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAvatar();
                }}
                className="relative shrink-0 rounded-full ring-2 ring-white/15 transition-all duration-300 hover:ring-emerald-200/70"
                title="Editar avatar"
              >
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="Avatar"
                    className="h-12 w-12 rounded-full object-cover border-2 border-white/20"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-white/10">
                    <span className="text-white font-black text-xl">{userProfile.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </button>

              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-emerald-100/80">Card do Jogador</p>
                <div className="mt-1 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                  {userProfile.is_goalkeeper ? 'Goleiro' : 'Linha'}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-5xl sm:text-6xl leading-none font-black text-white tabular-nums drop-shadow-[0_4px_24px_rgba(16,185,129,0.4)]">
                {userStats?.overall ?? '--'}
              </span>
              <span className="pb-1 text-emerald-200 font-bold tracking-wide">OVR</span>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-900/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 transition-all duration-500"
                style={{ width: `${rating}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md self-start">
            <svg className="h-7 w-7 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenPositions();
          }}
          className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:border-emerald-200/60 hover:bg-white/15"
        >
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">
            {userProfile.positions && userProfile.positions.length > 0
              ? userProfile.positions.join(' • ')
              : 'Definir Posições'}
          </span>
        </button>
      </div>
    </div>
  );
};
