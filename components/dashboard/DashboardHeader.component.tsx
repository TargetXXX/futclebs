import React from 'react';
import { Player } from '../../services/supabase';


interface DashboardHeaderProps {
  userProfile: Player;
  isSuperAdmin: boolean;
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
  onOpenUserManagement,
  onOpenCreateMatch,
  onOpenSeasonModal,
  onOpenWhatsAppConfig,
  onOpenFinancial,
  onLogout,
}) => {

  return (
    <header className="flex flex-col gap-3">
      {/* Linha 1: nome + sair */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">FutClebs • Dashboard</p>
          <h1 className="text-2xl font-black text-white leading-tight truncate">{userProfile.name}</h1>
          {userProfile.is_admin && (
            <span className="inline-block mt-1 text-[10px] font-black bg-white text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-white/20">
              Modo Admin
            </span>
          )}
        </div>

        {/* Sair — sempre visível, compacto */}
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

      {/* Linha 2: botões de ação — só aparecem para admin */}
      {(isSuperAdmin || userProfile.is_admin) && (
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <button
              onClick={onOpenUserManagement}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
            >
              Gerenciar Usuários
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={onOpenSeasonModal}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
              title="Gerenciar Temporadas"
            >
              🏆 Temporada
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={onOpenWhatsAppConfig}
              className="px-3 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
              title="WhatsApp — Enviar lista / Configurar"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={onOpenFinancial}
              className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
              title="Financeiro — Mensalidades"
            >
              💰 Caixa
            </button>
          )}

          {userProfile.is_admin && (
            <button
              onClick={onOpenCreateMatch}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20"
            >
              Criar Partida
            </button>
          )}
        </div>
      )}

    </header>
  );
};
