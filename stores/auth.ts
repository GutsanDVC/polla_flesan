import { defineStore } from 'pinia';
import type { SessionUser } from '~~/types/domain';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as SessionUser | null,
    loading: false as boolean,
  }),

  getters: {
    isAuthenticated: (s) => s.user !== null,
    isApproved: (s) => s.user?.status === 'APPROVED',
    isPending: (s) => s.user?.status === 'PENDING',
    isBlocked: (s) => s.user?.status === 'BLOCKED',
    isAdmin: (s) => s.user?.role === 'ADMIN',
  },

  actions: {
    async fetchMe() {
      this.loading = true;
      try {
        const me = await $fetch<SessionUser>('/api/auth/me');
        this.user = me;
      } catch (err: any) {
        if (err?.statusCode === 401 || err?.response?.status === 401) {
          this.user = null;
        } else {
          throw err;
        }
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' });
      this.user = null;
      await navigateTo('/auth/login');
    },

    startGoogleLogin() {
      if (import.meta.client) {
        window.location.href = '/api/auth/google';
      }
    },
  },
});
