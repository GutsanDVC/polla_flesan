import { UserRepository } from '~~/server/repositories/UserRepository';
import { PredictionRepository } from '~~/server/repositories/PredictionRepository';
import { requireApproved } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  requireApproved(event);
  const userRepo = new UserRepository();
  const predictionRepo = new PredictionRepository();
  const users = await userRepo.getApprovedUsers();

  const leaderboard = await Promise.all(
    users.map(async (user) => {
      const predictions = await predictionRepo.getPredictionsByUser(user.id);
      const totalPoints = predictions.reduce(
        (sum: number, p: any) => sum + (p.calculated_points || 0),
        0,
      );
      return {
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        totalPoints,
      };
    }),
  );

  return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
});
