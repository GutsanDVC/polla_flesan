import { z } from 'zod';
import { PointsCalculatorService } from '~~/server/services/PointsCalculatorService';
import { MatchRepository } from '~~/server/repositories/MatchRepository';
import { requireAdmin } from '~~/server/utils/auth';

const bodySchema = z.object({
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
});

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const matchId = parseInt(event.context.params?.id || '0', 10);
  if (!matchId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de partido inválido' });
  }
  const body = await readValidatedBody(event, bodySchema.parse);

  const matchRepo = new MatchRepository();
  const pointsCalculator = new PointsCalculatorService();

  const existingMatch = await matchRepo.getMatchById(matchId);
  if (!existingMatch) {
    throw createError({ statusCode: 404, statusMessage: 'Partido no encontrado' });
  }

  const match = await matchRepo.setMatchResult(matchId, body.homeScore, body.awayScore);
  if (!match) {
    throw createError({ statusCode: 404, statusMessage: 'Partido no encontrado' });
  }
  await pointsCalculator.processMatchResults(matchId, body.homeScore, body.awayScore, existingMatch.phase);

  return { ok: true, message: 'Resultado actualizado y puntos calculados' };
});
