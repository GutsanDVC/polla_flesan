import type { H3Event } from 'h3';
import { createError } from 'h3';
import type { SessionUser } from '../../types/domain';

export function getSessionUser(event: H3Event): SessionUser | undefined {
  return event.context.user;
}

export function requireUser(event: H3Event): SessionUser {
  const user = getSessionUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autorizado',
      data: { code: 'UNAUTHENTICATED' },
    });
  }
  return user;
}

export function requireApproved(event: H3Event): SessionUser {
  const user = requireUser(event);
  if (user.status !== 'APPROVED') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tu cuenta no está aprobada',
      data: { code: 'NOT_APPROVED', status: user.status },
    });
  }
  return user;
}

export function requireAdmin(event: H3Event): SessionUser {
  const user = requireUser(event);
  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acceso denegado',
      data: { code: 'NOT_ADMIN' },
    });
  }
  return user;
}
