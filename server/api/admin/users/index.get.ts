import { UserRepository } from '~~/server/repositories/UserRepository';
import { requireAdmin } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const repo = new UserRepository();
  return await repo.getAllUsers();
});
