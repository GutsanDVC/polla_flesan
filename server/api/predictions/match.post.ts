import { z } from 'zod';
import { PredictionService } from '~~/server/services/PredictionService';
import { requireApproved } from '~~/server/utils/auth';

const bodySchema = z.object({
  matchId: z.number().int().positive(),
  homeScorePred: z.number().int().min(0).max(20),
  awayScorePred: z.number().int().min(0).max(20),
});

export default defineEventHandler(async (event) => {
  const user = requireApproved(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  const service = new PredictionService();
  return await service.saveMatchPrediction(
    user.id,
    body.matchId,
    body.homeScorePred,
    body.awayScorePred,
  );
});
