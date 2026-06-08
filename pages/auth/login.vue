<template>
  <div class="max-w-md mx-auto py-12 space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-3xl font-bold text-green-700">{{ appName }}</h1>
      <p class="text-gray-600">Inicia sesión para participar</p>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
      <p class="text-sm text-gray-600">
        El acceso es por invitación. Si tu correo no está registrado, quedará
        <strong>PENDING</strong> hasta que un administrador apruebe tu solicitud.
      </p>

      <AuthGoogleSignInButton :loading="loading" @click="login" />

      <div v-if="errorMessage" class="text-sm text-red-600 bg-red-50 p-3 rounded">
        {{ errorMessage }}
      </div>
    </div>

    <div class="text-center text-xs text-gray-400">
      Al continuar aceptás los términos del torneo recreativo.
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const config = useRuntimeConfig();
const appName = config.public.appName;

const auth = useAuthStore();

if (!auth.user && !auth.loading) {
  await auth.fetchMe();
}
if (auth.isApproved) {
  await navigateTo('/groups');
} else if (auth.isPending) {
  await navigateTo('/auth/pending');
} else if (auth.isBlocked) {
  await navigateTo('/auth/blocked');
}

const loading = ref(false);
const errorMessage = ref('');

function login() {
  loading.value = true;
  errorMessage.value = '';
  if (import.meta.client) {
    window.location.href = '/';
  }
}
</script>
