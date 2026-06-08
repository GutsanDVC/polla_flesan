import { buildAuthorizationUrl, generateState, hashState } from '../../utils/google-oauth';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const clientId = config.google.clientId;
  const secret = config.oauthStateSecret;

  if (!clientId || !secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Google OAuth no configurado (faltan GOOGLE_CLIENT_ID u OAUTH_STATE_SECRET)',
    });
  }

  const state = generateState();
  const stateHash = hashState(state, secret);

  setCookie(event, 'oauth_state', stateHash, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });

  const redirectUri = config.google.redirectUri;
  const authUrl = buildAuthorizationUrl(state, redirectUri, clientId);
  return sendRedirect(event, authUrl, 302);
});
