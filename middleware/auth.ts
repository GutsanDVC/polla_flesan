export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();

  if (!auth.user && !auth.loading) {
    await auth.fetchMe();
  }

  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } });
  }

  if (auth.isPending) {
    return navigateTo('/auth/pending');
  }

  if (auth.isBlocked) {
    return navigateTo('/auth/blocked');
  }

  if (to.path.startsWith('/admin') && !auth.isAdmin) {
    return navigateTo('/');
  }
});
