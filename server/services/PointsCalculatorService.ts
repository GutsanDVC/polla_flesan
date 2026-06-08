import { PredictionRepository } from '../repositories/PredictionRepository';
import { MatchRepository } from '../repositories/MatchRepository';

export class PointsCalculatorService {
  calculatePointsForMatch(
    homeReal: number,
    awayReal: number,
    homePred: number,
    awayPred: number,
  ): number {
    let points = 0;

    const isExactMatch = homeReal === homePred && awayReal === awayPred;
    const realWinner = homeReal > awayReal ? 'HOME' : awayReal > homeReal ? 'AWAY' : 'DRAW';
    const predWinner = homePred > awayPred ? 'HOME' : awayPred > homePred ? 'AWAY' : 'DRAW';
    const isWinnerMatch = realWinner === predWinner;

    if (isExactMatch) {
      points += 10;
    } else if (isWinnerMatch) {
      points += 5;
    }

    const totalGolesReal = homeReal + awayReal;
    const totalGolesPred = homePred + awayPred;
    if (totalGolesReal === totalGolesPred) {
      points += 2;
    }

    if (!isExactMatch) {
      if (homeReal === homePred) points += 1;
      if (awayReal === awayPred) points += 1;
    }

    return points;
  }

  async processMatchResults(matchId: number, homeRealScore: number, awayRealScore: number) {
    const predictionRepo = new PredictionRepository();
    const predictions = await predictionRepo.getPredictionsByMatch(matchId);

    for (const pred of predictions) {
      const calculatedPoints = this.calculatePointsForMatch(
        homeRealScore,
        awayRealScore,
        pred.home_score_pred,
        pred.away_score_pred,
      );
      await predictionRepo.updatePredictionPoints(pred.id, calculatedPoints);
    }
  }
}
