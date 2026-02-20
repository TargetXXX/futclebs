import { useState, useCallback } from 'react';
import { MatchWithExtras } from '../types/app.types';
import { api } from '@/services/axios';

export const useMatches = (organizationId: string | null) => {
  const [matches, setMatches] = useState<MatchWithExtras[]>([]);

  const fetchMatches = useCallback(async () => {
    if (!organizationId) return;

    try {
      const { data } = await api.get(
        `/organizations/${organizationId}/tournaments`
      );

      // Ajuste conforme seu retorno real da API
      const tournaments = data || [];

      const allMatches: MatchWithExtras[] = [];

      for (const tournament of tournaments) {
        if (tournament.matches) {
          tournament.matches.forEach((match: any) => {
            allMatches.push({
              ...match,
              playerCount: match.players_count || 0,
              isUserRegistered: false,
              hasPendingVotes: false
            });
          });
        }
      }

      setMatches(allMatches);
    } catch (err) {
      console.error('Erro ao carregar partidas:', err);
    }
  }, [organizationId]);

  const deleteMatch = useCallback(
    async (matchId: string) => {
      await api.delete(`/matches/${matchId}`);
    },
    []
  );

  return {
    matches,
    fetchMatches,
    deleteMatch
  };
};
