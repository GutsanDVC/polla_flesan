import type { FDCompetitionMatchesResponse, FDMatch, FDTeam } from '~~/types/football-data';
import type { Match, MatchStatus, Phase, Team } from '~~/types/domain';
import { getFootballDataConfig } from '../config/api';

export const STAGE_MAP: Record<string, Phase> = {
  GROUP_STAGE: 'GROUP',
  LAST_32: 'R32',
  LAST_16: 'R16',
  QUARTER_FINALS: 'QUARTERS',
  SEMI_FINALS: 'SEMIS',
  THIRD_PLACE: 'THIRD_PLACE',
  FINAL: 'FINAL',
};

export const STATUS_MAP: Record<string, MatchStatus> = {
  TIMED: 'SCHEDULED',
  SCHEDULED: 'SCHEDULED',
  POSTPONED: 'SCHEDULED',
  SUSPENDED: 'LIVE',
  IN_PLAY: 'LIVE',
  PAUSED: 'LIVE',
  HALFTIME: 'LIVE',
  FINISHED: 'FINISHED',
  CANCELLED: 'SCHEDULED',
};

export function parseGroupLetter(group: string | null): string | null {
  if (!group) return null;
  // API: "GROUP_A" → "A"
  const match = group.match(/^GROUP_([A-Z])$/);
  return match ? match[1] : null;
}

export function mapTeam(t: FDTeam): Team {
  return {
    id: t.id,
    name: t.name,
    short_name: t.shortName,
    tla: t.tla,
    crest_url: t.crest,
    country_code: null,
  };
}

export type MappedMatch = Omit<Match, 'homeTeam' | 'awayTeam'>;

export function mapMatch(m: FDMatch): MappedMatch | null {
  const phase = STAGE_MAP[m.stage];
  if (!phase) return null;

  const status = STATUS_MAP[m.status] ?? 'SCHEDULED';
  const group = phase === 'GROUP' ? parseGroupLetter(m.group) : null;

  return {
    id: m.id,
    utc_date: m.utcDate,
    phase,
    group,
    matchday: m.matchday,
    status,
    home_team_id: m.homeTeam.id,
    away_team_id: m.awayTeam.id,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    last_synced_at: new Date().toISOString(),
  };
}

export interface FetchOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  fetchImpl?: typeof fetch;
}

export async function fetchWorldCupMatches(
  opts: FetchOptions = {},
): Promise<FDCompetitionMatchesResponse> {
  const { maxRetries = 2, initialDelayMs = 2000, fetchImpl = globalThis.fetch } = opts;
  const cfg = getFootballDataConfig();
  const url = `${cfg.baseUrl}/competitions/${cfg.worldCupCompetitionId}/matches`;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchImpl(url, {
        headers: { 'X-Auth-Token': cfg.apiToken },
      });
      if (res.status === 429) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (!res.ok) {
        throw new Error(`football-data.org responded ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as FDCompetitionMatchesResponse;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr ?? new Error('fetchWorldCupMatches failed');
}

export function collectTeams(matches: FDMatch[]): FDTeam[] {
  const map = new Map<number, FDTeam>();
  for (const m of matches) {
    if (!map.has(m.homeTeam.id)) map.set(m.homeTeam.id, m.homeTeam);
    if (!map.has(m.awayTeam.id)) map.set(m.awayTeam.id, m.awayTeam);
  }
  return [...map.values()];
}
