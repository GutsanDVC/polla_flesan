import { PredictionRepository } from '~~/server/repositories/PredictionRepository';
import { sendReminderEmail } from '~~/server/utils/email';
import { requireAdmin } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const config = useRuntimeConfig();
  const deadline = config.public.groupPhaseLockDate || '2026-06-12T00:00:00Z';

  const predRepo = new PredictionRepository();
  const incompleteUsers = await predRepo.getUsersWithIncompletePredictions();

  if (incompleteUsers.length === 0) {
    return { sent: 0, errors: 0, message: 'Todos los usuarios tienen sus predicciones completas' };
  }

  let sent = 0;
  let errors = 0;
  const details: Array<{ email: string; name: string; ok: boolean }> = [];

  for (const user of incompleteUsers) {
    const ok = await sendReminderEmail(user.email, user.full_name, deadline);
    if (ok) {
      sent++;
    } else {
      errors++;
    }
    details.push({ email: user.email, name: user.full_name, ok });
  }

  return {
    sent,
    errors,
    total: incompleteUsers.length,
    message: `Emails enviados: ${sent}, Errores: ${errors}`,
    details,
  };
});
