<template>
  <div class="bg-white rounded-lg shadow-md border overflow-hidden">
    <div class="p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-gray-500">{{ formatDate(match.utc_date) }}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">{{ phaseLabel }}</span>
          <span :class="statusClass">{{ statusLabel }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div class="flex-1 text-right">
          <div v-if="match.home_team.crest_url" class="flex items-center justify-end gap-2">
            <img :src="match.home_team.crest_url" :alt="match.home_team.name" class="w-8 h-8 object-contain" />
            <span class="font-semibold text-sm text-gray-700">{{ match.home_team.name }}</span>
          </div>
          <span v-else class="font-semibold text-sm text-gray-700">{{ match.home_team.name }}</span>
        </div>

        <div class="text-center px-4">
          <div v-if="isAdmin && match.status === 'LIVE' && expanded" class="flex items-center gap-2">
            <input
              v-model.number="draftHome"
              type="number"
              min="0"
              max="30"
              class="w-12 text-center border rounded py-1 text-lg font-bold"
              placeholder="-"
            />
            <span class="text-gray-400 text-lg font-bold">-</span>
            <input
              v-model.number="draftAway"
              type="number"
              min="0"
              max="30"
              class="w-12 text-center border rounded py-1 text-lg font-bold"
              placeholder="-"
            />
          </div>
          <div v-else-if="match.home_score !== null && match.away_score !== null" class="text-2xl font-bold text-gray-800">
            {{ match.home_score }} - {{ match.away_score }}
          </div>
          <div v-else class="text-lg text-gray-400">vs</div>
        </div>

        <div class="flex-1">
          <div v-if="match.away_team.crest_url" class="flex items-center gap-2">
            <span class="font-semibold text-sm text-gray-700">{{ match.away_team.name }}</span>
            <img :src="match.away_team.crest_url" :alt="match.away_team.name" class="w-8 h-8 object-contain" />
          </div>
          <span v-else class="font-semibold text-sm text-gray-700">{{ match.away_team.name }}</span>
        </div>
      </div>

      <div v-if="isAdmin && match.status === 'LIVE' && expanded" class="flex items-center justify-center gap-2 mt-3">
        <button
          @click="saveScore"
          :disabled="saving"
          :class="[
            'px-4 py-1.5 rounded text-sm font-semibold transition',
            saving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          ]"
        >
          {{ saving ? 'Guardando...' : 'Guardar marcador' }}
        </button>
        <button
          @click="finishMatch"
          :disabled="saving"
          class="px-4 py-1.5 rounded text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition"
        >
          Marcar como finalizado
        </button>
      </div>

      <div v-if="isAdmin && match.status === 'LIVE' && expanded && saveMessage" :class="[
        'mt-2 px-3 py-1.5 rounded text-xs text-center',
        saveMessage.type === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      ]">
        {{ saveMessage.text }}
      </div>
    </div>

    <div v-if="expanded" class="border-t">
      <div v-if="match.predictions.length > 0">
        <div class="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
          Predicciones ({{ match.predictions.length }})
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 border-b">
              <th class="px-4 py-2 text-left">Usuario</th>
              <th class="px-4 py-2 text-center">Predicción</th>
              <th class="px-4 py-2 text-center">Pts</th>
              <th class="px-4 py-2 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pred in match.predictions"
              :key="pred.user_id"
              class="border-b last:border-0 hover:bg-gray-50"
            >
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <img
                    v-if="pred.user_avatar"
                    :src="pred.user_avatar"
                    :alt="pred.user_name"
                    class="w-6 h-6 rounded-full"
                  />
                  <span class="font-medium text-gray-700">{{ pred.user_name }}</span>
                </div>
              </td>
              <td class="px-4 py-2 text-center font-mono">
                {{ pred.home_score_pred }} - {{ pred.away_score_pred }}
              </td>
              <td class="px-4 py-2 text-center font-bold" :class="pointsClass(pred)">
                {{ pred.tentative_points > 0 ? pred.tentative_points : '-' }}
              </td>
              <td class="px-4 py-2 text-center">
                <span v-if="pred.status === 'exact'" class="text-green-600">🎯</span>
                <span v-else-if="pred.status === 'winner'" class="text-yellow-500">✅</span>
                <span v-else class="text-gray-300">❌</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="px-4 py-3 text-center text-xs text-gray-400">
        Sin predicciones para este partido
      </div>
    </div>

    <div v-if="!expanded" class="border-t">
      <button
        @click="expanded = true"
        class="w-full px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition font-semibold"
      >
        Ver detalle ({{ match.predictions.length }} predicciones)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LiveMatch } from '~~/server/services/LiveScoreService';
import { PHASE_LABELS } from '~~/types/domain';

const props = defineProps<{
  match: LiveMatch;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const auth = useAuthStore();
const isAdmin = computed(() => auth.isAdmin);

const expanded = ref(props.match.status === 'LIVE');
const draftHome = ref(props.match.home_score ?? 0);
const draftAway = ref(props.match.away_score ?? 0);
const saving = ref(false);
const saveMessage = ref<{ type: 'ok' | 'error'; text: string } | null>(null);

watch(() => props.match, (m) => {
  draftHome.value = m.home_score ?? 0;
  draftAway.value = m.away_score ?? 0;
}, { deep: true });

const statusClass = computed(() => {
  if (props.match.status === 'FINISHED') return 'text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded';
  if (props.match.status === 'LIVE') return 'text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded animate-pulse';
  return 'text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded';
});

const statusLabel = computed(() => {
  if (props.match.status === 'FINISHED') return 'Final';
  if (props.match.status === 'LIVE') return 'En vivo';
  return 'Programado';
});

const phaseLabel = computed(() => PHASE_LABELS[props.match.phase] || props.match.phase);

function pointsClass(pred: { tentative_points: number; status: string }) {
  if (pred.status === 'exact') return 'text-green-600';
  if (pred.status === 'winner') return 'text-yellow-600';
  return 'text-gray-400';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function saveScore() {
  saving.value = true;
  saveMessage.value = null;
  try {
    await $fetch(`/api/live/matches/${props.match.id}/score`, {
      method: 'POST',
      body: { homeScore: draftHome.value ?? 0, awayScore: draftAway.value ?? 0 },
    });
    saveMessage.value = { type: 'ok', text: 'Marcador guardado' };
    emit('updated');
  } catch (error: any) {
    saveMessage.value = { type: 'error', text: error?.data?.statusMessage || 'Error al guardar' };
  } finally {
    saving.value = false;
  }
}

async function finishMatch() {
  saving.value = true;
  saveMessage.value = null;
  try {
    await $fetch(`/api/admin/matches/${props.match.id}/result`, {
      method: 'POST',
      body: { homeScore: draftHome.value ?? 0, awayScore: draftAway.value ?? 0 },
    });
    saveMessage.value = { type: 'ok', text: 'Partido finalizado y puntos calculados' };
    emit('updated');
  } catch (error: any) {
    saveMessage.value = { type: 'error', text: error?.data?.statusMessage || 'Error al finalizar' };
  } finally {
    saving.value = false;
  }
}
</script>
