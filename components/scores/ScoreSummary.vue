<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-lg font-semibold mb-4">Resumen</h2>

    <div class="grid grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-3xl font-bold text-green-700">{{ totalPoints }}</p>
        <p class="text-sm text-gray-500">Puntos</p>
      </div>
      <div>
        <p class="text-3xl font-bold text-blue-600">#{{ rank }}</p>
        <p class="text-sm text-gray-500">Posición</p>
      </div>
      <div>
        <p class="text-3xl font-bold text-gray-700">{{ processedCount }}/{{ totalCount }}</p>
        <p class="text-sm text-gray-500">Procesadas</p>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
      <div class="text-center">
        <p class="font-semibold text-gray-700">{{ matchPoints }} pts</p>
        <p class="text-gray-500">Predicciones</p>
      </div>
      <div class="text-center">
        <p class="font-semibold text-gray-700">{{ groupPoints }} pts</p>
        <p class="text-gray-500">Posiciones</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchPredictionWithMatch } from '~~/types/domain';
import type { GroupPrediction } from '~~/types/domain';

const props = defineProps<{
  matchPredictions: MatchPredictionWithMatch[];
  groupPredictions: GroupPrediction[];
  rank: number;
}>();

const totalPoints = computed(() => {
  const matchPts = props.matchPredictions.reduce((sum, p) => sum + (p.calculated_points || 0), 0);
  const groupPts = props.groupPredictions.reduce((sum, p) => sum + (p.calculated_points || 0), 0);
  return matchPts + groupPts;
});

const matchPoints = computed(() =>
  props.matchPredictions.reduce((sum, p) => sum + (p.calculated_points || 0), 0)
);

const groupPoints = computed(() =>
  props.groupPredictions.reduce((sum, p) => sum + (p.calculated_points || 0), 0)
);

const totalCount = computed(() => props.matchPredictions.length);

const processedCount = computed(() =>
  props.matchPredictions.filter((p) => p.processed).length
);
</script>
