<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-lg font-semibold mb-4">Reglas de Puntaje</h2>

    <div class="space-y-3">
      <div v-for="rule in rules" :key="rule.label" class="flex items-center justify-between py-2 border-b last:border-0">
        <div class="flex items-center gap-3">
          <span class="text-lg">{{ rule.icon }}</span>
          <span class="text-sm">{{ rule.label }}</span>
        </div>
        <span class="font-bold text-green-700">{{ rule.points }}</span>
      </div>
    </div>

    <div v-if="showExamples" class="mt-4 pt-4 border-t">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">Ejemplos</h3>
      <div class="space-y-2 text-xs text-gray-600">
        <p>• Predijiste <strong>2-1</strong>, resultado <strong>2-1</strong> → Exacto = <strong>10 pts</strong></p>
        <p>• Predijiste <strong>3-1</strong>, resultado <strong>2-1</strong> → Ganador correcto = <strong>5 pts</strong></p>
        <p>• Predijiste <strong>0-0</strong>, resultado <strong>3-2</strong> → Sin aciertos = <strong>0 pts</strong></p>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Multiplicadores por fase</h3>
      <p class="text-xs text-gray-600">
        *El puntaje obtenido por partido se multiplica según la fase en la que se encuentre.
      </p>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div v-for="m in multipliers" :key="m.phase" class="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
          <span class="text-gray-600">{{ m.label }}</span>
          <span class="font-bold text-green-700">x{{ m.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PHASE_LABELS, PHASE_MULTIPLIERS } from '~~/types/domain';

withDefaults(defineProps<{ showExamples?: boolean }>(), { showExamples: true });

const rules = [
  { icon: '\uD83C\uDFAF', label: 'Resultado exacto', points: '10 pts' },
  { icon: '\u2705', label: 'Ganador o empate correcto', points: '5 pts' },
];

const multipliers = Object.entries(PHASE_MULTIPLIERS).map(([phase, value]) => ({
  phase,
  label: PHASE_LABELS[phase as keyof typeof PHASE_LABELS],
  value,
}));
</script>
