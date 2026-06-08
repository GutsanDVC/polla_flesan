import type { Match, SyncResult } from '~~/types/domain';
import type { FetchOptions } from '../utils/football-data';
import {
  collectTeams,
  fetchWorldCupMatches,
  mapMatch,
  mapTeam,
} from '../utils/football-data';
import { MatchRepository } from '../repositories/MatchRepository';
import { TeamRepository } from '../repositories/TeamRepository';
import { PointsCalculatorService } from './PointsCalculatorService';

export class MatchSyncService {
  private matchRepo = new MatchRepository();
  private teamRepo = new TeamRepository();
  private pointsCalculator = new PointsCalculatorService();

  async run(opts: FetchOptions = {}): Promise<SyncResult> {
    const start = Date.now();
    const errors: string[] = [];
    const fetchedAt = new Date().toISOString();

    let created = 0;
    let updated = 0;
    let finished = 0;
    let total = 0;

    const response = await fetchWorldCupMatches(opts);
    const fdMatches = response.matches ?? [];
    total = fdMatches.length;

    const existingMatches = new Map<number, Match>();
    const allMatches = await this.matchRepo.getAllMatches();
    for (const m of allMatches) {
      existingMatches.set(m.id, m);
    }

    const fdTeams = collectTeams(fdMatches);
    for (const t of fdTeams) {
      try {
        await this.teamRepo.upsert(mapTeam(t));
      } catch (err) {
        errors.push(`team ${t.id} (${t.name}): ${(err as Error).message}`);
      }
    }

    for (const fd of fdMatches) {
      const mapped = mapMatch(fd);
      if (!mapped) continue;

      try {
        const wasFinished =
          existingMatches.get(mapped.id)?.status === 'FINISHED';

        await this.matchRepo.upsertMatch(mapped);

        if (existingMatches.has(mapped.id)) {
          updated += 1;
        } else {
          created += 1;
        }

        if (
          mapped.status === 'FINISHED' &&
          mapped.home_score !== null &&
          mapped.away_score !== null &&
          !wasFinished
        ) {
          await this.pointsCalculator.processMatchResults(
            mapped.id,
            mapped.home_score,
            mapped.away_score,
          );
          finished += 1;
        }
      } catch (err) {
        errors.push(`match ${mapped.id}: ${(err as Error).message}`);
      }
    }

    return {
      created,
      updated,
      finished,
      errors,
      durationMs: Date.now() - start,
      fetchedAt,
      total,
    };
  }
}
