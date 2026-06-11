import { LiveScoreService } from '~~/server/services/LiveScoreService';
import { requireApproved } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  requireApproved(event);

  const service = new LiveScoreService();
  const data = await service.getLiveData();

  setResponseHeaders(event, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });

  return data;
});
