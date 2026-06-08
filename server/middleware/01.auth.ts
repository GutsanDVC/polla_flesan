import { dbClient } from '../utils/db';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user?.id) return;

  try {
    const result = await dbClient.query(
      'SELECT id, email, full_name, avatar_url, role, status FROM users WHERE id = $1',
      [session.user.id],
    );
    const row = result.rows[0];
    if (!row) return;

    event.context.user = {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      role: row.role,
      status: row.status,
    };
  } catch (err) {
    console.error('[auth middleware] DB error:', err);
  }
});
