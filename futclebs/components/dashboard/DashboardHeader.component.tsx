import { Player } from '@/services/axios';
import React from 'react';

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
    <header className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">FutClebs • Dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{userProfile.name}</h1>
          {userProfile.is_admin && (
            <span className="mt-2 inline-flex text-[10px] font-black bg-white text-slate-950 px-2.5 py-1 rounded-full uppercase tracking-[0.14em] border border-white/20">
              Modo Admin
            </span>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-3">
          {isSuperAdmin && (
            <button
              onClick={onOpenUserManagement}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-xl transition-all text-[11px] font-black uppercase tracking-wide"
            >
              Gerenciar Usuários
            </button>
          )}

          {userProfile.is_admin && (
            <button
              onClick={onOpenCreateMatch}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl transition-all text-[11px] font-black uppercase tracking-wide shadow-lg shadow-emerald-600/20"
            >
              Criar Partida
            </button>
          )}

          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-wide"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};
