// Tipos compartidos del dominio - disponibles en cliente y servidor
// Acceso desde cualquier archivo: import type { Match, User, ... } from '~~/types/domain'

export type Phase =
  | 'GROUP'
  | 'R32'
  | 'R16'
  | 'QUARTERS'
  | 'SEMIS'
  | 'THIRD_PLACE'
  | 'FINAL';

export const PHASES: readonly Phase[] = [
  'GROUP',
  'R32',
  'R16',
  'QUARTERS',
  'SEMIS',
  'THIRD_PLACE',
  'FINAL',
] as const;

export const PHASE_LABELS: Record<Phase, string> = {
  GROUP: 'Fase de Grupos',
  R32: 'Dieciseisavos de Final',
  R16: 'Octavos de Final',
  QUARTERS: 'Cuartos de Final',
  SEMIS: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
};

export const PHASE_MULTIPLIERS: Record<Phase, number> = {
  GROUP: 1,
  R32: 2,
  R16: 4,
  QUARTERS: 8,
  SEMIS: 16,
  THIRD_PLACE: 32,
  FINAL: 64,
};

export type UserStatus = 'PENDING' | 'APPROVED' | 'BLOCKED';

export type UserRole = 'USER' | 'ADMIN';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  payment_status: string;
  payment_receipt_url: string | null;
  created_at?: string;
}

export interface Team {
  id: number;
  name: string;
  short_name: string | null;
  tla: string | null;
  crest_url: string | null;
  country_code: string | null;
}

export interface Match {
  id: number;
  utc_date: string;
  phase: Phase;
  group: string | null;             // 'A'..'L' en GROUP, null en eliminatorias
  matchday: number | null;
  status: MatchStatus;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;        // resultado real (de API)
  away_score: number | null;        // resultado real (de API)
  last_synced_at?: string;
  // Joins opcionales (poblados por repos)
  homeTeam?: Team;
  awayTeam?: Team;
}

export interface MatchPrediction {
  id: string;
  user_id: string;
  match_id: number;
  home_score_pred: number;
  away_score_pred: number;
  calculated_points: number;
  processed: boolean;
  updated_at?: string;
}

export interface MatchPredictionWithMatch extends MatchPrediction {
  utc_date: string;
  phase: Phase;
  group: string | null;
  matchday: number | null;
  home_score: number | null;
  away_score: number | null;
  match_status: MatchStatus;
  homeTeam?: Team;
  awayTeam?: Team;
}

export interface GroupPrediction {
  id: string;
  user_id: string;
  group: string;
  pos_1_team: string;
  pos_2_team: string;
  pos_3_team: string;
  calculated_points: number;
  processed: boolean;
  updated_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  full_name: string;
  avatar_url: string | null;
  totalPoints: number;
  breakdown: {
    match: number;
    group: number;
  };
}

export interface GroupStanding {
  group: string;
  positions: Array<{
    pos: 1 | 2 | 3 | 4;
    team: Team;
    points: number;
    gd: number;
    gf: number;
    played: number;
  }>;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface SyncResult {
  created: number;
  updated: number;
  finished: number;
  errors: string[];
  durationMs: number;
  fetchedAt: string;
  total: number;
}

declare module 'h3' {
  interface H3EventContext {
    user?: SessionUser;
  }
}
