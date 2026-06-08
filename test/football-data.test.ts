import { describe, it, expect } from 'vitest';
import {
  STAGE_MAP,
  STATUS_MAP,
  collectTeams,
  mapMatch,
  mapTeam,
  parseGroupLetter,
} from '../server/utils/football-data';
import type { FDMatch, FDTeam } from '../types/football-data';

function makeFDTeam(overrides: Partial<FDTeam> = {}): FDTeam {
  return {
    id: 1,
    name: 'Brazil',
    shortName: 'Brazil',
    tla: 'BRA',
    crest: 'https://crests.football-data.org/764.svg',
    ...overrides,
  };
}

function makeFDMatch(overrides: Partial<FDMatch> = {}): FDMatch {
  return {
    id: 537327,
    utcDate: '2026-06-13T20:00:00Z',
    status: 'TIMED',
    matchday: 1,
    stage: 'GROUP_STAGE',
    group: 'GROUP_A',
    homeTeam: makeFDTeam({ id: 1, name: 'Mexico', tla: 'MEX' }),
    awayTeam: makeFDTeam({ id: 2, name: 'South Africa', tla: 'RSA' }),
    score: {
      winner: null,
      duration: 'REGULAR',
      fullTime: { home: null, away: null },
      halfTime: { home: null, away: null },
    },
    lastUpdated: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('STAGE_MAP', () => {
  it('maps API stage codes to internal Phase enum', () => {
    expect(STAGE_MAP.GROUP_STAGE).toBe('GROUP');
    expect(STAGE_MAP.LAST_32).toBe('R32');
    expect(STAGE_MAP.LAST_16).toBe('R16');
    expect(STAGE_MAP.QUARTER_FINALS).toBe('QUARTERS');
    expect(STAGE_MAP.SEMI_FINALS).toBe('SEMIS');
    expect(STAGE_MAP.THIRD_PLACE).toBe('THIRD_PLACE');
    expect(STAGE_MAP.FINAL).toBe('FINAL');
  });
});

describe('STATUS_MAP', () => {
  it('collapses pre-game statuses to SCHEDULED', () => {
    expect(STATUS_MAP.TIMED).toBe('SCHEDULED');
    expect(STATUS_MAP.SCHEDULED).toBe('SCHEDULED');
    expect(STATUS_MAP.POSTPONED).toBe('SCHEDULED');
  });

  it('collapses in-game statuses to LIVE', () => {
    expect(STATUS_MAP.IN_PLAY).toBe('LIVE');
    expect(STATUS_MAP.PAUSED).toBe('LIVE');
    expect(STATUS_MAP.HALFTIME).toBe('LIVE');
    expect(STATUS_MAP.SUSPENDED).toBe('LIVE');
  });

  it('keeps FINISHED as FINISHED', () => {
    expect(STATUS_MAP.FINISHED).toBe('FINISHED');
  });
});

describe('parseGroupLetter', () => {
  it('strips GROUP_ prefix to single letter', () => {
    expect(parseGroupLetter('GROUP_A')).toBe('A');
    expect(parseGroupLetter('GROUP_L')).toBe('L');
  });

  it('returns null when input is null', () => {
    expect(parseGroupLetter(null)).toBe(null);
  });

  it('returns null for malformed input', () => {
    expect(parseGroupLetter('NOT_A_GROUP')).toBe(null);
    expect(parseGroupLetter('GROUP_AB')).toBe(null);
    expect(parseGroupLetter('A')).toBe(null);
  });
});

describe('mapTeam', () => {
  it('maps FDTeam to Team domain', () => {
    const fd = makeFDTeam({ id: 764, name: 'Brazil', tla: 'BRA' });
    const t = mapTeam(fd);
    expect(t.id).toBe(764);
    expect(t.name).toBe('Brazil');
    expect(t.tla).toBe('BRA');
    expect(t.crest_url).toBe(fd.crest);
    expect(t.country_code).toBe(null);
  });
});

describe('mapMatch', () => {
  it('maps a group stage match', () => {
    const fd = makeFDMatch();
    const m = mapMatch(fd);
    expect(m).not.toBeNull();
    expect(m!.id).toBe(537327);
    expect(m!.phase).toBe('GROUP');
    expect(m!.group).toBe('A');
    expect(m!.status).toBe('SCHEDULED');
    expect(m!.home_team_id).toBe(1);
    expect(m!.away_team_id).toBe(2);
    expect(m!.home_score).toBe(null);
    expect(m!.away_score).toBe(null);
  });

  it('maps a LAST_16 match to R16 phase (group null)', () => {
    const fd = makeFDMatch({ stage: 'LAST_16', group: null, matchday: null });
    const m = mapMatch(fd);
    expect(m).not.toBeNull();
    expect(m!.phase).toBe('R16');
    expect(m!.group).toBe(null);
  });

  it('maps FINISHED status with scores', () => {
    const fd = makeFDMatch({
      status: 'FINISHED',
      score: {
        winner: 'HOME_TEAM',
        duration: 'REGULAR',
        fullTime: { home: 3, away: 1 },
        halfTime: { home: 1, away: 0 },
      },
    });
    const m = mapMatch(fd);
    expect(m).not.toBeNull();
    expect(m!.status).toBe('FINISHED');
    expect(m!.home_score).toBe(3);
    expect(m!.away_score).toBe(1);
  });

  it('returns null for unknown stage', () => {
    const fd = makeFDMatch({ stage: 'PRELIMINARY_ROUND' });
    const m = mapMatch(fd);
    expect(m).toBeNull();
  });

  it('sets last_synced_at to a valid ISO date', () => {
    const m = mapMatch(makeFDMatch());
    expect(m!.last_synced_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('collectTeams', () => {
  it('deduplicates teams across matches', () => {
    const t1 = makeFDTeam({ id: 1, name: 'Mexico' });
    const t2 = makeFDTeam({ id: 2, name: 'Brazil' });
    const t3 = makeFDTeam({ id: 3, name: 'Germany' });

    const matches: FDMatch[] = [
      makeFDMatch({ id: 1, homeTeam: t1, awayTeam: t2 }),
      makeFDMatch({ id: 2, homeTeam: t2, awayTeam: t3 }),
      makeFDMatch({ id: 3, homeTeam: t1, awayTeam: t3 }),
    ];

    const teams = collectTeams(matches);
    expect(teams).toHaveLength(3);
    expect(teams.map((t) => t.id).sort()).toEqual([1, 2, 3]);
  });

  it('returns empty array for no matches', () => {
    expect(collectTeams([])).toEqual([]);
  });
});
