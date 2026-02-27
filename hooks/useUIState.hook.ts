import { useState } from 'react';
import { MatchCategory, Step } from '../types/app.types';

const CATEGORY_KEY = 'futclebs_activeCategory';

export const useUIState = () => {
  const [step, setStep] = useState<Step>(Step.PHONE_CHECK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategoryState] = useState<MatchCategory>(
    () => (localStorage.getItem(CATEGORY_KEY) as MatchCategory) ?? 'ranking'
  );
  const [activeAdminMenu, setActiveAdminMenu] = useState<string | null>(null);

  const setActiveCategory = (cat: MatchCategory) => {
    localStorage.setItem(CATEGORY_KEY, cat);
    setActiveCategoryState(cat);
  };

  return {
    step,
    setStep,
    loading,
    setLoading,
    error,
    setError,
    activeCategory,
    setActiveCategory,
    activeAdminMenu,
    setActiveAdminMenu
  };
};
