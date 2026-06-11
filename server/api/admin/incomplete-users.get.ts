import { PredictionRepository } from '~~/server/repositories/PredictionRepository';
import { requireAdmin } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const predRepo = new PredictionRepository();
  const users = await predRepo.getUsersWithIncompletePredictions();

  return users;
});
