<template>
  <div
    v-if="result"
    class="bg-white rounded-lg shadow-md p-4 border-l-4"
    :class="result.errors.length > 0 ? 'border-yellow-500' : 'border-green-500'"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold">Última Sincronización</h3>
      <span class="text-xs text-gray-500">{{ formatDate(result.fetchedAt) }}</span>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      <div class="bg-gray-50 rounded p-2 text-center">
        <div class="text-2xl font-bold text-gray-700">{{ result.total }}</div>
        <div class="text-xs text-gray-500">Total</div>
      </div>
      <div class="bg-blue-50 rounded p-2 text-center">
        <div class="text-2xl font-bold text-blue-700">{{ result.created }}</div>
        <div class="text-xs text-gray-500">Creados</div>
      </div>
      <div class="bg-yellow-50 rounded p-2 text-center">
        <div class="text-2xl font-bold text-yellow-700">{{ result.updated }}</div>
        <div class="text-xs text-gray-500">Actualizados</div>
      </div>
      <div class="bg-green-50 rounded p-2 text-center">
        <div class="text-2xl font-bold text-green-700">{{ result.finished }}</div>
        <div class="text-xs text-gray-500">Puntos calculados</div>
      </div>
    </div>

    <div class="text-xs text-gray-500">
      Duración: {{ result.durationMs }}ms
    </div>

    <details v-if="result.errors.length > 0" class="mt-3">
      <summary class="text-sm text-yellow-700 cursor-pointer">
        {{ result.errors.length }} advertencia(s)
      </summary>
      <ul class="mt-2 text-xs text-gray-600 space-y-1">
        <li v-for="(err, i) in result.errors" :key="i" class="font-mono">• {{ err }}</li>
      </ul>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { SyncResult } from '~~/types/domain';

defineProps<{ result: SyncResult | null }>();

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
</script>
