import { dbClient } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const userId = session?.user?.id;
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' });
  }

  const result = await dbClient.query(
    'SELECT id, email, full_name, avatar_url, role, status FROM users WHERE id = $1',
    [userId],
  );
  const row = result.rows[0];
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' });
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
