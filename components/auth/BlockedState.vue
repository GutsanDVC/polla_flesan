<template>
  <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-4">
    <div class="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
      <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
      </svg>
    </div>
    <h2 class="text-xl font-semibold text-red-800">Acceso bloqueado</h2>
    <p class="text-red-700">
      Hola <strong>{{ userName }}</strong>, tu cuenta fue bloqueada. Si crees que es un error,
      contacta al administrador del torneo.
    </p>
    <button
      type="button"
      class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      @click="logout"
    >
      Cerrar sesión
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ userName: string }>();
const auth = useAuthStore();
async function logout() {
  await auth.logout();
}
</script>
