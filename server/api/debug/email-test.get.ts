import { sendApprovalEmail } from '~~/server/utils/email';

export default defineEventHandler(async () => {
  const testEmail = 'bastian.gutierrez@flesan.cl';
  const testName = 'Bastian (Test)';

  const result = await sendApprovalEmail(testEmail, testName);

  return {
    success: result,
    message: result
      ? `Email de prueba enviado a ${testEmail}`
      : 'Error al enviar email. Verifica EMAIL_API_KEY.',
  };
});
