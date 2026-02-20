import { useMemo } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserProfile } from '@/hooks/useUserProfile.hook';
import { calculateByPosition } from '@/utils/overall.utils';
import { PlayerStats } from '@/services/axios';

export const useOrganizationStats = (): PlayerStats | null => {
  const { activeOrganization } = useOrganization();
  const { userProfile } = useUserProfile();

  return useMemo(() => {
    if (!activeOrganization?.stats || !userProfile) return null;

    const calculatedOverall = calculateByPosition(
      userProfile,
      activeOrganization.stats
    );

    return {
      player_id: userProfile.id,
      velocidade: activeOrganization.stats.velocidade,
      finalizacao: activeOrganization.stats.finalizacao,
      passe: activeOrganization.stats.passe,
      drible: activeOrganization.stats.drible,
      defesa: activeOrganization.stats.defesa,
      fisico: activeOrganization.stats.fisico,
      esportividade: activeOrganization.stats.esportividade ?? 100,
      overall: calculatedOverall,
    };
  }, [activeOrganization, userProfile]);
};
