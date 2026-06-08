<template>
  <button
    type="button"
    :disabled="loading"
    class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
    @click="onClick"
  >
    <svg class="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2A12 12 0 0 1 12.8 28l-6.6 5.1A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C40.9 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
    <span>{{ loading ? 'Redirigiendo...' : 'Continuar con Google' }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{ loading?: boolean }>();
const emit = defineEmits<{ (e: 'click'): void }>();

function onClick() {
  emit('click');
}
</script>
