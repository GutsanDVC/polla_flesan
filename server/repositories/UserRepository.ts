import { dbClient } from '../utils/db';

export class UserRepository {
  async getUserById(id: string) {
    const query = 'SELECT id, email, full_name, avatar_url, role, status, created_at FROM users WHERE id = $1';
    const result = await dbClient.query(query, [id]);
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await dbClient.query(query, [email]);
    return result.rows[0] || null;
  }

  async createUser(email: string, fullName: string, avatarUrl?: string) {
    const query = `
      INSERT INTO users (email, full_name, avatar_url, status)
      VALUES ($1, $2, $3, 'PENDING')
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url
      RETURNING id, email, full_name, avatar_url, role, status, created_at
    `;
    const result = await dbClient.query(query, [email, fullName, avatarUrl]);
    return result.rows[0];
  }

  async updateUserStatus(userId: string, status: string) {
    const query = 'UPDATE users SET status = $1 WHERE id = $2 RETURNING *';
    const result = await dbClient.query(query, [status, userId]);
    return result.rows[0];
  }

  async getAllUsers() {
    const query = 'SELECT id, email, full_name, avatar_url, role, status, created_at FROM users ORDER BY created_at DESC';
    const result = await dbClient.query(query);
    return result.rows;
  }

  async getApprovedUsers() {
    const query = 'SELECT id, email, full_name, avatar_url, role, status FROM users WHERE status = \'APPROVED\' ORDER BY full_name ASC';
    const result = await dbClient.query(query);
    return result.rows;
  }
}
