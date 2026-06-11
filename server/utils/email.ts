const EMAIL_API_URL = 'https://apinotificaciones.grupoflesan.com/api/v1/notifications/email-custom';
const HEADER_IMAGE = 'https://i-c-flesan.github.io/assets-flesan/base-html/header-notificacion-procesos.png';

function getEmailConfig() {
  const config = useRuntimeConfig() as any;
  return {
    url: config.emailApi?.url || EMAIL_API_URL,
    apiKey: config.emailApi?.apiKey || '',
  };
}

function buildApprovalHtml(userName: string): string {
  const appUrl = 'https://mundial2026.grupoflesan.com';
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="color:#16a34a;font-size:22px;text-align:center;margin-bottom:16px;">¡Cuenta Aprobada!</h1>
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Hola <strong>${userName}</strong>,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Tu cuenta en <strong>Polla Flesan DVC</strong> ha sido aprobada correctamente.
        Ya puedes acceder a la aplicación y comenzar a jugar.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${appUrl}"
           style="background-color:#16a34a;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">
          Ir a la apuerta mundialera
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;">
        Recuerda que debes completar tus predicciones antes de que comience el Mundial 2026.
      </p>
    </div>
  `;
}

export async function sendApprovalEmail(userEmail: string, userName: string): Promise<boolean> {
  const { url, apiKey } = getEmailConfig();
  if (!apiKey) {
    console.warn('[email] EMAIL_API_KEY no configurada. Email no enviado.');
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        custom_html: buildApprovalHtml(userName),
        recipient: userEmail,
        subject: '¡Tu cuenta fue aprobada! - Apuesta Mundialera Flesan DVC',
        template_vars: { departamento: 'PTI' },
        url_header: HEADER_IMAGE,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[email] Error enviando email:', response.status, data);
      return false;
    }

    console.log(`[email] Email de aprobación enviado a ${userEmail}`);
    return true;
  } catch (err: any) {
    console.error('[email] Excepción enviando email:', err.message);
    return false;
  }
}

function buildReminderHtml(userName: string, deadline: string): string {
  const appUrl = 'https://mundial2026.grupoflesan.com/groups';
  const deadlineDate = new Date(deadline);
  const deadlineStr = deadlineDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="color:#dc2626;font-size:22px;text-align:center;margin-bottom:16px;">Recordatorio: Predicciones Pendientes</h1>
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Hola <strong>${userName}</strong>,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Todavía no has completado todas tus predicciones de la <strong>fase de grupos</strong> del Mundial 2026.
      </p>
      <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="color:#dc2626;font-size:14px;margin:0;font-weight:bold;">
          ⏰ Fecha límite: ${deadlineStr}
        </p>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.6;">
        Una vez que comiencen los partidos de la fase de grupos, no podrás modificar tus predicciones.
        ¡No dejes para último momento!
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${appUrl}"
           style="background-color:#16a34a;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">
          Completar mis predicciones
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;">
        Recuerda: cada predicción correcta te da puntos. ¡El que más acierte, gana!
      </p>
    </div>
  `;
}

export async function sendReminderEmail(
  userEmail: string,
  userName: string,
  deadline: string,
): Promise<boolean> {
  const { url, apiKey } = getEmailConfig();
  if (!apiKey) {
    console.warn('[email] EMAIL_API_KEY no configurada. Email no enviado.');
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        custom_html: buildReminderHtml(userName, deadline),
        recipient: userEmail,
        subject: 'Recordatorio: Completa tus predicciones - Polla Flesan DVC',
        template_vars: { departamento: 'PTI' },
        url_header: HEADER_IMAGE,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[email] Error enviando recordatorio:', response.status, data);
      return false;
    }

    console.log(`[email] Email de recordatorio enviado a ${userEmail}`);
    return true;
  } catch (err: any) {
    console.error('[email] Excepción enviando recordatorio:', err.message);
    return false;
  }
}
