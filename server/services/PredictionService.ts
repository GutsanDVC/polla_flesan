import { PredictionRepository } from '../repositories/PredictionRepository';
import { MatchRepository } from '../repositories/MatchRepository';
import { dbClient } from '../utils/db';
import type { Match } from '~~/types/domain';

interface MatchLite {
  id: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
}

export class PredictionService {
  private predictionRepo = new PredictionRepository();
  private matchRepo = new MatchRepository();

  async saveMatchPrediction(
    userId: string,
    matchId: number,
    homeScore: number,
    awayScore: number,
  ) {
    const match = await this.matchRepo.getMatchById(matchId);
    if (!match) {
      throw new Error('El partido no existe.');
    }

    const currentDate = new Date();

    if (match.phase === 'GROUP') {
      const blockDate = new Date(
        process.env.GROUP_PHASE_LOCK_DATE || '2026-06-11T00:00:00Z',
      );
      if (currentDate >= blockDate) {
        throw new Error('La fase de grupos está bloqueada. No se permiten más modificaciones.');
      }
    } else {
      const phaseStartDate = await this.matchRepo.getMinDateByPhase(match.phase);
      if (phaseStartDate && currentDate >= new Date(phaseStartDate)) {
        throw new Error(`La fase eliminatoria ${match.phase} está en juego y bloqueada.`);
      }
    }

    const client = await dbClient.connect();
    try {
      await client.query('BEGIN');
      const prediction = await this.predictionRepo.upsertMatchPrediction(
        userId,
        matchId,
        homeScore,
        awayScore,
      );
      if (match.phase === 'GROUP' && match.group) {
        await this.recalculateAndSaveGroupPositionsInTx(client, userId, match.group);
      }
      await client.query('COMMIT');
      return prediction;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private async recalculateAndSaveGroupPositionsInTx(
    client: any,
    userId: string,
    group: string,
  ) {
    const groupMatches = await this.matchRepo.getMatchesByGroup(group);
    const matchIds = groupMatches.map((m) => m.id);
    const userPredictions = await this.predictionRepo.getPredictionsByUserAndMatches(
      userId,
      matchIds,
    );
    const standing = this.calculateStandings(groupMatches, userPredictions);
    await this.predictionRepo.upsertGroupPrediction(
      userId,
      group,
      standing[0] ?? '',
      standing[1] ?? '',
      standing[2] ?? '',
    );
  }

  calculateStandings(matches: Match[], predictions: any[]): string[] {
    const stats: Record<number, { name: string; points: number; gd: number; gf: number }> = {};

    for (const m of matches) {
      if (!stats[m.home_team_id]) {
        stats[m.home_team_id] = { name: m.homeTeam?.name ?? `#${m.home_team_id}`, points: 0, gd: 0, gf: 0 };
      }
      if (!stats[m.away_team_id]) {
        stats[m.away_team_id] = { name: m.awayTeam?.name ?? `#${m.away_team_id}`, points: 0, gd: 0, gf: 0 };
      }
    }

    for (const p of predictions) {
      const match = matches.find((m) => m.id === p.match_id);
      if (!match) continue;
      const home = stats[match.home_team_id];
      const away = stats[match.away_team_id];
      const hs = p.home_score_pred;
      const as = p.away_score_pred;
      home.gf += hs;
      away.gf += as;
      home.gd += hs - as;
      away.gd += as - hs;
      if (hs > as) home.points += 3;
      else if (as > hs) away.points += 3;
      else {
        home.points += 1;
        away.points += 1;
      }
    }

    return Object.values(stats)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      })
      .map((s) => s.name);
  }
}
