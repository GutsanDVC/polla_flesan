<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-green-700">Resultados en Vivo</h1>
      <button
        v-if="auth.isAdmin"
        @click="forceSync"
        :disabled="syncing"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-semibold transition',
          syncing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        ]"
      >
        {{ syncing ? 'Sincronizando...' : '🔄 Actualizar' }}
      </button>
    </div>

    <div class="flex items-center gap-4 text-sm text-gray-500">
      <span>Última sync: {{ lastSyncFormatted }}</span>
      <span v-if="liveCount > 0" class="text-red-600 font-semibold">
        {{ liveCount }} partido{{ liveCount > 1 ? 's' : '' }} en vivo
      </span>
      <span class="text-gray-400">|</span>
      <span>Auto-refresh: 30s</span>
    </div>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Cargando partidos...</p>
    </div>

    <template v-else>
      <div v-if="liveMatches.length > 0" class="space-y-4">
        <h2 class="text-lg font-semibold text-red-600 flex items-center gap-2">
          <span class="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          En Vivo
        </h2>
        <LiveMatchCard v-for="match in liveMatches" :key="match.id" :match="match" @updated="fetchLiveData" />
      </div>

      <div v-if="scheduledMatches.length > 0" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-600">Programados</h2>
        <LiveMatchCard v-for="match in scheduledMatches" :key="match.id" :match="match" @updated="fetchLiveData" />
      </div>

      <div v-if="finishedMatches.length > 0" class="space-y-4">
        <h2 class="text-lg font-semibold text-green-600">Finalizados</h2>
        <LiveMatchCard v-for="match in finishedMatches" :key="match.id" :match="match" @updated="fetchLiveData" />
      </div>

      <div v-if="matches.length === 0" class="text-center py-12">
        <p class="text-gray-500 text-lg">No hay partidos registrados</p>
        <p class="text-gray-400 text-sm mt-2">Los partidos aparecerán cuando se sincronicen desde la API</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { LiveMatch } from '~~/server/services/LiveScoreService';

definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const loading = ref(true);
const syncing = ref(false);
const matches = ref<LiveMatch[]>([]);
const lastSyncedAt = ref('');
const liveCount = ref(0);

const liveMatches = computed(() => matches.value.filter((m) => m.status === 'LIVE'));
const scheduledMatches = computed(() => matches.value.filter((m) => m.status === 'SCHEDULED'));
const finishedMatches = computed(() => matches.value.filter((m) => m.status === 'FINISHED'));

const lastSyncFormatted = computed(() => {
  if (!lastSyncedAt.value) return 'Nunca';
  const d = new Date(lastSyncedAt.value);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
});

async function fetchLiveData() {
  try {
    const data = await $fetch<{
      matches: LiveMatch[];
      last_synced_at: string;
      total_matches: number;
      live_count: number;
    }>('/api/live', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    matches.value = data.matches;
    lastSyncedAt.value = data.last_synced_at;
    liveCount.value = data.live_count;
  } catch (error) {
    console.error('Error fetching live data:', error);
  } finally {
    loading.value = false;
  }
}

async function forceSync() {
  syncing.value = true;
  try {
    await $fetch('/api/admin/matches/sync', { method: 'POST' });
    await fetchLiveData();
  } catch (error) {
    console.error('Error syncing:', error);
  } finally {
    syncing.value = false;
  }
}

let refreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchLiveData();
  refreshTimer = setInterval(fetchLiveData, 30000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>
