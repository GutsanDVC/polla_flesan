import { describe, it, expect } from 'vitest';
import { buildAuthorizationUrl, generateState, hashState, verifyStateHash } from '../server/utils/google-oauth';

describe('google-oauth utilities', () => {
  describe('generateState', () => {
    it('returns a non-empty string', () => {
      const state = generateState();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('returns different values on each call', () => {
      expect(generateState()).not.toBe(generateState());
    });
  });

  describe('hashState / verifyStateHash', () => {
    const secret = 'test-secret';

    it('verifies a freshly hashed state', () => {
      const state = generateState();
      const hash = hashState(state, secret);
      expect(verifyStateHash(state, hash, secret)).toBe(true);
    });

    it('rejects tampered state', () => {
      const state = generateState();
      const hash = hashState(state, secret);
      expect(verifyStateHash('tampered', hash, secret)).toBe(false);
    });

    it('rejects wrong secret', () => {
      const state = generateState();
      const hash = hashState(state, secret);
      expect(verifyStateHash(state, hash, 'wrong')).toBe(false);
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('includes all required OAuth params', () => {
      const url = buildAuthorizationUrl('abc123', 'https://app/callback', 'client-id');
      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://accounts.google.com');
      expect(parsed.searchParams.get('client_id')).toBe('client-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe('https://app/callback');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('state')).toBe('abc123');
      expect(parsed.searchParams.get('scope')).toContain('email');
      expect(parsed.searchParams.get('scope')).toContain('profile');
    });
  });
});
