<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-green-700">Gestión de Resultados</h1>

    <div class="bg-white rounded-lg shadow-md p-4">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <p class="text-sm text-gray-600">
          Sincroniza partidos y resultados desde la API de football-data.org
        </p>
        <AdminSyncMatchesButton @synced="onSynced" />
      </div>
      <AdminSyncResultPanel v-if="lastSync" :result="lastSync" class="mt-4" />
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="phase in phaseFilters"
        :key="phase.value"
        @click="phaseFilter = phase.value"
        :class="[
          'px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition text-sm',
          phaseFilter === phase.value
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        {{ phase.label }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Cargando partidos...</p>
    </div>

    <div v-else-if="filteredMatches.length === 0" class="text-center py-8 text-gray-500">
      No hay partidos en esta fase.
    </div>

    <div v-else class="space-y-4">
      <div v-for="match in filteredMatches" :key="match.id" class="bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500">
            {{ formatDate(match.utc_date) }} · {{ match.phase }}<span v-if="match.group"> · Grupo {{ match.group }}</span>
          </span>
          <span v-if="match.status === 'FINISHED'" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Finalizado</span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex-1 text-right">
            <CommonTeamLogo :team="match.homeTeam" size="sm" :show-name="true" />
          </div>

          <div class="flex items-center gap-2 mx-4">
            <input
              v-model.number="resultDraft[match.id].home"
              type="number"
              min="0"
              class="w-12 text-center border rounded py-1"
              placeholder="-"
              :disabled="match.status === 'FINISHED'"
            />
            <span class="text-gray-400">-</span>
            <input
              v-model.number="resultDraft[match.id].away"
              type="number"
              min="0"
              class="w-12 text-center border rounded py-1"
              placeholder="-"
              :disabled="match.status === 'FINISHED'"
            />
          </div>

          <div class="flex-1">
            <CommonTeamLogo :team="match.awayTeam" size="sm" :show-name="true" />
          </div>
        </div>

        <button
          @click="saveResult(match)"
          :disabled="match.status === 'FINISHED' || saving[match.id]"
          class="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition text-sm disabled:bg-gray-400"
        >
          {{ match.status === 'FINISHED' ? 'Finalizado' : saving[match.id] ? 'Guardando...' : 'Guardar Resultado' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match, SyncResult } from '~~/types/domain';
import { PHASE_LABELS } from '~~/types/domain';

definePageMeta({ middleware: 'auth' });

const phaseFilters = (Object.keys(PHASE_LABELS) as Array<keyof typeof PHASE_LABELS>).map(
  (value) => ({ value, label: PHASE_LABELS[value] }),
);

const phaseFilter = ref<Match['phase']>('GROUP');
const matches = ref<Match[]>([]);
const loading = ref(true);
const lastSync = ref<SyncResult | null>(null);
const saving = ref<Record<number, boolean>>({});
const resultDraft = ref<Record<number, { home: number; away: number }>>({});

const filteredMatches = computed(() =>
  matches.value.filter((m) => m.phase === phaseFilter.value),
);

function initDrafts(list: Match[]) {
  for (const m of list) {
    if (!(m.id in resultDraft.value)) {
      resultDraft.value[m.id] = {
        home: m.home_score ?? 0,
        away: m.away_score ?? 0,
      };
    }
  }
}

async function loadMatches() {
  loading.value = true;
  try {
    matches.value = await $fetch<Match[]>('/api/matches');
    initDrafts(matches.value);
  } catch (error) {
    console.error('Error fetching matches:', error);
  } finally {
    loading.value = false;
  }
}

function onSynced(result: SyncResult) {
  lastSync.value = result;
  loadMatches();
}

async function saveResult(match: Match) {
  saving.value[match.id] = true;
  try {
    const draft = resultDraft.value[match.id];
    await $fetch(`/api/admin/matches/${match.id}/result`, {
      method: 'POST',
      body: {
        homeScore: Number(draft?.home) || 0,
        awayScore: Number(draft?.away) || 0,
      },
    });
    await loadMatches();
  } catch (error: any) {
    alert(error?.data?.statusMessage || error?.statusMessage || error?.message || 'Error al guardar resultado');
  } finally {
    saving.value[match.id] = false;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(loadMatches);
</script>
