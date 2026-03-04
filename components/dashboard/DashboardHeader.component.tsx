import React from 'react';
import { Player } from '../../services/supabase';

interface DashboardHeaderProps {
  userProfile: Player;
  isSuperAdmin: boolean;
  isOrganizationAdmin: boolean;
  organizationName: string | null;
  onOpenUserManagement: () => void;
  onOpenCreateMatch: () => void;
  onOpenSeasonModal: () => void;
  onOpenWhatsAppConfig: () => void;
  onOpenFinancial: () => void;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userProfile,
  isSuperAdmin,
  isOrganizationAdmin,
  organizationName,
  onOpenUserManagement,
  onOpenCreateMatch,
  onOpenSeasonModal,
  onOpenWhatsAppConfig,
  onOpenFinancial,
  onLogout,
}) => {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">FutClebs • Dashboard</p>
          <h1 className="text-2xl font-black text-white leading-tight truncate">{userProfile.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {organizationName && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-500/30 animate-in fade-in duration-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {organizationName}
              </span>
            )}
            {isOrganizationAdmin && (
              <span className="inline-block text-[10px] font-black bg-white text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-white/20">
                Modo Admin
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="shrink-0 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"
          title="Sair"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {(isSuperAdmin || isOrganizationAdmin) && (
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <button onClick={onOpenUserManagement} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider">
              Gerenciar Usuários
            </button>
          )}

          {isSuperAdmin && (
            <button onClick={onOpenSeasonModal} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider" title="Gerenciar Temporadas">
              🏆 Temporada
            </button>
          )}

          {isSuperAdmin && (
            <button onClick={onOpenWhatsAppConfig} className="px-3 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5" title="WhatsApp — Enviar lista / Configurar">
              WhatsApp
            </button>
          )}

          {(isSuperAdmin || isOrganizationAdmin) && (
            <button onClick={onOpenFinancial} className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5" title="Financeiro — Mensalidades">
              💰 Caixa
            </button>
          )}

          {isOrganizationAdmin && (
            <button onClick={onOpenCreateMatch} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20">
              Criar Partida
            </button>
          )}
        </div>
      )}
    </header>
  );
};
