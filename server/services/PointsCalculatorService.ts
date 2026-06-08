import { PredictionRepository } from '../repositories/PredictionRepository';
import { MatchRepository } from '../repositories/MatchRepository';
import type { Phase } from '../../types/domain';
import { PHASE_MULTIPLIERS } from '../../types/domain';

export class PointsCalculatorService {
  calculatePointsForMatch(
    homeReal: number,
    awayReal: number,
    homePred: number,
    awayPred: number,
    phase: Phase,
  ): number {
    const isExactMatch = homeReal === homePred && awayReal === awayPred;
    const realWinner = homeReal > awayReal ? 'HOME' : awayReal > homeReal ? 'AWAY' : 'DRAW';
    const predWinner = homePred > awayPred ? 'HOME' : awayPred > homePred ? 'AWAY' : 'DRAW';
    const isWinnerMatch = realWinner === predWinner;

    let basePoints = 0;
    if (isExactMatch) {
      basePoints = 10;
    } else if (isWinnerMatch) {
      basePoints = 5;
    }

    const multiplier = PHASE_MULTIPLIERS[phase] ?? 1;
    return basePoints * multiplier;
  }

  async processMatchResults(matchId: number, homeRealScore: number, awayRealScore: number, phase: Phase) {
    const predictionRepo = new PredictionRepository();
    const predictions = await predictionRepo.getPredictionsByMatch(matchId);

    for (const pred of predictions) {
      const calculatedPoints = this.calculatePointsForMatch(
        homeRealScore,
        awayRealScore,
        pred.home_score_pred,
        pred.away_score_pred,
        phase,
      );
      await predictionRepo.updatePredictionPoints(pred.id, calculatedPoints);
    }
  }
}
