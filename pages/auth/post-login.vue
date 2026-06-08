<template>
  <div class="max-w-md mx-auto py-12 text-center text-gray-500">Procesando sesión...</div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const route = useRoute();

await auth.fetchMe();

const redirect = (route.query.redirect as string) || null;

if (!auth.isAuthenticated) {
  await navigateTo('/auth/login');
} else if (auth.isPending) {
  await navigateTo('/auth/pending');
} else if (auth.isBlocked) {
  await navigateTo('/auth/blocked');
} else if (redirect) {
  await navigateTo(redirect);
} else if (auth.isAdmin) {
  await navigateTo('/admin');
} else {
  await navigateTo('/groups');
}
</script>
