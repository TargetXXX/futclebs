import React from 'react';
import { Player } from '../../services/supabase.ts';

interface DashboardHeaderProps {
  userProfile: Player;
  isSuperAdmin: boolean;
  onOpenUserManagement: () => void;
  onOpenCreateMatch: () => void;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userProfile,
  isSuperAdmin,
  onOpenUserManagement,
  onOpenCreateMatch,
  onLogout
}) => {
  return (
    <header className="rounded-3xl border border-slate-800/90 bg-slate-900/65 backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">FutClebs • Dashboard</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Online
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight">Olá, {userProfile.name}</h1>
          <p className="text-xs text-slate-400 mt-1">Tudo pronto para organizar partidas e acompanhar a evolução do time.</p>

          <div className="flex gap-2 mt-3 flex-wrap">
            {userProfile.is_admin && (
              <span className="text-[10px] font-black bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
                Admin
              </span>
            )}
            {userProfile.is_goalkeeper && (
              <span className="text-[10px] font-black bg-cyan-400/90 text-slate-950 px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
                Goleiro
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
          {isSuperAdmin && (
            <button
              onClick={onOpenUserManagement}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider hover:-translate-y-0.5"
            >
              Gerenciar Usuários
            </button>
          )}

          {userProfile.is_admin && (
            <button
              onClick={onOpenCreateMatch}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-slate-950 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5"
            >
              Criar Partida
            </button>
          )}

          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-500 transition-all text-[11px] font-black uppercase tracking-wider hover:-translate-y-0.5"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};
