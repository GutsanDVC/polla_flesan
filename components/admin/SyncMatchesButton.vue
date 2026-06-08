<template>
  <div class="flex items-center gap-3">
    <button
      @click="onSync"
      :disabled="loading"
      class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <span v-if="loading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <span>{{ loading ? 'Sincronizando...' : 'Sincronizar desde API' }}</span>
    </button>
    <button
      v-if="lastResult"
      @click="$emit('show-result')"
      class="text-sm text-gray-600 hover:text-gray-800 underline"
    >
      Ver última sincronización
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SyncResult } from '~~/types/domain';

const emit = defineEmits<{
  (e: 'synced', result: SyncResult): void;
  (e: 'show-result'): void;
}>();

const loading = ref(false);
const lastResult = ref<SyncResult | null>(null);
const error = ref<string | null>(null);

async function onSync() {
  loading.value = true;
  error.value = null;
  try {
    const result = await $fetch<SyncResult>('/api/admin/matches/sync', {
      method: 'POST',
    });
    lastResult.value = result;
    emit('synced', result);
  } catch (err: any) {
    error.value =
      err?.data?.statusMessage || err?.statusMessage || err?.message || 'Error al sincronizar';
    alert(error.value);
  } finally {
    loading.value = false;
  }
}
</script>
