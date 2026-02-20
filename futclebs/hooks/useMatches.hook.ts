import { useState, useCallback } from 'react';
import { MatchWithExtras } from '../types/app.types';
import { api } from '@/services/axios';

export const useMatches = (organizationId: string | null) => {
  const [matches, setMatches] = useState<MatchWithExtras[]>([]);

  const fetchMatches = useCallback(async () => {
    if (!organizationId) return;

    try {
      const { data } = await api.get(`/organizations/${organizationId}/matches`);
      const list = data?.data ?? data ?? [];

      const normalized: MatchWithExtras[] = (list || []).map((match: any) => ({
        ...match,
        playerCount: match.players_count || 0,
        isUserRegistered: false,
        hasPendingVotes: Boolean(match.has_pending_votes),
      }));

      setMatches(normalized);
    } catch (err) {
      console.error('Erro ao carregar partidas:', err);
      setMatches([]);
    }
  }, [organizationId]);

  const deleteMatch = useCallback(async (matchId: string) => {
    await api.delete(`/matches/${matchId}`);
  }, []);

  return {
    matches,
    fetchMatches,
    deleteMatch,
  };
};
