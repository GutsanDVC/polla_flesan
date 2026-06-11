import { sendReminderEmail } from '~~/server/utils/email';

export default defineEventHandler(async () => {
  const testEmail = 'bastian.gutierrez@flesan.cl';
  const testName = 'Bastian (Test)';
  const deadline = '2026-06-12T00:00:00Z';

  const result = await sendReminderEmail(testEmail, testName, deadline);

  return {
    success: result,
    message: result
      ? `Email de recordatorio enviado a ${testEmail}`
      : 'Error al enviar email. Verifica EMAIL_API_KEY.',
  };
});
