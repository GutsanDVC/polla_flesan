<template>
  <div class="max-w-md mx-auto py-12">
    <AuthBlockedState v-if="auth.user" :user-name="auth.user.fullName" />
    <div v-else class="text-center text-gray-500">Cargando...</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
const auth = useAuthStore();

if (!auth.user) {
  await auth.fetchMe();
}

if (!auth.isAuthenticated) {
  await navigateTo('/auth/login');
} else if (auth.isApproved) {
  await navigateTo('/groups');
} else if (auth.isPending) {
  await navigateTo('/auth/pending');
}
</script>
