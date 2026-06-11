import { z } from 'zod';
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

  const existingMatch = await matchRepo.getMatchById(matchId);
  if (!existingMatch) {
    throw createError({ statusCode: 404, statusMessage: 'Partido no encontrado' });
  }

  if (existingMatch.status === 'FINISHED') {
    throw createError({ statusCode: 400, statusMessage: 'No se puede modificar un partido finalizado' });
  }

  const match = await matchRepo.updateMatchScores(matchId, body.homeScore, body.awayScore);
  if (!match) {
    throw createError({ statusCode: 404, statusMessage: 'Partido no encontrado' });
  }

  return { ok: true, message: 'Marcador actualizado (puntos tentativos)', match };
});
