import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FDCompetitionMatchesResponse, FDMatch, FDTeam } from '../types/football-data';
import type { Match } from '../types/domain';

vi.mock('../server/config/api', () => ({
  getFootballDataConfig: () => ({
    apiToken: 'test-token',
    baseUrl: 'https://api.football-data.org/v4',
    worldCupCompetitionId: 2000,
  }),
}));

const matchRepoMock = {
  getAllMatches: vi.fn(),
  upsertMatch: vi.fn(),
  setMatchResult: vi.fn(),
};
const teamRepoMock = {
  upsert: vi.fn(),
};
const pointsCalcMock = {
  processMatchResults: vi.fn(),
};

vi.mock('../server/repositories/MatchRepository', () => ({
  MatchRepository: vi.fn().mockImplementation(() => matchRepoMock),
}));
vi.mock('../server/repositories/TeamRepository', () => ({
  TeamRepository: vi.fn().mockImplementation(() => teamRepoMock),
}));
vi.mock('../server/services/PointsCalculatorService', () => ({
  PointsCalculatorService: vi.fn().mockImplementation(() => pointsCalcMock),
}));

import { MatchSyncService } from '../server/services/MatchSyncService';

function makeTeam(id: number, name: string, tla: string): FDTeam {
  return { id, name, shortName: name, tla, crest: `https://crests.example/${id}.svg` };
}

function makeMatch(
  id: number,
  stage: string,
  status: FDMatch['status'],
  home: FDTeam,
  away: FDTeam,
  homeScore: number | null = null,
  awayScore: number | null = null,
): FDMatch {
  return {
    id,
    utcDate: '2026-06-13T20:00:00Z',
    status,
    matchday: 1,
    stage,
    group: stage === 'GROUP_STAGE' ? 'GROUP_A' : null,
    homeTeam: home,
    awayTeam: away,
    score: {
      winner: null,
      duration: 'REGULAR',
      fullTime: { home: homeScore, away: awayScore },
      halfTime: { home: null, away: null },
    },
    lastUpdated: '2026-06-01T00:00:00Z',
  };
}

function makeResponse(matches: FDMatch[]): FDCompetitionMatchesResponse {
  return {
    filters: { season: '2026' },
    resultSet: { count: matches.length, first: '2026-06-11', last: '2026-07-19', played: 0 },
    competition: { id: 2000, name: 'FIFA World Cup', code: 'WC', type: 'CUP', emblem: '' },
    matches,
  };
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  } as Response;
}

describe('MatchSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    teamRepoMock.upsert.mockResolvedValue({});
    matchRepoMock.upsertMatch.mockResolvedValue(1);
    matchRepoMock.getAllMatches.mockResolvedValue([]);
    pointsCalcMock.processMatchResults.mockResolvedValue(undefined);
  });

  it('upserts all teams and all matches, triggering point calc only for newly finished', async () => {
    const t1 = makeTeam(1, 'Mexico', 'MEX');
    const t2 = makeTeam(2, 'South Africa', 'RSA');
    const t3 = makeTeam(3, 'France', 'FRA');
    const t4 = makeTeam(4, 'Saudi Arabia', 'KSA');

    const scheduled = makeMatch(101, 'GROUP_STAGE', 'TIMED', t1, t2);
    const liveMatch = makeMatch(102, 'GROUP_STAGE', 'IN_PLAY', t3, t4);
    const newlyFinished = makeMatch(103, 'GROUP_STAGE', 'FINISHED', t1, t3, 2, 1);
    const wasFinished = makeMatch(104, 'GROUP_STAGE', 'FINISHED', t2, t4, 1, 1);

    const existing: Match[] = [
      {
        id: 104,
        utc_date: '2026-06-13T20:00:00Z',
        phase: 'GROUP',
        group: 'A',
        matchday: 1,
        status: 'FINISHED',
        home_team_id: 2,
        away_team_id: 4,
        home_score: 1,
        away_score: 1,
      },
    ];
    matchRepoMock.getAllMatches.mockResolvedValue(existing);

    const fetchMock = vi.fn().mockResolvedValue(
      makeJsonResponse(
        makeResponse([scheduled, liveMatch, newlyFinished, wasFinished]),
      ),
    );

    const service = new MatchSyncService();
    const result = await service.run({ fetchImpl: fetchMock as any });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(teamRepoMock.upsert).toHaveBeenCalledTimes(4);
    expect(matchRepoMock.upsertMatch).toHaveBeenCalledTimes(4);
    expect(result.total).toBe(4);
    expect(result.created).toBe(3);
    expect(result.updated).toBe(1);
    expect(result.finished).toBe(1);
    expect(pointsCalcMock.processMatchResults).toHaveBeenCalledTimes(1);
    expect(pointsCalcMock.processMatchResults).toHaveBeenCalledWith(103, 2, 1, 'GROUP');
  });

  it('does not trigger point calculation for matches still scheduled', async () => {
    const t1 = makeTeam(1, 'Mexico', 'MEX');
    const t2 = makeTeam(2, 'Brazil', 'BRA');

    const m = makeMatch(201, 'GROUP_STAGE', 'TIMED', t1, t2);
    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeResponse([m])));

    const service = new MatchSyncService();
    const result = await service.run({ fetchImpl: fetchMock as any });

    expect(result.finished).toBe(0);
    expect(pointsCalcMock.processMatchResults).not.toHaveBeenCalled();
  });

  it('skips matches with unknown stage and reports zero total for that match', async () => {
    const t1 = makeTeam(1, 'Mexico', 'MEX');
    const t2 = makeTeam(2, 'Brazil', 'BRA');
    const valid = makeMatch(301, 'GROUP_STAGE', 'TIMED', t1, t2);
    const unknown = makeMatch(302, 'PRELIMINARY_ROUND', 'TIMED', t1, t2);
    const fetchMock = vi.fn().mockResolvedValue(
      makeJsonResponse(makeResponse([valid, unknown])),
    );

    const service = new MatchSyncService();
    const result = await service.run({ fetchImpl: fetchMock as any });

    expect(result.total).toBe(2);
    expect(matchRepoMock.upsertMatch).toHaveBeenCalledTimes(1);
  });

  it('captures team upsert errors but continues processing', async () => {
    const t1 = makeTeam(1, 'Mexico', 'MEX');
    const t2 = makeTeam(2, 'Brazil', 'BRA');
    const m = makeMatch(401, 'GROUP_STAGE', 'TIMED', t1, t2);

    teamRepoMock.upsert.mockRejectedValueOnce(new Error('DB unreachable'));

    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse(makeResponse([m])));
    const service = new MatchSyncService();
    const result = await service.run({ fetchImpl: fetchMock as any });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('team 1');
  });
});
