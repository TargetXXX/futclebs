import React from 'react';
import { MatchWithExtras } from '@/types/app.types';
import { Player } from '@/services/axios';

interface MatchCardProps {
  match: MatchWithExtras;
  userProfile: Player;
  isSuperAdmin: boolean;
  activeAdminMenu: string | null;
  setActiveAdminMenu: (id: string | null) => void;
  onOpenPlayers: () => void;
  onOpenVote: () => void;
  onOpenSummary: () => void;
  onOpenTeamSorting: () => void;
  onOpenComments: () => void;
  onOpenAdminManagement: () => void;
  onOpenMatchFinish: () => void;
  onOpenVotingStatus: () => void;
  onOpenDeleteConfirm: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  userProfile,
  isSuperAdmin,
  activeAdminMenu,
  setActiveAdminMenu,
  onOpenPlayers,
  onOpenVote,
  onOpenSummary,
  onOpenTeamSorting,
  onOpenComments,
  onOpenAdminManagement,
  onOpenMatchFinish,
  onOpenVotingStatus,
  onOpenDeleteConfirm
}) => {
  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-4 sm:p-5 transition-all hover:border-emerald-500/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 w-full">
          <div className="h-16 w-16 shrink-0 rounded-2xl border border-slate-700/50 bg-slate-800 text-emerald-500 font-bold flex flex-col items-center justify-center">
            <span className="text-lg leading-none">{match.match_date.split('-')[2]}</span>
            <span className="text-[10px] opacity-60 uppercase">
              {new Date(match.match_date + 'T12:00:00').toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
            </span>
            <span className="text-[8px] opacity-40 font-black">{match.match_date.split('-')[0]}</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm sm:text-base font-bold text-white">Pelada Clebinho</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                  match.status === 'open'
                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                    : match.hasPendingVotes
                    ? 'border border-orange-500/20 bg-orange-500/10 text-orange-500'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {match.hasPendingVotes ? 'Votar' : match.status === 'open' ? 'Aberta' : 'Finalizada'}
              </span>
              <span className="text-[10px] font-bold text-slate-500">• {match.playerCount} Confirmados</span>
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
          {match.status === 'finished' && !match.hasPendingVotes && (
            <button
              onClick={onOpenComments}
              className="px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-slate-800/80 text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400"
            >
              Resenha
            </button>
          )}

          {(match.status === 'open' || match.status === 'finished') && (
            <button
              onClick={onOpenTeamSorting}
              className="px-3 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/80 text-[10px] font-black uppercase text-slate-300 hover:text-white"
            >
              Escalação
            </button>
          )}

          <button
            onClick={() => {
              if (match.hasPendingVotes) onOpenVote();
              else if (match.status === 'finished') onOpenSummary();
              else onOpenPlayers();
            }}
            className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase ${
              match.hasPendingVotes
                ? 'bg-orange-600 text-slate-950 hover:bg-orange-500'
                : match.status === 'open'
                ? 'bg-emerald-600 text-slate-950 hover:bg-emerald-500'
                : 'border border-slate-700/30 bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {match.hasPendingVotes ? 'Votar Agora' : match.status === 'open' ? 'Inscritos' : 'Resumo'}
          </button>
        </div>
      </div>

      {userProfile.is_admin && (
        <div className="mt-3 border-t border-slate-800 pt-3">
          {match.status === 'open' && (
            <>
              {activeAdminMenu === match.id ? (
                <div className="flex flex-wrap gap-2">
                  <button onClick={onOpenAdminManagement} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase border border-slate-700/50">Lista</button>
                  <button onClick={onOpenTeamSorting} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase border border-blue-400/30">Sortear</button>
                  <button onClick={onOpenMatchFinish} className="px-3 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase border border-red-400/30">Finalizar</button>
                  <button onClick={onOpenDeleteConfirm} className="px-3 py-2 bg-red-950/50 text-red-500 border border-red-900/30 rounded-lg text-[10px] font-black uppercase">Excluir</button>
                  <button onClick={() => setActiveAdminMenu(null)} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase border border-slate-700/50">Fechar</button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveAdminMenu(match.id)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-[10px] font-black uppercase"
                >
                  Painel Admin
                </button>
              )}
            </>
          )}

          {match.status === 'finished' && isSuperAdmin && (
            <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
              <button
                onClick={onOpenVotingStatus}
                className="px-3 py-2.5 bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50 rounded-xl text-[10px] font-black uppercase"
              >
                Status
              </button>

              <button
                onClick={onOpenDeleteConfirm}
                className="px-3 py-2.5 bg-red-950/50 text-red-500 hover:text-red-400 border border-red-900/30 rounded-xl text-[10px] font-black uppercase"
                title="Excluir partida do histórico"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
