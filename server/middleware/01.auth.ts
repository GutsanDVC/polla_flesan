import { dbClient, SCHEMA } from '../utils/db';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user?.id) return;

  try {
    const result = await dbClient.query(
      `SELECT id, email, full_name, avatar_url, role, status FROM ${SCHEMA}.users WHERE id = $1`,
      [session.user.id],
    );
    const row = result.rows[0];
    if (!row) {
      console.warn('[auth middleware] User not found in DB:', session.user.id);
      return;
    }

    event.context.user = {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      role: row.role,
      status: row.status,
    };
  } catch (err: any) {
    console.error('[auth middleware] DB error:', err.message, 'userId:', session.user.id);
  }
});
