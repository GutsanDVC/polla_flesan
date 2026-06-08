import { z } from 'zod';
import { UserRepository } from '~~/server/repositories/UserRepository';
import { requireAdmin } from '~~/server/utils/auth';

const bodySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'BLOCKED']),
});

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const userId = event.context.params?.id;
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' });
  }
  const body = await readValidatedBody(event, bodySchema.parse);

  const repo = new UserRepository();
  const updated = await repo.updateUserStatus(userId, body.status);
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' });
  }
  return updated;
});
