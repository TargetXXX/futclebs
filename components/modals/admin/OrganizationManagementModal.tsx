import React from 'react';
import { Organization } from '../../../hooks/useOrganizations.hook';
import { OrganizationAccessPanel } from '../../dashboard/OrganizationAccessPanel.component';

interface OrganizationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
  onSearchOrganizations: (query: string, options?: { includeJoined?: boolean }) => Promise<Organization[]>;
  onJoinOrganization: (organizationId: string, password: string) => Promise<void>;
  onCreateOrganization: (payload: { name: string; description?: string; password: string }) => Promise<void>;
  onDeactivateOrganization: (organizationId: string) => Promise<void>;
  joinedOrganizationIds: string[];
}

export const OrganizationManagementModal: React.FC<OrganizationManagementModalProps> = ({
  isOpen,
  onClose,
  isSuperAdmin,
  onSearchOrganizations,
  onJoinOrganization,
  onCreateOrganization,
  onDeactivateOrganization,
  joinedOrganizationIds,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full h-full sm:h-auto sm:max-w-3xl bg-slate-950 sm:bg-slate-900 border-none sm:border sm:border-slate-800 sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen sm:max-h-[90vh] shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Gerenciar organizações</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Vínculos, acessos e criação</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          <OrganizationAccessPanel
            isSuperAdmin={isSuperAdmin}
            onSearchOrganizations={onSearchOrganizations}
            onJoinOrganization={onJoinOrganization}
            onCreateOrganization={onCreateOrganization}
            onDeactivateOrganization={onDeactivateOrganization}
            joinedOrganizationIds={joinedOrganizationIds}
          />
        </div>
      </div>
    </div>
  );
};
