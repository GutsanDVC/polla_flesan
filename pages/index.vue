<template>
  <div class="space-y-8">
    <section class="text-center py-12">
      <h1 class="text-4xl md:text-5xl font-bold text-green-700 mb-10">
        {{ appName }}
      </h1>
      <img src="https://crests.football-data.org/wm26.png" alt="FIFA World Cup 2026" class="h-64 mx-auto mb-8" />

      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <template v-if="!auth.isAuthenticated">
          <NuxtLink to="/auth/login" class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
            Iniciar sesión con Google
          </NuxtLink>
        </template>
        <template v-else-if="auth.isPending">
          <NuxtLink to="/auth/pending" class="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition">
            Esperando aprobación
          </NuxtLink>
        </template>
        <template v-else-if="auth.isBlocked">
          <NuxtLink to="/auth/blocked" class="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
            Cuenta bloqueada
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/groups" class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
            Ver Fase de Grupos
          </NuxtLink>
          <NuxtLink to="/leaderboard" class="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition">
            Tabla de Clasificación
          </NuxtLink>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const appName = config.public.appName;
const auth = useAuthStore();

if (!auth.user && !auth.loading) {
  await auth.fetchMe();
}
</script>
