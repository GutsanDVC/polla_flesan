import { dbClient } from '../utils/db';
import type { MatchPredictionWithMatch, Team } from '~~/types/domain';

interface PredictionRow extends Omit<MatchPredictionWithMatch, 'homeTeam' | 'awayTeam'> {
  home_team_id: number;
  away_team_id: number;
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

function hydrate(r: PredictionRow): MatchPredictionWithMatch {
  const homeTeam: Team = {
    id: r.home_team_id,
    name: r.home_team_name,
    short_name: r.home_team_short,
    tla: r.home_team_tla,
    crest_url: r.home_team_crest,
    country_code: r.home_team_country,
  };
  const awayTeam: Team = {
    id: r.away_team_id,
    name: r.away_team_name,
    short_name: r.away_team_short,
    tla: r.away_team_tla,
    crest_url: r.away_team_crest,
    country_code: r.away_team_country,
  };
  return {
    id: r.id,
    user_id: r.user_id,
    match_id: r.match_id,
    home_score_pred: r.home_score_pred,
    away_score_pred: r.away_score_pred,
    calculated_points: r.calculated_points,
    processed: r.processed,
    updated_at: r.updated_at,
    utc_date: r.utc_date,
    phase: r.phase,
    group: r.group,
    matchday: r.matchday,
    home_score: r.home_score,
    away_score: r.away_score,
    match_status: r.match_status,
    homeTeam,
    awayTeam,
  };
}

const SELECT_PREDICTION_WITH_MATCH = `
  SELECT
    mp.id, mp.user_id, mp.match_id,
    mp.home_score_pred, mp.away_score_pred,
    mp.calculated_points, mp.processed, mp.updated_at,
    m.utc_date, m.phase, m.group, m.matchday,
    m.home_score, m.away_score, m.status AS match_status,
    m.home_team_id, m.away_team_id,
    ht.name AS home_team_name, ht.short_name AS home_team_short,
    ht.tla AS home_team_tla, ht.crest_url AS home_team_crest, ht.country_code AS home_team_country,
    at.name AS away_team_name, at.short_name AS away_team_short,
    at.tla AS away_team_tla, at.crest_url AS away_team_crest, at.country_code AS away_team_country
  FROM match_predictions mp
  JOIN matches m ON m.id = mp.match_id
  JOIN teams ht ON ht.id = m.home_team_id
  JOIN teams at ON at.id = m.away_team_id
`;

export class PredictionRepository {
  async upsertMatchPrediction(userId: string, matchId: number, homeScore: number, awayScore: number) {
    const query = `
      INSERT INTO match_predictions (user_id, match_id, home_score_pred, away_score_pred, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, match_id)
      DO UPDATE SET
        home_score_pred = EXCLUDED.home_score_pred,
        away_score_pred = EXCLUDED.away_score_pred,
        updated_at = NOW()
      RETURNING *
    `;
    const res = await dbClient.query(query, [userId, matchId, homeScore, awayScore]);
    return res.rows[0];
  }

  async getPredictionsByUser(userId: string): Promise<MatchPredictionWithMatch[]> {
    const res = await dbClient.query(
      `${SELECT_PREDICTION_WITH_MATCH} WHERE mp.user_id = $1 ORDER BY m.utc_date ASC`,
      [userId],
    );
    return res.rows.map((r) => hydrate(r));
  }

  async getPredictionByUserAndMatch(userId: string, matchId: number) {
    const res = await dbClient.query(
      'SELECT * FROM match_predictions WHERE user_id = $1 AND match_id = $2',
      [userId, matchId],
    );
    return res.rows[0] ?? null;
  }

  async getPredictionsByMatch(matchId: number) {
    const res = await dbClient.query(
      'SELECT * FROM match_predictions WHERE match_id = $1',
      [matchId],
    );
    return res.rows;
  }

  async getPredictionsByUserAndMatches(userId: string, matchIds: number[]) {
    if (matchIds.length === 0) return [];
    const res = await dbClient.query(
      'SELECT * FROM match_predictions WHERE user_id = $1 AND match_id = ANY($2)',
      [userId, matchIds],
    );
    return res.rows;
  }

  async upsertGroupPrediction(
    userId: string,
    group: string,
    pos1: string,
    pos2: string,
    pos3: string,
  ) {
    const query = `
      INSERT INTO group_predictions (user_id, "group", pos_1_team, pos_2_team, pos_3_team, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id, "group")
      DO UPDATE SET
        pos_1_team = EXCLUDED.pos_1_team,
        pos_2_team = EXCLUDED.pos_2_team,
        pos_3_team = EXCLUDED.pos_3_team,
        updated_at = NOW()
      RETURNING *
    `;
    const res = await dbClient.query(query, [userId, group, pos1, pos2, pos3]);
    return res.rows[0];
  }

  async getGroupPredictionsByUser(userId: string) {
    const res = await dbClient.query(
      'SELECT * FROM group_predictions WHERE user_id = $1 ORDER BY "group" ASC',
      [userId],
    );
    return res.rows;
  }

  async updatePredictionPoints(predictionId: string, points: number) {
    const res = await dbClient.query(
      `UPDATE match_predictions
       SET calculated_points = $1, processed = TRUE
       WHERE id = $2
       RETURNING *`,
      [points, predictionId],
    );
    return res.rows[0];
  }
}
