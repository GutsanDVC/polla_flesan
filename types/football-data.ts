// Tipos del response de football-data.org v4
// Documentación: https://docs.football-data.org/general/v4/competitions.html

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FDTeamContainer {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FDScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface FDSeason {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number;
  winner: FDTeamContainer | null;
}

export interface FDCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status:
    | 'SCHEDULED'
    | 'LIVE'
    | 'IN_PLAY'
    | 'PAUSED'
    | 'FINISHED'
    | 'POSTPONED'
    | 'SUSPENDED'
    | 'CANCELLED'
    | 'TIMED'
    | 'HALFTIME';
  matchday: number | null;
  stage: string;
  group: string | null; // e.g. "GROUP_A", null en eliminatorias
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
  lastUpdated: string;
}

export interface FDCompetitionMatchesResponse {
  filters: { season: string };
  resultSet: {
    count: number;
    first: string;
    last: string;
    played: number;
  };
  competition: FDCompetition;
  matches: FDMatch[];
}
