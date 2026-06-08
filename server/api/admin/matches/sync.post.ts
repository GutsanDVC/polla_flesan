import { MatchSyncService } from '~~/server/services/MatchSyncService';
import { requireAdmin } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const service = new MatchSyncService();
  const result = await service.run();

  return result;
});
