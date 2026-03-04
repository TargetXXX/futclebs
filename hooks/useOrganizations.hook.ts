import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface MembershipRow {
  organization_id: string;
  is_admin: boolean;
}

export const useOrganizations = (userId: string | null) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [adminByOrganization, setAdminByOrganization] = useState<Record<string, boolean>>({});

  const storageKey = useMemo(() => (userId ? `selected-org:${userId}` : null), [userId]);

  const fetchOrganizations = useCallback(async () => {
    if (!userId) {
      setOrganizations([]);
      setSelectedOrganizationId(null);
      setAdminByOrganization({});
      return;
    }

    setLoadingOrganizations(true);

    try {
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_players')
        .select('organization_id, is_admin')
        .eq('player_id', userId);

      if (membershipError) throw membershipError;

      const parsedMemberships = (memberships as MembershipRow[] | null) ?? [];
      const orgIds = parsedMemberships.map((m) => m.organization_id);

      if (orgIds.length === 0) {
        setOrganizations([]);
        setSelectedOrganizationId(null);
        setAdminByOrganization({});
        return;
      }

      const adminMap = parsedMemberships.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.organization_id] = item.is_admin;
        return acc;
      }, {});

      setAdminByOrganization(adminMap);

      const { data: orgs, error: orgError } = await supabase
        .from('organization')
        .select('id, name, description, active')
        .in('id', orgIds)
        .eq('active', true)
        .order('name', { ascending: true });

      if (orgError) throw orgError;

      const availableOrgs = (orgs as Organization[] | null) ?? [];
      setOrganizations(availableOrgs);

      const savedOrgId = storageKey ? localStorage.getItem(storageKey) : null;
      const hasSavedOrg = !!savedOrgId && availableOrgs.some((org) => org.id === savedOrgId);
      const fallbackOrgId = availableOrgs[0]?.id ?? null;
      const nextOrgId = hasSavedOrg ? savedOrgId : fallbackOrgId;

      setSelectedOrganizationId(nextOrgId);

      if (storageKey && nextOrgId) {
        localStorage.setItem(storageKey, nextOrgId);
      }
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
      setOrganizations([]);
      setSelectedOrganizationId(null);
      setAdminByOrganization({});
    } finally {
      setLoadingOrganizations(false);
    }
  }, [storageKey, userId]);

  const selectOrganization = useCallback((organizationId: string) => {
    setSelectedOrganizationId(organizationId);
    if (storageKey) {
      localStorage.setItem(storageKey, organizationId);
    }
  }, [storageKey]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    selectedOrganizationId,
    loadingOrganizations,
    isCurrentOrganizationAdmin: selectedOrganizationId ? !!adminByOrganization[selectedOrganizationId] : false,
    selectOrganization,
    refetchOrganizations: fetchOrganizations,
  };
};
