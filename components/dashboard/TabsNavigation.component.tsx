import React from 'react';
import { MatchCategory } from '../../types/app.types.ts';

interface TabsNavigationProps {
  activeCategory: MatchCategory;
  onCategoryChange: (category: MatchCategory) => void;
  getCategoryCount: (category: MatchCategory) => number;
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeCategory,
  onCategoryChange,
  getCategoryCount
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 gap-1.5">
      <TabButton
        active={activeCategory === 'open'}
        onClick={() => onCategoryChange('open')}
        label="Abertas"
        count={getCategoryCount('open')}
      />
      <TabButton
        active={activeCategory === 'pending'}
        onClick={() => onCategoryChange('pending')}
        label="Votar"
        count={getCategoryCount('pending')}
        highlight
      />
      <TabButton
        active={activeCategory === 'finished'}
        onClick={() => onCategoryChange('finished')}
        label="Histórico"
        count={getCategoryCount('finished')}
      />
      <TabButton
        active={activeCategory === 'ranking'}
        onClick={() => onCategoryChange('ranking')}
        label="Ranking"
        count={0}
      />
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  highlight?: boolean;
}> = ({ active, onClick, label, count, highlight }) => (
  <button
    onClick={onClick}
    className={`py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all relative flex items-center justify-center gap-2 ${
      active
        ? highlight
          ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-600/30'
          : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-600/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    }`}
  >
    {label}
    {count > 0 && (
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
          active
            ? 'bg-slate-950/25 text-slate-950'
            : highlight
            ? 'bg-orange-500/20 text-orange-300'
            : 'bg-slate-700 text-slate-300'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);
