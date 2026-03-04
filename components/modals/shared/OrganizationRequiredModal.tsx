import React from 'react';

interface OrganizationRequiredModalProps {
  message: string;
  onClose: () => void;
}

export const OrganizationRequiredModal: React.FC<OrganizationRequiredModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <p className="text-white font-black text-sm">{message}</p>
        <p className="text-slate-400 text-xs mt-2">Abra uma organização no seletor para continuar.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase">
          Fechar
        </button>
      </div>
    </div>
  );
};
