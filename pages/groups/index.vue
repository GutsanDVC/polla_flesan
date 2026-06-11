<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-green-700">Fase de Grupos</h1>

    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="letter in groups"
        :key="letter"
        @click="selectedGroup = letter"
        :class="[
          'px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition',
          selectedGroup === letter
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        Grupo {{ letter }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Cargando...</p>
    </div>

    <div v-else-if="selectedGroup" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-700">Grupo {{ selectedGroup }}</h2>
        <button
          v-if="!isGlobalLock"
          @click="saveAllPredictions"
          :disabled="saving || !hasChanges"
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition',
            saving || !hasChanges
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          ]"
        >
          {{ saving ? 'Guardando...' : 'Guardar todo' }}
        </button>
      </div>

      <div v-if="isGlobalLock" class="bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm">
        Predicciones cerradas. Ya no es posible modificar pronósticos.
      </div>

      <div v-if="saveMessage" :class="[
        'px-4 py-2 rounded text-sm',
        saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      ]">
        {{ saveMessage.text }}
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-1 min-w-0">
          <GroupMatchList
            ref="matchListRef"
            :matches="groupMatches"
            :predictions="userPredictions"
          />
        </div>

        <div class="w-full lg:w-80 flex-shrink-0 space-y-4">
          <GroupStandings
            :standing="groupStanding"
          />
          <GroupRealStandings
            :standing="realStanding"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match, MatchPrediction } from '~~/types/domain';
import type { StandingEntry } from '~~/server/services/PredictionService';

definePageMeta({ middleware: 'auth' });

const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const selectedGroup = ref('A');
const loading = ref(true);
const saving = ref(false);
const groupMatches = ref<Match[]>([]);
const userPredictions = ref<MatchPrediction[]>([]);
const groupStanding = ref<StandingEntry[]>([]);
const realStanding = ref<StandingEntry[]>([]);
const matchListRef = ref<any>(null);
const saveMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

const LOCK_DATE = new Date('2026-06-12T00:00:00Z');
const isGlobalLock = computed(() => new Date() >= LOCK_DATE);

const originalPredictions = ref<Record<number, { home: number; away: number }>>({});

const hasChanges = computed(() => {
  if (!matchListRef.value?.localPredictions) return false;
  const current = matchListRef.value.localPredictions;
  for (const matchId of Object.keys(current)) {
    const id = Number(matchId);
    const orig = originalPredictions.value[id];
    const curr = current[id];
    if (!orig || orig.home !== curr.home || orig.away !== curr.away) {
      return true;
    }
  }
  return false;
});

async function fetchGroupData() {
  loading.value = true;
  try {
    const data = await $fetch<{
      group: string;
      matches: Match[];
      predictions: MatchPrediction[];
      standing: StandingEntry[];
      realStanding: StandingEntry[];
    }>(`/api/standings/group/${selectedGroup.value}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    groupMatches.value = data.matches;
    groupStanding.value = data.standing;
    realStanding.value = data.realStanding;
    userPredictions.value = data.predictions;

    const preds: Record<number, { home: number; away: number }> = {};
    data.predictions.forEach((p) => {
      preds[p.match_id] = { home: p.home_score_pred, away: p.away_score_pred };
    });
    originalPredictions.value = preds;
  } catch (error) {
    console.error('Error fetching group data:', error);
  } finally {
    loading.value = false;
  }
}

async function saveAllPredictions() {
  if (!matchListRef.value?.localPredictions) return;

  saving.value = true;
  saveMessage.value = null;

  const current = matchListRef.value.localPredictions;
  const toSave: Array<{ matchId: number; homeScorePred: number; awayScorePred: number }> = [];

  for (const matchId of Object.keys(current)) {
    const id = Number(matchId);
    const match = groupMatches.value.find((m) => m.id === id);
    if (match && matchListRef.value.isMatchLocked(match)) continue;
    const pred = current[id];
    toSave.push({
      matchId: id,
      homeScorePred: pred.home,
      awayScorePred: pred.away,
    });
  }

  if (toSave.length === 0) {
    saveMessage.value = { type: 'error', text: 'No hay predicciones editables para guardar' };
    saving.value = false;
    return;
  }

  try {
    await $fetch('/api/predictions/bulk', {
      method: 'POST',
      body: { predictions: toSave },
    });
    saveMessage.value = { type: 'success', text: 'Predicciones guardadas correctamente' };
    await fetchGroupData();
  } catch (error: any) {
    saveMessage.value = {
      type: 'error',
      text: error?.data?.statusMessage || error?.statusMessage || 'Error al guardar predicciones'
    };
  } finally {
    saving.value = false;
  }
}

watch(selectedGroup, fetchGroupData);
onMounted(fetchGroupData);
</script>
