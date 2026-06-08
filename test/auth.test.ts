import { describe, it, expect } from 'vitest';
import type { H3Event } from 'h3';
import { getSessionUser, requireUser, requireAdmin, requireApproved } from '../server/utils/auth';

function makeEvent(context: Record<string, any> = {}): H3Event {
  return { context } as unknown as H3Event;
}

describe('auth utils', () => {
  describe('getSessionUser', () => {
    it('returns undefined when no user in context', () => {
      expect(getSessionUser(makeEvent())).toBeUndefined();
    });

    it('returns the user when present', () => {
      const u = { id: '1', email: 'a@b.c', fullName: 'A', avatarUrl: null, role: 'USER' as const, status: 'APPROVED' as const };
      expect(getSessionUser(makeEvent({ user: u }))).toEqual(u);
    });
  });

  describe('requireUser', () => {
    it('returns the user when present', () => {
      const u = { id: '1', email: 'a@b.c', fullName: 'A', avatarUrl: null, role: 'USER' as const, status: 'APPROVED' as const };
      expect(requireUser(makeEvent({ user: u }))).toEqual(u);
    });

    it('throws 401 when no user', () => {
      try {
        requireUser(makeEvent());
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.data?.code).toBe('UNAUTHENTICATED');
      }
    });
  });

  describe('requireApproved', () => {
    it('returns the user when APPROVED', () => {
      const u = { id: '1', email: 'a@b.c', fullName: 'A', avatarUrl: null, role: 'USER' as const, status: 'APPROVED' as const };
      expect(requireApproved(makeEvent({ user: u }))).toEqual(u);
    });

    it('throws 403 when PENDING', () => {
      const u = { id: '1', email: 'a@b.c', fullName: 'A', avatarUrl: null, role: 'USER' as const, status: 'PENDING' as const };
      try {
        requireApproved(makeEvent({ user: u }));
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.data?.code).toBe('NOT_APPROVED');
        expect(err.data?.status).toBe('PENDING');
      }
    });

    it('throws 403 when BLOCKED', () => {
      const u = { id: '1', email: 'a@b.c', fullName: 'A', avatarUrl: null, role: 'USER' as const, status: 'BLOCKED' as const };
      try {
        requireApproved(makeEvent({ user: u }));
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
      }
    });

    it('throws 401 when no user (before checking status)', () => {
      try {
        requireApproved(makeEvent());
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
      }
    });
  });

  describe('requireAdmin', () => {
    it('returns the user when ADMIN+APPROVED', () => {
      const u = { id: '1', email: 'a@b.c', fullName: 'A', avatarUrl: null, role: 'ADMIN' as const, status: 'APPROVED' as const };
      expect(requireAdmin(makeEvent({ user: u }))).toEqual(u);
    });

    it('throws 403 when USER', () => {
      const u = { id: '1', email: 'a@b.c', fullName: 'A', avatarUrl: null, role: 'USER' as const, status: 'APPROVED' as const };
      try {
        requireAdmin(makeEvent({ user: u }));
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.data?.code).toBe('NOT_ADMIN');
      }
    });

    it('throws 401 when no user', () => {
      try {
        requireAdmin(makeEvent());
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
      }
    });
  });
});
