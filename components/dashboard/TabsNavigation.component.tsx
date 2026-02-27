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
    <div className="grid grid-cols-4 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 gap-1">
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
    className={`w-full py-2.5 px-1 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all flex flex-col items-center justify-center gap-0.5 ${
      active
        ? highlight
          ? 'bg-orange-600 text-slate-950 shadow-lg shadow-orange-600/20'
          : 'bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-600/20'
        : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {label}
    {count > 0 && (
      <span
        className={`px-1.5 py-0.5 rounded-full text-[9px] leading-none font-black ${
          active
            ? 'bg-slate-950/20 text-slate-950'
            : highlight
            ? 'bg-orange-600/20 text-orange-500'
            : 'bg-slate-800 text-slate-400'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);
