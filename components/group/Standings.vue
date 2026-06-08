<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <h2 class="text-lg font-semibold mb-4">Tabla de Posiciones Proyectada</h2>

    <table class="w-full text-sm">
      <thead>
        <tr class="border-b bg-gray-50">
          <th class="text-left py-2 px-2 w-10">#</th>
          <th class="text-left py-2 px-2">Equipo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(teamName, index) in standing" :key="index" class="border-b last:border-0">
          <td class="py-2 px-2 font-medium">{{ index + 1 }}</td>
          <td class="py-2 px-2">{{ teamName }}</td>
        </tr>
        <tr v-if="standing.length === 0">
          <td colspan="2" class="py-4 text-center text-gray-500">
            Ingresa predicciones para ver la tabla proyectada
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Match } from '~~/types/domain';

defineProps<{
  standing: string[];
  matches: Match[];
}>();
</script>
