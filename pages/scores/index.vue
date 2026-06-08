<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-green-700">Mis Puntajes</h1>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Cargando...</p>
    </div>

    <template v-else>
      <ScoresScoreSummary
        :match-predictions="matchPredictions"
        :group-predictions="groupPredictions"
        :rank="rank"
      />

      <div class="bg-white rounded-lg shadow-md p-4">
        <h2 class="text-lg font-semibold mb-3">Reglas de Puntaje</h2>
        <div class="flex flex-wrap gap-3 text-sm">
          <span class="bg-green-50 text-green-700 px-3 py-1 rounded-full">🎯 Exacto: 10 pts</span>
          <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">✅ Ganador: 5 pts</span>
          <span class="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">⚡ Multiplicador por fase</span>
        </div>
        <NuxtLink to="/scores-rules" class="inline-block mt-3 text-sm text-green-600 hover:underline">
          Ver reglas completas →
        </NuxtLink>
      </div>

      <div v-if="groupPhasePredictions.length > 0">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">Fase de Grupos</h2>
        <div class="space-y-3">
          <ScoresMatchScoreCard
            v-for="pred in groupPhasePredictions"
            :key="pred.id"
            :prediction="pred"
          />
        </div>
      </div>

      <div v-if="knockoutPhasePredictions.length > 0">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">Eliminatorias</h2>
        <div class="space-y-3">
          <ScoresMatchScoreCard
            v-for="pred in knockoutPhasePredictions"
            :key="pred.id"
            :prediction="pred"
          />
        </div>
      </div>

      <div v-if="groupPredictions.length > 0">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">Posiciones de Grupo</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ScoresGroupPositionCard
            v-for="pred in groupPredictions"
            :key="pred.id"
            :prediction="pred"
          />
        </div>
      </div>

      <div v-if="matchPredictions.length === 0 && groupPredictions.length === 0" class="text-center py-12">
        <p class="text-gray-500 text-lg">Aún no tenés predicciones</p>
        <NuxtLink to="/groups" class="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
          Hacer predicciones
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MatchPredictionWithMatch, GroupPrediction } from '~~/types/domain';
import { PHASES } from '~~/types/domain';

definePageMeta({ middleware: 'auth' });

const loading = ref(true);
const matchPredictions = ref<MatchPredictionWithMatch[]>([]);
const groupPredictions = ref<GroupPrediction[]>([]);
const rank = ref(0);

const KNOCKOUT_PHASES = ['R32', 'R16', 'QUARTERS', 'SEMIS', 'THIRD_PLACE', 'FINAL'];

const groupPhasePredictions = computed(() =>
  matchPredictions.value.filter((p) => p.phase === 'GROUP')
);

const knockoutPhasePredictions = computed(() =>
  matchPredictions.value.filter((p) => KNOCKOUT_PHASES.includes(p.phase))
);

async function fetchData() {
  loading.value = true;
  try {
    const [predictions, groups, leaderboard] = await Promise.all([
      $fetch<MatchPredictionWithMatch[]>('/api/predictions/me'),
      $fetch<GroupPrediction[]>('/api/predictions/my-group-predictions'),
      $fetch<Array<{ id: string; totalPoints: number }>>('/api/leaderboard'),
    ]);

    matchPredictions.value = predictions;
    groupPredictions.value = groups;

    const userId = predictions[0]?.user_id || groups[0]?.user_id;
    const userRank = leaderboard.findIndex((u) => u.id === userId);
    rank.value = userRank >= 0 ? userRank + 1 : 0;
  } catch (error) {
    console.error('Error fetching scores:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
