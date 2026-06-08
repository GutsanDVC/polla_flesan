import { PredictionRepository } from '~~/server/repositories/PredictionRepository';
import { MatchRepository } from '~~/server/repositories/MatchRepository';
import { PredictionService } from '~~/server/services/PredictionService';
import { requireApproved } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const user = requireApproved(event);
  const groupLetter = event.context.params?.letter;

  if (!groupLetter || !/^[A-L]$/.test(groupLetter)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Grupo inválido (debe ser A-L)',
    });
  }

  const matchRepo = new MatchRepository();
  const predictionRepo = new PredictionRepository();
  const predictionService = new PredictionService();

  const groupMatches = await matchRepo.getMatchesByGroup(groupLetter);
  const userPredictions = await predictionRepo.getPredictionsByUserAndMatches(
    user.id,
    groupMatches.map((m) => m.id),
  );

  const standing = predictionService.calculateStandings(groupMatches, userPredictions);

  return {
    group: groupLetter,
    matches: groupMatches,
    predictions: userPredictions,
    standing,
  };
});
