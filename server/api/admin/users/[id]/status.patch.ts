import { z } from 'zod';
import { UserRepository } from '~~/server/repositories/UserRepository';
import { requireAdmin } from '~~/server/utils/auth';

const bodySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'BLOCKED']),
  payment_status: z.enum(['UNPAID', 'PAID']).optional(),
  payment_receipt_url: z.string().url().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const userId = event.context.params?.id;
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' });
  }
  const body = await readValidatedBody(event, bodySchema.parse);

  const repo = new UserRepository();

  // Update status
  const updated = await repo.updateUserStatus(userId, body.status);
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' });
  }

  // Update payment fields if provided
  if (body.payment_status !== undefined) {
    await repo.updatePaymentFields(userId, body.payment_status, body.payment_receipt_url);
  }

  // Return fresh user data
  return await repo.getUserById(userId);
});
