import React from 'react';
import { Organization } from '../../hooks/useOrganizations.hook';

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedOrganizationId: string | null;
  onSelectOrganization: (organizationId: string) => void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  organizations,
  selectedOrganizationId,
  onSelectOrganization,
}) => {
  if (organizations.length <= 1) return null;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Organização ativa</p>
      <div className="flex flex-wrap gap-2">
        {organizations.map((org) => {
          const isActive = selectedOrganizationId === org.id;
          return (
            <button
              key={org.id}
              onClick={() => onSelectOrganization(org.id)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {org.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
