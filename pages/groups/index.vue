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

    <div v-else-if="selectedGroup" class="space-y-6">
      <GroupMatchList
        :matches="groupMatches"
        :predictions="userPredictions"
        @save-prediction="savePrediction"
      />

      <GroupStandings
        :standing="groupStanding"
        :matches="groupMatches"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match, MatchPrediction } from '~~/types/domain';

definePageMeta({ middleware: 'auth' });

const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const selectedGroup = ref('A');
const loading = ref(true);
const groupMatches = ref<Match[]>([]);
const userPredictions = ref<MatchPrediction[]>([]);
const groupStanding = ref<string[]>([]);

async function fetchGroupData() {
  loading.value = true;
  try {
    const data = await $fetch<{
      group: string;
      matches: Match[];
      predictions: MatchPrediction[];
      standing: string[];
    }>(`/api/standings/group/${selectedGroup.value}`);
    groupMatches.value = data.matches;
    groupStanding.value = data.standing;
    userPredictions.value = data.predictions;
  } catch (error) {
    console.error('Error fetching group data:', error);
  } finally {
    loading.value = false;
  }
}

async function savePrediction(matchId: number, homeScore: number, awayScore: number) {
  try {
    await $fetch('/api/predictions/match', {
      method: 'POST',
      body: { matchId, homeScorePred: homeScore, awayScorePred: awayScore },
    });
    await fetchGroupData();
  } catch (error: any) {
    alert(error?.data?.statusMessage || error?.statusMessage || error?.message || 'Error al guardar predicción');
  }
}

watch(selectedGroup, fetchGroupData);
onMounted(fetchGroupData);
</script>
