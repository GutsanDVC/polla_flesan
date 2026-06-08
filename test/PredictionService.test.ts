import { describe, it, expect } from 'vitest';
import { PredictionService } from '../server/services/PredictionService';
import type { Match } from '../types/domain';

function makeMatch(id: number, homeId: number, homeName: string, awayId: number, awayName: string): Match {
  return {
    id,
    utc_date: '2026-06-11T16:00:00Z',
    phase: 'GROUP',
    group: 'A',
    matchday: 1,
    status: 'SCHEDULED',
    home_team_id: homeId,
    away_team_id: awayId,
    home_score: null,
    away_score: null,
    homeTeam: { id: homeId, name: homeName, short_name: null, tla: null, crest_url: null, country_code: null },
    awayTeam: { id: awayId, name: awayName, short_name: null, tla: null, crest_url: null, country_code: null },
  };
}

describe('PredictionService - calculateStandings', () => {
  const service = new PredictionService();

  it('should sort teams by points, then goal difference, then goals for', () => {
    const matches = [
      makeMatch(1, 10, 'A', 20, 'B'),
      makeMatch(2, 10, 'A', 30, 'C'),
      makeMatch(3, 20, 'B', 30, 'C'),
    ];

    const predictions = [
      { match_id: 1, home_score_pred: 2, away_score_pred: 1 },
      { match_id: 2, home_score_pred: 3, away_score_pred: 0 },
      { match_id: 3, home_score_pred: 1, away_score_pred: 1 },
    ];

    const standing = service.calculateStandings(matches, predictions);

    expect(standing[0].name).toBe('A');
    expect(standing[0].points).toBe(6);
    expect(standing[1].name).toBe('B');
    expect(standing[2].name).toBe('C');
  });

  it('should handle empty predictions', () => {
    const matches = [makeMatch(1, 10, 'A', 20, 'B')];

    const standing = service.calculateStandings(matches, []);

    expect(standing.map(s => s.name)).toContain('A');
    expect(standing.map(s => s.name)).toContain('B');
  });

  it('should handle ties by goal difference', () => {
    const matches = [makeMatch(1, 10, 'A', 20, 'B')];
    const predictions = [{ match_id: 1, home_score_pred: 1, away_score_pred: 1 }];

    const standing = service.calculateStandings(matches, predictions);

    expect(standing.map(s => s.name)).toEqual(['A', 'B']);
  });

  it('should fall back to team_id when homeTeam/awayTeam are missing', () => {
    const matches: Match[] = [
      {
        id: 1,
        utc_date: '2026-06-11T16:00:00Z',
        phase: 'GROUP',
        group: 'A',
        matchday: 1,
        status: 'SCHEDULED',
        home_team_id: 10,
        away_team_id: 20,
        home_score: null,
        away_score: null,
      },
    ];

    const standing = service.calculateStandings(matches, []);
    expect(standing.map(s => s.name)).toContain('#10');
    expect(standing.map(s => s.name)).toContain('#20');
  });
});
