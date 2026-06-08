import { PredictionRepository } from '~~/server/repositories/PredictionRepository';
import { requireApproved } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const user = requireApproved(event);
  const repo = new PredictionRepository();
  return await repo.getPredictionsByUser(user.id);
});
