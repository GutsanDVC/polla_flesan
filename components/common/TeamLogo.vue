<template>
  <span class="inline-flex items-center gap-2">
    <img
      v-if="team?.crest_url"
      :src="team.crest_url"
      :alt="team.name"
      :width="sizePx"
      :height="sizePx"
      class="object-contain flex-shrink-0"
      :style="{ width: sizePx + 'px', height: sizePx + 'px' }"
      @error="onImgError"
    />
    <span
      v-else
      class="inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold flex-shrink-0"
      :style="{ width: sizePx + 'px', height: sizePx + 'px', fontSize: tlaFontSize + 'px' }"
    >
      {{ tla }}
    </span>
    <span v-if="showName" class="truncate">{{ team?.name ?? '?' }}</span>
  </span>
</template>

<script setup lang="ts">
import type { Team } from '~~/types/domain';

const props = withDefaults(
  defineProps<{
    team?: Team | null;
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
  }>(),
  { size: 'md', showName: true },
);

const sizePx = computed(() => {
  if (props.size === 'sm') return 20;
  if (props.size === 'lg') return 48;
  return 32;
});

const tlaFontSize = computed(() => {
  if (props.size === 'sm') return 9;
  if (props.size === 'lg') return 16;
  return 12;
});

const tla = computed(() => {
  if (props.team?.tla) return props.team.tla;
  if (!props.team?.name) return '?';
  const parts = props.team.name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
});

const imgFailed = ref(false);
function onImgError() {
  imgFailed.value = true;
}
</script>
