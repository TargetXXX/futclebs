import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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