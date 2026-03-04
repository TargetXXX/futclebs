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

interface OrganizationWithPassword extends Organization {
  password: string;
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

  const searchOrganizations = useCallback(async (query: string) => {
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

    return ((data as Organization[] | null) ?? []).filter((org) =>
      !organizations.some((membershipOrg) => membershipOrg.id === org.id)
    );
  }, [organizations]);

  const joinOrganization = useCallback(async (organizationId: string, password: string) => {
    if (!userId) throw new Error('Usuário não autenticado.');

    const cleanPassword = password.trim();
    if (!cleanPassword) throw new Error('Informe a senha da organização.');

    const { data: organizationData, error: orgError } = await supabase
      .from('organization')
      .select('id, name, description, active, password')
      .eq('id', organizationId)
      .eq('active', true)
      .maybeSingle();

    if (orgError) throw orgError;

    const organization = organizationData as OrganizationWithPassword | null;
    if (!organization) throw new Error('Organização não encontrada ou inativa.');

    if (organization.password !== cleanPassword) {
      throw new Error('Senha da organização inválida.');
    }

    const { error: joinError } = await supabase
      .from('organization_players')
      .upsert(
        {
          organization_id: organization.id,
          player_id: userId,
          is_admin: false,
        },
        { onConflict: 'organization_id,player_id' }
      );

    if (joinError) throw joinError;

    await fetchOrganizations();
    selectOrganization(organization.id);
  }, [fetchOrganizations, selectOrganization, userId]);

  // FUNÇÃO CORRIGIDA ABAIXO
  const createOrganization = useCallback(async (payload: { name: string; description?: string; password: string }) => {
    if (!userId) throw new Error('Usuário não autenticado.');

    const name = payload.name.trim();
    const password = payload.password.trim();
    const description = payload.description?.trim() || null;

    if (!name) throw new Error('Informe o nome da organização.');
    if (password.length < 4) throw new Error('A senha da organização deve ter ao menos 4 caracteres.');

    // 1. Inserir na tabela organization incluindo o owner_id (CORREÇÃO DO ERRO)
    const { data: insertedOrganization, error: createError } = await supabase
      .from('organization')
      .insert({
        name,
        description,
        password,
        active: true,
        owner_id: userId, // Campo obrigatório pela constraint foreign key
      })
      .select('id')
      .single();

    if (createError) throw createError;
    if (!insertedOrganization?.id) throw new Error('Falha ao obter ID da nova organização.');

    const organizationId = insertedOrganization.id;

    // 2. Vincular o criador como admin na tabela organization_players
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
    refetchOrganizations: fetchOrganizations,
  };
};
