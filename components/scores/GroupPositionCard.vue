<template>
  <div class="bg-white rounded-lg shadow-sm border p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold text-gray-700">Grupo {{ prediction.group }}</h3>
      <span v-if="prediction.processed && prediction.calculated_points > 0" class="text-sm font-bold text-green-600">
        +{{ prediction.calculated_points }} pts
      </span>
      <span v-else-if="prediction.processed" class="text-xs text-gray-400">Sin puntos</span>
    </div>

    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <span class="text-lg">🥇</span>
        <span class="text-sm font-medium">{{ prediction.pos_1_team }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-lg">🥈</span>
        <span class="text-sm font-medium">{{ prediction.pos_2_team }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-lg">🥉</span>
        <span class="text-sm font-medium">{{ prediction.pos_3_team }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GroupPrediction } from '~~/types/domain';

defineProps<{
  prediction: GroupPrediction;
}>();
</script>
