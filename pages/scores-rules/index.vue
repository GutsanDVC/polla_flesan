<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-green-700">Reglas de Puntaje</h1>

    <ScoresScoringRules :show-examples="true" />

    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-lg font-semibold mb-4">¿Cómo funciona?</h2>
      <div class="space-y-4 text-sm text-gray-600">
        <p>
          Hacés tus predicciones antes de que comience cada fase del torneo.
          Una vez que los partidos se juegan, se calculan tus puntos automáticamente.
        </p>
        <p>
          Podés combinar predicciones de <strong>fase de grupos</strong> y
          <strong>eliminatorias</strong>. Cada predicción puede darte hasta
          <strong>640 puntos</strong> por partido (resultado exacto en la Final).
        </p>
        <p>
          También participás en las <strong>predicciones de posición de grupo</strong>,
          donde elegís los 3 primeros de cada grupo.
        </p>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
      <h2 class="text-lg font-semibold mb-2">⏰ Límite de Predicciones</h2>
      <p class="text-sm text-gray-600">
        Las predicciones deben ingresarse <strong>al menos 1 hora antes</strong> del inicio
        del primer partido de la fase de grupos (11 de junio de 2026 a las 15:00 hrs).
        Las predicciones realizadas después de este límite no serán consideradas.
      </p>
    </div>

    <div class="bg-gradient-to-br from-green-600 to-green-800 rounded-lg shadow-md p-6 text-white">
      <h2 class="text-lg font-semibold mb-4">💰 Premios</h2>

      <div class="bg-white/10 rounded-lg p-4 mb-4 text-center">
        <p class="text-sm opacity-80">Pozo Acumulado</p>
        <p class="text-3xl font-bold">${{ totalPot.toLocaleString('es-CL') }}</p>
        <p class="text-xs opacity-70 mt-1">
          {{ participantCount }} participantes x $10.000 CLP
        </p>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between bg-white/10 rounded-lg p-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🥇</span>
            <div>
              <p class="font-semibold">1er Lugar</p>
              <p class="text-xs opacity-70">50% del pozo</p>
            </div>
          </div>
          <p class="text-xl font-bold">${{ firstPlace.toLocaleString('es-CL') }}</p>
        </div>

        <div class="flex items-center justify-between bg-white/10 rounded-lg p-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🥈</span>
            <div>
              <p class="font-semibold">2do Lugar</p>
              <p class="text-xs opacity-70">30% del pozo</p>
            </div>
          </div>
          <p class="text-xl font-bold">${{ secondPlace.toLocaleString('es-CL') }}</p>
        </div>

        <div class="flex items-center justify-between bg-white/10 rounded-lg p-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🥉</span>
            <div>
              <p class="font-semibold">3er Lugar</p>
              <p class="text-xs opacity-70">20% del pozo</p>
            </div>
          </div>
          <p class="text-xl font-bold">${{ thirdPlace.toLocaleString('es-CL') }}</p>
        </div>
      </div>

      <p class="text-xs opacity-60 mt-4 text-center">
        * Cada participante aporta $10.000 CLP al pozo
      </p>
    </div>

    <div class="text-center">
      <NuxtLink to="/scores" class="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
        Ver mis predicciones
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const PRIZE_COST = 10000;

const participantCount = ref(0);

const totalPot = computed(() => participantCount.value * PRIZE_COST);
const firstPlace = computed(() => Math.floor(totalPot.value * 0.5));
const secondPlace = computed(() => Math.floor(totalPot.value * 0.3));
const thirdPlace = computed(() => totalPot.value - firstPlace.value - secondPlace.value);

onMounted(async () => {
  try {
    const leaderboard = await $fetch<Array<any>>('/api/leaderboard');
    participantCount.value = leaderboard.length;
  } catch (error) {
    console.error('Error loading participant count:', error);
  }
});
</script>
