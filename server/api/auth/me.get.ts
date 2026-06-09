import { dbClient } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const userId = session?.user?.id;
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' });
  }

  let result;
  try {
    result = await dbClient.query(
      'SELECT id, email, full_name, avatar_url, role, status FROM users WHERE id = $1',
      [userId],
    );
  } catch (err: any) {
    console.error('[auth/me] DB error:', err.message, 'userId:', userId);
    throw createError({ statusCode: 500, statusMessage: 'Error de base de datos' });
  }

  const row = result.rows[0];
  if (!row) {
    console.warn('[auth/me] User not found, clearing session:', userId);
    await clearUserSession(event);
    throw createError({ statusCode: 401, statusMessage: 'Sesión inválida' });
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
  };
});
