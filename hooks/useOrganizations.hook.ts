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


export interface OrganizationMember {
  organization_id: string;
  player_id: string;
  is_admin: boolean;
  players: {
    id: string;
    name: string;
    phone: string;
    avatar: string | null;
  } | null;
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

  const searchOrganizations = useCallback(async (query: string, options?: { includeJoined?: boolean }) => {
    const term = query.trim();
    if (!term) return [] as Organization[];

    const { data, error } = await supabase
      .from('organization')
      .select('id, name, description, active')
      .eq('active', true)
      .ilike('name', `%${term}%`)
      .order('name', { ascending: true })
      .limit(12);

    if (error) throw error;

    const allOrganizations = (data as Organization[] | null) ?? [];

    if (options?.includeJoined) {
      return allOrganizations;
    }

    return allOrganizations.filter((org) =>
      !organizations.some((membershipOrg) => membershipOrg.id === org.id)
    );
  }, [organizations]);

  const joinOrganization = useCallback(async (organizationId: string, password: string) => {
    if (!userId) throw new Error('Usuário não autenticado.');

    const alreadyMember = organizations.some((org) => org.id === organizationId);
    if (alreadyMember) throw new Error('Você já faz parte desta organização.');

    const cleanPassword = password.trim();
    if (!cleanPassword) throw new Error('Informe a senha da organização.');

    const { error: joinError } = await supabase.functions.invoke('join-organization', {
      body: {
        org_id: organizationId,
        input_password: cleanPassword,
      },
    });

    if (joinError) throw new Error(joinError.message || 'Não foi possível entrar na organização.');

    await fetchOrganizations();
    selectOrganization(organizationId);
  }, [fetchOrganizations, organizations, selectOrganization, userId]);

  const createOrganization = useCallback(async (payload: { name: string; description?: string; password: string }) => {
    if (!userId) throw new Error('Usuário não autenticado.');

    const name = payload.name.trim();
    const password = payload.password.trim();
    const description = payload.description?.trim() || null;

    if (!name) throw new Error('Informe o nome da organização.');
    if (password.length < 4) throw new Error('A senha da organização deve ter ao menos 4 caracteres.');

    const { data: insertedOrganization, error: createError } = await supabase
      .from('organization')
      .insert({
        name,
        description,
        password,
        active: true,
        owner_id: userId,
      })
      .select('id')
      .single();

    if (createError) throw createError;
    if (!insertedOrganization?.id) throw new Error('Falha ao obter ID da nova organização.');

    const organizationId = insertedOrganization.id;

    const { error: membershipError } = await supabase
      .from('organization_players')
      .insert({
        organization_id: organizationId,
        player_id: userId,
        is_admin: true,
      });

    if (membershipError) throw membershipError;

    await fetchOrganizations();
    selectOrganization(organizationId);
  }, [fetchOrganizations, selectOrganization, userId]);

  const deleteOrganization = useCallback(async (organizationId: string) => {
    if (!userId) throw new Error('Usuário não autenticado.');

    const cleanId = organizationId.trim();
    if (!cleanId) throw new Error('Organização inválida.');

    const { error } = await supabase
      .from('organization')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;

    if (selectedOrganizationId === cleanId) {
      setSelectedOrganizationId(null);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
    }

    await fetchOrganizations();
  }, [fetchOrganizations, selectedOrganizationId, storageKey, userId]);

  const getOrganizationMembers = useCallback(async (organizationId: string) => {
    if (!organizationId) return [] as OrganizationMember[];

    const { data, error } = await supabase
      .from('organization_players')
      .select('organization_id, player_id, is_admin, players(id, name, phone, avatar)')
      .eq('organization_id', organizationId)
      .order('is_admin', { ascending: false })
      .order('player_id', { ascending: true });

    if (error) throw error;

    return ((data as OrganizationMember[] | null) ?? []).sort((a, b) => {
      const aName = a.players?.name || '';
      const bName = b.players?.name || '';
      return aName.localeCompare(bName, 'pt-BR');
    });
  }, []);

  const setOrganizationMemberAdmin = useCallback(async (organizationId: string, memberId: string, isAdmin: boolean) => {
    if (!organizationId || !memberId) throw new Error('Dados inválidos para atualizar membro.');

    const { error } = await supabase
      .from('organization_players')
      .update({ is_admin: isAdmin })
      .eq('organization_id', organizationId)
      .eq('player_id', memberId);

    if (error) throw error;

    if (memberId === userId && selectedOrganizationId === organizationId) {
      setAdminByOrganization((prev) => ({ ...prev, [organizationId]: isAdmin }));
    }
  }, [selectedOrganizationId, userId]);

  const removeOrganizationMember = useCallback(async (organizationId: string, memberId: string) => {
    if (!organizationId || !memberId) throw new Error('Dados inválidos para remover membro.');

    const { error } = await supabase
      .from('organization_players')
      .delete()
      .eq('organization_id', organizationId)
      .eq('player_id', memberId);

    if (error) throw error;

    if (memberId === userId) {
      await fetchOrganizations();
    }
  }, [fetchOrganizations, userId]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    selectedOrganizationId,
    loadingOrganizations,
    isCurrentOrganizationAdmin: selectedOrganizationId ? !!adminByOrganization[selectedOrganizationId] : false,
    selectOrganization,
    searchOrganizations,
    joinOrganization,
    createOrganization,
    deleteOrganization,
    getOrganizationMembers,
    setOrganizationMemberAdmin,
    removeOrganizationMember,
    refetchOrganizations: fetchOrganizations,
  };
};
