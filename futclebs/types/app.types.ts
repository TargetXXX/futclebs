import { Match, Organization } from '@/services/axios';

export enum Step {
  PHONE_CHECK,
  LOGIN,
  REGISTER
}

export type MatchCategory = 'open' | 'pending' | 'finished' | 'ranking';

export interface MatchWithExtras extends Match {
  playerCount: number;
  isUserRegistered: boolean;
  hasPendingVotes?: boolean;
}

export interface PlayerData {
  name: string;
  username: string | null;
  email: string | null;
  is_goalkeeper: boolean;
  stats: any | null;
  avatar?: string | null;
  primary_position: string;
  secondary_position: string | null;
  is_verified: boolean;
  organizations: Organization[] | null;
}

