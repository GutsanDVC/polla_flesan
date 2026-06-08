import { dbClient } from '../utils/db';
import type { Match, Phase, Team } from '~~/types/domain';

interface MatchRow extends Match {
  home_team_name: string;
  home_team_short: string | null;
  home_team_tla: string | null;
  home_team_crest: string | null;
  home_team_country: string | null;
  away_team_name: string;
  away_team_short: string | null;
  away_team_tla: string | null;
  away_team_crest: string | null;
  away_team_country: string | null;
}

function hydrate(row: MatchRow): Match {
  const homeTeam: Team = {
    id: row.home_team_id,
    name: row.home_team_name,
    short_name: row.home_team_short,
    tla: row.home_team_tla,
    crest_url: row.home_team_crest,
    country_code: row.home_team_country,
  };
  const awayTeam: Team = {
    id: row.away_team_id,
    name: row.away_team_name,
    short_name: row.away_team_short,
    tla: row.away_team_tla,
    crest_url: row.away_team_crest,
    country_code: row.away_team_country,
  };
  return {
    id: row.id,
    utc_date: row.utc_date,
    phase: row.phase,
    group: row.group,
    matchday: row.matchday,
    status: row.status,
    home_team_id: row.home_team_id,
    away_team_id: row.away_team_id,
    home_score: row.home_score,
    away_score: row.away_score,
    last_synced_at: row.last_synced_at,
    homeTeam,
    awayTeam,
  };
}

const SELECT_WITH_TEAMS = `
  SELECT
    m.id, m.utc_date, m.phase, m.group, m.matchday, m.status,
    m.home_team_id, m.away_team_id, m.home_score, m.away_score, m.last_synced_at,
    ht.name  AS home_team_name,  ht.short_name AS home_team_short,  ht.tla AS home_team_tla,  ht.crest_url AS home_team_crest,  ht.country_code AS home_team_country,
    at.name  AS away_team_name,  at.short_name AS away_team_short,  at.tla AS away_team_tla,  at.crest_url AS away_team_crest,  at.country_code AS away_team_country
  FROM matches m
  JOIN teams ht ON ht.id = m.home_team_id
  JOIN teams at ON at.id = m.away_team_id
`;

export class MatchRepository {
  async getAllMatches(phase?: Phase): Promise<Match[]> {
    const values: any[] = [];
    let query = `${SELECT_WITH_TEAMS}`;
    if (phase) {
      query += ` WHERE m.phase = $1`;
      values.push(phase);
    }
    query += ` ORDER BY m.utc_date ASC`;
    const res = await dbClient.query(query, values);
    return res.rows.map((r) => hydrate(r));
  }

  async getMatchById(id: number): Promise<Match | null> {
    const res = await dbClient.query(`${SELECT_WITH_TEAMS} WHERE m.id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return hydrate(res.rows[0]);
  }

  async getMatchesByGroup(group: string): Promise<Match[]> {
    const res = await dbClient.query(
      `${SELECT_WITH_TEAMS} WHERE m.phase = 'GROUP' AND m.group = $1 ORDER BY m.utc_date ASC`,
      [group],
    );
    return res.rows.map((r) => hydrate(r));
  }

  async getMatchesByPhase(phase: Phase): Promise<Match[]> {
    const res = await dbClient.query(
      `${SELECT_WITH_TEAMS} WHERE m.phase = $1 ORDER BY m.utc_date ASC`,
      [phase],
    );
    return res.rows.map((r) => hydrate(r));
  }

  async getMinDateByPhase(phase: Phase): Promise<string | null> {
    const res = await dbClient.query(
      `SELECT MIN(utc_date) AS min_date FROM matches WHERE phase = $1`,
      [phase],
    );
    return res.rows[0]?.min_date ?? null;
  }

  async getCount(): Promise<number> {
    const res = await dbClient.query('SELECT COUNT(*)::int AS c FROM matches');
    return res.rows[0]?.c ?? 0;
  }

  async getFinishedIds(): Promise<number[]> {
    const res = await dbClient.query(
      'SELECT id FROM matches WHERE status = $1 AND home_score IS NOT NULL AND away_score IS NOT NULL',
      ['FINISHED'],
    );
    return res.rows.map((r) => r.id);
  }

  async upsertMatch(match: Omit<Match, 'homeTeam' | 'awayTeam'>): Promise<number> {
    const res = await dbClient.query(
      `
      INSERT INTO matches (
        id, utc_date, phase, "group", matchday, status,
        home_team_id, away_team_id,
        home_score, away_score, last_synced_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        utc_date       = EXCLUDED.utc_date,
        phase          = EXCLUDED.phase,
        "group"        = EXCLUDED."group",
        matchday       = EXCLUDED.matchday,
        status         = EXCLUDED.status,
        home_team_id   = EXCLUDED.home_team_id,
        away_team_id   = EXCLUDED.away_team_id,
        home_score     = EXCLUDED.home_score,
        away_score     = EXCLUDED.away_score,
        last_synced_at = EXCLUDED.last_synced_at
      RETURNING id
      `,
      [
        match.id,
        match.utc_date,
        match.phase,
        match.group,
        match.matchday,
        match.status,
        match.home_team_id,
        match.away_team_id,
        match.home_score,
        match.away_score,
        match.last_synced_at ?? new Date().toISOString(),
      ],
    );
    return res.rows[0].id;
  }

  async setMatchResult(
    matchId: number,
    homeScore: number,
    awayScore: number,
  ): Promise<Match | null> {
    const res = await dbClient.query(
      `
      UPDATE matches
      SET
        home_score = $1,
        away_score = $2,
        status     = 'FINISHED'
      WHERE id = $3
      RETURNING id
      `,
      [homeScore, awayScore, matchId],
    );
    if (res.rows.length === 0) return null;
    return this.getMatchById(matchId);
  }
}
