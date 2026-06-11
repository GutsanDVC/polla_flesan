import { dbClient, SCHEMA } from '../utils/db';
import { PointsCalculatorService } from './PointsCalculatorService';
import type { Phase } from '~~/types/domain';

interface LiveMatchRow {
  id: number;
  utc_date: string;
  phase: Phase;
  group: string | null;
  matchday: number | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  home_team_crest: string | null;
  away_team_name: string;
  away_team_crest: string | null;
  last_synced_at: string | null;
}

interface PredictionRow {
  id: string;
  user_id: string;
  match_id: number;
  home_score_pred: number;
  away_score_pred: number;
  calculated_points: number;
  processed: boolean;
  full_name: string;
  avatar_url: string | null;
}

export interface LivePrediction {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  home_score_pred: number;
  away_score_pred: number;
  tentative_points: number;
  status: 'exact' | 'winner' | 'none';
}

export interface LiveMatch {
  id: number;
  utc_date: string;
  phase: Phase;
  group: string | null;
  matchday: number | null;
  status: string;
  home_team: { name: string; crest_url: string | null };
  away_team: { name: string; crest_url: string | null };
  home_score: number | null;
  away_score: number | null;
  predictions: LivePrediction[];
}

export interface LiveResponse {
  matches: LiveMatch[];
  last_synced_at: string;
  total_matches: number;
  live_count: number;
}

export class LiveScoreService {
  private pointsCalculator = new PointsCalculatorService();

  async getLiveData(): Promise<LiveResponse> {
    const matches = await this.getAllMatchesWithTeams();
    const allMatchIds = matches.map((m) => m.id);

    const predictions = allMatchIds.length > 0
      ? await this.getPredictionsForMatches(allMatchIds)
      : [];

    const predictionsByMatch = new Map<number, PredictionRow[]>();
    for (const pred of predictions) {
      if (!predictionsByMatch.has(pred.match_id)) {
        predictionsByMatch.set(pred.match_id, []);
      }
      predictionsByMatch.get(pred.match_id)!.push(pred);
    }

    const liveMatches: LiveMatch[] = matches.map((match) => {
      const matchPredictions = predictionsByMatch.get(match.id) ?? [];
      const livePredictions = matchPredictions.map((pred) =>
        this.buildLivePrediction(pred, match)
      );

      livePredictions.sort((a, b) => {
        if (b.tentative_points !== a.tentative_points) {
          return b.tentative_points - a.tentative_points;
        }
        if (a.status === 'exact' && b.status !== 'exact') return -1;
        if (a.status !== 'exact' && b.status === 'exact') return 1;
        return 0;
      });

      return {
        id: match.id,
        utc_date: match.utc_date,
        phase: match.phase,
        group: match.group,
        matchday: match.matchday,
        status: match.status,
        home_team: { name: match.home_team_name, crest_url: match.home_team_crest },
        away_team: { name: match.away_team_name, crest_url: match.away_team_crest },
        home_score: match.home_score,
        away_score: match.away_score,
        predictions: livePredictions,
      };
    });

    liveMatches.sort((a, b) => {
      const statusOrder: Record<string, number> = { LIVE: 0, SCHEDULED: 1, FINISHED: 2 };
      const aOrder = statusOrder[a.status] ?? 3;
      const bOrder = statusOrder[b.status] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime();
    });

    const lastSync = matches.length > 0
      ? matches.reduce((latest, m) => {
          const synced = m.last_synced_at;
          return synced && synced > latest ? synced : latest;
        }, '')
      : new Date().toISOString();

    return {
      matches: liveMatches,
      last_synced_at: lastSync,
      total_matches: liveMatches.length,
      live_count: liveMatches.filter((m) => m.status === 'LIVE').length,
    };
  }

  async hasLiveMatches(): Promise<boolean> {
    const res = await dbClient.query(
      `SELECT 1 FROM ${SCHEMA}.matches WHERE status = 'LIVE' LIMIT 1`
    );
    return res.rows.length > 0;
  }

  private buildLivePrediction(pred: PredictionRow, match: LiveMatchRow): LivePrediction {
    let tentativePoints = 0;
    let status: 'exact' | 'winner' | 'none' = 'none';

    if (match.home_score !== null && match.away_score !== null) {
      tentativePoints = this.pointsCalculator.calculatePointsForMatch(
        match.home_score,
        match.away_score,
        pred.home_score_pred,
        pred.away_score_pred,
        match.phase,
      );

      const isExact = match.home_score === pred.home_score_pred &&
                       match.away_score === pred.away_score_pred;
      if (isExact) {
        status = 'exact';
      } else if (tentativePoints > 0) {
        status = 'winner';
      }
    }

    return {
      user_id: pred.user_id,
      user_name: pred.full_name,
      user_avatar: pred.avatar_url,
      home_score_pred: pred.home_score_pred,
      away_score_pred: pred.away_score_pred,
      tentative_points: tentativePoints,
      status,
    };
  }

  private async getAllMatchesWithTeams(): Promise<LiveMatchRow[]> {
    const res = await dbClient.query(
      `SELECT
        m.id, m.utc_date, m.phase, m."group", m.matchday, m.status,
        m.home_score, m.away_score, m.home_team_id, m.away_team_id,
        m.last_synced_at,
        ht.name AS home_team_name, ht.crest_url AS home_team_crest,
        at.name AS away_team_name, at.crest_url AS away_team_crest
      FROM ${SCHEMA}.matches m
      JOIN ${SCHEMA}.teams ht ON ht.id = m.home_team_id
      JOIN ${SCHEMA}.teams at ON at.id = m.away_team_id
      ORDER BY m.utc_date ASC`
    );
    return res.rows;
  }

  private async getPredictionsForMatches(matchIds: number[]): Promise<PredictionRow[]> {
    const res = await dbClient.query(
      `SELECT
        mp.id, mp.user_id, mp.match_id,
        mp.home_score_pred, mp.away_score_pred,
        mp.calculated_points, mp.processed,
        u.full_name, u.avatar_url
      FROM ${SCHEMA}.match_predictions mp
      JOIN ${SCHEMA}.users u ON u.id = mp.user_id
      WHERE mp.match_id = ANY($1)
      ORDER BY u.full_name ASC`,
      [matchIds],
    );
    return res.rows;
  }
}
