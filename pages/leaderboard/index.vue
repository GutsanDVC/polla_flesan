<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-green-700">Tabla de Clasificación</h1>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Cargando...</p>
    </div>

    <div v-else-if="leaderboard.length === 0" class="text-center py-8 text-gray-500">
      Aún no hay jugadores con puntaje.
    </div>

    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="text-left py-3 px-4">#</th>
            <th class="text-left py-3 px-4">Jugador</th>
            <th class="text-right py-3 px-4">Puntos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in leaderboard" :key="user.id" class="border-b last:border-0 hover:bg-gray-50">
            <td class="py-3 px-4 font-medium">{{ index + 1 }}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.full_name" class="w-8 h-8 rounded-full" />
                <span>{{ user.full_name }}</span>
              </div>
            </td>
            <td class="py-3 px-4 text-right font-bold text-green-700">{{ user.totalPoints }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const loading = ref(true);
const leaderboard = ref<any[]>([]);

onMounted(async () => {
  try {
    leaderboard.value = await $fetch<any[]>('/api/leaderboard');
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  } finally {
    loading.value = false;
  }
});
</script>
