import { z } from 'zod';
import { UserRepository } from '~~/server/repositories/UserRepository';
import { requireAdmin } from '~~/server/utils/auth';
import { sendApprovalEmail } from '~~/server/utils/email';

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

  // Get current user status before update
  const currentUser = await repo.getUserById(userId);
  const wasApproved = currentUser?.status === 'APPROVED';

  // Update status
  const updated = await repo.updateUserStatus(userId, body.status);
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' });
  }

  // Update payment fields if provided
  if (body.payment_status !== undefined) {
    await repo.updatePaymentFields(userId, body.payment_status, body.payment_receipt_url);
  }

  // Send approval email if user was not approved before and now is
  if (!wasApproved && body.status === 'APPROVED' && currentUser) {
    sendApprovalEmail(currentUser.email, currentUser.full_name).catch((err) => {
      console.error('[status.patch] Failed to send approval email:', err);
    });
  }

  // Return fresh user data
  return await repo.getUserById(userId);
});
