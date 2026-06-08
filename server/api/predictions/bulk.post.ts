import { z } from 'zod';
import { PredictionService } from '~~/server/services/PredictionService';
import { requireApproved } from '~~/server/utils/auth';

const bodySchema = z.object({
  predictions: z.array(z.object({
    matchId: z.number().int().positive(),
    homeScorePred: z.number().int().min(0).max(20),
    awayScorePred: z.number().int().min(0).max(20),
  })).min(1).max(50),
});

export default defineEventHandler(async (event) => {
  const user = requireApproved(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  const service = new PredictionService();
  const results = [];

  for (const pred of body.predictions) {
    const result = await service.saveMatchPrediction(
      user.id,
      pred.matchId,
      pred.homeScorePred,
      pred.awayScorePred,
    );
    results.push(result);
  }

  return { saved: results.length };
});
