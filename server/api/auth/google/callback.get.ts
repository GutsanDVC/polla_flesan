import { z } from 'zod';
import { dbClient } from '../../../utils/db';
import { exchangeCodeForToken, fetchGoogleProfile, verifyStateHash } from '../../../utils/google-oauth';

const querySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const clientId = config.google.clientId;
  const clientSecret = config.google.clientSecret;
  const stateSecret = config.oauthStateSecret;
  const redirectUri = config.google.redirectUri;

  if (!clientId || !clientSecret || !stateSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Google OAuth no configurado' });
  }

  const parsed = querySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' });
  }
  const { code, state } = parsed.data;

  const storedHash = getCookie(event, 'oauth_state');
  if (!storedHash || !verifyStateHash(state, storedHash, stateSecret)) {
    throw createError({ statusCode: 400, statusMessage: 'Estado OAuth inválido' });
  }
  deleteCookie(event, 'oauth_state', { path: '/' });

  const { access_token } = await exchangeCodeForToken(code, redirectUri, clientId, clientSecret);
  const profile = await fetchGoogleProfile(access_token);

  if (!profile.email_verified) {
    throw createError({ statusCode: 403, statusMessage: 'Email de Google no verificado' });
  }

  const upsert = await dbClient.query(
    `INSERT INTO users (email, full_name, avatar_url, role, status)
     VALUES ($1, $2, $3, 'USER', 'PENDING')
     ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW()
     RETURNING id, email, full_name, avatar_url, role, status`,
    [profile.email, profile.name, profile.picture ?? null],
  );
  const user = upsert.rows[0];

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      status: user.status,
    },
  });

  return sendRedirect(event, '/auth/post-login', 302);
});
