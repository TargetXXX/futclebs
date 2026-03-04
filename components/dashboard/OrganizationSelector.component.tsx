import React from 'react';
import { Organization } from '../../hooks/useOrganizations.hook';

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedOrganizationId: string | null;
  onSelectOrganization: (organizationId: string) => void;
  isLoading?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  organizations,
  selectedOrganizationId,
  onSelectOrganization,
  isLoading = false,
}) => {
  if (organizations.length <= 1) return null;

  return (
    <section className="relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-5">
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Organização ativa</p>
          <h3 className="text-white font-black text-sm">Escolha o dashboard</h3>
        </div>

        {isLoading && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-black uppercase tracking-wide animate-in fade-in duration-300">
            <span className="w-3 h-3 border-2 border-emerald-300/40 border-t-emerald-300 rounded-full animate-spin" />
            Atualizando
          </div>
        )}
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {organizations.map((org) => {
          const isActive = selectedOrganizationId === org.id;

          return (
            <button
              key={org.id}
              onClick={() => onSelectOrganization(org.id)}
              disabled={isLoading}
              className={`text-left px-3 py-3 rounded-2xl border transition-all duration-300 group ${
                isActive
                  ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:-translate-y-0.5'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={`text-xs font-black uppercase tracking-wide truncate ${isActive ? 'text-emerald-300' : 'text-slate-200 group-hover:text-white'}`}>
                  {org.name}
                </p>
                {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              </div>

              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 min-h-8">
                {org.description?.trim() || 'Sem descrição cadastrada para esta organização.'}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
