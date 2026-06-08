<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <h2 class="text-lg font-semibold mb-4">Tabla de Posiciones Real</h2>

    <table class="w-full text-sm">
      <thead>
        <tr class="border-b bg-gray-50">
          <th class="text-left py-2 px-2 w-8">#</th>
          <th class="text-left py-2 px-2">Equipo</th>
          <th class="text-center py-2 px-1 w-10">Pts</th>
          <th class="text-center py-2 px-1 w-10">GF</th>
          <th class="text-center py-2 px-1 w-10">DG</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entry, index) in standing" :key="entry.teamId" class="border-b last:border-0">
          <td class="py-2 px-2 font-medium text-gray-500">{{ index + 1 }}</td>
          <td class="py-2 px-2">
            <CommonTeamLogo
              :team="{ id: entry.teamId, name: entry.name, crest_url: entry.crest_url, short_name: null, tla: null, country_code: null }"
              size="sm"
              :show-name="true"
            />
          </td>
          <td class="py-2 px-1 text-center font-bold">{{ entry.points }}</td>
          <td class="py-2 px-1 text-center">{{ entry.gf }}</td>
          <td class="py-2 px-1 text-center">{{ entry.gd > 0 ? '+' : '' }}{{ entry.gd }}</td>
        </tr>
        <tr v-if="standing.length === 0">
          <td colspan="5" class="py-4 text-center text-gray-500">
            Aún no hay partidos finalizados en este grupo
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { StandingEntry } from '~~/server/services/PredictionService';

defineProps<{
  standing: StandingEntry[];
}>();
</script>
