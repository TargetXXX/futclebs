import { useState, useCallback } from 'react';
import { api, Player } from '@/services/axios';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<Player | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await api.get(`/players/${userId}`);
      setUserProfile(data);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setUserProfile(null);
    }
  }, []);

  const updateUserProfile = useCallback((updates: Partial<Player>) => {
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return {
    userProfile,
    fetchUserProfile,
    updateUserProfile,
    setUserProfile,
  };
};
