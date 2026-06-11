<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <h2 class="text-lg font-semibold mb-4">Partidos</h2>

    <div class="space-y-4">
      <div v-for="match in matches" :key="match.id" class="border-b pb-4 last:border-0">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500">{{ formatDate(match.utc_date) }}</span>
          <span v-if="match.status === 'FINISHED'" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
            Final
          </span>
          <span v-else-if="match.status === 'LIVE'" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
            En vivo
          </span>
          <span v-else-if="isMatchLocked(match)" class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
            Cerrado
          </span>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="flex-1 text-right">
            <CommonTeamLogo :team="match.homeTeam" size="sm" :show-name="true" />
          </div>

          <div class="flex items-center gap-2">
            <input
              type="number"
              min="0"
              :value="getPrediction(match.id, 'home')"
              @change="updatePrediction(match.id, 'home', $event)"
              :disabled="isMatchLocked(match)"
              class="w-12 text-center border rounded py-1 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span class="text-gray-400">-</span>
            <input
              type="number"
              min="0"
              :value="getPrediction(match.id, 'away')"
              @change="updatePrediction(match.id, 'away', $event)"
              :disabled="isMatchLocked(match)"
              class="w-12 text-center border rounded py-1 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div class="flex-1">
            <CommonTeamLogo :team="match.awayTeam" size="sm" :show-name="true" />
          </div>
        </div>

        <div v-if="match.status === 'FINISHED'" class="mt-2 text-center text-sm text-gray-500">
          Resultado: {{ match.home_score }} - {{ match.away_score }}
        </div>
      </div>

      <div v-if="matches.length === 0" class="text-center text-gray-500 py-4">
        No hay partidos en este grupo
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match, MatchPrediction } from '~~/types/domain';

const props = defineProps<{
  matches: Match[];
  predictions: MatchPrediction[];
}>();

const LOCK_DATE = new Date('2026-06-12T00:00:00Z');

function isMatchLocked(match: Match) {
  return new Date(match.utc_date) <= new Date() || new Date() >= LOCK_DATE;
}

const localPredictions = ref<Record<number, { home: number; away: number }>>({});

onMounted(() => {
  props.predictions.forEach((pred) => {
    localPredictions.value[pred.match_id] = {
      home: pred.home_score_pred,
      away: pred.away_score_pred,
    };
  });
});

watch(
  () => props.predictions,
  (preds) => {
    preds.forEach((pred) => {
      if (!(pred.match_id in localPredictions.value)) {
        localPredictions.value[pred.match_id] = {
          home: pred.home_score_pred,
          away: pred.away_score_pred,
        };
      }
    });
  },
  { deep: true },
);

function getPrediction(matchId: number, side: 'home' | 'away') {
  return localPredictions.value[matchId]?.[side] ?? '';
}

function updatePrediction(matchId: number, side: 'home' | 'away', event: Event) {
  const target = event.target as HTMLInputElement;
  const value = parseInt(target.value) || 0;
  if (!localPredictions.value[matchId]) {
    localPredictions.value[matchId] = { home: 0, away: 0 };
  }
  localPredictions.value[matchId][side] = value;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

defineExpose({ localPredictions, isMatchLocked });
</script>
