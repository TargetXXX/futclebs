import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

const ORG_AWARE_PATHS = ["/tournaments", "/teams", "/matches"];

const getOrganizationId = () => {
  if (typeof window === "undefined") return null;

  const fromStorage = localStorage.getItem("orgId");
  if (fromStorage && Number(fromStorage) > 0) return Number(fromStorage);

  const match = window.location.pathname.match(/\/dashboard\/org\/(\d+)/);
  if (!match?.[1]) return null;

  const fromPath = Number(match[1]);
  return Number.isFinite(fromPath) && fromPath > 0 ? fromPath : null;
};

const shouldInjectOrganizationId = (url?: string) =>
  Boolean(url && ORG_AWARE_PATHS.some((segment) => url.includes(segment)));

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (shouldInjectOrganizationId(config.url)) {
    const organizationId = getOrganizationId();

    if (organizationId) {
      config.params = {
        ...(config.params ?? {}),
        organization_id: organizationId,
      };

      if (config.data && typeof config.data === "object" && !Array.isArray(config.data)) {
        config.data = {
          ...config.data,
          organization_id: config.data.organization_id ?? organizationId,
        };
      }
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export type Player = {
  id: string;
  uuid: string;
  name: string;
  phone: string;
  is_admin: boolean;
  is_goalkeeper: boolean;
  avatar: string | null;
  positions: String[] | null;
  created_at: string;
  organizations: Organization[] | null
};

export type Organization = {
    id: number;
    name: string;
    description: string;
    actice: boolean;
    created_at: string;
}

export enum PlayerPosition {
  MEIO = 'MEIO',
  DEFESA = 'DEFESA',
  ATAQUE = 'ATAQUE',
  GOLEIRO = 'GOLEIRO',
}

export type PlayerStats = {
  player_id: string;
  velocidade: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  esportividade: number;
  fisico: number;
  overall: number;
};

export type Match = {
  id: string;
  match_date: string;
  status: 'open' | 'in_progress' | 'finished';
  created_by?: string;
  created_at: string;
};

export type MatchResult = {
  match_id: string;
  goals_team_a: number;
  goals_team_b: number;
  winner: 'A' | 'B' | 'draw' | null;
  players_team_a: string[];
  players_team_b: string[];
};

export type MatchRegistration = {
  id: string;
  match_id: string;
  player_id: string;
  created_at: string;
  status: 'confirmed' | 'waiting';
};

export type PlayerVote = {
  id: string;
  match_id: string;
  voter_id: string;
  target_player_id: string;
  velocidade: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
  created_at: string;
};

export type MatchComment = {
  id: string;
  match_id: string;
  player_id: string;
  content: string;
  created_at: string;
  player_name?: string;
};

export type Session = {
    user: Player | null;
    token: string | null;
}


type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

export const unwrapApiResponse = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

export const getApiErrorMessage = (error: any, fallback = "Não foi possível concluir a operação.") => {
  const payload = error?.response?.data as ApiErrorPayload | undefined;

  if (payload?.message) return payload.message;

  const firstFieldError = payload?.errors && Object.values(payload.errors)[0];

  if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
    return firstFieldError[0];
  }

  if (typeof firstFieldError === "string") {
    return firstFieldError;
  }

  return fallback;
};
