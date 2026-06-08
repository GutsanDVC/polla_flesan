import { z } from 'zod';
import { MatchRepository } from '~~/server/repositories/MatchRepository';
import { PHASES } from '~~/types/domain';

const querySchema = z.object({
  phase: z.enum(PHASES as readonly [string, ...string[]]).optional(),
  group: z.string().regex(/^[A-L]$/).optional(),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  const repo = new MatchRepository();

  if (query.group) {
    return await repo.getMatchesByGroup(query.group);
  }
  return await repo.getAllMatches(query.phase as any);
});
