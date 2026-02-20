import { api } from "@/services/axios";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Organization = {
  id: number;
  name: string;
  description: string;
  is_admin: boolean;
  stats: {
    velocidade: number;
    finalizacao: number;
    passe: number;
    drible: number;
    defesa: number;
    fisico: number;
    esportividade: number;
    overall: number;
  };
};

type OrganizationContextType = {
  organizations: Organization[];
  activeOrganization: Organization | null;
  setActiveOrganization: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextType>(
  {} as OrganizationContextType
);

export const OrganizationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganizationState] =
    useState<Organization | null>(null);

  const refreshOrganizations = async () => {
    try {
      const { data } = await api.get("/me/organizations");
      setOrganizations(data);
    } catch (err) {
      console.error("Erro ao buscar organizações", err);
    }
  };

  const setActiveOrganization = (org: Organization) => {
    setActiveOrganizationState(org);
    localStorage.setItem("activeOrganizationId", String(org.id));
  };

  useEffect(() => {
    refreshOrganizations();
  }, []);

  useEffect(() => {
    if (!organizations.length) return;

    const savedOrgId = localStorage.getItem("activeOrganizationId");

    if (savedOrgId) {
      const found = organizations.find(
        (o) => o.id === Number(savedOrgId)
      );
      if (found) {
        setActiveOrganizationState(found);
        return;
      }
    }

    setActiveOrganizationState(null);
  }, [organizations]);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrganization,
        setActiveOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  return useContext(OrganizationContext);
};
