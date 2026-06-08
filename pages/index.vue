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

    <section v-if="auth.isApproved && !loadingScore" class="max-w-md mx-auto">
      <div class="bg-white rounded-lg shadow-md p-6 text-center">
        <p class="text-sm text-gray-500 mb-1">Tu puntaje</p>
        <p class="text-4xl font-bold text-green-700">{{ totalPoints }}</p>
        <p class="text-sm text-gray-500 mt-1">
          <template v-if="rank > 0">#{{ rank }} en la tabla</template>
          <template v-else>Aún sin posición</template>
        </p>
        <NuxtLink to="/scores" class="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold">
          Ver detalle →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const appName = config.public.appName;
const auth = useAuthStore();

const loadingScore = ref(true);
const totalPoints = ref(0);
const rank = ref(0);

if (!auth.user && !auth.loading) {
  await auth.fetchMe();
}

if (auth.isPending) {
  await navigateTo('/auth/pending');
} else if (auth.isBlocked) {
  await navigateTo('/auth/blocked');
}

if (auth.isApproved) {
  try {
    const [predictions, leaderboard] = await Promise.all([
      $fetch<Array<{ calculated_points: number }>>('/api/predictions/me'),
      $fetch<Array<{ id: string; totalPoints: number }>>('/api/leaderboard'),
    ]);

    totalPoints.value = predictions.reduce((sum, p) => sum + (p.calculated_points || 0), 0);

    const userId = predictions[0] ? (await $fetch<any>('/api/auth/me')).id : null;
    if (userId) {
      const userRank = leaderboard.findIndex((u) => u.id === userId);
      rank.value = userRank >= 0 ? userRank + 1 : 0;
    }
  } catch (error) {
    console.error('Error loading score summary:', error);
  } finally {
    loadingScore.value = false;
  }
}
</script>
