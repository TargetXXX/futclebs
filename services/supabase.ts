
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.SUPABASE_URL as string;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SubscriptionType = 'monthly_both' | 'monthly_one' | 'daily' | 'goalkeeper';

export const SUBSCRIPTION_LABELS: Record<SubscriptionType, string> = {
  monthly_both: 'Mensal (Seg + Qui)',
  monthly_one:  'Mensal (1 jogo)',
  daily:        'Diária',
  goalkeeper:   '🧤 Goleiro (Isento)',
};

export const SUBSCRIPTION_VALUES: Record<SubscriptionType, number | number[]> = {
  monthly_both: [45, 35],
  monthly_one:  45,
  daily:        15,
  goalkeeper:   0,
};

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday:    'Segunda',
  tuesday:   'Terça',
  wednesday: 'Quarta',
  thursday:  'Quinta',
  friday:    'Sexta',
  saturday:  'Sábado',
  sunday:    'Domingo',
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  monday:    'Seg',
  tuesday:   'Ter',
  wednesday: 'Qua',
  thursday:  'Qui',
  friday:    'Sex',
  saturday:  'Sáb',
  sunday:    'Dom',
};

export type Player = {
  id: string;
  name: string;
  phone: string;
  is_admin: boolean;
  is_goalkeeper: boolean;
  avatar: string | null;
  positions: String[] | null;
  subscription_type: SubscriptionType;
  match_days: DayOfWeek[];
  created_at: string;
};

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
