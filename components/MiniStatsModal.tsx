
import React from 'react';
import { PlayerStats } from '../services/supabase';

interface MiniStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  isGoalkeeper: boolean;
  stats: PlayerStats | null;
}

export const MiniStatsModal: React.FC<MiniStatsModalProps> = ({ isOpen, onClose, name, isGoalkeeper, stats }) => {
  if (!isOpen) return null;

  const SCALING = 20;

  const allStatItems = [
    { label: 'VEL', value: (stats?.velocidade || 0) * SCALING, color: 'bg-blue-500', key: 'VEL' },
    { label: 'FIN', value: (stats?.finalizacao || 0) * SCALING, color: 'bg-red-500', key: 'FIN' },
    { label: 'PAS', value: (stats?.passe || 0) * SCALING, color: 'bg-emerald-500', key: 'PAS' },
    { label: 'DRI', value: (stats?.drible || 0) * SCALING, color: 'bg-yellow-500', key: 'DRI' },
    { label: 'DEF', value: (stats?.defesa || 0) * SCALING, color: 'bg-slate-500', key: 'DEF' },
    { label: 'FIS', value: (stats?.fisico || 0) * SCALING, color: 'bg-orange-500', key: 'FIS' },
  ];

  const statItems = isGoalkeeper
    ? allStatItems.filter(item => item.key === 'PAS' || item.key === 'DEF')
    : allStatItems;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in zoom-in duration-200">
      <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{name}</h3>
              {isGoalkeeper && (
                <span className="text-[8px] font-black bg-orange-500 text-slate-950 px-1.5 py-0.5 rounded-md uppercase">GK</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-3xl font-black text-emerald-500">
                {stats?.overall ? Math.round(Number(stats.overall) * SCALING) : '--'}
              </span>
              <span className="text-[10px] font-black text-emerald-500/60 uppercase mt-2">Overall</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`grid ${isGoalkeeper ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          {statItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 px-0.5">
                <span>{item.label}</span>
                <span className="text-white">{Math.round(Number(item.value))}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color}`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl transition-all"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
