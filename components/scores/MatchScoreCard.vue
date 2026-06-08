<template>
  <div class="bg-white rounded-lg shadow-sm border p-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs text-gray-500">{{ formatDate(prediction.utc_date) }}</span>
      <span :class="statusClass">{{ statusLabel }}</span>
    </div>

    <div class="flex items-center justify-between gap-4">
      <div class="flex-1 text-right">
        <CommonTeamLogo :team="prediction.homeTeam" size="sm" :show-name="true" />
      </div>

      <div class="text-center">
        <div class="flex items-center gap-1 text-lg font-bold">
          <span :class="prediction.home_score_pred === prediction.home_score ? 'text-green-600' : 'text-gray-700'">
            {{ prediction.home_score_pred }}
          </span>
          <span class="text-gray-400">-</span>
          <span :class="prediction.away_score_pred === prediction.away_score ? 'text-green-600' : 'text-gray-700'">
            {{ prediction.away_score_pred }}
          </span>
        </div>
        <div v-if="prediction.match_status === 'FINISHED' && prediction.home_score !== null" class="text-xs text-gray-500">
          Real: {{ prediction.home_score }} - {{ prediction.away_score }}
        </div>
      </div>

      <div class="flex-1">
        <CommonTeamLogo :team="prediction.awayTeam" size="sm" :show-name="true" />
      </div>
    </div>

    <div v-if="prediction.processed && prediction.calculated_points > 0" class="mt-3 pt-3 border-t">
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-500">{{ explanation }}</span>
        <span class="text-sm font-bold text-green-600">+{{ prediction.calculated_points }} pts</span>
      </div>
    </div>
    <div v-else-if="prediction.processed && prediction.calculated_points === 0" class="mt-3 pt-3 border-t">
      <span class="text-xs text-gray-400">Sin puntos</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchPredictionWithMatch } from '~~/types/domain';
import { PHASE_LABELS } from '~~/types/domain';

const props = defineProps<{
  prediction: MatchPredictionWithMatch;
}>();

const statusClass = computed(() => {
  if (props.prediction.match_status === 'FINISHED') return 'text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded';
  if (props.prediction.match_status === 'LIVE') return 'text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded';
  return 'text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded';
});

const statusLabel = computed(() => {
  if (props.prediction.match_status === 'FINISHED') return 'Final';
  if (props.prediction.match_status === 'LIVE') return 'En vivo';
  return PHASE_LABELS[props.prediction.phase] || props.prediction.phase;
});

const explanation = computed(() => {
  const p = props.prediction;
  if (p.home_score === null || p.away_score === null) return '';

  const isExact = p.home_score_pred === p.home_score && p.away_score_pred === p.away_score;
  if (isExact) return 'Resultado exacto';

  const homeWin = p.home_score > p.away_score;
  const awayWin = p.away_score > p.home_score;
  const predHomeWin = p.home_score_pred > p.away_score_pred;
  const predAwayWin = p.away_score_pred > p.home_score_pred;
  const isDraw = p.home_score === p.away_score;
  const predIsDraw = p.home_score_pred === p.away_score_pred;

  const correctWinner = (homeWin && predHomeWin) || (awayWin && predAwayWin) || (isDraw && predIsDraw);
  if (correctWinner) return 'Ganador correcto';

  return 'Sin aciertos';
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
